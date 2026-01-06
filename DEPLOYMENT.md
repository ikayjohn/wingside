# Hostinger VPS Deployment Guide

This guide covers deploying the Wingside application to a Hostinger VPS.

## Prerequisites

- Hostinger VPS with Ubuntu 20.04+ or similar
- Node.js 18+ installed on VPS
- PM2 for process management
- Domain pointed to VPS IP

## Quick Deploy Steps

### 1. SSH into your VPS

```bash
ssh user@your-vps-ip
```

### 2. Install Node.js (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PM2 globally

```bash
sudo npm install -g pm2
```

### 4. Clone your repository

```bash
cd /var/www
git clone https://github.com/ikayjohn/wingside.git
cd wingside
```

### 5. Install dependencies

```bash
npm install
```

### 6. Create environment file

```bash
cp .env.example .env.production
nano .env.production
```

Add your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
VAPID_PRIVATE_KEY=your-vapid-key
VAPID_PUBLIC_KEY=your-vapid-public-key
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

### 9. Configure Nginx (optional but recommended)

Install Nginx:
```bash
sudo apt install nginx
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/wingside
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }

    # Cache static assets
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
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Setup SSL with Let's Encrypt (recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Update Deployment

To update the application:

```bash
cd /var/www/wingside
git pull origin main
npm install
npm run build
pm2 restart wingside
```

## PM2 Commands

```bash
# View logs
pm2 logs wingside

# Restart app
pm2 restart wingside

# Stop app
pm2 stop wingside

# Monitor
pm2 monit
```

## Performance Optimization

The application is already optimized with:
- Next.js 16 with Turbopack for faster builds
- Tailwind CSS 4 for optimized CSS
- Bundle analyzer for size monitoring
- Experimental package imports optimization
- Image optimization enabled

## Troubleshooting

### Build fails
- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `rm -rf .next node_modules && npm install`

### App not accessible
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs wingside`
- Verify PORT is set correctly in .env.production

### API routes not working
- Ensure NODE_ENV=production is set
- Check if ports are open: `sudo ufw status`
