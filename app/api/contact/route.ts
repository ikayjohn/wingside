import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/contact - Handle contact form submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, phone, company, message, formData } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
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

    const supabase = createClient();

    // Check if contact_submissions table exists, if not create it
    const { error: checkError } = await supabase.rpc('check_table_exists', {
      table_name: 'contact_submissions'
    });

    // Store in database (if table exists)
    const { data: submission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: type || 'general',
        name,
        email,
        phone,
        company: company || null,
        message: message || null,
        form_data: formData || {},
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Log error but don't fail - we'll still send the email
      console.error('Database insert error:', insertError);
    }

    // TODO: Send email notification using Resend, SendGrid, or Supabase Edge Function
    // For now, we'll just log it
    console.log('Contact form submission:', {
      type,
      name,
      email,
      phone,
      company,
      message,
      formData,
    });

    // Send notification email (you can integrate Resend/SendGrid here)
    // Example with Resend:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'Wingside <noreply@wingside.ng>',
    //     to: 'reachus@wingside.ng',
    //     subject: `${type} - Contact from ${name}`,
    //     html: `<p>Contact form submission...</p>`,
    //   }),
    // });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you within 24 hours.',
      submission,
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
