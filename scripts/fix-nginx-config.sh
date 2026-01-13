#!/bin/bash

# Quick Fix Script for Nginx Configuration
# This script updates Nginx to allow POST requests to API routes

echo "================================================"
echo "Nginx API Routes Fix for Wingside"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo:"
    echo "sudo bash fix-nginx-config.sh"
    exit 1
fi

# Backup current configuration
echo "1. Backing up current Nginx configuration..."
cp /etc/nginx/sites-available/wingside /etc/nginx/sites-available/wingside.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || \
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.$(date +%Y%m%d_%H%M%S)

echo "   ✓ Backup created"
echo ""

# Create new configuration
echo "2. Creating new Nginx configuration..."

cat > /etc/nginx/sites-available/wingside << 'EOF'
server {
    listen 80;
    listen [::]:80;

    server_name www.wingside.ng wingside.ng;

    access_log /var/log/nginx/wingside-access.log;
    error_log /var/log/nginx/wingside-error.log;

    client_max_body_size 10M;

    # API Routes - Allow all methods including POST
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-HTTP-Method-Override, X-Method-Override' always;

        # Handle OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Length' 0;
            return 204;
        }

        # No caching for API routes
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache 1;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # All other requests - Next.js pages
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, immutable";
    }

    # Static assets
    location /static {
        proxy_pass http://localhost:3000;
    }
}
EOF

echo "   ✓ Configuration created"
echo ""

# Enable the site
echo "3. Enabling site configuration..."
ln -sf /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/wingside

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

echo "   ✓ Site enabled"
echo ""

# Test configuration
echo "4. Testing Nginx configuration..."
if nginx -t; then
    echo "   ✓ Configuration is valid"
else
    echo "   ✗ Configuration test failed!"
    echo "   Restoring backup..."
    mv /etc/nginx/sites-available/wingside.backup.* /etc/nginx/sites-available/wingside
    exit 1
fi
echo ""

# Stop Apache if running
echo "5. Checking for Apache (conflicts with Nginx)..."
if systemctl is-active --quiet apache2; then
    echo "   ⚠️  Apache is running - stopping it..."
    systemctl stop apache2
    systemctl disable apache2
    echo "   ✓ Apache stopped and disabled"
else
    echo "   ✓ Apache is not running"
fi
echo ""

# Reload Nginx
echo "6. Reloading Nginx..."
systemctl reload nginx

if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx reloaded successfully"
else
    echo "   ✗ Failed to reload Nginx"
    exit 1
fi
echo ""

# Test API route locally
echo "7. Testing API route locally..."
sleep 2

if curl -X POST http://localhost:3000/api/payment/nomba/webhook \
    -H "Content-Type: application/json" \
    -d '{"event_type":"payment_success"}' \
    --silent --show-error --fail > /dev/null 2>&1; then
    echo "   ✓ Local API test passed"
else
    echo "   ⚠️  Local API test failed - make sure Next.js app is running"
    echo "   Start with: pm2 restart wingside"
fi
echo ""

echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Test webhook from external:"
echo "   curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"event_type\":\"payment_success\"}'"
echo ""
echo "2. Restart your Next.js app:"
echo "   pm2 restart wingside"
echo ""
echo "3. Check logs if needed:"
echo "   pm2 logs wingside"
echo "   sudo tail -f /var/log/nginx/wingside-error.log"
echo ""
echo "4. Test with a real payment!"
echo ""
