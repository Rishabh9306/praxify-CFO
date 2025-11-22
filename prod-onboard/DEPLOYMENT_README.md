# 🚀 Production Deployment - Documentation Index

## Choose Your Path

### 🏃 Express Deploy (30 minutes)
**For experienced devops engineers**  
👉 **[QUICK_START_DEPLOY.md](QUICK_START_DEPLOY.md)**

### 📚 Complete Guide (Recommended)
**Detailed step-by-step with explanations**  
👉 **[PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)**

### ✅ Before You Start
**Pre-deployment checklist**  
👉 **[PRE_FLIGHT_CHECKLIST.md](PRE_FLIGHT_CHECKLIST.md)**

---

## 📄 All Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** | Overview & quick reference | First read - understand what you need |
| **[CODE_CHANGES_REQUIRED.md](CODE_CHANGES_REQUIRED.md)** | Code updates needed before deploy | Before renting VPS - update domain references |
| **[PRE_FLIGHT_CHECKLIST.md](PRE_FLIGHT_CHECKLIST.md)** | Complete verification checklist | Before deployment - ensure everything is ready |
| **[PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)** | Complete step-by-step guide | During deployment - follow all steps |
| **[QUICK_START_DEPLOY.md](QUICK_START_DEPLOY.md)** | Fast deployment (30 min) | For quick setup if you know what you're doing |
| **[LIVE_PROGRESS_IMPLEMENTATION.md](LIVE_PROGRESS_IMPLEMENTATION.md)** | Progress bar feature docs | Reference - how progress tracking works |

---

## 🛠️ Scripts & Tools

| Script | Purpose | Usage |
|--------|---------|-------|
| **`update-domain.sh`** | Automatically update domain in all files | `./update-domain.sh yourdomain.com` |
| **`deploy.sh`** | Deploy/update application on VPS | Run on VPS: `sudo ./deploy.sh` |
| **`backup.sh`** | Backup Docker volumes and configs | Run on VPS: `sudo ./backup.sh` |

---

## 🎯 Deployment Flow

```
1. READ DOCUMENTATION
   ├── Start: DEPLOYMENT_SUMMARY.md
   └── Reference: CODE_CHANGES_REQUIRED.md

2. PREPARE LOCALLY
   ├── Run: ./update-domain.sh yourdomain.com
   ├── Get Google API key
   ├── Create .env files
   └── Commit & push to GitHub

3. RENT VPS
   ├── Fluence Console / DigitalOcean / Vultr
   ├── Ubuntu 22.04, 4 vCPU, 8GB RAM
   └── Note IP address

4. CONFIGURE DNS
   ├── Login to Namecheap
   ├── Add A records (@ www api)
   └── Wait for propagation

5. DEPLOY
   ├── SSH to VPS
   ├── Follow: PRODUCTION_DEPLOYMENT_GUIDE.md
   │   or: QUICK_START_DEPLOY.md
   └── Run: ./deploy.sh

6. VERIFY
   ├── Test: https://yourdomain.com
   ├── Test: https://api.yourdomain.com
   └── Complete: PRE_FLIGHT_CHECKLIST.md
```

---

## ⚡ Quick Commands

### Before Deployment (Local Machine)
```bash
# Update domain references
./update-domain.sh myactualsite.com

# Verify changes
grep -r "myactualsite\.com" praxifi-CFO/ praxifi-frontend/ | grep -v node_modules

# Test builds
cd praxifi-CFO && docker compose build
cd ../praxifi-frontend && pnpm build

# Commit
git add .
git commit -m "Production configuration"
git push origin v3
```

### During Deployment (VPS)
```bash
# Initial setup
ssh root@YOUR_VPS_IP
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
npm install -g pnpm pm2
apt install -y certbot python3-certbot-nginx

# Clone and deploy
cd /opt && mkdir praxifi && cd praxifi
git clone https://github.com/YOUR_USERNAME/praxifi.git .
chmod +x deploy.sh backup.sh
./deploy.sh
```

### After Deployment (Maintenance)
```bash
# Check status
docker compose ps
pm2 list

# View logs
docker compose logs -f
pm2 logs

# Update application
cd /opt/praxifi && git pull && ./deploy.sh

# Backup
./backup.sh
```

---

## 💰 Cost Estimate

| Item | Cost |
|------|------|
| Domain (Namecheap) | ~$10-15/year |
| VPS (4 vCPU, 8GB RAM) | ~$25-50/month |
| SSL Certificate (Let's Encrypt) | FREE |
| **Total** | **~$310-615/year** |

---

## 🆘 Need Help?

### Common Issues

| Issue | Solution |
|-------|----------|
| DNS not resolving | Wait 1-2 hours for propagation. Check: `nslookup yourdomain.com` |
| Containers won't start | Check logs: `docker compose logs`. Verify resources: `docker stats` |
| Frontend not accessible | Check PM2: `pm2 status`. Restart: `pm2 restart praxifi-frontend` |
| SSL certificate issues | Renew: `certbot renew --force-renewal`. Restart nginx: `docker compose restart nginx` |
| API timeout/slow | Check CPU: `htop`. Increase Docker memory limits in `docker-compose.yml` |

### Debug Commands

```bash
# Check service status
systemctl status docker
pm2 status

# Check ports
netstat -tulpn | grep -E '80|443|3000|8000'

# Check disk space
df -h

# Check memory
free -h

# Check logs
journalctl -u docker -n 100
docker compose logs --tail=100
pm2 logs --lines 100

# Test endpoints
curl -I http://localhost:8000
curl -I http://localhost:3000
curl -I https://yourdomain.com
```

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Docker Compose**: https://docs.docker.com/compose
- **Let's Encrypt**: https://letsencrypt.org/getting-started
- **PM2 Process Manager**: https://pm2.keymetrics.io/docs/usage/quick-start

---

## ✅ Deployment Checklist

Quick reference - complete version in [PRE_FLIGHT_CHECKLIST.md](PRE_FLIGHT_CHECKLIST.md):

- [ ] Domain purchased
- [ ] VPS rented
- [ ] DNS configured
- [ ] Code updated (`./update-domain.sh`)
- [ ] Google API key obtained
- [ ] Environment files created
- [ ] Changes committed & pushed
- [ ] VPS provisioned (Docker, Node, PM2)
- [ ] SSL certificates obtained
- [ ] Application deployed
- [ ] All URLs tested
- [ ] Backups configured
- [ ] Monitoring setup

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ **Frontend**: https://yourdomain.com loads and displays homepage  
✅ **API Docs**: https://api.yourdomain.com/docs shows Swagger UI  
✅ **Upload Works**: Can upload CSV and generate report  
✅ **Progress Bar**: Updates in real-time during generation  
✅ **Insights**: Dashboard displays charts correctly  
✅ **SSL**: All URLs use HTTPS (green padlock)  
✅ **Monitoring**: PM2 and Docker healthchecks passing  
✅ **Backups**: Automated daily backups running  

---

## 📞 Support

- **GitHub Issues**: Create issue in your repository
- **Documentation**: Refer to guides in this folder
- **Logs**: Always check logs first for troubleshooting

---

**Version**: v3  
**Last Updated**: November 22, 2025  
**Status**: Ready for Production Deployment ✅

---

## 🚀 Let's Deploy!

**Start here**: [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)

Good luck! 🎯
