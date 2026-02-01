import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContactNotification } from '@/lib/emails/service';
import { checkRateLimitByIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';

// POST /api/newsletter/signup - Handle newsletter signup
export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    // Check rate limit (5 signups per hour per IP)
    const { rateLimit } = await checkRateLimitByIp({ limit: 5, window: 60 * 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { email, type = 'gifts_launch', source = 'gifts_page' } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store in database
    const { data: submission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: 'newsletter',
        email,
        name: email.split('@')[0], // Use email username as name
        phone: '', // Not provided
        message: `Newsletter signup: ${type} (${source})`,
        form_data: { newsletter_type: type, source },
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Log error but don't fail - we'll still send the email
      console.error('Database insert error:', insertError);
    }

    // Send email notification to admin
    try {
      const emailResult = await sendContactNotification({
        type: 'newsletter',
        name: email.split('@')[0],
        email,
        phone: 'N/A',
        message: `Newsletter Signup - ${type}`,
        formData: {
          newsletter_type: type,
          source,
          timestamp: new Date().toISOString()
        },
      });

      if (!emailResult.success) {
        console.error('Failed to send newsletter notification:', emailResult.error);
      } else {
        console.log('Newsletter notification email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending newsletter email:', emailError);
    }

    const successMessage = type === 'gifts_launch'
      ? 'Thank you for signing up! We\'ll notify you when we launch.'
      : 'Thank you for subscribing to our newsletter!';

    return NextResponse.json({
      success: true,
      message: successMessage,
      submission,
    });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}
