#!/bin/bash

# Safe Update Script for Wingside VPS
# Preserves environment variables during git pull

echo "=========================================="
echo "Safe Update for Wingside"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the wingside directory"
    echo "   Run: cd /var/www/wingside"
    echo "   Then: bash vps-safe-update.sh"
    exit 1
fi

# Step 1: Backup existing ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    echo "1. Backing up your ecosystem.config.js..."
    cp ecosystem.config.js ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✓ Backup created"
    echo ""

    # Extract current environment variables
    echo "2. Extracting your current environment variables..."
    grep -E "NOMBA_|SUPABASE_|NEXT_PUBLIC_" ecosystem.config.js > .env_backup 2>/dev/null || true
    echo "   ✓ Variables backed up to .env_backup"
    echo ""
fi

# Step 2: Remove ecosystem.config.js temporarily
if [ -f "ecosystem.config.js" ]; then
    echo "3. Removing old ecosystem.config.js..."
    rm ecosystem.config.js
    echo "   ✓ Removed"
    echo ""
fi

# Step 3: Pull latest changes
echo "4. Pulling latest code from git..."
if git pull origin main; then
    echo "   ✓ Git pull successful"
    echo ""
else
    echo "   ✗ Git pull failed"
    echo ""
    echo "Restoring backup..."
    cp ecosystem.config.js.backup.* ecosystem.config.js 2>/dev/null || true
    exit 1
fi

# Step 4: Merge back environment variables
if [ -f ".env_backup" ]; then
    echo "5. Merging your environment variables..."

    # Check if the new ecosystem.config.js has placeholders
    if grep -q "ADD YOUR" ecosystem.config.js || grep -q "your_value_here" ecosystem.config.js; then
        echo "   ⚠️  New ecosystem.config.js has placeholders"
        echo "   ⚠️  You need to manually add your environment variables"
        echo ""
        echo "Your saved variables:"
        cat .env_backup
        echo ""
        echo "Edit ecosystem.config.js and add these values:"
        echo "nano ecosystem.config.js"
    else
        echo "   ✓ Variables already in ecosystem.config.js"
        rm .env_backup
    fi
    echo ""
fi

# Step 5: Install dependencies
echo "6. Installing dependencies..."
if npm install --production; then
    echo "   ✓ Dependencies installed"
    echo ""
else
    echo "   ✗ Failed to install dependencies"
    exit 1
fi

# Step 6: Build application
echo "7. Building application..."
if npm run build; then
    echo "   ✓ Build successful"
    echo ""
else
    echo "   ✗ Build failed"
    echo "   Check the error messages above"
    exit 1
fi

# Step 7: Restart application
echo "8. Restarting application..."
if pm2 restart ecosystem.config.js --env production; then
    echo "   ✓ Application restarted"
else
    # Fallback: try restarting wingside process
    if pm2 restart wingside; then
        echo "   ✓ Application restarted (wingside)"
    else
        echo "   ⚠️  Could not restart PM2"
        echo "   Run manually: pm2 restart ecosystem.config.js --env production"
    fi
fi
echo ""

# Step 8: Save PM2 config
pm2 save > /dev/null 2>&1
echo "   ✓ PM2 config saved"
echo ""

echo "=========================================="
echo "✅ Update Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify environment variables are set:"
echo "   pm2 env wingside | grep NOMBA"
echo ""
echo "2. Check application logs:"
echo "   pm2 logs wingside --lines 50"
echo ""
echo "3. Fix Nginx if needed:"
echo "   bash scripts/fix-nginx-config.sh"
echo ""
echo "4. Test webhook from your local machine:"
echo "   scripts\\test-webhook.ps1"
echo ""
