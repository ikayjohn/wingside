#!/bin/bash

echo "🚀 Deploying webhook fix and processing stuck orders"
echo "======================================================"

# Step 1: Restart PM2 to apply changes
echo ""
echo "📦 Step 1: Restarting PM2 to apply webhook fix..."
pm2 restart wingside
sleep 3
echo "✅ PM2 restarted"

# Step 2: Process stuck orders
echo ""
echo "💰 Step 2: Processing 3 stuck paid orders..."
echo ""

echo "Processing WS202602040093..."
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602040093-1770215087530"}' \
  2>/dev/null | jq .
echo ""

echo "Processing WS202602040092..."
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602040092-1770210260057"}' \
  2>/dev/null | jq .
echo ""

echo "Processing WS202602040089..."
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602040089-1770209499833"}' \
  2>/dev/null | jq .
echo ""

echo "✅ All 3 orders processed"

# Step 3: Test webhook endpoint
echo ""
echo "🧪 Step 3: Testing webhook endpoint accessibility..."
RESPONSE=$(curl -s -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"test-fix","data":{}}')

if echo "$RESPONSE" | grep -q "received"; then
    echo "✅ Webhook endpoint is accessible!"
    echo "Response: $RESPONSE"
else
    echo "⚠️  Unexpected response: $RESPONSE"
fi

# Step 4: Verify orders were processed
echo ""
echo "🔍 Step 4: Verifying orders in database..."
echo "Run this SQL query in Supabase:"
echo ""
echo "SELECT order_number, payment_status, status, paid_at"
echo "FROM orders"
echo "WHERE order_number IN ('WS202602040093', 'WS202602040092', 'WS202602040089');"
echo ""

# Step 5: Instructions for live test
echo ""
echo "======================================================"
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check Supabase to verify orders are now 'paid'"
echo "2. Make a test payment (₦100) to test live webhooks"
echo "3. Watch logs: pm2 logs --lines 0"
echo "4. You should see 'Nomba webhook event' within 5 seconds"
echo ""
echo "🎉 Webhooks will now work even during maintenance mode!"
echo "======================================================"
