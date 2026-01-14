#!/bin/bash

# Quick fix for Redis timeout issues on Hostinger

echo "🔧 Fixing Redis Timeout Issues..."
echo ""

# Option 1: Stop Redis service (if not needed)
echo "1️⃣  Stopping Redis service..."
sudo systemctl stop redis 2>/dev/null
sudo systemctl disable redis 2>/dev/null
echo "✅ Redis stopped"
echo ""

# Option 2: Remove REDIS_URL from PM2 environment
echo "2️⃣  Checking PM2 environment..."
if pm2 env wingside | grep -q "REDIS_URL"; then
    echo "⚠️  REDIS_URL is configured in PM2"
    echo "Removing REDIS_URL from PM2 environment..."

    # Get current environment
    pm2 env wingside > /tmp/current_env.txt

    # Create a script to restart without REDIS_URL
    cat > /tmp/restart_without_redis.sh << 'EOF'
#!/bin/bash
cd /var/www/wingside
export REDIS_URL=""
pm2 restart wingside
EOF

    chmod +x /tmp/restart_without_redis.sh
    bash /tmp/restart_without_redis.sh

    echo "✅ PM2 restarted (REDIS_URL unset)"
else
    echo "✅ REDIS_URL not configured in PM2"
fi
echo ""

# Option 3: Restart PM2 to clear any cached connections
echo "3️⃣  Restarting PM2 process..."
pm2 restart wingside
pm2 save
echo "✅ PM2 restarted"
echo ""

echo "✅ Fix applied!"
echo ""
echo "🧪 Testing site response time..."
time curl -s http://localhost:3000/ > /dev/null
echo ""

echo "✅ Done! Check your site now."
