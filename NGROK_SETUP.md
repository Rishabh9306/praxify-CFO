# 🚀 ngrok Setup for Praxifi Backend# ngrok Setup Guide



## Current Configuration## ✅ Migration Complete: Cloudflare Tunnel → ngrok



### ✅ Active ngrok Tunnel### What Changed?

- **URL**: `https://dd5469096c70.ngrok-free.app`- **Removed**: Cloudflare Tunnel (100-second timeout killing long reports)

- **Target**: `localhost:8080` (FastAPI Backend)- **Added**: ngrok (no timeout limits, perfect for 2+ minute report generation)

- **Status**: Running (PID: 24191)

---

### 📋 Environment Setup

## 🚀 Quick Start

#### Frontend (.env)

```bash### Start ngrok:

NEXT_PUBLIC_API_URL=https://dd5469096c70.ngrok-free.app```bash

```./start-ngrok.sh

```

#### Vercel Environment Variables

Set in Vercel Dashboard (vercel.com):This will:

```1. Kill any existing ngrok processes

NEXT_PUBLIC_API_URL=https://dd5469096c70.ngrok-free.app2. Start ngrok tunnel on port 8080

```3. Display the public URL

**Apply to**: Production, Preview, Development

### Current ngrok URL:

### 🔧 Backend CORS Configuration```

Located in: `praxifi-CFO/aiml_engine/api/app.py`https://dd5469096c70.ngrok-free.app

```

```python

allow_origin_regex=r"https://.*\.vercel\.app|https://praxifi\.com|https://www\.praxifi\.com|https://.*\.ngrok-free\.app|https://.*\.ngrok\.io|http://localhost:\d+|http://127\.0\.0\.1:\d+"---

```

## 📋 Configuration Updates Needed

## 🎯 Quick Commands

### 1. **Vercel Environment Variables** ⚠️ REQUIRED

### Check ngrok StatusGo to: https://vercel.com/your-project/settings/environment-variables

```bash

ps aux | grep ngrok | grep -v grepUpdate:

```- **Variable**: `NEXT_PUBLIC_API_URL`

- **Value**: `https://dd5469096c70.ngrok-free.app` (your current ngrok URL)

### Get Current ngrok URL- **Environment**: Production, Preview, Development

```bash

curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])"After updating, redeploy:

``````bash

cd praxifi-frontend

### View ngrok Dashboardgit commit --allow-empty -m "Trigger Vercel redeploy"

```bashgit push

xdg-open http://127.0.0.1:4040```

```

Or visit: http://127.0.0.1:4040/inspect/http### 2. **Cloudflare DNS** (Optional - for custom domain later)

If you want to use `api.praxifi.com` with ngrok:

### Test Backend via ngrok- Delete the CNAME record pointing to Cloudflare Tunnel

```bash- Or leave it as-is (won't affect anything)

curl https://dd5469096c70.ngrok-free.app/

curl https://dd5469096c70.ngrok-free.app/docs### 3. **Backend CORS** ✅ Already Updated

````aiml_engine/api/app.py` now includes ngrok patterns:

```python

### Restart ngrok (if needed)allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.ngrok-free\.app|..."

```bash```

# Kill existing process

pkill -f ngrok---



# Start new tunnel## 🔄 Daily Usage

ngrok http 8080 --log=stdout &

```### Start Backend + ngrok:

```bash

## 📝 Important Notes# Terminal 1: Start Docker backend

cd praxifi-CFO

### ngrok URL Changesdocker compose up -d

⚠️ **Free ngrok URLs change on restart!**

# Terminal 2: Start ngrok

If you restart ngrok, you MUST update:./start-ngrok.sh

1. ✅ Frontend `.env` file```

2. ✅ Vercel environment variables

3. ✅ Redeploy on Vercel to pick up new URL### Check Status:

```bash

### Advantages over Cloudflare Tunnel# Backend health

✅ **No timeout limits** - Perfect for 2+ minute AI report generation  curl http://localhost:8080/

✅ **Easy to use** - Single command to start  

✅ **Request inspection** - Built-in dashboard at localhost:4040  # ngrok tunnel status

✅ **Flexible** - Can point to any local port  curl http://localhost:4040/api/tunnels



### Disadvantages# View ngrok dashboard

❌ **URL changes on restart** - Need to update config  open http://localhost:4040

❌ **Free tier limitations** - Single tunnel, public URL exposure  ```

❌ **ngrok branding** - Shows interstitial page on first visit  

### Stop Everything:

## 🔄 Workflow```bash

# Stop ngrok

### Developmentpkill -f "ngrok http"

```bash

# 1. Ensure backend is running# Stop backend

cd praxifi-CFOcd praxifi-CFO

docker compose up -ddocker compose down

```

# 2. Ensure ngrok is running

ps aux | grep ngrok---



# 3. Test locally## ⚠️ Important Notes

curl http://localhost:8080/

### Free ngrok URL Changes

# 4. Test via ngrokThe free ngrok URL (`https://dd5469096c70.ngrok-free.app`) changes **every time you restart ngrok**.

curl https://dd5469096c70.ngrok-free.app/

```**When ngrok restarts**, you must:

1. Get new URL from `./start-ngrok.sh` output

### Production Deployment2. Update Vercel `NEXT_PUBLIC_API_URL`

```bash3. Redeploy frontend

# 1. Verify ngrok URL hasn't changed

curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])"### Upgrade to ngrok Static Domain (Recommended)

**Cost**: $8/month

# 2. Update Vercel if URL changed**Benefit**: `api.praxifi.com` stays permanent, no Vercel updates needed

# Go to: https://vercel.com/dashboard → Project → Settings → Environment Variables

# Update NEXT_PUBLIC_API_URL with new ngrok URLTo upgrade:

```bash

# 3. Trigger Vercel redeploy# 1. Get ngrok account at https://dashboard.ngrok.com

# Push to GitHub or use Vercel dashboard "Redeploy" button# 2. Reserve static domain

# 3. Update script:

# 4. Test productionngrok http --domain=api.praxifi.com 8080

curl https://www.praxifi.com/api-test```

```

---

## 🐛 Troubleshooting

## 🔧 Troubleshooting

### Issue: "502 Bad Gateway" from ngrok

**Solution**: Backend not running### "Failed to start ngrok"

```bash```bash

cd praxifi-CFO# Check if ngrok is installed

docker compose up -dngrok --version

docker compose ps  # Verify healthy status

```# If not installed:

snap install ngrok

### Issue: CORS errors in browser

**Solution**: CORS pattern mismatch# Add auth token (get from https://dashboard.ngrok.com)

```bashngrok config add-authtoken YOUR_TOKEN_HERE

# Restart backend after CORS changes```

cd praxifi-CFO

docker compose restart aiml-engine### CORS Errors

``````bash

# Restart backend to reload CORS config

### Issue: Vercel not picking up new URLcd praxifi-CFO

**Solution**: Clear cache and force rebuilddocker compose restart aiml-engine

```bash```

# 1. Update environment variable in Vercel dashboard

# 2. Delete .next cache locally### 524 Timeout Still Happening?

rm -rf praxifi-frontend/.next- Check that Vercel has the correct ngrok URL

# 3. Push to GitHub to trigger fresh build- Verify ngrok is running: `pgrep -la ngrok`

```- Check ngrok logs: `tail -f ~/ngrok.log`



### Issue: ngrok tunnel disconnected---

**Solution**: Restart ngrok

```bash## 📊 Comparison: Cloudflare Tunnel vs ngrok

pkill -f ngrok

ngrok http 8080 --log=stdout &| Feature | Cloudflare Tunnel | ngrok |

# Wait 5 seconds then get new URL|---------|------------------|-------|

sleep 5 && curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])"| Timeout | 100 seconds ❌ | Unlimited ✅ |

```| Custom Domain | Free | $8/month |

| SSL | Free | Free |

## 🔐 Security Considerations| Setup Complexity | Medium | Easy |

| Stability | Good | Good |

### Current Setup| **Best for** | Short requests | Long-running AI tasks ✅ |

- ✅ HTTPS encryption via ngrok

- ✅ CORS configured for specific domains---

- ✅ Backend authentication in place

- ✅ Rate limiting via FastAPI## 🎯 Next Steps



### Recommendations for Production1. ✅ ngrok is running

1. **Use ngrok paid plan** for:2. ⏳ **Update Vercel env variable** with ngrok URL

   - Custom domain (e.g., api.praxifi.com)3. ⏳ **Redeploy frontend** on Vercel

   - No interstitial page4. ✅ Test report generation at https://www.praxifi.com/mvp/static-report

   - Multiple tunnels

   - IP whitelistingAfter these steps, your 2+ minute reports will work perfectly! 🚀


2. **Alternative: VPS Deployment**
   - Deploy backend to DigitalOcean/AWS
   - Use nginx reverse proxy
   - No timeout limits
   - Full control

3. **Alternative: Serverless with Extended Timeout**
   - AWS Lambda with 15-minute timeout
   - API Gateway
   - Handles long-running reports

## 📊 Current Architecture

```
User Browser
    ↓
Vercel (Next.js Frontend)
    ↓ HTTPS
ngrok Tunnel (https://dd5469096c70.ngrok-free.app)
    ↓ Port Forward
localhost:8080 (FastAPI Backend in Docker)
    ↓
AI/ML Processing (2+ minutes)
    ↓
Response via ngrok → Vercel → User
```

## ✅ Status Check

Run this to verify everything:
```bash
echo "🐳 Docker Backend:"
docker compose ps | grep aiml-engine

echo -e "\n🌐 ngrok Tunnel:"
ps aux | grep ngrok | grep -v grep

echo -e "\n🔗 ngrok URL:"
curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])"

echo -e "\n✅ Backend Health (ngrok):"
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'])")
curl -s $NGROK_URL/ | python3 -m json.tool

echo -e "\n📝 Frontend .env:"
cat praxifi-frontend/.env | grep NEXT_PUBLIC_API_URL
```

---

**Last Updated**: December 10, 2025  
**ngrok Version**: Running via snap package  
**Backend**: FastAPI on Docker (localhost:8080)
