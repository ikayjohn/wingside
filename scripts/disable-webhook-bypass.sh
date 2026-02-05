#!/bin/bash

echo "🔒 Disabling webhook signature bypass mode..."
echo ""

cd /var/www/wingside

# Remove bypass flag
if grep -q "NOMBA_WEBHOOK_BYPASS_VERIFICATION" .env.production; then
    echo "📝 Removing bypass flag from .env.production..."
    sed -i '/NOMBA_WEBHOOK_BYPASS_VERIFICATION/d' .env.production
    sed -i '/TEMPORARY: Bypass webhook signature/d' .env.production
    echo "✅ Bypass flag removed"
else
    echo "ℹ️  Bypass flag not found in .env.production"
fi

echo ""
echo "🔄 Restarting PM2..."
pm2 restart wingside

sleep 3

echo ""
echo "✅ Signature verification re-enabled"
echo ""
echo "🔐 Webhooks will now require valid signatures"
