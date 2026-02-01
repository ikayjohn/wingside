/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at application startup
 * to catch configuration errors early before they cause runtime failures.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-only)'
  },

  // Application
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Application base URL (e.g., https://www.wingside.ng)'
  },

  // Payment Gateways
  {
    name: 'PAYSTACK_SECRET_KEY',
    required: true,
    description: 'Paystack payment gateway secret key'
  },
  {
    name: 'NOMBA_CLIENT_ID',
    required: false,
    description: 'Nomba payment gateway client ID (optional)'
  },
  {
    name: 'NOMBA_CLIENT_SECRET',
    required: false,
    description: 'Nomba payment gateway client secret (optional)'
  },
  {
    name: 'NOMBA_ACCOUNT_ID',
    required: false,
    description: 'Nomba account ID (optional)'
  },
  {
    name: 'NOMBA_WEBHOOK_SECRET',
    required: false,
    description: 'Nomba webhook signature secret (recommended for security)'
  },

  // Notifications
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend email service API key (optional)'
  },
  {
    name: 'TERMII_API_KEY',
    required: false,
    description: 'Termii SMS service API key (optional)'
  },
  {
    name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    required: false,
    description: 'Web push notification VAPID public key (optional)'
  },
  {
    name: 'VAPID_PRIVATE_KEY',
    required: false,
    description: 'Web push notification VAPID private key (optional)'
  },

  // Integrations
  {
    name: 'EMBEDLY_API_KEY',
    required: false,
    description: 'Embedly wallet integration API key (optional)'
  },
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL (optional, falls back to memory cache)'
  },
];

export function validateEnvironmentVariables(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating environment variables...');

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        errors.push(
          `❌ REQUIRED: ${envVar.name} is not set. ${envVar.description}`
        );
      } else {
        warnings.push(
          `⚠️  OPTIONAL: ${envVar.name} is not set. ${envVar.description}`
        );
      }
    } else {
      // Validate format for specific variables
      if (envVar.name.includes('URL') && !value.startsWith('http')) {
        errors.push(
          `❌ INVALID: ${envVar.name} must be a valid URL starting with http:// or https://`
        );
      }

      if (envVar.name.includes('KEY') && value.length < 10) {
        warnings.push(
          `⚠️  SUSPICIOUS: ${envVar.name} appears too short (less than 10 characters)`
        );
      }
    }
  }

  // Additional validations
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    // Extra checks for production
    if (!process.env.NOMBA_WEBHOOK_SECRET) {
      warnings.push(
        '⚠️  SECURITY: NOMBA_WEBHOOK_SECRET not set in production. Webhooks are vulnerable!'
      );
    }

    if (!process.env.REDIS_URL) {
      warnings.push(
        '⚠️  PERFORMANCE: REDIS_URL not set in production. Using in-memory cache (not recommended for multi-instance deployments)'
      );
    }
  }

  // Print results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All required environment variables are configured correctly');
  } else {
    if (errors.length > 0) {
      console.error('\n❌ ENVIRONMENT VALIDATION FAILED:\n');
      errors.forEach(error => console.error(error));
    }

    if (warnings.length > 0) {
      console.warn('\n⚠️  ENVIRONMENT WARNINGS:\n');
      warnings.forEach(warning => console.warn(warning));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Call this function at application startup to ensure environment is properly configured
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironmentVariables();

  if (!result.valid) {
    console.error(
      '\n❌ APPLICATION STARTUP ABORTED: Environment validation failed'
    );
    console.error('Please fix the above errors and restart the application.\n');
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Application started with warnings. Some features may not work correctly.\n');
  }
}
