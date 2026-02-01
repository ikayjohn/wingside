import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test if referral tables exist
    const tablesToCheck = ['referrals', 'referral_rewards', 'referral_settings', 'referral_shares'];
    const tableStatus: Record<string, { exists: boolean; error: string | null; count: number }> = {};

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        tableStatus[tableName] = {
          exists: !error,
          error: error ? error.message : null,
          count: data ? data.length : 0
        };
      } catch (tableError) {
        tableStatus[tableName] = {
          exists: false,
          error: tableError instanceof Error ? tableError.message : String(tableError),
          count: 0
        };
      }
    }

    // Test if referral columns exist in profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, referral_count, total_referral_earnings')
        .limit(1);

      const profileColumnsStatus = {
        exists: !error,
        error: error ? error.message : null,
        hasData: data && data.length > 0
      };

      return NextResponse.json({
        status: 'success',
        tables: tableStatus,
        profileColumns: profileColumnsStatus,
        message: 'Referral database tables check completed'
      });
    } catch (profileError) {
      return NextResponse.json({
        status: 'partial',
        tables: tableStatus,
        profileColumns: {
          exists: false,
          error: profileError.message,
          hasData: false
        },
        message: 'Some database tables may be missing'
      });
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check database status'
    }, { status: 500 });
  }
}