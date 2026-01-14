#!/bin/bash

# Hostinger Performance Diagnostic Script
# Run this on your VPS to identify slow loading issues

echo "🔍 Hostinger Performance Diagnostics"
echo "====================================="
echo ""

# 1. Check PM2 status
echo "📊 PM2 Status:"
pm2 status
echo ""

# 2. Check if REDIS_URL is set in PM2
echo "🔴 Checking Redis Configuration:"
pm2 env wingside | grep -i redis || echo "✅ REDIS_URL not configured (good!)"
echo ""

# 3. Check if Redis is running
echo "🔴 Checking Redis Service:"
if systemctl is-active --quiet redis; then
    echo "⚠️  Redis is RUNNING - this could be causing delays!"
    sudo systemctl status redis --no-pager | head -10
else
    echo "✅ Redis is NOT running"
fi
echo ""

# 4. Check recent PM2 logs for Redis errors
echo "📋 Recent PM2 Logs (Redis related):"
pm2 logs wingside --lines 50 --nostream | grep -i redis || echo "No Redis errors found"
echo ""

# 5. Check for timeout errors
echo "⏱️  Checking for timeout errors:"
pm2 logs wingside --lines 50 --nostream | grep -i "timeout\|ETIMEDOPS\|ECONNREFUSED" || echo "No timeout errors found"
echo ""

# 6. Test API response time
echo "🚀 Testing API Response Time:"
echo "Testing /api/flavors..."
time curl -s http://localhost:3000/api/flavors > /dev/null
echo ""
echo "Testing /api/hero-slides/public..."
time curl -s http://localhost:3000/api/hero-slides/public > /dev/null
echo ""

# 7. Check memory usage
echo "💾 Memory Usage:"
pm2 describe wingside | grep -A 5 "memory usage"
echo ""

echo "====================================="
echo "Diagnosis complete!"
echo ""
echo "📝 Recommended Actions:"
echo "1. If Redis is running but not needed: sudo systemctl stop redis"
echo "2. If REDIS_URL is set in PM2: pm2 restart wingside --update-env"
echo "3. If APIs are slow (>2s): Check Supabase connection"
