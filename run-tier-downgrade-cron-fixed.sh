#!/bin/bash
# Tier Downgrade Cron Job - Fixed version
# Properly handles .env.production with comments

# Change to app directory
cd /var/www/wingside

# Load environment variables from .env.production (skip comments and empty lines)
set -a
source <(grep -v '^#' .env.production | grep -v '^$' | sed 's/\r$//')
set +a

# Run the tier downgrade endpoint
curl -X POST "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  >> /var/www/wingside/logs/tier-downgrades.log 2>&1

# Log the execution
echo "[$(date)] Tier downgrade cron executed" >> /var/www/wingside/logs/tier-downgrades.log
