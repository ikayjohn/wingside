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

echo -e "${YELLOW}📦 Stopping PM2 process...${NC}"
cd $APP_DIR
pm2 stop wingside || true
pm2 delete wingside || true

echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin $BRANCH

echo -e "${YELLOW}🧹 Cleaning old build...${NC}"
rm -rf .next

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Building application...${NC}"
NODE_ENV=production npm run build

echo -e "${YELLOW}🔄 Starting application...${NC}"
NODE_ENV=production pm2 start npm --name "wingside" -- start
pm2 save

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application is running at: http://localhost:3000"
echo "View logs: pm2 logs wingside"
echo "Monitor: pm2 monit"
