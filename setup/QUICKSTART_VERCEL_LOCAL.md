# 🎯 QUICK START: Vercel Frontend + Local Backend

## What You Need

1. **ngrok installed** (for tunneling) - https://ngrok.com/download
2. **Google API Key** - https://makersuite.google.com/app/apikey
3. **Vercel account** - https://vercel.com

---

## ⚡ 5-Minute Setup

### 1. Set Your API Key

Edit `/home/draxxy/praxify-CFO/.env`:
```bash
GOOGLE_API_KEY=your_actual_key_here  # ← Replace this!
```

### 2. Start Everything

```bash
# Terminal 1: Start Redis
docker run -d -p 6379:6379 --name praxify-redis redis:7-alpine

# Terminal 2: Start Backend
cd /home/draxxy/praxify-CFO
python -m uvicorn aiml_engine.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start ngrok
ngrok http 8000
```

### 3. Copy ngrok URL

From ngrok terminal, copy the HTTPS URL:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            Copy this!
```

### 4. Update Backend CORS

Edit `/home/draxxy/praxify-CFO/.env` and add your ngrok URL:
```bash
CORS_ORIGINS=http://localhost:3000,https://praxify-cfo.vercel.app,https://abc123.ngrok.io
```

**Restart backend** (Ctrl+C, then run uvicorn command again)

### 5. Deploy to Vercel

```bash
cd /home/draxxy/praxify-CFO/praxify-frontend
vercel --prod
```

Add environment variable when prompted:
- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://abc123.ngrok.io` (your ngrok URL)

Or add later in Vercel dashboard → Settings → Environment Variables

### 6. Test It!

Visit your Vercel URL, upload a CSV, generate a report!

---

## 🔄 Daily Restart (Free ngrok)

**Every time you restart your computer:**

```bash
# 1. Start backend + ngrok
cd /home/draxxy/praxify-CFO
docker start praxify-redis
python -m uvicorn aiml_engine.main:app --reload --host 0.0.0.0 --port 8000 &
ngrok http 8000

# 2. Get NEW ngrok URL (it changes!)
# Copy from ngrok terminal

# 3. Update Vercel
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Paste new ngrok URL

# 4. Redeploy
vercel --prod
```

---

## 📁 Required Files (Already Created!)

✅ `/home/draxxy/praxify-CFO/.env` - Backend config  
✅ `/home/draxxy/praxify-CFO/praxify-frontend/.env.local` - Frontend local dev  
✅ All code changes applied (CORS, parameters, API URLs)

---

## ❓ Troubleshooting

**"Failed to fetch" on Vercel?**
→ Check ngrok is running, check Vercel env var

**CORS error?**
→ Add ngrok URL to backend `.env` CORS_ORIGINS, restart backend

**ngrok URL changed?**
→ Update Vercel env var and redeploy

**Backend not accessible via ngrok?**
→ Use `--host 0.0.0.0` not just `--host localhost`

---

## 💎 Upgrade to Fixed URL ($8/month)

```bash
# Sign up for ngrok Pro
# Get fixed domain: praxify.ngrok.io

ngrok http 8000 --domain=praxify.ngrok.io

# Set ONCE on Vercel, never change again!
```

---

## 📚 Full Guides

- **This Setup:** `VERCEL_WITH_LOCAL_BACKEND.md`
- **Backend in Cloud:** `VERCEL_DEPLOYMENT_GUIDE.md`
- **Local Dev Only:** `INTEGRATION_QUICKSTART.md`
- **Complete Status:** `INTEGRATION_COMPLETE.md`

---

**You're ready! Start with Step 1 above.** 🚀
