# Wingside VPS Deployment Guide (Hostinger)

Complete guide for deploying and managing Wingside on Hostinger VPS.

## Prerequisites

- Hostinger VPS with SSH access
- Node.js 18+ installed
- PM2 installed (`npm install -g pm2`)
- Git configured
- Domain pointed to VPS IP

## Initial Setup

### 1. Clone Repository

```bash
cd /var/www  # or your preferred directory
git clone https://github.com/yourusername/wingside.git
cd wingside
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.production
nano .env.production  # or use vim/vi
```

Add all required variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Tier Downgrade Cron
CRON_SECRET=your_generated_secret

# Payment Gateway (Nomba)
NOMBA_CLIENT_ID=your_client_id
NOMBA_CLIENT_SECRET=your_client_secret
NOMBA_ACCOUNT_ID=your_account_id

# Application
NEXT_PUBLIC_APP_URL=https://wingside.ng
NODE_ENV=production
PORT=3000
```

### 4. Build Application

```bash
npm run build
```

### 5. Start with PM2

```bash
# Using ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Or manually
pm2 start npm --name "wingside" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command PM2 outputs
```

### 6. Configure Nginx (if using)

Create `/etc/nginx/sites-available/wingside`:

```nginx
server {
    listen 80;
    server_name wingside.ng www.wingside.ng;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wingside.ng www.wingside.ng;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/wingside.ng/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wingside.ng/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js app
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
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Client body size (for file uploads)
    client_max_body_size 10M;
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL Certificate

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d wingside.ng -d www.wingside.ng
```

## Tier Downgrade Cron Job Setup

### Run the Setup Script

```bash
cd /var/www/wingside
bash setup-cron-vps.sh
```

The script will:
1. Check for CRON_SECRET in .env.production
2. Create cron job script
3. Configure crontab
4. Set up logging

### Manual Setup (Alternative)

If the script doesn't work:

```bash
# Create cron script
nano /var/www/wingside/run-tier-downgrade-cron.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/wingside
export $(grep -v '^#' .env.production | xargs)
curl -X POST "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -s >> /var/www/wingside/logs/tier-downgrades.log 2>&1
echo "[$(date)] Tier downgrade cron executed" >> /var/www/wingside/logs/tier-downgrades.log
```

Make executable:
```bash
chmod +x /var/www/wingside/run-tier-downgrade-cron.sh
```

Add to crontab:
```bash
crontab -e
```

Add line:
```
0 2 * * 0 /var/www/wingside/run-tier-downgrade-cron.sh
```

## Deployment Workflow

### Standard Deployment

```bash
cd /var/www/wingside
bash deploy-vps.sh
```

The script handles:
1. ✅ Git pull
2. ✅ Install dependencies
3. ✅ Build application
4. ✅ Restart PM2
5. ✅ Health check

### Manual Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install --production

# 3. Build
npm run build

# 4. Restart with PM2
pm2 restart wingside

# Or reload (zero-downtime)
pm2 reload wingside

# 5. Save configuration
pm2 save
```

## Monitoring & Maintenance

### View Logs

```bash
# PM2 logs (real-time)
pm2 logs wingside

# PM2 logs (last 100 lines)
pm2 logs wingside --lines 100

# Tier downgrade cron logs
tail -f /var/www/wingside/logs/tier-downgrades.log

# Error logs only
pm2 logs wingside --err

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Monitor Application

```bash
# PM2 status
pm2 status

# Real-time monitoring
pm2 monit

# CPU and memory usage
pm2 list
```

### Restart Application

```bash
# Restart (brief downtime)
pm2 restart wingside

# Reload (zero-downtime, cluster mode only)
pm2 reload wingside

# Stop application
pm2 stop wingside

# Start application
pm2 start wingside

# Delete from PM2
pm2 delete wingside
```

### Check Cron Jobs

```bash
# List cron jobs
crontab -l

# View cron logs
grep CRON /var/log/syslog

# Test cron script manually
bash /var/www/wingside/run-tier-downgrade-cron.sh
```

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs wingside --err --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Kill process using port 3000
sudo kill -9 $(sudo lsof -t -i:3000)

# Restart PM2
pm2 restart wingside
```

### Environment Variables Not Loading

```bash
# Verify .env.production exists
ls -la /var/www/wingside/.env.production

# Check PM2 is loading env file
pm2 show wingside | grep env

# Restart with env refresh
pm2 restart wingside --update-env
```

### Cron Job Not Running

```bash
# Check crontab
crontab -l

# Check cron is running
sudo systemctl status cron

# View cron execution logs
grep CRON /var/log/syslog | tail -20

# Test script manually
bash /var/www/wingside/run-tier-downgrade-cron.sh

# Check script permissions
ls -l /var/www/wingside/run-tier-downgrade-cron.sh
# Should show -rwxr-xr-x
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart wingside

# Reduce max memory restart threshold
pm2 restart wingside --max-memory-restart 800M
pm2 save
```

### Nginx Issues

```bash
# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Backup & Recovery

### Backup Database

```bash
# Supabase handles backups, but you can export locally
# Create backup script
nano /var/www/wingside/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/wingside"
mkdir -p $BACKUP_DIR

# Backup .env.production
cp /var/www/wingside/.env.production "$BACKUP_DIR/env_$DATE.backup"

# Backup PM2 configuration
pm2 save

echo "Backup completed: $DATE"
```

### Restore from Backup

```bash
# Stop application
pm2 stop wingside

# Restore .env.production
cp /var/backups/wingside/env_YYYYMMDD_HHMMSS.backup /var/www/wingside/.env.production

# Pull specific Git commit
git checkout <commit-hash>

# Rebuild
npm install
npm run build

# Start application
pm2 start wingside
```

## Performance Optimization

### Enable Gzip Compression (Nginx)

Add to nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### PM2 Cluster Mode

For better performance:
```bash
# Edit ecosystem.config.js
instances: 2,  # or 'max' for all CPU cores
exec_mode: 'cluster'

# Restart
pm2 restart wingside
```

### Rate Limiting (Nginx)

Add to nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:3000;
}
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Fail2ban installed for brute-force protection
- [ ] Regular security updates (`sudo apt update && sudo apt upgrade`)
- [ ] .env.production file permissions (chmod 600)
- [ ] Nginx security headers configured
- [ ] CRON_SECRET properly secured

## Useful Commands Cheat Sheet

```bash
# Deployment
git pull && npm install && npm run build && pm2 restart wingside

# Quick restart
pm2 restart wingside --update-env

# View logs
pm2 logs wingside --lines 50

# Monitor
pm2 monit

# Status
pm2 status

# Cron test
bash run-tier-downgrade-cron.sh

# Database migrations (run on VPS)
# Apply SQL directly in Supabase Dashboard

# Check app health
curl http://localhost:3000

# SSL renewal (usually automatic)
sudo certbot renew --dry-run
```

## Support

For issues:
1. Check PM2 logs: `pm2 logs wingside`
2. Check cron logs: `tail -f logs/tier-downgrades.log`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify environment variables: `pm2 show wingside`
5. Test endpoints manually with curl
