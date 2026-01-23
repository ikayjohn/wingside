#!/bin/bash
# ============================================================================
# Deployment Script for Hostinger VPS
# ============================================================================
# This script handles deployment from Git to your VPS
# Usage: bash deploy-vps.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 Starting Wingside VPS Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get current directory
APP_DIR="$(pwd)"
echo "📁 Deployment Directory: $APP_DIR"
echo ""

# Step 1: Pull latest code from Git
echo "1️⃣  Pulling latest code from Git..."
git pull origin main
echo "✅ Code updated"
echo ""

# Step 2: Install dependencies
echo "2️⃣  Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"
echo ""

# Step 3: Build Next.js app
echo "3️⃣  Building Next.js application..."
npm run build
echo "✅ Build complete"
echo ""

# Step 4: Check environment variables
echo "4️⃣  Checking environment variables..."
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found"
    echo "   Please create .env.production with required variables"
else
    echo "✅ .env.production found"

    # Check critical variables
    REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "CRON_SECRET")
    MISSING_VARS=()

    for VAR in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$VAR=" .env.production; then
            MISSING_VARS+=("$VAR")
        fi
    done

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "⚠️  Warning: Missing environment variables:"
        printf '   - %s\n' "${MISSING_VARS[@]}"
        echo ""
    else
        echo "✅ All critical environment variables present"
    fi
fi
echo ""

# Step 5: Restart the application
echo "5️⃣  Restarting application..."

# Check if PM2 is being used
if command -v pm2 &> /dev/null; then
    echo "   Using PM2..."

    # Check if app is already running
    if pm2 list | grep -q "wingside"; then
        echo "   Reloading existing process..."
        pm2 reload wingside --update-env
    else
        echo "   Starting new process..."
        pm2 start npm --name "wingside" -- start
        pm2 save
    fi

    echo "✅ Application restarted with PM2"
    echo ""
    echo "📊 PM2 Status:"
    pm2 list | grep wingside

elif systemctl is-active --quiet wingside.service 2>/dev/null; then
    echo "   Using systemd..."
    sudo systemctl restart wingside.service
    echo "✅ Application restarted with systemd"
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status wingside.service --no-pager -l

else
    echo "⚠️  No process manager detected (PM2 or systemd)"
    echo "   Please restart your application manually"
    echo ""
    echo "   To start with PM2:"
    echo "     pm2 start npm --name wingside -- start"
    echo "     pm2 save"
    echo "     pm2 startup"
fi
echo ""

# Step 6: Clean up
echo "6️⃣  Cleaning up..."
# Remove old logs (keep last 30 days)
find logs -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
echo "✅ Cleanup complete"
echo ""

# Step 7: Health check
echo "7️⃣  Running health check..."
sleep 3  # Give app time to start

if command -v curl &> /dev/null; then
    # Try localhost first
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        echo "✅ Application is responding on localhost:3000"
    else
        echo "⚠️  Application may not be running on localhost:3000"
        echo "   Check logs: pm2 logs wingside OR journalctl -u wingside.service -f"
    fi
else
    echo "⚠️  curl not available for health check"
fi
echo ""

# Display deployment summary
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Post-deployment checklist:"
echo "  [ ] Check application logs"
echo "  [ ] Test website in browser"
echo "  [ ] Verify cron jobs are set up (if first deployment)"
echo "  [ ] Monitor for errors in first 5 minutes"
echo ""
echo "Useful commands:"
echo "  View logs:     pm2 logs wingside --lines 100"
echo "  Restart:       pm2 restart wingside"
echo "  Monitor:       pm2 monit"
echo "  Cron logs:     tail -f logs/tier-downgrades.log"
echo ""
