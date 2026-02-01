import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitByIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Check CSRF token
    const csrfError = await csrfProtection(request)
    if (csrfError) {
      return csrfError
    }

    // Check rate limit (2 applications per day per IP)
    const { rateLimit } = await checkRateLimitByIp({
      limit: 2,
      window: 24 * 60 * 60 * 1000 // 24 hours
    });
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

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'state', 'country', 'netWorth', 'liquidCapital', 'businessExperience', 'franchiseLocation', 'timeline'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare form data
    const formData = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      city: body.city,
      state: body.state,
      country: body.country,
      netWorth: body.netWorth,
      liquidCapital: body.liquidCapital,
      businessExperience: body.businessExperience,
      franchiseLocation: body.franchiseLocation,
      timeline: body.timeline,
      message: body.message || '',
    };

    // Insert into contact_submissions table
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: 'franchise',
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        phone: body.phone,
        company: null,
        message: body.message || null,
        form_data: formData,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // Send email notification
    try {
      await sendEmailNotification(body);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully', id: data.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendEmailNotification(application: any) {
  // Format application data for email
  const emailBody = `
New Franchise Application

Personal Information:
- Name: ${application.firstName} ${application.lastName}
- Email: ${application.email}
- Phone: ${application.phone}

Location:
- City: ${application.city}
- State: ${application.state}
- Country: ${application.country}

Financial Information:
- Net Worth: ${application.netWorth}
- Liquid Capital: ${application.liquidCapital}

Business Experience:
${application.businessExperience}

Franchise Details:
- Preferred Location: ${application.franchiseLocation}
- Timeline: ${application.timeline}

${application.message ? `Additional Message:\n${application.message}` : ''}

Submitted at: ${new Date().toISOString()}
  `.trim();

  // Send email notification using Resend
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured, cannot send franchise application email');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Wingside Franchise <noreply@wingside.ng>',
    to: 'franchise@wingside.ng',
    subject: 'New Franchise Application - Wingside',
    text: emailBody,
  });
}
