import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContactNotification } from '@/lib/emails/service';

// POST /api/newsletter/signup - Handle newsletter signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type = 'gifts_launch' } = body;

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

    // Check if newsletter_submissions table exists, if not create it
    const { data: existingTables } = await supabase.rpc('check_table_exists', {
      table_name: 'newsletter_submissions'
    });

    // Store in database
    const { data: submission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: 'newsletter',
        email,
        name: email.split('@')[0], // Use email username as name
        phone: '', // Not provided
        message: `Newsletter signup: ${type}`,
        form_data: { newsletter_type: type, source: 'gifts_page' },
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
          source: 'gifts_page',
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

    return NextResponse.json({
      success: true,
      message: 'Thank you for signing up! We\'ll notify you when we launch.',
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
