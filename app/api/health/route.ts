import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const healthStatus: any = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      version: '1.0.0',
      services: {
        nextjs: 'ok',
        database: 'unknown',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Test database connection
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        healthStatus.services.database = `error: ${error.message}`;
      } else {
        healthStatus.services.database = 'ok';
      }
    } catch (dbError) {
      healthStatus.services.database = `connection error: ${dbError.message}`;
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const envStatus = {};
    for (const envVar of requiredEnvVars) {
      envStatus[envVar] = process.env[envVar] ? 'set' : 'missing';
    }
    healthStatus.environmentVariables = envStatus;

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}