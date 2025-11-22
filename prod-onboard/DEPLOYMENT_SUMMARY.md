# 📝 Production Deployment Summary

## Quick Reference for Deploying Praxifi to Fluence Console VPS

---

## 🎯 What You Need

### 1. Domain (Already Have ✓)
- **Provider**: Namecheap
- **Domain**: `praxifi.com` (replace everywhere)

### 2. VPS Server (To Rent)
- **Provider**: Fluence Console (or any VPS provider)
- **OS**: Ubuntu 22.04 LTS
- **Specs**: 4 vCPU, 8GB RAM, 50GB SSD minimum
- **Monthly Cost**: ~$25-50

### 3. API Keys (To Obtain)
- **Google API Key**: Get from https://makersuite.google.com/app/apikey
  - Used for AI-generated financial narratives

---

## 📂 Files Created for Production

All these files are already in your repo at `/home/draxxy/praxifi/`:

1. **`PRODUCTION_DEPLOYMENT_GUIDE.md`** ⭐
   - Complete step-by-step deployment guide
   - DNS configuration
   - VPS setup
   - SSL/HTTPS setup
   - **START HERE!**

2. **`PRE_FLIGHT_CHECKLIST.md`** ✅
   - Checklist before deployment
   - All items to verify
   - Configuration changes needed

3. **`deploy.sh`**
   - Automated deployment script
   - Run on VPS to deploy/update app
   - Usage: `sudo ./deploy.sh`

4. **`backup.sh`**
   - Automated backup script
   - Backs up Docker volumes and configs
   - Schedule with cron

5. **`praxifi-CFO/nginx.production.conf`**
   - Production Nginx configuration
   - SSL/HTTPS ready
   - Rate limiting configured

6. **`praxifi-CFO/.env.production.example`**
   - Template for backend environment variables
   - Copy to `.env` and fill in values

7. **`praxifi-frontend/.env.production.example`**
   - Template for frontend environment variables
   - Copy to `.env.production`

8. **`praxifi-frontend/ecosystem.config.js`**
   - PM2 configuration for frontend
   - Cluster mode with 2 instances

---

## 🔧 Code Changes Made

### 1. Backend CORS (`praxifi-CFO/aiml_engine/api/app.py`)
```python
# Now checks ENV variable
if ENV == "production":
    ALLOWED_ORIGINS = [
        "https://praxifi.com",       # Update this!
        "https://www.praxifi.com",   # Update this!
        "https://api.praxifi.com",   # Update this!
    ]
```
**Action Required**: Replace `praxifi.com` with your actual domain

### 2. Nginx Configuration
- Created `nginx.production.conf` with SSL support
- Configured reverse proxy for frontend and backend
- SSE support for progress bar
- Rate limiting enabled

### 3. Docker Compose
- Already configured with nginx profile
- SSL certificate mounts ready
- Resource limits set

---

## 🚀 Deployment Steps (Simplified)

### Phase 1: Before Renting VPS (Do Now)

1. **Update Domain References** (Search & Replace in your codebase):
   - Find: `praxifi.com`
   - Replace with: `your-actual-domain.com`
   - Files to update:
     - `praxifi-CFO/nginx.production.conf` (12 instances)
     - `praxifi-CFO/aiml_engine/api/app.py` (3 instances)

2. **Get Google API Key**:
   - Go to: https://makersuite.google.com/app/apikey
   - Create key
   - Save it securely

3. **Create Environment Files**:
   ```bash
   # Backend
   cp praxifi-CFO/.env.production.example praxifi-CFO/.env
   nano praxifi-CFO/.env
   # Add your GOOGLE_API_KEY

   # Frontend
   cp praxifi-frontend/.env.production.example praxifi-frontend/.env.production
   nano praxifi-frontend/.env.production
   # Update NEXT_PUBLIC_API_URL with your domain
   ```

4. **Commit Everything**:
   ```bash
   git add .
   git commit -m "Production configuration for deployment"
   git push origin v3
   ```

### Phase 2: Rent VPS (Fluence Console)

1. **Go to Fluence Console** or your VPS provider
2. **Select Configuration**:
   - OS: Ubuntu 22.04 LTS
   - Plan: 4 vCPU, 8GB RAM, 50GB SSD
   - Location: Closest to your users
3. **Get IP Address**: e.g., `123.45.67.89`
4. **Save root password** or upload SSH key

### Phase 3: Configure DNS (Namecheap)

1. **Login to Namecheap**
2. **Go to Domain List → Manage**
3. **Add DNS Records** (replace `123.45.67.89` with your VPS IP):
   ```
   Type    Host    Value           TTL
   A       @       123.45.67.89    300
   A       www     123.45.67.89    300
   A       api     123.45.67.89    300
   ```
4. **Wait for propagation** (5 min to 48 hours, usually 1 hour)

### Phase 4: Deploy to VPS (Follow Full Guide)

1. **SSH into VPS**:
   ```bash
   ssh root@YOUR_VPS_IP
   ```

2. **Follow Complete Setup**:
   - Open `PRODUCTION_DEPLOYMENT_GUIDE.md`
   - Follow sections:
     - Server Provisioning
     - Install Docker, Node.js, PM2
     - Configure Firewall
     - Clone Repository
     - Deploy Application
     - Setup SSL/HTTPS

3. **Or Use Quick Deploy Script**:
   ```bash
   # After initial setup
   sudo /opt/praxifi/deploy.sh
   ```

---

## 🔍 Verification

After deployment, test these URLs:

1. **Frontend**: https://praxifi.com
   - Should show Praxifi homepage
   
2. **API Docs**: https://api.praxifi.com/docs
   - Should show FastAPI Swagger UI

3. **API Health**: https://api.praxifi.com/
   - Should return JSON with welcome message

4. **Full Flow**:
   - Go to: https://praxifi.com/mvp/static-report
   - Upload CSV
   - Generate report
   - Watch live progress bar
   - View insights dashboard

---

## 📊 System Architecture (Production)

```
                    ┌─────────────────┐
                    │   Namecheap DNS │
                    │  praxifi.com │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   VPS Server    │
                    │  (Fluence/AWS)  │
                    │  123.45.67.89   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐          ┌────────────────┐
     │  Nginx (Port   │          │  Nginx (Port   │
     │  443 - HTTPS)  │          │  443 - HTTPS)  │
     │  yourdomain    │          │  api.domain    │
     └────────┬───────┘          └────────┬───────┘
              │                           │
              ▼                           ▼
     ┌────────────────┐          ┌────────────────┐
     │   Frontend     │          │   Backend API  │
     │   Next.js      │          │   FastAPI      │
     │   (PM2)        │          │   (Docker)     │
     │   Port 3000    │          │   Port 8000    │
     └────────────────┘          └────────┬───────┘
                                          │
                                          ▼
                                 ┌────────────────┐
                                 │     Redis      │
                                 │  (Docker)      │
                                 │   Port 6379    │
                                 └────────────────┘
```

---

## 💰 Cost Breakdown

| Item | Provider | Monthly Cost | Annual Cost |
|------|----------|--------------|-------------|
| Domain | Namecheap | ~$1 | ~$10-15 |
| VPS (4 vCPU, 8GB RAM) | Fluence/DigitalOcean | ~$25-50 | ~$300-600 |
| SSL Certificate | Let's Encrypt | $0 (Free) | $0 |
| **Total** | | **~$26-51/month** | **~$310-615/year** |

---

## 🛠️ Maintenance Tasks

### Daily (Automated)
- ✅ Backups (2 AM via cron)
- ✅ SSL renewal check (0:00 and 12:00 via cron)
- ✅ PM2 auto-restart on crash

### Weekly (Manual)
- Check disk space: `df -h`
- Review logs: `docker compose logs --tail=100`
- Check PM2 status: `pm2 status`

### Monthly (Manual)
- Update packages: `apt update && apt upgrade`
- Review backup retention: `ls -lh /opt/praxifi/backups`
- Check security logs: `/var/log/auth.log`

### As Needed
- Deploy updates: `sudo /opt/praxifi/deploy.sh`
- Restore from backup (see guide)

---

## 📚 Documentation Index

1. **`PRODUCTION_DEPLOYMENT_GUIDE.md`** - Complete deployment steps
2. **`PRE_FLIGHT_CHECKLIST.md`** - Pre-deployment verification
3. **`LIVE_PROGRESS_IMPLEMENTATION.md`** - Progress bar feature docs
4. **`README.md`** - General project information

---

## ⚡ Quick Commands

```bash
# On VPS - Check Status
docker compose ps
pm2 list

# On VPS - View Logs
docker compose logs -f aiml-engine
pm2 logs praxifi-frontend

# On VPS - Restart Services
docker compose restart
pm2 restart praxifi-frontend

# On VPS - Update Application
cd /opt/praxifi
git pull origin v3
sudo ./deploy.sh

# On VPS - Manual Backup
sudo /opt/praxifi/backup.sh

# On VPS - Check SSL Certificate
sudo certbot certificates
```

---

## 🆘 Support & Troubleshooting

Common issues and solutions in:
- **`PRODUCTION_DEPLOYMENT_GUIDE.md`** → Troubleshooting section

**Need Help?**
- Check logs first: `docker compose logs` and `pm2 logs`
- Verify DNS: `nslookup praxifi.com`
- Test endpoints: `curl -I https://praxifi.com`

---

## ✅ Next Steps

1. **Read**: `PRODUCTION_DEPLOYMENT_GUIDE.md` (full details)
2. **Check**: `PRE_FLIGHT_CHECKLIST.md` (complete all items)
3. **Update**: Domain references in code (search/replace)
4. **Get**: Google API key
5. **Rent**: VPS from Fluence Console
6. **Deploy**: Follow the guide!

---

**Version**: v3  
**Last Updated**: November 22, 2025  
**Status**: Ready for Deployment ✅
