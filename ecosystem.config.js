// PM2 Ecosystem Configuration for Hostinger VPS
// ============================================================================
// This file configures how PM2 manages the Wingside Next.js application
//
// IMPORTANT: Environment variables are loaded from .env.local
// Do NOT hardcode sensitive values here - use .env.local instead
// ============================================================================

module.exports = {
  apps: [{
    name: 'wingside',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: './',  // Current directory - adjust if deployed elsewhere
    instances: 1,  // Single instance for VPS - increase for load balancing
    exec_mode: 'fork',  // Use 'cluster' if instances > 1
    autorestart: true,
    watch: false,  // Don't watch files in production
    max_memory_restart: '1G',  // Restart if memory exceeds 1GB

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },

    // Load additional env vars from .env.production
    // PM2 will automatically load .env files from the cwd
    env_file: '.env.production',

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,  // Prefix logs with timestamp
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Restart behavior
    min_uptime: '10s',  // Min uptime before considering restart
    max_restarts: 10,  // Max consecutive restarts
    restart_delay: 4000,  // Delay between restarts (ms)

    // Advanced options
    listen_timeout: 10000,  // Time to wait for app to be ready
    kill_timeout: 5000,  // Time to wait before force killing
    wait_ready: true,  // Wait for app to signal it's ready

    // Auto-restart on file changes (disabled by default)
    // Uncomment to enable in development
    // watch: ['app', 'components', 'lib'],
    // ignore_watch: ['node_modules', 'logs', '.next'],
  }]
};
