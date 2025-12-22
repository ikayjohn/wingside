import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/settings - Get all public settings
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all settings from site_settings table
    const { data: settingsData, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value, category');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }

    // Convert array to nested object grouped by category
    const settingsByCategory: Record<string, Record<string, string>> = {};
    const flatSettings: Record<string, string> = {};

    settingsData?.forEach(item => {
      const category = item.category || 'general';
      const key = item.setting_key;
      const value = item.setting_value || '';

      // Group by category
      if (!settingsByCategory[category]) {
        settingsByCategory[category] = {};
      }
      settingsByCategory[category][key] = value;

      // Also provide flat structure for easier access
      flatSettings[key] = value;
    });

    return NextResponse.json({
      settings: flatSettings,
      settingsByCategory
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
