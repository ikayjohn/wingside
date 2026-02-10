import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, event_title, name, email, phone, attending, stay_updated } = body;

    // Validate required fields
    if (!event_id || !name || !email || !attending) {
      return NextResponse.json(
        { error: 'Event ID, name, email, and attendance status are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, is_active')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.is_active) {
      return NextResponse.json(
        { error: 'This event is no longer accepting RSVPs' },
        { status: 400 }
      );
    }

    // Check if user already RSVPd for this event
    const { data: existingRsvp } = await supabase
      .from('event_rsvps')
      .select('id')
      .eq('event_id', event_id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingRsvp) {
      return NextResponse.json(
        { error: 'You have already RSVPd for this event' },
        { status: 400 }
      );
    }

    // Insert RSVP
    const { data: rsvp, error: insertError } = await supabase
      .from('event_rsvps')
      .insert({
        event_id,
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        attending: attending || 'yes',
        stay_updated: stay_updated || false,
        status: 'confirmed',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting RSVP:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit RSVP' },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email
    // You can integrate with Resend here to send a confirmation email

    return NextResponse.json(
      {
        message: 'RSVP submitted successfully!',
        rsvp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('RSVP submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
