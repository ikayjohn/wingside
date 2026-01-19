import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimitByIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';

// Validation schema
const partnershipSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  organization: z.string().max(200, 'Organization name must be less than 200 characters').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
});

// POST /api/partnership - Submit partnership inquiry
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    // Check rate limit (2 submissions per hour)
    const { rateLimit } = await checkRateLimitByIp({ limit: 2, window: 60 * 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          details: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    // Validate input using Zod schema
    const validationResult = partnershipSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    const { name, email, phone, organization, message } = validationResult.data;

    const supabase = await createClient();

    // Insert partnership inquiry into contact_submissions table
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: 'partnership',
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        organization: organization?.trim() || null,
        message: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting partnership inquiry:', error);

      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Duplicate submission detected' },
          { status: 409 }
        );
      }

      if (error.code === '23502') {
        return NextResponse.json(
          { error: 'Missing required field in database' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Database error',
          details: 'Failed to save partnership inquiry'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Partnership inquiry submitted successfully',
        data
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Partnership submission error:', error);

    // Handle unknown errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}
