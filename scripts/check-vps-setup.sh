#!/bin/bash

# VPS Configuration Check for Wingside Next.js Application
# This script helps diagnose issues with API routes on VPS hosting

echo "================================================"
echo "Wingside VPS Configuration Check"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

echo "1. Checking Node.js Installation..."
node --version && check_success "Node.js is installed" || echo -e "${RED}✗${NC} Node.js not found"
npm --version && check_success "npm is installed" || echo -e "${RED}✗${NC} npm not found"
echo ""

echo "2. Checking if Next.js Server is Running..."
if pm2 list | grep -q "wingside\|next"; then
    echo -e "${GREEN}✓${NC} PM2 process found"
    pm2 list
else
    echo -e "${YELLOW}⚠${NC} No PM2 process found. Checking for Node.js processes..."
    ps aux | grep "next start\|node.*next" | grep -v grep
fi
echo ""

echo "3. Checking which web server is running..."
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓${NC} Nginx is installed"
    nginx -v
    echo ""
    echo "Nginx configuration files:"
    ls -la /etc/nginx/sites-available/ 2>/dev/null || echo "  No sites-available directory"
    echo ""
    echo "Current Nginx configuration for wingside:"
    if [ -f /etc/nginx/sites-available/wingside ]; then
        cat /etc/nginx/sites-available/wingside | grep -v "#"
    else
        echo -e "${YELLOW}⚠${NC} No wingside config found"
    fi
elif command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo -e "${GREEN}✓${NC} Apache is installed"
    apache2 -v 2>/dev/null || httpd -v 2>/dev/null
    echo ""
    echo "Apache is being used - this may block API routes!"
    echo "Apache should only serve static files, Node.js should handle /api/* routes"
else
    echo -e "${YELLOW}⚠${NC} No web server (Nginx/Apache) found"
    echo "Node.js server might be directly exposed"
fi
echo ""

echo "4. Checking listening ports..."
echo "Services listening on port 80/443/3000:"
netstat -tlnp | grep -E ':80\s|:443\s|:3000\s' || ss -tlnp | grep -E ':80\s|:443\s|:3000\s'
echo ""

echo "5. Testing API route locally..."
echo "Testing: http://localhost:3000/api/payment/nomba/webhook"
curl -X POST http://localhost:3000/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null || echo -e "${RED}✗${NC} Cannot connect to local server"
echo ""

echo "6. Checking for .htaccess issues..."
if [ -f /var/www/wingside/public/.htaccess ]; then
    echo -e "${YELLOW}⚠${NC} .htaccess file found"
    echo "This is for Apache, but you should use Nginx for VPS!"
    echo "Apache .htaccess won't work with Nginx reverse proxy"
fi
echo ""

echo "================================================"
echo "Recommendations:"
echo "================================================"
echo ""
echo "If you're using Nginx (recommended):"
echo "  1. Ensure Nginx proxies /api/* requests to Next.js"
echo "  2. Remove Apache if both are running"
echo "  3. Use the Nginx config provided in docs/"
echo ""
echo "If you're using Apache:"
echo "  1. Consider switching to Nginx (better for Node.js)"
echo "  2. Or configure Apache as reverse proxy correctly"
echo ""
echo "Next Steps:"
echo "  • Check the configuration examples below"
echo "  • Ensure your VPS is using Nginx as reverse proxy"
echo "  • Restart web server after making changes"
echo ""
