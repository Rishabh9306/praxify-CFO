# 🚀 Praxifi Production Deployment Guide
## Fluence Console VPS + Namecheap Domain

---

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [VPS Server Setup](#vps-server-setup)
4. [Domain Configuration (Namecheap)](#domain-configuration)
5. [Server Provisioning](#server-provisioning)
6. [Application Deployment](#application-deployment)
7. [SSL/HTTPS Setup](#ssl-setup)
8. [Monitoring & Maintenance](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Recommended VPS Specifications:
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- **CPU**: 4+ vCPUs (8 vCPUs recommended for smooth forecasting)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB SSD minimum (100GB recommended)
- **Bandwidth**: 2TB/month minimum
- **Network**: 1Gbps port

### Why These Specs?
- **CPU**: Prophet forecasting is CPU-intensive (uses all cores in parallel)
- **RAM**: 4GB for backend + 2GB for frontend + 1GB for Redis + 1GB buffer
- **Storage**: Docker images (~5GB) + data volumes + logs

### Estimated Monthly Cost:
- **Fluence Console**: ~$20-40/month for 4-core, 8GB RAM VPS
- **Domain**: ~$10-15/year (already purchased)
- **Total**: ~$25-50/month

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables to Prepare

Create a `.env.production` file with these values:

```bash
# API Configuration
ENV=production
API_PORT=8000
LOG_LEVEL=info

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_EXTERNAL_PORT=6380

# Google AI (for narratives)
GOOGLE_API_KEY=your_actual_google_api_key_here

# Security Settings
DIFFERENTIAL_PRIVACY_ENABLED=true
DIFFERENTIAL_PRIVACY_EPSILON=1.0
ZK_VALIDATION_ENABLED=true
PRIVACY_BUDGET_PER_SESSION=10.0

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://api.praxifi.com

# Nginx Configuration
NGINX_PORT=80
NGINX_SSL_PORT=443
DOMAIN_NAME=praxifi.com
```

### 2. Get Your Google API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key for `.env.production`

### 3. Domain Information Needed
- Your domain name (e.g., `praxifi.com`)
- Namecheap account credentials
- Access to domain DNS settings

---

## 🌐 Domain Configuration (Namecheap)

### Step 1: Login to Namecheap
1. Go to https://www.namecheap.com
2. Login to your account
3. Go to "Domain List"
4. Click "Manage" next to your domain

### Step 2: Configure DNS Records

**Wait to add these AFTER you have your VPS IP address!**

Add these DNS records (replace `YOUR_VPS_IP` with actual IP):

```
Type    Host        Value           TTL
A       @           YOUR_VPS_IP     300
A       www         YOUR_VPS_IP     300
A       api         YOUR_VPS_IP     300
CNAME   *           praxifi.com  300
```

**Explanation:**
- `@` = Root domain (praxifi.com)
- `www` = www.praxifi.com
- `api` = api.praxifi.com (for backend API)
- `*` = Wildcard (catches all subdomains)

**Propagation Time**: 5 minutes to 48 hours (usually ~1 hour)

---

## 🖥️ VPS Server Setup

### Step 1: Rent Ubuntu VPS from Fluence Console

1. **Go to Fluence Console**: https://console.fluence.network (or your VPS provider)

2. **Select Server Configuration**:
   ```
   - OS: Ubuntu 22.04 LTS
   - Plan: 4 vCPU, 8GB RAM, 50GB SSD
   - Location: Choose closest to your users (US East, EU, Asia)
   - Hostname: praxifi-prod
   ```

3. **Setup SSH Key** (Recommended):
   ```bash
   # On your local machine
   ssh-keygen -t ed25519 -C "praxifi-deployment"
   cat ~/.ssh/id_ed25519.pub
   ```
   - Copy the public key
   - Paste it in VPS provider's SSH key section

4. **Note Down**:
   - Server IP address (e.g., 123.45.67.89)
   - Root password (if not using SSH key)
   - SSH port (usually 22)

5. **Update DNS Records** (from previous section with this IP)

---

## 🔧 Server Provisioning

### Step 1: Connect to VPS

```bash
# Replace with your VPS IP
ssh root@YOUR_VPS_IP

# If using custom SSH key
ssh -i ~/.ssh/id_ed25519 root@YOUR_VPS_IP
```

### Step 2: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y \
  curl \
  wget \
  git \
  ufw \
  fail2ban \
  htop \
  nano \
  certbot \
  python3-certbot-nginx

# Create non-root user
adduser praxifi
usermod -aG sudo praxifi

# Switch to new user
su - praxifi
```

### Step 3: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Logout and login again for group changes
exit
su - praxifi
```

### Step 4: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (optional, if direct access needed)
sudo ufw allow 8000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 5: Install Node.js (for frontend)

```bash
# Install Node.js 22.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify
node --version
pnpm --version
```

---

## 📦 Application Deployment

### Step 1: Clone Repository

```bash
# Create app directory
sudo mkdir -p /opt/praxifi
sudo chown -R praxifi:praxifi /opt/praxifi
cd /opt/praxifi

# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/praxifi.git .

# Or if using private repo
git clone https://<personal_access_token>@github.com/YOUR_USERNAME/praxifi.git .
```

### Step 2: Setup Backend Environment

```bash
cd /opt/praxifi/praxifi-CFO

# Create production environment file
nano .env

# Paste the following (update values):
```

```bash
ENV=production
API_PORT=8000
LOG_LEVEL=info
REDIS_HOST=redis
REDIS_PORT=6379
GOOGLE_API_KEY=your_actual_google_api_key_here
DIFFERENTIAL_PRIVACY_ENABLED=true
DIFFERENTIAL_PRIVACY_EPSILON=1.0
ZK_VALIDATION_ENABLED=true
PRIVACY_BUDGET_PER_SESSION=10.0
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Update CORS Configuration

```bash
nano /opt/praxifi/praxifi-CFO/aiml_engine/api/app.py
```

Find the CORS section and update to:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://praxifi.com",      # Add your domain
        "https://www.praxifi.com",  # Add www subdomain
        "https://api.praxifi.com"   # Add API subdomain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 4: Update Nginx Configuration

```bash
nano /opt/praxifi/praxifi-CFO/nginx.conf
```

Replace with production config (see next section for full config)

### Step 5: Build and Start Backend

```bash
cd /opt/praxifi/praxifi-CFO

# Build Docker images
docker compose build

# Start services with nginx
docker compose --profile with-nginx up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 6: Setup Frontend

```bash
cd /opt/praxifi/praxifi-frontend

# Install dependencies
pnpm install

# Create production environment
nano .env.production

# Add:
NEXT_PUBLIC_API_URL=https://api.praxifi.com
```

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start &

# Check if running
curl http://localhost:3000
```

### Step 7: Setup PM2 for Frontend (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /opt/praxifi/praxifi-frontend
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'praxifi-frontend',
    cwd: '/opt/praxifi/praxifi-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

```bash
# Start frontend with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# (follow the command it outputs)

# Check status
pm2 status
pm2 logs praxifi-frontend
```

---

## 🔒 SSL/HTTPS Setup (Let's Encrypt)

### Prerequisites
- Domain must be pointing to VPS IP
- DNS propagation complete (verify with `nslookup praxifi.com`)
- Ports 80 and 443 must be open

### Step 1: Install Certbot (Already done in provisioning)

```bash
# Verify certbot is installed
certbot --version
```

### Step 2: Update Nginx Configuration for SSL

```bash
nano /opt/praxifi/praxifi-CFO/nginx.conf
```

Replace entire file with:

```nginx
events {
    worker_connections 2048;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

    # Upstream backends
    upstream aiml_backend {
        server aiml-engine:8000;
    }

    upstream frontend_app {
        server host.docker.internal:3000;  # Frontend on host
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name praxifi.com www.praxifi.com api.praxifi.com;
        
        # Allow certbot verification
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Main website (HTTPS)
    server {
        listen 443 ssl http2;
        server_name praxifi.com www.praxifi.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 100M;

        # Frontend proxy
        location / {
            proxy_pass http://frontend_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # API backend (HTTPS)
    server {
        listen 443 ssl http2;
        server_name api.praxifi.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 100M;
        
        # Increased timeouts for long-running forecasts
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;

        access_log /var/log/nginx/api_access.log;
        error_log /var/log/nginx/api_error.log;

        # API routes
        location / {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://aiml_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Upload endpoint with stricter rate limit
        location /api/full_report {
            limit_req zone=upload_limit burst=5 nodelay;
            
            proxy_pass http://aiml_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Extra long timeout for forecasting
            proxy_read_timeout 900s;
        }

        # SSE endpoint for progress updates
        location /api/progress/ {
            proxy_pass http://aiml_backend;
            proxy_http_version 1.1;
            proxy_set_header Connection '';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # SSE specific settings
            proxy_buffering off;
            proxy_cache off;
            chunked_transfer_encoding on;
        }
    }
}
```

**Important**: Replace all instances of `praxifi.com` with your actual domain!

### Step 3: Obtain SSL Certificates

```bash
# Stop nginx temporarily
cd /opt/praxifi/praxifi-CFO
docker compose stop nginx

# Obtain certificate (replace with your domain and email)
sudo certbot certonly --standalone \
  -d praxifi.com \
  -d www.praxifi.com \
  -d api.praxifi.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Certificates will be saved to:
# /etc/letsencrypt/live/praxifi.com/fullchain.pem
# /etc/letsencrypt/live/praxifi.com/privkey.pem
```

### Step 4: Mount SSL Certificates in Docker

Update `docker-compose.yml`:

```bash
nano /opt/praxifi/praxifi-CFO/docker-compose.yml
```

Find the nginx service and update volumes:

```yaml
  nginx:
    image: nginx:alpine
    container_name: praxifi-cfo-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/praxifi.com:/etc/nginx/ssl:ro
      - /etc/letsencrypt/archive/praxifi.com:/etc/letsencrypt/archive/praxifi.com:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Access host network
    depends_on:
      - aiml-engine
    restart: unless-stopped
    networks:
      - praxifi-network
    profiles:
      - with-nginx
```

### Step 5: Restart Services with SSL

```bash
cd /opt/praxifi/praxifi-CFO

# Restart with new config
docker compose --profile with-nginx up -d

# Check logs
docker compose logs nginx

# Test SSL
curl -I https://praxifi.com
curl -I https://api.praxifi.com
```

### Step 6: Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet && docker compose -f /opt/praxifi/praxifi-CFO/docker-compose.yml restart nginx
```

---

## 📊 Monitoring & Maintenance

### Docker Health Checks

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Update and rebuild
cd /opt/praxifi
git pull
cd praxifi-CFO
docker compose build
docker compose --profile with-nginx up -d
```

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs praxifi-frontend

# Restart
pm2 restart praxifi-frontend

# Monitor in real-time
pm2 monit
```

### System Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop

# Check Docker disk usage
docker system df
```

### Backup Strategy

```bash
# Create backup script
sudo nano /opt/praxifi/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/praxifi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm \
  -v praxifi-cfo_uploads_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

docker run --rm \
  -v praxifi-cfo_redis_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/redis_$DATE.tar.gz -C /data .

# Backup configs
tar czf $BACKUP_DIR/configs_$DATE.tar.gz /opt/praxifi/praxifi-CFO/.env /opt/praxifi/praxifi-CFO/nginx.conf

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x /opt/praxifi/backup.sh

# Setup daily backup cron
crontab -e

# Add:
0 2 * * * /opt/praxifi/backup.sh >> /var/log/praxifi-backup.log 2>&1
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Docker containers not starting

```bash
# Check logs
docker compose logs

# Check resources
docker stats

# Restart Docker daemon
sudo systemctl restart docker
```

#### 2. Frontend not accessible

```bash
# Check PM2
pm2 status
pm2 logs praxifi-frontend

# Check port
netstat -tulpn | grep 3000

# Restart frontend
pm2 restart praxifi-frontend
```

#### 3. SSL certificate issues

```bash
# Check certificate validity
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check nginx config
docker compose exec nginx nginx -t
```

#### 4. Backend API slow/timeout

```bash
# Check CPU/Memory
htop

# Check backend logs
docker compose logs aiml-engine

# Increase resources in docker-compose.yml
```

#### 5. DNS not resolving

```bash
# Check DNS propagation
nslookup praxifi.com
dig praxifi.com

# Wait 1-2 hours for propagation
```

---

## 📝 Production Checklist

Before going live, verify:

- [ ] VPS provisioned with correct specs
- [ ] Domain DNS configured and propagated
- [ ] SSH access working
- [ ] Firewall configured (ports 80, 443, 22 open)
- [ ] Docker and Docker Compose installed
- [ ] Node.js and pnpm installed
- [ ] Repository cloned
- [ ] Environment variables configured (`.env`, `.env.production`)
- [ ] CORS settings updated with production domain
- [ ] SSL certificates obtained and mounted
- [ ] Backend Docker containers running (redis, aiml-engine, nginx)
- [ ] Frontend running with PM2
- [ ] HTTPS working for all domains (main, www, api)
- [ ] API endpoints accessible (test with `curl`)
- [ ] File upload working (test with small CSV)
- [ ] Progress bar working (SSE endpoint)
- [ ] Backups configured
- [ ] Monitoring setup (PM2, Docker healthchecks)
- [ ] Auto-renewal cron job set

---

## 🎯 Quick Deployment Commands

```bash
# Complete deployment script (after VPS setup)
cd /opt/praxifi

# Pull latest code
git pull

# Backend
cd praxifi-CFO
docker compose build
docker compose --profile with-nginx up -d

# Frontend
cd ../praxifi-frontend
pnpm install
pnpm build
pm2 restart praxifi-frontend

# Verify
curl -I https://praxifi.com
curl -I https://api.praxifi.com/docs
```

---

## 📞 Support

- **Documentation**: `/opt/praxifi/LIVE_PROGRESS_IMPLEMENTATION.md`
- **Logs**: 
  - Backend: `docker compose logs -f aiml-engine`
  - Frontend: `pm2 logs praxifi-frontend`
  - Nginx: `docker compose logs -f nginx`

---

**Deployment Date**: November 22, 2025  
**Version**: v3  
**Maintained by**: Praxifi Team
