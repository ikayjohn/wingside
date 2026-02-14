import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContactNotification } from '@/lib/emails/service';
import { z } from 'zod';
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeTextInput,
  detectSqlInjection,
  detectNoSqlInjection,
} from '@/lib/security';
import { checkRateLimitByIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';
import { comprehensiveBotProtection } from '@/lib/bot-protection';

// Validation schema
const contactSchema = z.object({
  type: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  message: z.string().max(2000, 'Message must be less than 2000 characters').optional(),
  formData: z.record(z.any(), z.any()).optional(),
});

// POST /api/contact - Handle contact form submissions
export async function POST(request: NextRequest) {
  try {
    // Parse request body first (needed for bot protection)
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

    // Check for bot behavior (honeypot + timing + patterns)
    const botCheck = await comprehensiveBotProtection(request, body, {
      honeypotField: 'website',
      minSubmissionTime: 2000,  // 2 seconds minimum
      maxSubmissionTime: 3600000, // 1 hour maximum
    });

    if (!botCheck.valid) {
      console.warn('Bot detected in contact form:', {
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        { error: botCheck.error || 'Invalid submission' },
        { status: botCheck.status || 400 }
      );
    }

    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    // Check rate limit (3 submissions per hour)
    const { rateLimit } = await checkRateLimitByIp({ limit: 3, window: 60 * 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

    // Validate input using Zod schema
    const validationResult = contactSchema.safeParse(body);
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

    const { type, name, email, phone, company, message, formData } = validationResult.data;

    // Security checks for injection attacks
    const stringInputs = [name, email, phone, company, message].filter((v): v is string => typeof v === 'string');
    for (const input of stringInputs) {
      if (detectSqlInjection(input) || detectNoSqlInjection(input)) {
        console.error('Potential injection attack detected:', { input });
        return NextResponse.json(
          {
            error: 'Invalid input detected',
            details: 'Your submission contains potentially malicious content'
          },
          { status: 400 }
        );
      }
    }

    // Sanitize inputs
    const sanitizedName = sanitizeTextInput(name);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPhone = phone ? sanitizePhone(phone) : null;
    const sanitizedCompany = company ? sanitizeTextInput(company) : null;
    const sanitizedMessage = message ? sanitizeTextInput(message) : null;

    const supabase = await createClient();

    // Store in database
    const { data: submission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: type || 'general',
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone || '',
        company: sanitizedCompany || '',
        message: sanitizedMessage || '',
        form_data: formData || {},
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);

      // Handle specific database errors
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Duplicate submission detected' },
          { status: 409 }
        );
      }

      if (insertError.code === '23502') {
        return NextResponse.json(
          { error: 'Missing required field in database' },
          { status: 400 }
        );
      }

      // Log error but don't fail - we'll still send the email
    }

    // Send email notification to admin
    try {
      const emailResult = await sendContactNotification({
        type: type || 'general',
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        company: sanitizedCompany,
        message: sanitizedMessage,
        formData,
      });

      if (!emailResult.success) {
        console.error('Failed to send email notification:', emailResult.error);
        // Don't fail the request if email fails
      } else {
        console.log('Contact notification email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending contact email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you within 24 hours.',
      submission,
    });
  } catch (error) {
    console.error('Contact form submission error:', error);

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
