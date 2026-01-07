# Wingside Hostinger VPS Deployment Guide

This guide covers deploying the Wingside application to a Hostinger VPS for **wingside.ng** and **www.wingside.ng**.

## Prerequisites

- Hostinger VPS with Ubuntu 20.04+ or similar
- Node.js 18+ installed on VPS
- PM2 for process management
- Domain: **wingside.ng** and **www.wingside.ng** pointed to VPS IP

## Quick Deploy Steps

### 1. SSH into your VPS

```bash
ssh root@your-vps-ip
# OR
ssh ubuntu@your-vps-ip
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3. Install PM2 globally

```bash
sudo npm install -g pm2
```

### 4. Clone your repository

```bash
cd /var/www
sudo git clone https://github.com/ikayjohn/wingside.git
cd wingside
```

### 5. Install dependencies

```bash
npm install
```

### 6. Create production environment file

```bash
cp .env.example .env.production
nano .env.production
```

Add your actual environment variables:
```env
# Supabase - Get from https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://cxbqochxrhokdscgijxe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Resend - Get from https://resend.com/api_keys
RESEND_API_KEY=re_your-actual-resend-api-key

# Web Push Notifications
VAPID_PRIVATE_KEY=your-actual-vapid-private-key
VAPID_PUBLIC_KEY=your-actual-vapid-public-key
VAPID_SUBJECT=mailto:info@wingside.ng

# Environment
NODE_ENV=production
PORT=3000
```

### 7. Build the application

```bash
npm run build
```

### 8. Start with PM2

```bash
pm2 start npm --name "wingside" -- start
pm2 save
pm2 startup
```

### 9. Configure Nginx

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Create Nginx config for Wingside:
```bash
sudo nano /etc/nginx/sites-available/wingside
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name wingside.ng www.wingside.ng;

    # Log files
    access_log /var/log/nginx/wingside.access.log;
    error_log /var/log/nginx/wingside.error.log;

    # Redirect www to non-www (optional - remove if you want www)
    # if ($host = 'www.wingside.ng') {
    #     return 301 https://wingside.ng$request_uri;
    # }

    location / {
        proxy_pass http://localhost:3000;
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

    # Cache static assets for better performance
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    location /static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Remove default Nginx site:
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

### 10. Setup SSL with Let's Encrypt for both domains

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate for both domains
sudo certbot --nginx -d wingside.ng -d www.wingside.ng

# Certbot will automatically configure SSL and redirect HTTP to HTTPS
# Enter your email when prompted
# Agree to terms of service
```

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

### 11. Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Update Deployment

To update the application after making changes:

```bash
cd /var/www/wingside
git pull origin main
npm install
npm run build
pm2 restart wingside
```

Or use the automated deployment script:
```bash
cd /var/www/wingside
./deploy.sh
```

## PM2 Commands

```bash
# View logs
pm2 logs wingside

# View real-time logs
pm2 logs wingside --lines 100

# Restart app
pm2 restart wingside

# Stop app
pm2 stop wingside

# Start app
pm2 start wingside

# Monitor
pm2 monit

# Show status
pm2 status

# View app info
pm2 info wingside

# View resource usage
pm2 plus
```

## Domain Configuration

Ensure your DNS is configured at your registrar (Namecheap, GoDaddy, etc.):

**For wingside.ng:**
```
Type: A
Name: @
Value: Your-VPS-IP-Address
TTL: 3600
```

**For www.wingside.ng:**
```
Type: CNAME
Name: www
Value: wingside.ng
TTL: 3600
```

## Performance Optimization

The application is already optimized with:
- ✅ Next.js 16 with Turbopack for faster builds
- ✅ Tailwind CSS 4 for optimized CSS
- ✅ Bundle analyzer for size monitoring
- ✅ Experimental package imports optimization
- ✅ Image optimization enabled
- ✅ Static asset caching via Nginx
- ✅ HTTP/2 support via Nginx
- ✅ Gzip compression enabled

## Monitoring

Check application health:
```bash
# Check if Next.js is running
curl http://localhost:3000

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/wingside.error.log
```

## Troubleshooting

### Build fails
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear all caches and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### App not accessible
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs wingside --lines 50

# Verify PORT is set
cat .env.production | grep PORT

# Restart PM2
pm2 restart wingside
```

### API routes not working
```bash
# Ensure NODE_ENV is production
echo $NODE_ENV

# Check .env.production exists
ls -la .env.production

# Restart with fresh environment
pm2 delete wingside
pm2 start npm --name "wingside" -- start
```

### Nginx issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL certificate issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Port 3000 not accessible
```bash
# Check if port is open
sudo netstat -tlnp | grep 3000

# Check if Next.js is running
pm2 status

# Check firewall
sudo ufw status
```

## Useful Commands

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Disk space check
df -h

# Memory usage
free -h

# CPU usage
top

# Check system logs
sudo journalctl -xe
```

## Backup Strategy

Regular backups should include:
1. Database (Supabase - automatic)
2. Environment files
```bash
cp .env.production .env.production.backup
```
3. PM2 process list
```bash
pm2 save
```

## Production URLs

- **Main site**: https://wingside.ng
- **WWW**: https://www.wingside.ng
- **Admin dashboard**: https://wingside.ng/admin
- **API endpoints**: https://wingside.ng/api/*

## Support

For issues or questions:
- Check logs: `pm2 logs wingside`
- Review Nginx logs: `sudo tail -f /var/log/nginx/wingside.error.log`
- Verify DNS: `nslookup wingside.ng`
