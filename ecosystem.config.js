module.exports = {
  apps: [{
    name: 'wingside',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/wingside',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,

      // ================================
      // ⚠️  ADD YOUR PRODUCTION VALUES BELOW
      // ================================

      // Nomba Payment Gateway
      NOMBA_CLIENT_ID: '9d1a85c1-212e-4418-9217-f56b769703e8',
      NOMBA_CLIENT_SECRET: '5sZ/rzXiIzjbvvu+2PVnog76H/PKp15fud9Y8JfWdjgeFtdtQYA1zCXYECbiGj9hvaEPOlyO+3Jiqut5luaHxQ==',
      NOMBA_ACCOUNT_ID: 'dfb21b47-8348-4aa7-9ba3-7e31021c6f69',
      NOMBA_WEBHOOK_SECRET: '', // ⚠️ ADD YOUR WEBHOOK SECRET FROM NOMBA DASHBOARD

      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: '', // ⚠️ ADD YOUR SUPABASE URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '', // ⚠️ ADD YOUR SUPABASE ANON KEY
      SUPABASE_SERVICE_ROLE_KEY: '', // ⚠️ ADD YOUR SERVICE ROLE KEY

      // Application
      NEXT_PUBLIC_APP_URL: 'https://www.wingside.ng',

      // ================================
      // Optional: Other Environment Variables
      // ================================

      // Email (Resend)
      // RESEND_API_KEY: 'your_resend_api_key',

      // Turnstile CAPTCHA
      // NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'your_site_key',
      // TURNSTILE_SECRET_KEY: 'your_secret_key',

      // Redis (if using)
      // REDIS_URL: 'redis://localhost:6379',

      // Other services...
      // TWILIO_ACCOUNT_SID: 'your_twilio_sid',
      // TWILIO_AUTH_TOKEN: 'your_twilio_token',
      // NEXT_PUBLIC_TWILIO_PHONE_NUMBER: '+1234567890'
    }
  }]
};
