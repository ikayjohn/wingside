#!/bin/bash

echo "🔍 Wingside Webhook Diagnostic & Fix Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Server Network Configuration
echo -e "${BLUE}Step 1: Checking server network configuration...${NC}"
echo ""

echo "Server's public IP address:"
PUBLIC_IP=$(curl -s ifconfig.me)
echo "  → $PUBLIC_IP"
echo ""

echo "DNS resolution for www.wingside.ng:"
DNS_IP=$(dig +short www.wingside.ng | tail -n1)
echo "  → $DNS_IP"
echo ""

if [ "$PUBLIC_IP" = "$DNS_IP" ]; then
    echo -e "${GREEN}✅ DNS correctly points to this server${NC}"
else
    echo -e "${RED}❌ DNS MISMATCH! www.wingside.ng resolves to $DNS_IP but server IP is $PUBLIC_IP${NC}"
    echo -e "${YELLOW}   → This is likely why webhooks aren't reaching the server!${NC}"
fi
echo ""

# Step 2: Check Nginx Configuration
echo -e "${BLUE}Step 2: Checking Nginx configuration...${NC}"
echo ""

echo "Nginx listening ports:"
sudo netstat -tlnp | grep nginx
echo ""

echo "Checking if Nginx is listening on public interface (0.0.0.0):"
if sudo netstat -tlnp | grep nginx | grep "0.0.0.0:443"; then
    echo -e "${GREEN}✅ Nginx listening on public interface (port 443)${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx might not be listening on public interface${NC}"
fi
echo ""

# Step 3: Test Local Webhook Endpoint
echo -e "${BLUE}Step 3: Testing webhook endpoint locally...${NC}"
echo ""

echo "Testing localhost endpoint:"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"diagnostic-test","data":{"transaction":{"transactionId":"test-123"},"order":{"orderReference":"TEST-REF"}}}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint responding locally (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Webhook endpoint error (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Step 4: Check Firewall Rules
echo -e "${BLUE}Step 4: Checking firewall configuration...${NC}"
echo ""

echo "UFW Status:"
sudo ufw status
echo ""

echo "iptables Rules (checking for HTTPS/443 blocks):"
sudo iptables -L INPUT -v -n | grep -E "443|HTTPS|DROP|REJECT" || echo "  → No blocking rules found"
echo ""

# Step 5: Check SSL Certificate
echo -e "${BLUE}Step 5: Checking SSL certificate...${NC}"
echo ""

echo "SSL certificate for www.wingside.ng:"
SSL_CHECK=$(echo | timeout 5 openssl s_client -servername www.wingside.ng -connect www.wingside.ng:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate is valid${NC}"
    echo "$SSL_CHECK"
else
    echo -e "${RED}❌ SSL certificate issue or connection timeout${NC}"
fi
echo ""

# Step 6: Check Recent Nginx Access Logs for Webhook Requests
echo -e "${BLUE}Step 6: Checking Nginx logs for webhook requests...${NC}"
echo ""

echo "Recent webhook requests in Nginx access log (last 100 lines):"
WEBHOOK_LOGS=$(sudo tail -n 100 /var/log/nginx/access.log | grep "/api/payment/nomba/webhook")

if [ -z "$WEBHOOK_LOGS" ]; then
    echo -e "${YELLOW}⚠️  NO webhook requests found in Nginx logs${NC}"
    echo "   This means requests are not reaching Nginx at all"
else
    echo -e "${GREEN}✅ Found webhook requests:${NC}"
    echo "$WEBHOOK_LOGS"
fi
echo ""

# Step 7: Check PM2 Logs for Webhook Processing
echo -e "${BLUE}Step 7: Checking application logs...${NC}"
echo ""

echo "Recent webhook-related logs from PM2 (last 50 lines):"
pm2 logs wingside --lines 50 --nostream | grep -i "webhook\|nomba" || echo "  → No webhook logs found"
echo ""

# Step 8: Deploy Latest Code with Verbose Logging
echo -e "${BLUE}Step 8: Deploying latest code with verbose logging...${NC}"
echo ""

cd /var/www/wingside || exit 1

echo "Current git status:"
git status --short
echo ""

echo "Pulling latest changes from main branch:"
git pull origin main
echo ""

echo "Building application:"
npm run build
echo ""

echo "Restarting PM2:"
pm2 restart wingside
sleep 3
echo -e "${GREEN}✅ Application restarted${NC}"
echo ""

# Step 9: Test External Accessibility
echo -e "${BLUE}Step 9: Testing external accessibility...${NC}"
echo ""

echo "Testing webhook endpoint from external service (webhook.site):"
echo "Please manually test with: https://webhook.site"
echo "Configure a redirect to: https://www.wingside.ng/api/payment/nomba/webhook"
echo ""

# Step 10: Process Stuck Orders
echo -e "${BLUE}Step 10: Processing stuck paid orders...${NC}"
echo ""

echo "Checking for stuck orders in database..."
# We'll use the webhook-test endpoint to process known stuck orders

STUCK_ORDERS=(
  "WS-WS202602050098-1770299653484"
  "WS-WS202602040093-1770215087530"
  "WS-WS202602040092-1770210260057"
  "WS-WS202602040089-1770209499833"
)

for ORDER_REF in "${STUCK_ORDERS[@]}"; do
  echo ""
  echo "Processing order: $ORDER_REF"
  RESULT=$(curl -s -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
    -H "Content-Type: application/json" \
    -d "{\"orderReference\": \"$ORDER_REF\"}" | jq -r '.message // .error // .')

  if echo "$RESULT" | grep -q "successfully"; then
    echo -e "${GREEN}✅ $RESULT${NC}"
  else
    echo -e "${YELLOW}⚠️  $RESULT${NC}"
  fi
done

echo ""
echo ""

# Summary and Recommendations
echo "==========================================="
echo -e "${BLUE}📊 DIAGNOSTIC SUMMARY${NC}"
echo "==========================================="
echo ""

# DNS Check
if [ "$PUBLIC_IP" != "$DNS_IP" ]; then
    echo -e "${RED}🚨 CRITICAL: DNS Mismatch Detected${NC}"
    echo "   Server IP: $PUBLIC_IP"
    echo "   DNS IP: $DNS_IP"
    echo ""
    echo "   ACTION REQUIRED:"
    echo "   1. Update DNS A record for www.wingside.ng to point to $PUBLIC_IP"
    echo "   2. Wait 5-60 minutes for DNS propagation"
    echo "   3. Re-run this script to verify"
    echo ""
fi

# Nginx Check
if ! sudo netstat -tlnp | grep nginx | grep -q "0.0.0.0:443"; then
    echo -e "${YELLOW}⚠️  WARNING: Nginx Configuration Issue${NC}"
    echo "   Nginx may not be listening on public interface"
    echo ""
    echo "   ACTION REQUIRED:"
    echo "   1. Check Nginx site configuration: sudo nano /etc/nginx/sites-available/wingside"
    echo "   2. Ensure 'listen 443 ssl' (not 'listen 127.0.0.1:443')"
    echo "   3. Reload Nginx: sudo systemctl reload nginx"
    echo ""
fi

# Webhook Logs Check
if [ -z "$WEBHOOK_LOGS" ] && [ "$PUBLIC_IP" = "$DNS_IP" ]; then
    echo -e "${YELLOW}⚠️  WARNING: No Webhook Requests in Logs${NC}"
    echo "   Nomba webhooks are not reaching the server"
    echo ""
    echo "   POSSIBLE CAUSES:"
    echo "   1. Nomba webhook URL configuration incorrect"
    echo "   2. SSL certificate issue preventing connections"
    echo "   3. Hostinger upstream firewall blocking Nomba's IPs"
    echo ""
    echo "   ACTION REQUIRED:"
    echo "   1. Verify webhook URL in Nomba dashboard: https://www.wingside.ng/api/payment/nomba/webhook"
    echo "   2. Contact Nomba support to check their webhook delivery logs"
    echo "   3. Contact Hostinger support about upstream firewall rules"
    echo ""
fi

echo "==========================================="
echo -e "${BLUE}📋 NEXT STEPS${NC}"
echo "==========================================="
echo ""
echo "1. Monitor logs in real-time:"
echo "   pm2 logs wingside --lines 0"
echo ""
echo "2. Make a test payment (₦100) and watch for:"
echo "   - '🚨 WEBHOOK ENDPOINT HIT!' in logs (should appear within 5 seconds)"
echo ""
echo "3. If you see the 🚨 log:"
echo "   ✅ Webhooks are now working!"
echo ""
echo "4. If you DON'T see the 🚨 log after 30 seconds:"
echo "   - Check Nomba dashboard webhook delivery logs"
echo "   - Contact Nomba support with this server IP: $PUBLIC_IP"
echo "   - Contact Hostinger support about firewall rules"
echo ""
echo "5. Verify stuck orders were processed:"
echo "   Check Supabase orders table for paid_at timestamps"
echo ""
echo "==========================================="
echo -e "${GREEN}✅ Diagnostic Complete!${NC}"
echo "==========================================="
