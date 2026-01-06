#!/bin/bash

# Wingside Deployment Script for Hostinger VPS

set -e

echo "🚀 Starting Wingside deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/wingside"
REPO_URL="https://github.com/ikayjohn/wingside.git"
BRANCH="main"

echo -e "${YELLOW}📦 Pulling latest code...${NC}"
cd $APP_DIR
git pull origin $BRANCH

echo -e "${YELLOW}📥 Installing dependencies...${NC}"
npm install --production=false

echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart wingside || pm2 start npm --name "wingside" -- start

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application is running at: http://localhost:3000"
echo "View logs: pm2 logs wingside"
echo "Monitor: pm2 monit"
