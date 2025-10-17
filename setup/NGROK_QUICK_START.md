# ⚡ QUICK START WITH NGROK - 3 MINUTES

**Your Integration Status:** ✅ **100% COMPLETE**  
**Ready for:** ngrok tunneling + Vercel deployment

---

## 🎯 What You Have

✅ Backend running on `localhost:8000`  
✅ Redis running on `localhost:6379`  
✅ Frontend code ready with 943 packages installed  
✅ All API endpoints matched  
✅ All parameters aligned  
✅ CORS configured  
✅ ngrok available

---

## 🚀 3-Step Deployment

### **Step 1: Start ngrok (1 minute)**

```bash
# Easy way (using provided script):
cd /home/draxxy/praxify-CFO
./setup-ngrok.sh

# Manual way:
ngrok http 8000
```

**You'll see:**
```
Forwarding: https://abc123.ngrok.io -> http://localhost:8000
            ^^^^^^^^^^^^^^^^^^^^
            COPY THIS URL!
```

---

### **Step 2: Update Backend CORS (1 minute)**

```bash
# Edit backend environment
nano /home/draxxy/praxify-CFO/.env
```

**Add ngrok URL to CORS_ORIGINS:**
```bash
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://praxify-cfo.vercel.app,https://abc123.ngrok.io
                                                                                          ^^^^^^^^^^^^^^^^^^
                                                                                          Add your ngrok URL
```

**Also set your Google API key while you're here:**
```bash
GOOGLE_API_KEY=your_actual_api_key_here
```

**Save and restart backend:**
```bash
docker restart praxify-cfo-aiml-engine
# Wait 10 seconds for restart
```

---

### **Step 3: Deploy to Vercel (1 minute)**

```bash
cd /home/draxxy/praxify-CFO/praxify-frontend

# Deploy
vercel --prod

# Set environment variable (when prompted or after deployment)
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://abc123.ngrok.io (your ngrok URL)

# Redeploy to apply env var
vercel --prod
```

---

## ✅ That's It! You're Live!

Your app is now accessible at: `https://praxify-cfo.vercel.app`

**Architecture:**
```
Vercel (Cloud) → ngrok tunnel → localhost:8000 (Your Computer)
```

---

## 📱 Test Your Deployment

1. Visit: `https://praxify-cfo.vercel.app`
2. Go to Upload page
3. Upload a CSV file
4. Generate a report
5. Try the AI chat

**Everything should work!** ✅

---

## 🔄 Daily Restart (Free ngrok)

If using free ngrok, the URL changes on restart:

```bash
# 1. Start ngrok (get NEW URL)
ngrok http 8000

# 2. Update backend .env with NEW URL
nano /home/draxxy/praxify-CFO/.env

# 3. Restart backend
docker restart praxify-cfo-aiml-engine

# 4. Update Vercel env var
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Enter NEW ngrok URL

# 5. Redeploy
vercel --prod
```

**Paid ngrok ($8/mo) = Fixed URL = No daily updates needed!**

---

## 🐛 Troubleshooting

### Backend not responding?
```bash
# Check if running
docker ps | grep aiml-engine

# View logs
docker logs praxify-cfo-aiml-engine --tail 50

# Restart
docker restart praxify-cfo-aiml-engine
```

### CORS error on Vercel?
```bash
# Make sure ngrok URL is in backend .env CORS_ORIGINS
grep CORS_ORIGINS /home/draxxy/praxify-CFO/.env

# Make sure backend restarted after adding URL
docker restart praxify-cfo-aiml-engine
```

### ngrok tunnel not working?
```bash
# Test from terminal
curl https://YOUR-NGROK-URL.ngrok.io/

# Should return:
# {"message":"Welcome to the Agentic CFO Copilot API"...}

# If not, check if backend uses 0.0.0.0 (not just localhost)
# This should be fine as your container exposes port 8000
```

### Vercel deployment fails?
```bash
# Check frontend build locally first
cd /home/draxxy/praxify-CFO/praxify-frontend
pnpm run build

# Should say: "Compiled successfully"
```

---

## 📚 Full Documentation

- `INTEGRATION_VERIFICATION_COMPLETE.md` - **Complete integration checklist** ⭐
- `VERCEL_WITH_LOCAL_BACKEND.md` - Detailed ngrok guide
- `QUICKSTART_VERCEL_LOCAL.md` - Alternative quick guide
- `FRONTEND_ERROR_RESOLUTION.md` - TypeScript errors explained

---

## 🎉 You're All Set!

**Integration Status:** 100% Complete ✅  
**Backend:** Running and ready ✅  
**Frontend:** Built and deployable ✅  
**ngrok:** Ready to use ✅  
**Documentation:** Complete ✅

**Next Command:**
```bash
./setup-ngrok.sh
```

**Then deploy and enjoy your AI-powered CFO copilot!** 🚀
