#!/bin/bash

echo "🔓 Enabling webhook signature bypass mode..."
echo ""

cd /var/www/wingside

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "Creating from .env.example..."
    cp .env.example .env.production
fi

# Check if bypass flag already exists
if grep -q "NOMBA_WEBHOOK_BYPASS_VERIFICATION" .env.production; then
    echo "📝 Updating existing bypass flag..."
    sed -i 's/NOMBA_WEBHOOK_BYPASS_VERIFICATION=.*/NOMBA_WEBHOOK_BYPASS_VERIFICATION=true/' .env.production
else
    echo "📝 Adding bypass flag..."
    echo "" >> .env.production
    echo "# TEMPORARY: Bypass webhook signature verification (REMOVE AFTER TESTING!)" >> .env.production
    echo "NOMBA_WEBHOOK_BYPASS_VERIFICATION=true" >> .env.production
fi

echo ""
echo "✅ Bypass flag enabled"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   This bypasses signature verification - use ONLY for testing!"
echo "   Remove this flag after confirming webhooks work."
echo ""

# Restart PM2 to apply changes
echo "🔄 Restarting PM2..."
pm2 restart wingside

sleep 3

echo ""
echo "✅ PM2 restarted with --update-env"
echo ""
echo "==========================================="
echo "📋 NEXT STEPS"
echo "==========================================="
echo ""
echo "1. Monitor logs in real-time:"
echo "   pm2 logs wingside --lines 0"
echo ""
echo "2. Make a test payment (₦100)"
echo ""
echo "3. Watch for these logs:"
echo "   ⚠️  WEBHOOK SIGNATURE VERIFICATION BYPASSED"
echo "   Order WS202602050XXX payment confirmed via Nomba webhook"
echo "   ✅ Payment processed atomically"
echo ""
echo "4. If you see '✅ Payment processed' - SUCCESS!"
echo "   The callback page should show success (no verification error)"
echo ""
echo "5. After confirming it works, disable bypass:"
echo "   ./scripts/disable-webhook-bypass.sh"
echo ""
echo "==========================================="
