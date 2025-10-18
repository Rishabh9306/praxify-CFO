# 🚀 Deployment Guide

**Last Updated:** October 18, 2025

Complete guide for deploying Praxify CFO to production.

---

## 📋 Table of Contents

1. [Vercel + Local Backend (Recommended for Testing)](#vercel--local-backend)
2. [Vercel + ngrok (Public Access)](#vercel--ngrok)
3. [Full Production Deployment](#full-production-deployment)
4. [Docker Deployment](#docker-deployment)

---

## 🔷 Vercel + Local Backend

Best for: Testing Vercel deployment while keeping backend local.

### Step 1: Deploy Frontend to Vercel

```bash
cd praxify-frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Project name: praxify-cfo
# - Framework: Next.js
# - Root directory: ./
```

### Step 2: Configure Environment Variable

In Vercel Dashboard:
1. Go to your project settings
2. Add environment variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `http://localhost:8000`
3. Redeploy

### Step 3: Update Backend CORS

Edit `/home/draxxy/praxify-CFO/.env`:
```bash
CORS_ORIGINS=http://localhost:3000,https://praxify-cfo.vercel.app,https://praxify-cfo-*.vercel.app
```

Restart backend:
```bash
docker compose down
docker compose up -d
```

### Testing

1. Open your Vercel URL: `https://praxify-cfo.vercel.app`
2. Backend must be running locally on your computer
3. Works only when connected to same network

---

## 🌐 Vercel + ngrok

Best for: Public demos without deploying backend.

### Step 1: Install and Setup ngrok

```bash
# Install ngrok
brew install ngrok  # macOS
# OR download from https://ngrok.com/download

# Authenticate (free account required)
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### Step 2: Start Backend

```bash
cd /home/draxxy/praxify-CFO
docker compose up -d

# Verify it's running
curl http://localhost:8000/health
```

### Step 3: Create ngrok Tunnel

```bash
# Start tunnel to port 8000
ngrok http 8000

# You'll see output like:
# Forwarding: https://abc123xyz.ngrok-free.app -> http://localhost:8000
```

**Important:** Copy the HTTPS URL (e.g., `https://abc123xyz.ngrok-free.app`)

### Step 4: Update Backend CORS

Edit `/home/draxxy/praxify-CFO/.env`:
```bash
CORS_ORIGINS=http://localhost:3000,https://praxify-cfo.vercel.app,https://abc123xyz.ngrok-free.app
```

Restart backend:
```bash
docker compose down
docker compose up -d
```

### Step 5: Update Vercel Environment

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL`:
   - **Value:** `https://abc123xyz.ngrok-free.app`
3. Redeploy: `vercel --prod`

### Step 6: Test

1. Visit: `https://praxify-cfo.vercel.app`
2. Upload a file and test features
3. Everything should work!

### ngrok Tips

**Keep tunnel running:**
```bash
# Run in tmux/screen for persistent sessions
tmux new -s ngrok
ngrok http 8000
# Detach: Ctrl+B then D
```

**Use ngrok script:**
```bash
./setup/setup-ngrok.sh
```

**Free tier limitations:**
- URL changes each restart (use paid plan for static URLs)
- Session timeout after 2 hours
- Add ngrok badge to bypass warning page

---

## 🏢 Full Production Deployment

Best for: Real production use.

### Architecture Options

#### Option A: Vercel + Cloud Backend
- **Frontend:** Vercel (free tier)
- **Backend:** AWS EC2, DigitalOcean, Railway, Render
- **Redis:** Redis Cloud, AWS ElastiCache

#### Option B: Single Server
- **Everything:** VPS (DigitalOcean, Linode, AWS)
- **Setup:** Docker Compose on server
- **Domain:** Custom domain + Nginx reverse proxy

### Option A: Vercel + Cloud Backend

#### 1. Deploy Backend to Cloud

**Using Railway (Easiest):**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up

# Add environment variables in Railway dashboard
```

**Using DigitalOcean App Platform:**
1. Connect GitHub repo
2. Select backend folder: `aiml_engine`
3. Add environment variables
4. Deploy

#### 2. Deploy Frontend to Vercel

```bash
cd praxify-frontend
vercel --prod
```

Add environment variable:
- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://your-backend.railway.app`

#### 3. Configure CORS

Update backend environment:
```bash
CORS_ORIGINS=https://praxify-cfo.vercel.app
```

### Option B: Single Server Deployment

#### 1. Setup VPS

```bash
# SSH into server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/Rishabh9306/praxify-CFO.git
cd praxify-CFO

# Create .env file
nano .env
# Add production values

# Build and start
docker compose up -d
```

#### 3. Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install nginx

# Create config
nano /etc/nginx/sites-available/praxify
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/praxify /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install SSL with Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

#### 4. Update Configuration

```bash
# Update frontend .env
cd praxify-frontend
echo "NEXT_PUBLIC_API_URL=https://your-domain.com" > .env.local

# Update backend .env
cd ..
nano .env
# Set CORS_ORIGINS=https://your-domain.com

# Rebuild
docker compose down
docker compose up -d --build
```

---

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Production

Update `docker-compose.yml` for production:

```yaml
services:
  aiml-engine:
    restart: always
    environment:
      - ENVIRONMENT=production
      - CORS_ORIGINS=${CORS_ORIGINS}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
    driver: local
```

### Docker Best Practices

**Use environment file:**
```bash
# .env.production
REDIS_HOST=redis
REDIS_PORT=6379
API_PORT=8000
CORS_ORIGINS=https://your-domain.com
GOOGLE_API_KEY=your_production_key
ENVIRONMENT=production
```

**Deploy with:**
```bash
docker compose --env-file .env.production up -d
```

**Backup Redis data:**
```bash
docker compose exec redis redis-cli BGSAVE
docker cp praxify-cfo-redis-1:/data/dump.rdb ./backup/
```

**Monitor resources:**
```bash
docker stats
```

---

## 🔒 Security Checklist

- [ ] Change default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS/SSL certificates
- [ ] Restrict CORS to specific domains
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Use Redis password protection
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Use secrets management (AWS Secrets, Vault)

---

## 📊 Monitoring

### Health Checks

```bash
# Backend
curl https://your-domain.com/api/health

# Frontend
curl https://your-domain.com

# Redis
docker compose exec redis redis-cli ping
```

### Application Logs

```bash
# Docker logs
docker compose logs -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Resource Monitoring

```bash
# Server resources
htop

# Docker resources
docker stats

# Disk usage
df -h
```

---

## 🔄 CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
      
      - name: Deploy Backend
        run: |
          # Add your backend deployment commands
          # e.g., SSH to server and pull latest changes
```

---

## 🆘 Deployment Troubleshooting

### Vercel Build Fails
- Check Node.js version in `package.json`
- Verify environment variables are set
- Check build logs in Vercel dashboard

### ngrok Tunnel Stops
- Use paid plan for longer sessions
- Run in tmux/screen session
- Consider alternative: localtunnel, Cloudflare Tunnel

### Docker Container Won't Start
```bash
# Check logs
docker compose logs aiml-engine

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### CORS Still Blocking Requests
1. Verify CORS_ORIGINS includes your domain
2. Check protocol (http vs https)
3. Restart backend after changes
4. Clear browser cache

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [ngrok Documentation](https://ngrok.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Let's Encrypt Setup](https://letsencrypt.org/getting-started/)
