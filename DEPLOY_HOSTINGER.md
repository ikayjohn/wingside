# Deploying Wingside to Hostinger VPS

## Prerequisites
- Hostinger VPS with SSH access
- Domain pointed to your VPS IP
- Node.js 20+ installed

## Step-by-Step Deployment

### 1. SSH into your Hostinger VPS
```bash
ssh your-user@your-vps-ip
```

### 2. Clone the repository (or pull if already cloned)
```bash
cd /var/www  # or your preferred directory
git clone https://github.com/ikayjohn/wingside.git
cd wingside
```

### 3. Make deploy script executable
```bash
chmod +x deploy-hostinger.sh
```

### 4. Run deployment
```bash
./deploy-hostinger.sh
```

### 5. Configure Nginx

#### Copy the Nginx config:
```bash
sudo cp nginx-hostinger.conf /etc/nginx/sites-available/wingside
```

#### Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/wingside /etc/nginx/sites-enabled/
```

#### Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL Certificate (Let's Encrypt)

#### Install Certbot:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

#### Get certificate:
```bash
sudo certbot --nginx -d wingside.ng -d www.wingside.ng
```

#### Auto-renewal is configured automatically.

### 7. Configure Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 8. Verify Deployment

#### Check if PM2 is running:
```bash
pm2 status
pm2 logs wingside
```

#### Check if Next.js is responding:
```bash
curl http://localhost:3000/api/health
```

#### Check API routes:
```bash
curl http://localhost:3000/api/products
```

## Common Issues & Fixes

### Issue: API routes return 404
**Fix:** Make sure Next.js server is running on port 3000
```bash
pm2 restart wingside
```

### Issue: Nginx 502 Bad Gateway
**Fix:** Check if Next.js is running and port 3000 is accessible
```bash
netstat -tuln | grep 3000
pm2 logs wingside --lines 50
```

### Issue: Build fails
**Fix:** Make sure all dependencies are installed
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Port 3000 already in use
**Fix:** Kill the process or use a different port
```bash
lsof -ti:3000 | xargs kill -9
# Then update PORT env variable and restart
```

## Monitoring

### View logs:
```bash
# PM2 logs
pm2 logs wingside

# Nginx logs
sudo tail -f /var/log/nginx/wingside_error.log

# System logs
sudo journalctl -u nginx -f
```

### Restart app:
```bash
pm2 restart wingside
```

### Update app:
```bash
cd /var/www/wingside
git pull origin main
npm install
npm run build
pm2 restart wingside
```

## Environment Variables

Create `.env.production` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment gateway
NOMBA_CLIENT_ID=your-client-id
NOMBA_CLIENT_SECRET=your-client-secret
NOMBA_ACCOUNT_ID=your-account-id

# App URL
NEXT_PUBLIC_APP_URL=https://wingside.ng

# Redis (optional - for caching)
REDIS_URL=your-redis-url

# Port (default: 3000)
PORT=3000
```

## Security Tips

1. **Keep Node.js updated:** `sudo apt update && sudo apt upgrade nodejs`
2. **Use HTTPS:** Always use SSL certificates
3. **Limit PM2 API access:** Don't expose PM2 port publicly
4. **Regular backups:** Backup database and code regularly
5. **Monitor logs:** Check for suspicious activity

## Performance Optimization

1. **Enable gzip compression** in Nginx
2. **Use CDN** for static assets
3. **Configure Redis** for caching
4. **Setup database connection pooling**
5. **Monitor memory usage:** `pm2 monit`
