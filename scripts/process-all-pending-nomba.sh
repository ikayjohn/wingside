#!/bin/bash

echo "Processing all pending Nomba orders..."
echo "========================================"

# Process the 4 known stuck orders
echo ""
echo "Processing known stuck orders:"

curl -s -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602050098-1770299653484"}' | jq -r '.message // .error'

curl -s -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602040093-1770215087530"}' | jq -r '.message // .error'

curl -s -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602040092-1770210260057"}' | jq -r '.message // .error'

curl -s -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-WS202602040089-1770209499833"}' | jq -r '.message // .error'

echo ""
echo "========================================"
echo "✅ Done! Check Supabase to verify orders are now 'paid'"
