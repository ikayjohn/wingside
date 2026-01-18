#!/bin/bash

# Deployment script for Hostinger VPS
# Run this on your Hostinger VPS

set -e

echo "🚀 Starting Wingside deployment to Hostinger VPS..."

# 1. Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 3. Stop existing app if running
echo "🛑 Stopping existing app..."
pm2 stop wingside 2>/dev/null || true
pm2 delete wingside 2>/dev/null || true

# 4. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 5. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 6. Build the app
echo "🔨 Building Next.js app..."
npm run build

# 7. Start with PM2
echo "▶️  Starting app with PM2..."
NODE_ENV=production pm2 start npm --name "wingside" -- start

# 8. Save PM2 config
pm2 save

# 9. Show status
pm2 status

echo "✅ Deployment complete!"
echo "📝 App is running on port 3000"
echo "🔗 Make sure Nginx/Apache is configured to proxy to port 3000"
