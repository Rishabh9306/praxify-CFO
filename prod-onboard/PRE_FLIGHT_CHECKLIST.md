# 🚀 Pre-Flight Deployment Checklist

Before deploying Praxifi to production, complete this checklist.

---

## ☑️ Domain & DNS Configuration

- [☑️] **Domain purchased** from Namecheap
- [ ] **VPS IP address** obtained from Fluence Console
- [ ] **DNS A Records** added:
  - [ ] `@` → Your VPS IP
  - [ ] `www` → Your VPS IP
  - [ ] `api` → Your VPS IP
- [ ] **DNS propagation complete** (test with `nslookup praxifi.com`)
- [ ] **Domain name** documented: `_________________`

---

## ☑️ VPS Server Requirements

- [☑️] **Ubuntu 22.04 LTS** or newer
- [☑️] **Minimum specs**:
  - [ ] 4 vCPUs (8 recommended)
  - [ ] 8GB RAM (16GB recommended)
  - [ ] 50GB SSD storage (100GB recommended)
- [ ] **Root/sudo access** available
- [ ] **SSH key** configured (recommended over password)
- [ ] **Firewall rules** planned:
  - [ ] Port 22 (SSH)
  - [ ] Port 80 (HTTP)
  - [ ] Port 443 (HTTPS)

---

## ☑️ API Keys & Credentials

- [ ] **Google API Key** obtained from https://makersuite.google.com/app/apikey
  - Key: `_________________` (keep secure!)
- [ ] **GitHub personal access token** (if using private repo)
- [ ] **SSH keys** backed up locally

---

## ☑️ Code Preparation

### Backend (praxifi-CFO)

- [ ] **CORS configuration** updated in `/praxifi-CFO/aiml_engine/api/app.py`:
  ```python
  allow_origins=[
      "https://praxifi.com",
      "https://www.praxifi.com",
      "https://api.praxifi.com"
  ]
  ```

- [ ] **Environment file** created: `/praxifi-CFO/.env`:
  ```bash
  ENV=production
  GOOGLE_API_KEY=your_actual_key_here
  # ... (see .env.production.example)
  ```

- [ ] **Nginx config** updated with domain in `/praxifi-CFO/nginx.production.conf`:
  - Replace all `praxifi.com` with actual domain

### Frontend (praxifi-frontend)

- [ ] **Environment file** created: `/praxifi-frontend/.env.production`:
  ```bash
  NEXT_PUBLIC_API_URL=https://api.praxifi.com
  ```

- [ ] **Package.json** verified - build script exists:
  ```json
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
  ```

---

## ☑️ Local Testing

- [ ] **Backend containers** running locally:
  ```bash
  cd praxifi-CFO
  docker compose up -d
  ```

- [ ] **Backend health check** passes:
  ```bash
  curl http://localhost:8000/
  ```

- [ ] **Frontend builds** successfully:
  ```bash
  cd praxifi-frontend
  pnpm build
  ```

- [ ] **Frontend runs** in production mode:
  ```bash
  pnpm start
  ```

- [ ] **Full flow tested**:
  - [ ] Upload CSV
  - [ ] Generate report
  - [ ] Progress bar works
  - [ ] Navigate to insights
  - [ ] Charts display correctly

---

## ☑️ Server Dependencies (to install on VPS)

- [ ] Docker & Docker Compose
- [ ] Node.js 22.x LTS
- [ ] pnpm package manager
- [ ] PM2 process manager
- [ ] Certbot (for SSL)
- [ ] Git
- [ ] UFW firewall
- [ ] Fail2ban (security)

---

## ☑️ Files to Create/Modify Before Deploy

### Files to Create:
- [ ] `/praxifi-CFO/.env` (from `.env.production.example`)
- [ ] `/praxifi-frontend/.env.production` (from example)
- [ ] `/praxifi-frontend/ecosystem.config.js` (already created)
- [ ] `/backup.sh` (already created)
- [ ] `/deploy.sh` (already created)

### Files to Modify:
- [ ] `/praxifi-CFO/nginx.production.conf` - Replace `praxifi.com` (12 instances)
- [ ] `/praxifi-CFO/aiml_engine/api/app.py` - Update CORS origins
- [ ] `/praxifi-CFO/docker-compose.yml` - Verify nginx SSL volume mounts

---

## ☑️ Git Repository

- [ ] **All changes committed** to git
- [ ] **Branch** pushed to GitHub: `v3`
- [ ] **Repository accessible** from VPS (public or with PAT)
- [ ] **.gitignore** includes:
  - [ ] `.env`
  - [ ] `.env.production`
  - [ ] `.env.local`
  - [ ] `node_modules/`
  - [ ] `.next/`

---

## ☑️ Security Considerations

- [ ] **Strong passwords** set for:
  - [ ] VPS root/user account
  - [ ] Any database users (if added later)
- [ ] **SSH key-based auth** enabled (password auth disabled recommended)
- [ ] **Firewall rules** restrictive (only necessary ports open)
- [ ] **Fail2ban** to prevent brute force attacks
- [ ] **Regular backups** scheduled (cron job)
- [ ] **SSL certificates** auto-renewal configured

---

## ☑️ Post-Deployment Verification

After running `deploy.sh`, verify:

- [ ] **Backend containers running**:
  ```bash
  docker compose ps
  ```

- [ ] **Frontend running with PM2**:
  ```bash
  pm2 list
  ```

- [ ] **HTTPS working**:
  - [ ] https://praxifi.com
  - [ ] https://www.praxifi.com
  - [ ] https://api.praxifi.com

- [ ] **API endpoints accessible**:
  ```bash
  curl -I https://api.praxifi.com/docs
  ```

- [ ] **Upload and report generation working**:
  - [ ] Navigate to https://praxifi.com/mvp/static-report
  - [ ] Upload CSV
  - [ ] Generate report
  - [ ] Progress bar updates in real-time
  - [ ] Report displays correctly

- [ ] **SSL certificate valid**:
  ```bash
  openssl s_client -connect praxifi.com:443 -servername praxifi.com
  ```

- [ ] **Logs accessible**:
  - [ ] `docker compose logs aiml-engine`
  - [ ] `pm2 logs praxifi-frontend`

---

## ☑️ Monitoring Setup

- [ ] **PM2 monitoring** configured
- [ ] **Docker healthchecks** working
- [ ] **Backup cron job** scheduled (daily at 2 AM)
- [ ] **SSL renewal cron job** scheduled (twice daily)
- [ ] **Disk space monitoring** configured (alert at 80%)

---

## ☑️ Documentation

- [ ] **Deployment guide** reviewed: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- [ ] **Progress implementation** documented: `LIVE_PROGRESS_IMPLEMENTATION.md`
- [ ] **Admin credentials** stored securely (password manager)
- [ ] **Runbook** created for common tasks:
  - [ ] How to update application
  - [ ] How to restart services
  - [ ] How to check logs
  - [ ] How to restore from backup

---

## 🎯 Quick Command Reference

### On VPS (after deployment):

```bash
# Check all services
docker compose ps
pm2 list

# View logs
docker compose logs -f aiml-engine
pm2 logs praxifi-frontend

# Restart services
docker compose restart
pm2 restart praxifi-frontend

# Update application
sudo /opt/praxifi/deploy.sh

# Backup data
sudo /opt/praxifi/backup.sh
```

---

## ✅ Ready to Deploy?

Once all items are checked:

1. **SSH into VPS**: `ssh root@YOUR_VPS_IP`
2. **Run setup commands** (see deployment guide)
3. **Clone repository**: `git clone <repo> /opt/praxifi`
4. **Run deploy script**: `sudo /opt/praxifi/deploy.sh`
5. **Verify all endpoints** work
6. **Test complete user flow**
7. **🎉 Go live!**

---

**Last Updated**: November 22, 2025  
**Version**: v3  
**Deployment Status**: [ ] Not Started [ ] In Progress [ ] Complete
