# 🚀 Praxifi Production Deployment - Quick Start

## TL;DR - 30 Minute Deploy

This is the express version. For detailed steps, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.

---

## Before You Start (5 minutes)

### 1. Update Domain References
```bash
# Replace 'yourdomain.com' with your actual domain everywhere
cd /home/draxxy/praxifi

# Files to update (or use find/replace in VS Code):
# - praxifi-CFO/nginx.production.conf
# - praxifi-CFO/aiml_engine/api/app.py
```

### 2. Get Google API Key
- Go to: https://makersuite.google.com/app/apikey
- Create & copy key

### 3. Create Environment Files
```bash
# Backend
cp praxifi-CFO/.env.production.example praxifi-CFO/.env
nano praxifi-CFO/.env
# Paste Google API key: GOOGLE_API_KEY=your_key_here

# Frontend  
cp praxifi-frontend/.env.production.example praxifi-frontend/.env.production
nano praxifi-frontend/.env.production
# Update: NEXT_PUBLIC_API_URL=https://api.your-actual-domain.com
```

### 4. Commit & Push
```bash
git add .
git commit -m "Production config"
git push origin v3
```

---

## Rent VPS (5 minutes)

1. **Go to Fluence Console** (or DigitalOcean, Vultr, etc.)
2. **Create Droplet/Server**:
   - Ubuntu 22.04 LTS
   - 4 vCPU, 8GB RAM, 50GB SSD
   - Select datacenter location
3. **Note IP**: `123.45.67.89` (example)

---

## Configure DNS (2 minutes + wait)

1. **Login to Namecheap** → Domain List → Manage
2. **Add A Records**:
   ```
   @       →  123.45.67.89
   www     →  123.45.67.89
   api     →  123.45.67.89
   ```
3. **Wait 15-60 minutes** for DNS propagation

---

## Deploy to VPS (15 minutes)

### Step 1: Connect & Setup
```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install pnpm & PM2
npm install -g pnpm pm2

# Install certbot
apt install -y certbot python3-certbot-nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Step 2: Clone & Configure
```bash
# Clone repo
mkdir -p /opt/praxifi
cd /opt/praxifi
git clone https://github.com/YOUR_USERNAME/praxifi.git .

# Verify environment files exist
ls -la praxifi-CFO/.env
ls -la praxifi-frontend/.env.production
```

### Step 3: Get SSL Certificate
```bash
# Stop any web server
docker compose down

# Get certificate (replace with YOUR domain)
certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@example.com \
  --agree-tos

# Certificates saved to: /etc/letsencrypt/live/yourdomain.com/
```

### Step 4: Deploy!
```bash
cd /opt/praxifi

# Make scripts executable
chmod +x deploy.sh backup.sh

# Run deployment
./deploy.sh
```

---

## Verify (3 minutes)

```bash
# Check services
docker compose ps    # Should show 3 containers running
pm2 list            # Should show praxifi-frontend

# Test URLs (replace with your domain)
curl -I https://yourdomain.com
curl -I https://api.yourdomain.com/docs

# Check logs
docker compose logs --tail=50 aiml-engine
pm2 logs praxifi-frontend --lines 50
```

---

## Test Full Flow

1. Open browser: `https://yourdomain.com`
2. Click "MVP" → "Static Report"
3. Upload CSV file
4. Click "Generate Report"
5. **Watch progress bar update live!** 🎉
6. View insights dashboard

---

## Setup Auto-Backups (Optional)

```bash
# Add cron job
crontab -e

# Add these lines:
0 2 * * * /opt/praxifi/backup.sh >> /var/log/praxifi-backup.log 2>&1
0 0,12 * * * certbot renew --quiet && docker compose -f /opt/praxifi/praxifi-CFO/docker-compose.yml restart nginx
```

---

## Common Commands

```bash
# Restart everything
docker compose restart
pm2 restart praxifi-frontend

# Update application
cd /opt/praxifi
git pull origin v3
./deploy.sh

# View logs
docker compose logs -f
pm2 logs

# Manual backup
./backup.sh

# Check SSL cert expiry
certbot certificates
```

---

## Troubleshooting

### DNS not working
```bash
# Check propagation
nslookup yourdomain.com

# Wait longer (can take up to 48 hours)
```

### Containers won't start
```bash
# Check logs
docker compose logs

# Check resources
docker stats
free -h
```

### Frontend not accessible
```bash
# Check PM2
pm2 status
pm2 logs

# Restart
pm2 restart praxifi-frontend
```

### SSL issues
```bash
# Check certificate
certbot certificates

# Renew manually
certbot renew --force-renewal
docker compose restart nginx
```

---

## 📚 Full Documentation

- **Complete Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Checklist**: `PRE_FLIGHT_CHECKLIST.md`
- **Summary**: `DEPLOYMENT_SUMMARY.md`

---

## ✅ You're Live!

Once everything works:
- ✅ Frontend: https://yourdomain.com
- ✅ API: https://api.yourdomain.com/docs
- ✅ Backups: Automated daily
- ✅ SSL: Auto-renewing
- ✅ Monitoring: PM2 + Docker

**Congratulations! Praxifi is now in production! 🚀**

---

**Time to Deploy**: ~30 minutes  
**Difficulty**: Medium  
**Cost**: ~$25-50/month
