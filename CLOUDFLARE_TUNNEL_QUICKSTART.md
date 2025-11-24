# 🚀 Quick Fix: Switch from ngrok to Cloudflare Tunnel

## Problem
ngrok free tier has a **10-minute timeout** that kills long-running report generation requests.

## Solution
Use **Cloudflare Tunnel** instead - it's **FREE with NO timeouts**! 🎉

## Setup (5 minutes)

### Step 1: Install Cloudflare Tunnel
```bash
# On macOS
brew install cloudflare/cloudflare/cloudflared

# On Linux
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# On Windows
# Download from: https://github.com/cloudflare/cloudflared/releases/latest
```

### Step 2: Start the Tunnel
```bash
# Make sure your backend is running
cd /Users/swayamsahoo/Projects/praxify-CFO/praxifi-CFO
docker ps  # Should show praxifi-cfo-aiml-engine running

# Start tunnel (no signup required!)
cloudflared tunnel --url http://localhost:8080
```

You'll see output like:
```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://randomly-generated-name.trycloudflare.com
```

### Step 3: Update Frontend Environment
```bash
cd /Users/swayamsahoo/Projects/praxify-CFO/praxifi-frontend

# Edit .env.local
nano .env.local  # or code .env.local
```

Replace ngrok URL with your Cloudflare Tunnel URL:
```bash
# OLD
NEXT_PUBLIC_API_URL=https://unpompous-nonextensible-richelle.ngrok-free.dev

# NEW (use the URL from Step 2)
NEXT_PUBLIC_API_URL=https://randomly-generated-name.trycloudflare.com
```

### Step 4: Restart Frontend
```bash
# Stop the current frontend (Ctrl+C in the terminal running pnpm dev)
# Then restart:
pnpm run dev
```

### Step 5: Test!
1. Go to http://localhost:3000/mvp/static-report
2. Upload `sample_financial_data.csv`
3. Click "Skip email prompt" or provide an email
4. Wait 10+ minutes - **it will work!** ✅

## ✨ Benefits of Cloudflare Tunnel

| Feature | ngrok Free | Cloudflare Tunnel |
|---------|------------|-------------------|
| **Timeout** | ❌ 10 minutes | ✅ Unlimited |
| **Cost** | Free | Free |
| **Signup Required** | Yes | No* |
| **Stability** | Good | Excellent |
| **Speed** | Fast | Fast |
| **Custom Domain** | ❌ Paid only | ✅ Free with account |

*No signup needed for quick tunnels (random URLs). Signup required for custom domains.

## 🔧 Pro Tips

### Make Tunnel Persistent
```bash
# Keep tunnel running in background
cloudflared tunnel --url http://localhost:8080 > tunnel.log 2>&1 &

# See the URL
cat tunnel.log | grep "trycloudflare.com"
```

### Monitor Tunnel Status
```bash
# Check if tunnel is running
ps aux | grep cloudflared

# View logs
tail -f tunnel.log
```

### Stop Tunnel
```bash
# Find the process
ps aux | grep cloudflared

# Kill it (replace PID with actual process ID)
kill <PID>
```

## 🎯 Expected Results

**Before** (with ngrok):
- ❌ 503 Service Unavailable after 10 minutes
- ❌ CORS errors
- ❌ Duplicate POST requests
- ❌ "Failed to fetch" errors

**After** (with Cloudflare Tunnel):
- ✅ Reports complete successfully even after 10+ minutes
- ✅ No CORS errors
- ✅ Single POST request
- ✅ Proper 200 OK responses
- ✅ PDF downloads successfully
- ✅ Email sending works

## 🚨 Troubleshooting

### Issue: "Command not found: cloudflared"
```bash
# Verify installation
which cloudflared

# If not found, reinstall:
brew reinstall cloudflared
```

### Issue: "Connection refused"
```bash
# Make sure backend is running
docker ps | grep aiml-engine

# If not running:
cd praxifi-CFO
docker compose up -d
```

### Issue: "Tunnel URL not accessible"
```bash
# Wait 30 seconds - Cloudflare needs time to provision
# Try accessing the URL in an incognito window
# Check tunnel logs for errors
```

## 📊 Alternative: Use Railway for Permanent Deployment

If you want a **permanent URL** (not random):

```bash
# 1. Sign up at railway.app (free)
# 2. Install CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Deploy backend
cd /Users/swayamsahoo/Projects/praxify-CFO/praxifi-CFO
railway up

# 5. Get your permanent URL from Railway dashboard
# Example: https://praxifi-api-production.up.railway.app

# 6. Update frontend .env.local with Railway URL
```

## 🎉 Summary

1. ✅ **Install**: `brew install cloudflare/cloudflare/cloudflared`
2. ✅ **Start**: `cloudflared tunnel --url http://localhost:8080`
3. ✅ **Update**: Replace ngrok URL in `.env.local`
4. ✅ **Test**: Generate reports - they work beyond 10 minutes!

**This solves the timeout issue immediately without any code changes!**

## 📞 Need Help?

If Cloudflare Tunnel doesn't work:
1. Check Docker logs: `docker logs praxifi-cfo-aiml-engine`
2. Check tunnel logs: Look at terminal output
3. Test backend directly: `curl http://localhost:8080/`
4. Make sure ports aren't blocked by firewall

---

**Next Steps**: Once working, consider deploying to Railway/Vercel for production (see LONG_RUNNING_REQUESTS_SOLUTION.md)
