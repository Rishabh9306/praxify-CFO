# Vercel Deployment Configuration for Praxifi Frontend

## 🎯 Overview
- **Frontend**: Next.js app hosted on Vercel
- **Backend**: FastAPI running on local Kubuntu machine, exposed via Cloudflare Tunnel
- **Domain**: praxifi.com (frontend) → api.praxifi.com (backend)

---

## 📋 Vercel Console Settings

### 1. **Root Directory**
```
praxifi-frontend
```
⚠️ **Important**: Set this in **Project Settings** → **General** → **Root Directory**

Since your repo has multiple folders (`praxifi-frontend/`, `praxifi-CFO/`, etc.), you MUST specify `praxifi-frontend` as the root directory so Vercel knows where your Next.js app is located.

---

### 2. **Environment Variables**

Go to: **Project Settings** → **Environment Variables**

Add these two variables:

#### **Variable 1: API URL**
```
Name:  NEXT_PUBLIC_API_URL
Value: https://api.praxifi.com
Environment: Production, Preview, Development
```

#### **Variable 2: Email API Key**
```
Name:  MAILERSEND_API_KEY
Value: mlsn.3551b2ff1c444f90e9916c48cd2f91530e07e196f33cb111dcbf036be477ca1d
Environment: Production, Preview, Development
```

---

## 🔧 Build & Development Settings

### Build Command
```bash
pnpm build
```
(or leave as default - Vercel auto-detects Next.js)

### Output Directory
```
.next
```
(or leave as default)

### Install Command
```bash
pnpm install
```

### Development Command
```bash
pnpm dev
```

### Node.js Version
```
18.x
```
(or 20.x - check your local version with `node --version`)

---

## 🌐 Domain Configuration

### Custom Domains
In **Project Settings** → **Domains**, add:

1. **Primary Domain**: `praxifi.com`
2. **WWW Redirect**: `www.praxifi.com` → redirects to `praxifi.com`

### DNS Configuration (in Namecheap)

For the frontend domain (`praxifi.com`):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | Automatic |
| CNAME | www | cname.vercel-dns.com | Automatic |

For the backend API (`api.praxifi.com`):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | api | 74d09ce1-0c25-4211-bb94-be4b0d64ddff.cfargotunnel.com | Automatic |

⚠️ **Note**: The `api` CNAME should already be configured from the Cloudflare Tunnel setup!

---

## 📦 Framework Preset

**Framework**: Next.js  
(Should be auto-detected)

---

## 🚀 Deployment Steps

### Step 1: Connect Repository
1. Go to Vercel Dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repository: `Rishabh9306/praxify-CFO`
4. Select the `v4` branch (or `main` if that's your production branch)

### Step 2: Configure Project
1. **Root Directory**: `praxifi-frontend` ⚠️ **CRITICAL**
2. **Framework Preset**: Next.js (auto-detected)
3. **Build Command**: Leave default or use `pnpm build`
4. **Output Directory**: `.next`

### Step 3: Add Environment Variables
Add both variables as shown above:
- `NEXT_PUBLIC_API_URL=https://api.praxifi.com`
- `MAILERSEND_API_KEY=mlsn.3551b2ff1c444f90e9916c48cd2f91530e07e196f33cb111dcbf036be477ca1d`

### Step 4: Deploy
Click **Deploy** and wait for the build to complete.

### Step 5: Configure Custom Domain
1. Go to **Project Settings** → **Domains**
2. Add `praxifi.com`
3. Follow Vercel's DNS instructions for Namecheap

---

## ✅ Verification Checklist

After deployment:

- [ ] Frontend loads at `https://praxifi.com` (or `https://your-project.vercel.app`)
- [ ] API calls go to `https://api.praxifi.com`
- [ ] Upload page can submit CSV files
- [ ] Simulate page shows calculations
- [ ] Email reports work (test from frontend)
- [ ] No CORS errors in browser console
- [ ] Check Network tab shows requests to `api.praxifi.com`

---

## 🔍 Testing Your Setup

### Test 1: Check Environment Variables are Loaded
After deployment, check the Vercel logs or add this to a page temporarily:
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

### Test 2: Test API Connection
Open browser console on your deployed site and run:
```javascript
fetch('https://api.praxifi.com/')
  .then(r => r.json())
  .then(console.log)
```

Expected output:
```json
{
  "message": "Welcome to the Agentic CFO Copilot API",
  "documentation": "/docs"
}
```

### Test 3: Test Full Upload Flow
1. Go to `/upload` page
2. Upload a CSV file
3. Check Network tab - should see POST to `https://api.praxifi.com/api/full_report`
4. Verify no CORS errors

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" or build errors
- **Solution**: Make sure **Root Directory** is set to `praxifi-frontend`

### Issue: "NEXT_PUBLIC_API_URL is undefined"
- **Solution**: 
  1. Check environment variables are added correctly
  2. Redeploy the project (env vars only apply to new deployments)
  3. Make sure variable name is exact: `NEXT_PUBLIC_API_URL`

### Issue: CORS errors
- **Solution**: Backend CORS is already configured for Vercel domains. If you have custom domain, make sure it's added to the CORS allowed origins in `/praxifi-CFO/aiml_engine/api/app.py`

### Issue: API calls timing out
- **Solution**: 
  1. Check Cloudflare tunnel is running: `./status-check.sh`
  2. Test API directly: `curl https://api.praxifi.com/`
  3. Check backend is running: `cd praxifi-CFO && docker-compose ps`

---

## 📝 Summary: Quick Copy-Paste

### Vercel Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.praxifi.com
MAILERSEND_API_KEY=mlsn.3551b2ff1c444f90e9916c48cd2f91530e07e196f33cb111dcbf036be477ca1d
```

### Vercel Root Directory:
```
praxifi-frontend
```

### Backend Status Check (on your local machine):
```bash
cd /home/draxxy/praxify-CFO
./status-check.sh
```

---

## 🎯 Architecture Flow

```
User Browser
    ↓
praxifi.com (Vercel - Frontend)
    ↓
api.praxifi.com (Cloudflare CDN)
    ↓
Cloudflare Tunnel (Encrypted)
    ↓
Your Kubuntu Machine (localhost:8080)
    ↓
Docker Container (FastAPI Backend)
```

---

## 🔐 Security Notes

✅ **Public Variables** (NEXT_PUBLIC_*):
- These are embedded in the client-side JavaScript
- Safe to expose in browser
- Used for API URLs, public keys, etc.

🔒 **Server-Only Variables**:
- `MAILERSEND_API_KEY` should be used in API routes only (`/app/api/*`)
- Never expose in client components
- Already correctly configured in your setup

---

## 🚀 Ready to Deploy!

Once you set these values in Vercel:
1. Root Directory: `praxifi-frontend`
2. Environment Variables: Both added
3. Deploy!

Your frontend will be live at `praxifi.com` (or Vercel URL initially), calling your local backend at `api.praxifi.com` through the Cloudflare Tunnel! 🎉
