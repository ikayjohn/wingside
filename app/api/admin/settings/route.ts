import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { CacheInvalidation } from '@/lib/redis';

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

    // Fetch existing settings to validate keys exist
    const settingKeys = Object.keys(settings);
    const { data: existingSettings, error: fetchError } = await supabase
      .from('site_settings')
      .select('setting_key')
      .in('setting_key', settingKeys);

    if (fetchError) {
      console.error('Error fetching existing settings:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to validate settings'
      }, { status: 500 });
    }

    const existingKeys = new Set((existingSettings || []).map(s => s.setting_key));
    const notFoundKeys = settingKeys.filter(key => !existingKeys.has(key));

    if (notFoundKeys.length > 0) {
      console.warn('Some setting keys not found:', notFoundKeys);
      return NextResponse.json({
        success: false,
        error: 'Some settings not found in database',
        notFound: notFoundKeys
      }, { status: 400 });
    }

    // Batch update using upsert for better performance (single query)
    const updatedAt = new Date().toISOString();
    const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: String(value),
      updated_at: updatedAt
    }));

    const { data: updatedData, error: updateError } = await supabase
      .from('site_settings')
      .upsert(settingsToUpdate, {
        onConflict: 'setting_key',
        ignoreDuplicates: false
      })
      .select();

    if (updateError) {
      console.error('Error updating settings:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update settings',
        details: updateError.message
      }, { status: 500 });
    }

    console.log(`Updated ${settingsToUpdate.length} settings in batch`);

    // Invalidate settings cache (both Redis and memory cache)
    try {
      await CacheInvalidation.settings();
    } catch (cacheError) {
      console.error('Error invalidating cache:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updated: settingsToUpdate.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
