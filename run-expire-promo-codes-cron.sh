#!/bin/bash
# Promo Code Expiration Cron Job
# Deactivates promo codes past their valid_until date

cd /var/www/wingside

# Extract CRON_SECRET from .env.production
CRON_SECRET=$(grep "^CRON_SECRET=" .env.production | cut -d '=' -f 2- | tr -d '\r')

# Call the API
curl -L -X POST "https://www.wingside.ng/api/cron/expire-promo-codes" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s -w "\nHTTP Status: %{http_code}\n" \
  >> /var/www/wingside/logs/expire-promo-codes.log 2>&1

# Log execution
echo "[$(date)] Promo code expiration cron executed - Exit: $?" >> /var/www/wingside/logs/expire-promo-codes.log
