# Hostinger VPS Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Wingside Next.js application to a Hostinger VPS.

## VPS Optimizations

The following optimizations are configured for Hostinger VPS:

### PM2 Cluster Mode
- **Instances**: 2 (cluster mode for load balancing)
- **Memory Limit**: 800MB per instance
- **Auto-restart**: Enabled with intelligent backoff
- **Logging**: Timestamped logs in `./logs/` directory

### Next.js Configuration
- **Standalone Output**: Optimized build for VPS deployment
- **SWC Minification**: Fast Rust-based code minification
- **Package Import Optimization**: Reduced bundle size
- **Aggressive Caching**: Static assets cached for 1 year

### Caching Strategy
- **Videos (.mp4)**: 1 year, immutable
- **Images (.jpg, .png, .webp, etc.)**: 1 year, immutable
- **Fonts (.woff, .woff2, etc.)**: 1 year, immutable
- **Static Assets**: 1 year, immutable
- **API Routes**: No caching (fresh data)

## Prerequisites

1. Hostinger VPS with Ubuntu/Debian
2. Node.js 18+ installed
3. PM2 installed globally
4. Nginx installed (for reverse proxy)
5. SSL certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### Install Node.js
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

### Install PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Enable Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Step 2: Clone & Build Application

```bash
# Navigate to web directory
cd /var/www/

# Clone repository
sudo git clone https://github.com/your-username/wingside.git
sudo chown -R $USER:$USER wingside
cd wingside

# Install dependencies
npm ci --production

# Create logs directory
mkdir -p logs

# Copy environment file
cp .env.example .env.production
nano .env.production  # Edit with production values
```

### Environment Variables (.env.production)

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PORT=3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Payment Gateways
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NOMBA_SECRET_KEY=your_nomba_secret_key

# Webhook Authentication
WEBHOOK_AUTH_TOKEN=generate_random_token_here
INTERNAL_SERVICE_TOKEN=generate_random_token_here

# Redis (Optional - uses memory cache if not set)
REDIS_URL=redis://localhost:6379

# Email & SMS
RESEND_API_KEY=your_resend_api_key
TERMII_API_KEY=your_termii_api_key

# Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Logging
LOG_LEVEL=info  # info in production, debug in development
```

### Build Application
```bash
# Build for production
npm run build

# Verify build
ls -la .next/standalone
```

## Step 3: Configure PM2

The `ecosystem.config.js` is already optimized for VPS. Start the application:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# View logs
pm2 logs wingside

# Monitor performance
pm2 monit

# Check status
pm2 status
```

### PM2 Commands
```bash
# Restart application
pm2 restart wingside

# Stop application
pm2 stop wingside

# Reload (zero-downtime)
pm2 reload wingside

# View logs
pm2 logs wingside --lines 100

# Clear logs
pm2 flush

# List processes
pm2 list
```

## Step 4: Configure Nginx Reverse Proxy

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/wingside
```

### Nginx Configuration (with caching)
```nginx
# Upstream Next.js application
upstream wingside_app {
    least_conn;
    server localhost:3000;
}

# Cache configuration
proxy_cache_path /var/cache/nginx/wingside levels=1:2 keys_zone=wingside_cache:10m max_size=1g inactive=60m use_temp_path=off;

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers (additional to Next.js headers)
    add_header X-Robots-Tag "index, follow" always;

    # Logging
    access_log /var/log/nginx/wingside-access.log;
    error_log /var/log/nginx/wingside-error.log;

    # Max upload size (for file uploads)
    client_max_body_size 10M;

    # Proxy to Next.js
    location / {
        proxy_pass http://wingside_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets (images, fonts, videos)
    location ~* \.(jpg|jpeg|png|gif|webp|ico|svg|mp4|woff|woff2|ttf|eot)$ {
        proxy_pass http://wingside_app;
        proxy_cache wingside_cache;
        proxy_cache_valid 200 365d;
        proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
        add_header X-Cache-Status $upstream_cache_status;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache API routes
    location /api/ {
        proxy_pass http://wingside_app;
        proxy_cache_bypass 1;
        proxy_no_cache 1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Cache Next.js static files
    location /_next/static/ {
        proxy_pass http://wingside_app;
        proxy_cache wingside_cache;
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";
}
```

### Enable Site & Reload Nginx
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 5: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is configured via cron
```

## Step 6: Redis Setup (Optional but Recommended)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Test Redis
redis-cli ping  # Should return PONG

# Update .env.production
REDIS_URL=redis://localhost:6379
```

## Step 7: Monitoring & Maintenance

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# CPU & Memory usage
pm2 status

# Application logs
pm2 logs wingside --lines 100

# Error logs only
pm2 logs wingside --err --lines 50
```

### Nginx Monitoring
```bash
# Access logs
sudo tail -f /var/log/nginx/wingside-access.log

# Error logs
sudo tail -f /var/log/nginx/wingside-error.log

# Check Nginx status
sudo systemctl status nginx
```

### Disk Usage
```bash
# Check disk usage
df -h

# Check directory sizes
du -sh /var/www/wingside/*

# Clean PM2 logs
pm2 flush

# Clean Nginx cache
sudo rm -rf /var/cache/nginx/wingside/*
```

## Step 8: Deployment Updates

### Pull Latest Changes
```bash
cd /var/www/wingside

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build
npm run build

# Reload PM2 (zero-downtime)
pm2 reload wingside

# Or restart
pm2 restart wingside
```

### Automated Deployment Script
Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Reload PM2
pm2 reload wingside

# Check status
pm2 status

echo "✅ Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs wingside --lines 100

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart wingside
```

### Nginx Errors
```bash
# Test Nginx configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/wingside-error.log

# Reload Nginx
sudo systemctl reload nginx
```

### Memory Issues
```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 status

# Reduce PM2 instances if needed
# Edit ecosystem.config.js: instances: 1
pm2 reload wingside
```

### Database Connection Issues
```bash
# Check environment variables
cat .env.production | grep SUPABASE

# Test connection
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

## Performance Optimization Checklist

- [x] PM2 cluster mode enabled (2 instances)
- [x] Nginx reverse proxy configured
- [x] Gzip compression enabled
- [x] Static asset caching (1 year)
- [x] Redis caching (optional)
- [x] SSL/TLS enabled
- [x] Security headers configured
- [ ] Database connection pooling (Supabase handles this)
- [ ] CDN for static assets (optional)
- [ ] Image optimization via Next.js Image component

## Security Checklist

- [x] Firewall configured (UFW)
- [x] SSL certificate installed
- [x] Security headers enabled
- [x] File upload validation (magic numbers)
- [x] CSRF protection enabled
- [x] Rate limiting configured
- [x] Environment variables secured
- [x] RLS enabled in Supabase
- [ ] Regular security updates
- [ ] Automated backups configured

## Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (change 22 to your SSH port if custom)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Backup Strategy

### Automated Daily Backups
Create `/usr/local/bin/backup-wingside.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/wingside"
DATE=$(date +%Y%m%d)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/wingside-code-$DATE.tar.gz -C /var/www wingside

# Backup environment file
cp /var/www/wingside/.env.production $BACKUP_DIR/.env.production-$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "wingside-*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name ".env.production-*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-wingside.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-wingside.sh
```

## Support

For deployment issues:
1. Check this guide
2. Review PM2 logs: `pm2 logs wingside`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/wingside-error.log`
4. Check application status: `pm2 status`

---

**Last Updated**: February 1, 2026
**Server Requirements**: 2GB RAM, 2 CPU cores, 20GB SSD
**Recommended VPS**: Hostinger VPS Plan 2 or higher
