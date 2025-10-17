# 🌐 Deploying Frontend on Vercel + Backend on Local Computer

## ⚠️ Important Understanding

**The Challenge:**
- Frontend on Vercel (cloud servers)
- Backend on your local computer
- Cloud cannot directly access `localhost:8000`

**The Solution:**
Use a **tunnel service** to expose your local backend to the internet.

---

## 🚀 Setup Guide: Vercel Frontend + Local Backend

### Step 1: Install ngrok (Free & Easy)

ngrok creates a secure tunnel from the internet to your local computer.

**Option A: Download ngrok**
```bash
# Visit https://ngrok.com/download
# Or use package manager:

# macOS
brew install ngrok/ngrok/ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

**Option B: Sign up and authenticate**
```bash
# Sign up at: https://dashboard.ngrok.com/signup
# Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

# Authenticate
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

---

### Step 2: Start Your Local Backend

```bash
# Terminal 1: Start Redis
docker run -d -p 6379:6379 --name praxify-redis redis:7-alpine

# Terminal 2: Start Backend
cd /home/draxxy/praxify-CFO
python -m uvicorn aiml_engine.main:app --reload --host 0.0.0.0 --port 8000
```

**Note:** Use `--host 0.0.0.0` (not just localhost) so ngrok can access it.

---

### Step 3: Start ngrok Tunnel

```bash
# Terminal 3: Start ngrok
ngrok http 8000
```

**You'll see output like:**
```
Session Status                online
Account                       Your Name (Plan: Free)
Forwarding                    https://abc123.ngrok.io -> http://localhost:8000
```

**Copy the HTTPS URL:** `https://abc123.ngrok.io`

⚠️ **Free ngrok URLs change every time you restart!**  
→ You'll need to update Vercel env var each time.

---

### Step 4: Update Backend CORS for ngrok

Edit `/home/draxxy/praxify-CFO/.env`:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# API Configuration
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://praxify-cfo.vercel.app,https://abc123.ngrok.io

# Google Gemini API Key
GOOGLE_API_KEY=your_actual_key_here

# Environment
ENVIRONMENT=development
```

**Restart backend** to apply CORS changes.

---

### Step 5: Test ngrok Tunnel

```bash
# Test that your backend is accessible via ngrok
curl https://abc123.ngrok.io/

# Should return:
# {"message":"Welcome to the Agentic CFO Copilot API","documentation":"/docs"}
```

Visit: `https://abc123.ngrok.io/docs` - You should see FastAPI docs!

---

### Step 6: Deploy Frontend to Vercel

```bash
cd /home/draxxy/praxify-CFO/praxify-frontend

# Deploy to Vercel
vercel --prod
```

When prompted, or in Vercel dashboard:

**Add Environment Variable:**
- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://abc123.ngrok.io` (your ngrok URL)

**Important:** Use HTTPS, not HTTP!

---

### Step 7: Test the Complete Setup

1. **Visit your Vercel app:** `https://praxify-cfo.vercel.app`
2. **Upload a CSV file**
3. **Generate a report or start AI chat**
4. **Check for errors** in browser console

**If it works:** 🎉 You're connected!

---

## 🔄 Daily Workflow (Free ngrok)

Since free ngrok URLs change on every restart:

```bash
# 1. Start backend
cd /home/draxxy/praxify-CFO
python -m uvicorn aiml_engine.main:app --reload --host 0.0.0.0 --port 8000

# 2. Start ngrok
ngrok http 8000
# Copy the new HTTPS URL

# 3. Update Vercel environment variable
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Paste the new ngrok URL

# 4. Redeploy frontend (quick, uses cache)
cd praxify-frontend
vercel --prod
```

---

## 💎 Better Solution: Paid ngrok (Optional)

**ngrok Pro ($8/month):**
- Fixed URLs (never change!)
- No need to update Vercel daily
- Custom domains
- More concurrent connections

```bash
# With paid plan, get a fixed domain:
ngrok http 8000 --domain=praxify-backend.ngrok.io

# Set once on Vercel:
NEXT_PUBLIC_API_URL=https://praxify-backend.ngrok.io

# Never change again!
```

**Sign up:** https://dashboard.ngrok.com/billing/subscription

---

## 🌟 Alternative Tunnel Services

### Option 1: localtunnel (Free, No Signup)

```bash
# Install
npm install -g localtunnel

# Start tunnel
lt --port 8000 --subdomain praxify-backend

# URL: https://praxify-backend.loca.lt
```

**Pros:** No account needed  
**Cons:** Less stable, may have rate limits

### Option 2: Cloudflare Tunnel (Free, Complex Setup)

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create praxify-backend

# Run tunnel
cloudflared tunnel --url http://localhost:8000
```

**Pros:** Free, stable, from Cloudflare  
**Cons:** More complex setup

### Option 3: Visual Studio Code Port Forwarding (Simplest!)

If you use VS Code:

1. Start backend on port 8000
2. In VS Code: View → Command Palette → "Forward a Port"
3. Enter port: 8000
4. Right-click port → "Port Visibility" → "Public"
5. Copy the forwarded URL

**Pros:** Built-in, super easy  
**Cons:** Requires VS Code running

---

## 📋 Complete Setup Checklist

- [ ] Redis running locally (`docker run -d -p 6379:6379 redis:7-alpine`)
- [ ] Backend `.env` has `GOOGLE_API_KEY` set
- [ ] Backend running on `0.0.0.0:8000` (not just localhost)
- [ ] ngrok (or tunnel) exposing backend
- [ ] Backend CORS includes ngrok URL
- [ ] Tested ngrok URL in browser
- [ ] Frontend deployed to Vercel
- [ ] Vercel env var `NEXT_PUBLIC_API_URL` set to ngrok URL
- [ ] Tested upload → report on Vercel

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" from Vercel

**Check:**
1. Is ngrok running? (`ngrok http 8000`)
2. Is backend running?
3. Does backend CORS include ngrok URL?
4. Is Vercel env var set correctly?

**Test ngrok directly:**
```bash
curl https://your-ngrok-url.ngrok.io/
```

### Issue: CORS Error

**Solution:**
1. Add ngrok URL to backend `.env`:
```bash
CORS_ORIGINS=https://abc123.ngrok.io,https://praxify-cfo.vercel.app
```
2. Restart backend

### Issue: ngrok URL Changed

**Solution:**
```bash
# Get new URL from ngrok terminal
# Update on Vercel:
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Enter new URL
vercel --prod
```

### Issue: "This site can't be reached"

**Check:**
1. Is backend listening on `0.0.0.0` (not `127.0.0.1`)?
2. Restart with: `--host 0.0.0.0`

### Issue: ngrok "ERR_NGROK_108"

**Solution:**
Free tier allows 1 tunnel at a time. Close other ngrok processes:
```bash
killall ngrok
ngrok http 8000
```

---

## 💰 Cost Comparison

### Free Setup
- Vercel: Free (hobby plan)
- ngrok: Free (with URL changes)
- **Total: $0/month**
- **Effort:** Update Vercel env var daily

### Recommended Setup
- Vercel: Free (hobby plan)
- ngrok Pro: $8/month (fixed URL)
- **Total: $8/month**
- **Effort:** Set once, forget it

### Alternative: Backend in Cloud
- Vercel: Free
- Railway backend: $5/month
- **Total: $5/month**
- **Effort:** Deploy once

---

## 🎯 Recommended Approach

**For Development/Testing:** Use free ngrok  
**For Production/Daily Use:** Either:
1. Get ngrok Pro ($8/month) for convenience
2. Deploy backend to Railway ($5/month) - see `VERCEL_DEPLOYMENT_GUIDE.md`

---

## 📝 Quick Commands Reference

```bash
# Start Redis
docker run -d -p 6379:6379 --name praxify-redis redis:7-alpine

# Start Backend
cd /home/draxxy/praxify-CFO
python -m uvicorn aiml_engine.main:app --reload --host 0.0.0.0 --port 8000

# Start ngrok
ngrok http 8000

# Deploy Frontend
cd /home/draxxy/praxify-CFO/praxify-frontend
vercel --prod

# Update Vercel env var
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
```

---

## ✅ Final Environment File Configuration

### Backend `.env` (Local Computer)
```bash
# /home/draxxy/praxify-CFO/.env
REDIS_HOST=localhost
REDIS_PORT=6379
API_PORT=8000
CORS_ORIGINS=https://praxify-cfo.vercel.app,https://abc123.ngrok.io
GOOGLE_API_KEY=your_actual_api_key_here
ENVIRONMENT=development
```

### Frontend (Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

---

## 🎓 You're All Set!

Your setup:
```
┌─────────────────────────────┐
│  Vercel (Cloud)             │
│  Frontend: React/Next.js    │
│  https://your-app.vercel.app│
└──────────┬──────────────────┘
           │
           │ HTTPS
           ▼
┌─────────────────────────────┐
│  ngrok Tunnel               │
│  https://abc123.ngrok.io    │
└──────────┬──────────────────┘
           │
           │ HTTP
           ▼
┌─────────────────────────────┐
│  Your Local Computer        │
│  ├─ Backend (Port 8000)     │
│  ├─ Redis (Port 6379)       │
│  └─ AI/ML Models            │
└─────────────────────────────┘
```

**Start in this order:**
1. Redis
2. Backend
3. ngrok
4. Deploy to Vercel (once)
5. Update Vercel env var (when ngrok URL changes)

---

**Questions?** Check the main guides:
- `INTEGRATION_COMPLETE.md` - Full status
- `VERCEL_DEPLOYMENT_GUIDE.md` - Alternative deployment
- `INTEGRATION_QUICKSTART.md` - Local development only
