# 🚀 Current Production Setup

**Date**: December 10, 2025  
**Status**: ✅ Cloudflare Removed | ✅ ngrok Active

---

## 📋 System Status

### Frontend
- **Platform**: Vercel
- **URLs**: 
  - https://praxifi.com (production)
  - https://www.praxifi.com (production)
  - https://praxifi.vercel.app (Vercel default)

### Backend
- **Platform**: Docker on local Kubuntu machine
- **Tunnel**: ngrok (free tier)
- **Public URL**: `https://dd5469096c70.ngrok-free.app`
- **Local Port**: `http://localhost:8080`
- **Health**: ✅ Running (Docker containers healthy)

---

## 🔧 Vercel Environment Variables

Go to: https://vercel.com/dashboard → praxifi → Settings → Environment Variables

```
Variable Name: NEXT_PUBLIC_API_URL
Value: https://dd5469096c70.ngrok-free.app
Environments: Production, Preview, Development
```

---

## 🐳 Docker Services

```bash
# Check status
cd /home/draxxy/praxify-CFO/praxifi-CFO
docker compose ps

# Expected output:
# praxifi-cfo-aiml-engine (healthy) - 0.0.0.0:8080->8080/tcp
# praxifi-cfo-redis (healthy) - 0.0.0.0:6380->6379/tcp
```

---

## 🌐 ngrok Setup

### Current Process
```bash
# Check if running
ps aux | grep ngrok

# Expected: ngrok http 8080 --log=stdout
```

### Get Current URL
```bash
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])"
```

### Restart ngrok (if needed)
```bash
# Kill existing
killall ngrok

# Start new tunnel
ngrok http 8080 --log=stdout &
```

⚠️ **IMPORTANT**: Free tier ngrok URL changes on restart! Update Vercel env var if URL changes.

---

## 🧪 Health Checks

### Backend (Local)
```bash
curl http://localhost:8080/
```

### Backend (Public via ngrok)
```bash
curl https://dd5469096c70.ngrok-free.app/
```

### Frontend
```bash
curl https://praxifi.com/
```

---

## 🔍 CORS Configuration

Backend allows requests from:
- `https://*.vercel.app` (all Vercel preview/production deployments)
- `https://praxifi.com`
- `https://www.praxifi.com`
- `https://*.ngrok-free.app` (ngrok tunnels)
- `https://*.ngrok.io` (ngrok custom domains)
- `http://localhost:*` (local development)
- `http://127.0.0.1:*` (local development)

File: `/home/draxxy/praxify-CFO/praxifi-CFO/aiml_engine/api/app.py`

---

## ⚠️ Known Limitations

### ngrok Free Tier
1. **Dynamic URL**: URL changes when ngrok restarts
2. **Rate Limiting**: Limited requests per minute
3. **Warning Page**: First-time visitors see ngrok interstitial
4. **No Custom Domain**: Can't use api.praxifi.com

### Solutions
- **ngrok Paid** ($8/mo): Static domain, no warning page
- **Deploy to VPS**: DigitalOcean, AWS, etc. with nginx
- **Cloud Functions**: AWS Lambda with API Gateway

---

## 🗑️ What Was Removed

### Cloudflare Tunnel
- ❌ `cloudflared` process (killed)
- ❌ `~/.cloudflared/` config (backed up to `~/.cloudflared.backup`)
- ❌ `api.praxifi.com` domain routing
- ❌ All Cloudflare documentation files
- ❌ `start-cloudflare-tunnel.sh` script

### Why Removed
- 100-second timeout incompatible with 2+ minute AI report generation
- User requested complete removal after multiple failed fixes

---

## 📝 Deployment Checklist

Before deploying:
- [ ] Docker containers running (`docker compose ps`)
- [ ] ngrok tunnel active (`curl http://localhost:4040/api/tunnels`)
- [ ] Backend health check passes (`curl http://localhost:8080/`)
- [ ] Vercel environment variable set correctly
- [ ] Test report generation locally before pushing

---

## 🆘 Troubleshooting

### Frontend can't reach backend
1. Check ngrok is running: `ps aux | grep ngrok`
2. Verify ngrok URL: `curl http://localhost:4040/api/tunnels`
3. Update Vercel env var if URL changed
4. Redeploy Vercel

### Backend not responding
1. Check Docker: `docker compose ps`
2. Restart if needed: `docker compose restart aiml-engine`
3. Check logs: `docker compose logs aiml-engine --tail=50`

### CORS errors
1. Verify CORS config in `app.py` includes ngrok patterns
2. Check browser console for actual blocked origin
3. Restart backend after CORS changes

---

## 📞 Quick Commands

```bash
# Backend status
cd /home/draxxy/praxify-CFO/praxifi-CFO && docker compose ps

# Get ngrok URL
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])"

# Test backend locally
curl http://localhost:8080/

# Test backend publicly
curl https://dd5469096c70.ngrok-free.app/

# View backend logs
cd /home/draxxy/praxify-CFO/praxifi-CFO && docker compose logs aiml-engine --tail=50 -f

# Restart everything
cd /home/draxxy/praxify-CFO/praxifi-CFO && docker compose restart
```
