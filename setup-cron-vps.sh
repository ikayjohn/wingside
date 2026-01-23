#!/bin/bash
# ============================================================================
# Setup Cron Job for Tier Downgrades on Hostinger VPS
# ============================================================================
# Run this script on your VPS after deployment
# Usage: bash setup-cron-vps.sh
# ============================================================================

echo "🚀 Setting up Tier Downgrade Cron Job for Hostinger VPS"
echo ""

# Get the current directory (where the app is deployed)
APP_DIR="$(pwd)"
echo "📁 App Directory: $APP_DIR"

# Check if .env.production exists
if [ ! -f "$APP_DIR/.env.production" ]; then
    echo "❌ Error: .env.production not found in $APP_DIR"
    echo "   Please ensure .env.production exists with CRON_SECRET defined"
    exit 1
fi

# Check if CRON_SECRET is set
if ! grep -q "CRON_SECRET=" "$APP_DIR/.env.production"; then
    echo "❌ Error: CRON_SECRET not found in .env.production"
    echo "   Run: openssl rand -base64 32"
    echo "   Then add to .env.production: CRON_SECRET=your-generated-secret"
    exit 1
fi

CRON_SECRET=$(grep "CRON_SECRET=" "$APP_DIR/.env.production" | cut -d '=' -f2)
echo "✅ CRON_SECRET found"
echo ""

# Get the domain/URL
read -p "Enter your domain (e.g., wingside.ng): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Domain is required"
    exit 1
fi

# Determine protocol (http or https)
read -p "Use HTTPS? (y/n, default: y): " USE_HTTPS
USE_HTTPS=${USE_HTTPS:-y}

if [ "$USE_HTTPS" = "y" ] || [ "$USE_HTTPS" = "Y" ]; then
    PROTOCOL="https"
else
    PROTOCOL="http"
fi

URL="$PROTOCOL://$DOMAIN"
echo "🌐 API URL: $URL/api/cron/tier-downgrades"
echo ""

# Create the cron job script
CRON_SCRIPT="$APP_DIR/run-tier-downgrade-cron.sh"

cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash
# Tier Downgrade Cron Job
# Auto-generated

# Change to app directory
cd /var/www/wingside

# Load environment variables from .env.production (skip comments and empty lines)
set -a
source <(grep -v '^#' .env.production | grep -v '^$' | sed 's/\r$//')
set +a

# Run the tier downgrade endpoint
curl -X POST "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  >> /var/www/wingside/logs/tier-downgrades.log 2>&1

# Log the execution
echo "[$(date)] Tier downgrade cron executed" >> /var/www/wingside/logs/tier-downgrades.log
EOF

chmod +x "$CRON_SCRIPT"
echo "✅ Created cron script: $CRON_SCRIPT"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$APP_DIR/logs"
echo "✅ Created logs directory: $APP_DIR/logs"
echo ""

# Test the script
echo "🧪 Testing cron script..."
bash "$CRON_SCRIPT"
echo ""

# Check if the log was created
if [ -f "$APP_DIR/logs/tier-downgrades.log" ]; then
    echo "✅ Test execution successful. Log output:"
    tail -5 "$APP_DIR/logs/tier-downgrades.log"
    echo ""
else
    echo "⚠️  Log file not created. This may be normal if the app isn't running."
    echo ""
fi

# Add to crontab
echo "⏰ Setting up crontab..."
echo ""
echo "Proposed cron schedule:"
echo "  - Every Sunday at 2:00 AM: 0 2 * * 0"
echo "  - Every day at 2:00 AM: 0 2 * * *"
echo "  - Weekly on Monday at 3:00 AM: 0 3 * * 1"
echo ""

read -p "Enter cron schedule (default: 0 2 * * 0 for Sunday 2AM): " CRON_SCHEDULE
CRON_SCHEDULE=${CRON_SCHEDULE:-0 2 * * 0}

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE $CRON_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
    echo "⚠️  Cron job already exists. Updating..."
    crontab -l 2>/dev/null | grep -v "$CRON_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo ""

# Display current crontab
echo "📋 Current crontab:"
crontab -l | grep tier-downgrade
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ TIER DOWNGRADE CRON JOB SETUP COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Cron Schedule: $CRON_SCHEDULE"
echo "Script Location: $CRON_SCRIPT"
echo "Log Location: $APP_DIR/logs/tier-downgrades.log"
echo ""
echo "To view logs:"
echo "  tail -f $APP_DIR/logs/tier-downgrades.log"
echo ""
echo "To test manually:"
echo "  bash $CRON_SCRIPT"
echo ""
echo "To edit cron schedule:"
echo "  crontab -e"
echo ""
