import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to check if current time is within business hours
function isWithinBusinessHours(openTime: string, closeTime: string, currentTime: Date): boolean {
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();

  const currentMinutes = currentHour * 60 + currentMin;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

// Helper function to calculate time until next opening
function getTimeUntilOpen(openTime: string, currentTime: Date): { hours: number; minutes: number } {
  const [openHour, openMin] = openTime.split(':').map(Number);
  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();

  const currentMinutes = currentHour * 60 + currentMin;
  const openMinutes = openHour * 60 + openMin;

  let minutesUntilOpen = openMinutes - currentMinutes;
  if (minutesUntilOpen < 0) {
    // Already past opening time today, calculate for next day
    minutesUntilOpen = (24 * 60) - currentMinutes + openMinutes;
  }

  const hours = Math.floor(minutesUntilOpen / 60);
  const minutes = minutesUntilOpen % 60;

  return { hours, minutes };
}

// GET /api/orders/status - Check if orders are currently accepted
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all relevant settings
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'accept_orders',
        'auto_close_outside_hours',
        'monday_open', 'monday_close',
        'tuesday_open', 'tuesday_close',
        'wednesday_open', 'wednesday_close',
        'thursday_open', 'thursday_close',
        'friday_open', 'friday_close',
        'saturday_open', 'saturday_close',
        'sunday_open', 'sunday_close',
        'business_timezone'
      ]);

    // Convert settings array to object
    const settingsObj: Record<string, string> = {};
    settings?.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });

    // Create accept_orders setting if it doesn't exist
    if (!settingsObj['accept_orders']) {
      await supabase.from('site_settings').insert({
        setting_key: 'accept_orders',
        setting_value: 'true',
        category: 'general',
        description: 'Whether the website is currently accepting orders',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      settingsObj['accept_orders'] = 'true';
    }

    // Check if orders are manually disabled
    const manuallyDisabled = settingsObj['accept_orders'] !== 'true';

    // Check if auto-close is enabled
    const autoCloseEnabled = settingsObj['auto_close_outside_hours'] === 'true';

    let acceptingOrders = !manuallyDisabled;
    let message = acceptingOrders ? 'Orders are currently being accepted' : 'Orders are currently disabled';
    let countdown: { hours: number; minutes: number } | null = null;

    // If auto-close is enabled and not manually disabled, check opening hours
    if (autoCloseEnabled && !manuallyDisabled) {
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];

      const openTime = settingsObj[`${currentDay}_open`] || '11:00';
      const closeTime = settingsObj[`${currentDay}_close`] || '22:00';

      const isOpen = isWithinBusinessHours(openTime, closeTime, now);

      if (!isOpen) {
        acceptingOrders = false;
        const timeUntil = getTimeUntilOpen(openTime, now);
        countdown = timeUntil;

        const hoursText = timeUntil.hours > 0 ? `${timeUntil.hours} hour${timeUntil.hours !== 1 ? 's' : ''}` : '';
        const minsText = timeUntil.minutes > 0 ? `${timeUntil.minutes} minute${timeUntil.minutes !== 1 ? 's' : ''}` : '';
        const timeText = [hoursText, minsText].filter(Boolean).join(' and ');

        message = `We're currently closed. We'll be back in ${timeText}.`;
      }
    }

    return NextResponse.json({
      acceptingOrders,
      message,
      countdown,
      autoCloseEnabled,
      manuallyDisabled
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    // Default to accepting orders on error
    return NextResponse.json({
      acceptingOrders: true,
      message: 'Orders are currently being accepted'
    });
  }
}
