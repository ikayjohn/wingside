import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/settings - Get all settings (admin only)
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all settings from site_settings table
    const { data: settingsData, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value, category, description')
      .order('category', { ascending: true })
      .order('setting_key', { ascending: true });

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }

    // Group settings by category
    const settingsByCategory: Record<string, any[]> = {};
    const flatSettings: Record<string, string> = {};

    settingsData?.forEach(item => {
      const category = item.category || 'general';

      if (!settingsByCategory[category]) {
        settingsByCategory[category] = [];
      }

      settingsByCategory[category].push({
        key: item.setting_key,
        value: item.setting_value || '',
        description: item.description || ''
      });

      flatSettings[item.setting_key] = item.setting_value || '';
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

// PUT /api/admin/settings - Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get settings from request body
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
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Update each setting in site_settings table
    const updateResults = await Promise.all(
      Object.entries(settings).map(async ([key, value]) => {
        const { data, error, count } = await supabase
          .from('site_settings')
          .update({
            setting_value: String(value),
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', key)
          .select();

        if (error) {
          console.error(`Error updating setting ${key}:`, error);
          return { key, success: false, error: error.message };
        }

        if (!data || data.length === 0) {
          console.warn(`Setting ${key} not found in database`);
          return { key, success: false, error: 'Setting not found' };
        }

        console.log(`Updated ${key} to ${value}`);
        return { key, success: true, newValue: value };
      })
    );

    // Check if any updates failed
    const failures = updateResults.filter(r => !r.success);
    if (failures.length > 0) {
      console.error('Some settings failed to update:', failures);
      return NextResponse.json({
        success: false,
        message: 'Some settings failed to update',
        failures
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updated: updateResults.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
