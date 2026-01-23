#!/bin/bash
# Tier Downgrade Cron Job - Simple version
# Only loads CRON_SECRET (all we need)

cd /var/www/wingside

# Extract CRON_SECRET from .env.production
CRON_SECRET=$(grep "^CRON_SECRET=" .env.production | cut -d '=' -f 2- | tr -d '\r')

# Call the API
curl -X POST "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s -w "\nHTTP Status: %{http_code}\n" \
  >> /var/www/wingside/logs/tier-downgrades.log 2>&1

# Log the execution
echo "[$(date)] Tier downgrade cron executed - Status: $?" >> /var/www/wingside/logs/tier-downgrades.log
