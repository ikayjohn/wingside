#!/bin/bash

# Nomba Webhook Debug Script
# Tests your production webhook to identify 401 issues

echo "================================"
echo "Nomba Webhook Debug Tool"
echo "================================"
echo ""

# Configuration
WEBHOOK_URL="https://www.wingside.ng/api/payment/nomba/webhook-debug"
WEBHOOK_MAIN="https://www.wingside.ng/api/payment/nomba/webhook"

echo "Testing webhook URL: $WEBHOOK_URL"
echo ""

# Test 1: Check if endpoint is accessible
echo "Test 1: Endpoint accessibility..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$WEBHOOK_URL" || echo "❌ Cannot reach endpoint"
echo ""

# Test 2: Send test webhook payload
echo "Test 2: Sending test webhook..."
echo ""

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Send request to debug endpoint
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "nomba-signature: test_signature_12345" \
  -H "nomba-sig-value: test_signature_12345" \
  -H "nomba-timestamp: $TIMESTAMP" \
  -H "nomba-signature-algorithm: HmacSHA256" \
  -H "nomba-signature-version: 1.0.0" \
  -d '{
    "event_type": "payment_success",
    "requestId": "test-request-123",
    "data": {
      "transaction": {
        "transactionId": "test-txn-123",
        "type": "online_checkout",
        "transactionAmount": 1000,
        "fee": 50,
        "time": "'$TIMESTAMP'"
      },
      "order": {
        "orderReference": "TEST-REF-123",
        "customerEmail": "test@example.com",
        "amount": 1000,
        "currency": "NGN",
        "customerId": "customer-123",
        "callbackUrl": "https://wingside.ng/callback"
      }
    }
  }')

echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract recommendation
RECOMMENDATION=$(echo "$RESPONSE" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('recommendation', 'No recommendation'))" 2>/dev/null)

echo "================================"
echo "Recommendation:"
echo "$RECOMMENDATION"
echo "================================"
echo ""

# Check for specific issues
if echo "$RESPONSE" | grep -q "NOMBA_WEBHOOK_SECRET not set"; then
    echo "❌ ISSUE: Webhook secret not configured in production"
    echo ""
    echo "Fix: Set NOMBA_WEBHOOK_SECRET in your production environment"
    echo ""
    echo "For Vercel:"
    echo "  vercel env add NOMBA_WEBHOOK_SECRET production"
    echo ""
    echo "For VPS/Hostinger:"
    echo "  Edit .env.production file"
    echo "  Add: NOMBA_WEBHOOK_SECRET=your_secret_here"
    echo ""
fi

if echo "$RESPONSE" | grep -q "Signature mismatch"; then
    echo "❌ ISSUE: Signature verification failed"
    echo ""
    echo "Fix: Ensure NOMBA_WEBHOOK_SECRET matches in BOTH places:"
    echo "  1. Your production environment (.env.production or Vercel)"
    echo "  2. Nomba Dashboard → Developer → Webhooks → Webhook Secret"
    echo ""
    echo "Current secret in use:"
    curl -s "$WEBHOOK_URL" | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('validation', {}).get('webhookSecretPreview', 'Unknown'))" 2>/dev/null
    echo ""
fi

if echo "$RESPONSE" | grep -q "Missing.*header"; then
    echo "⚠️  ISSUE: Missing required headers"
    echo ""
    echo "Nomba should send these headers:"
    echo "  - nomba-signature"
    echo "  - nomba-sig-value"
    echo "  - nomba-timestamp"
    echo "  - nomba-signature-algorithm"
    echo "  - nomba-signature-version"
    echo ""
fi

echo "Next Steps:"
echo "1. Review the recommendation above"
echo "2. Fix the identified issue"
echo "3. Test again"
echo "4. Once debug endpoint passes, test main webhook: $WEBHOOK_MAIN"
echo ""
