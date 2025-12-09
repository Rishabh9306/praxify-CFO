# ⚡ VERCEL DEPLOYMENT - QUICK REFERENCE

## 🎯 What You Need to Set in Vercel Console

### 1️⃣ ROOT DIRECTORY (CRITICAL!)
```
praxifi-frontend
```
**Where to set**: Project Settings → General → Root Directory

⚠️ **IMPORTANT**: Your repo has multiple folders. Without setting this, Vercel won't find your Next.js app!

---

### 2️⃣ ENVIRONMENT VARIABLES

**Where to set**: Project Settings → Environment Variables

Add these 2 variables:

| Variable Name | Value | Apply to |
|--------------|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://api.praxifi.com` | Production, Preview, Development |
| `MAILERSEND_API_KEY` | `mlsn.3551b2ff1c444f90e9916c48cd2f91530e07e196f33cb111dcbf036be477ca1d` | Production, Preview, Development |

---

## 📋 Copy-Paste Values

### Environment Variable 1:
```
Name:  NEXT_PUBLIC_API_URL
Value: https://api.praxifi.com
```

### Environment Variable 2:
```
Name:  MAILERSEND_API_KEY
Value: mlsn.3551b2ff1c444f90e9916c48cd2f91530e07e196f33cb111dcbf036be477ca1d
```

---

## 🏗️ Build Settings (Auto-detected, but for reference)

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (or auto)
- **Output Directory**: `.next` (or auto)
- **Install Command**: `pnpm install` (or auto)
- **Node.js Version**: 18.x or 20.x

---

## 🌐 Your Architecture

```
Frontend (Vercel)          Backend (Your Machine)
    ↓                              ↓
praxifi.com  ────────→   api.praxifi.com
                               ↓
                      Cloudflare Tunnel
                               ↓
                      localhost:8080
                               ↓
                      Docker (FastAPI)
```

---

## ✅ Pre-Deployment Checklist

Before deploying to Vercel, make sure:

- [ ] Backend is running: `curl http://localhost:8080/`
- [ ] Cloudflare tunnel is running: `./status-check.sh`
- [ ] API is publicly accessible: `curl https://api.praxifi.com/`
- [ ] CORS is configured (✅ Already done!)

---

## 🚀 After Deployment

### Test Your Deployed Frontend:

1. **Check Environment Variables Loaded**:
   - Open browser console on your Vercel deployment
   - Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
   - Should show: `https://api.praxifi.com`

2. **Test API Connection**:
   - Open browser console
   - Run:
   ```javascript
   fetch('https://api.praxifi.com/')
     .then(r => r.json())
     .then(console.log)
   ```
   - Expected: `{"message":"Welcome to the Agentic CFO Copilot API","documentation":"/docs"}`

3. **Test Upload Flow**:
   - Go to `/upload` page
   - Upload a CSV file
   - Check Network tab for requests to `api.praxifi.com`
   - Should see no CORS errors

---

## 🐛 Common Issues & Solutions

### ❌ "Cannot find package.json"
**Solution**: Set Root Directory to `praxifi-frontend`

### ❌ "NEXT_PUBLIC_API_URL is undefined"
**Solutions**:
1. Check variable name is exactly `NEXT_PUBLIC_API_URL`
2. Redeploy after adding env vars (env vars only apply to new builds)
3. Make sure "Apply to" includes Production/Preview/Development

### ❌ CORS errors
**Solution**: Already fixed! Backend CORS now allows:
- `https://praxifi.com`
- `https://www.praxifi.com`
- `http://localhost:3000` (for local dev)

### ❌ API not responding
**Solutions**:
1. Check backend: `curl http://localhost:8080/`
2. Check tunnel: `./status-check.sh`
3. Check public API: `curl https://api.praxifi.com/`

---

## 📱 Domain Configuration

### In Vercel (after deployment):
- Add custom domain: `praxifi.com`
- Vercel will give you DNS instructions

### In Namecheap (for praxifi.com):
Follow Vercel's instructions, typically:
- A record: @ → 76.76.21.21
- CNAME: www → cname.vercel-dns.com

### Backend API (already done!):
- CNAME: api → `74d09ce1-0c25-4211-bb94-be4b0d64ddff.cfargotunnel.com`

---

## 🔄 Deployment Workflow

1. **Push code to GitHub** (v4 branch)
2. **Vercel auto-deploys** (if connected to GitHub)
3. **Wait for build** (~2-3 minutes)
4. **Test deployment** (use checklist above)
5. **Add custom domain** (if not already added)

---

## 💡 Pro Tips

✅ **Environment Variables**:
- `NEXT_PUBLIC_*` variables are public (embedded in client JS)
- Use `MAILERSEND_API_KEY` only in API routes (`/app/api/*`)
- Never log sensitive variables in production

✅ **Preview Deployments**:
- Every git push creates a preview deployment
- Great for testing before merging to main

✅ **Monitoring**:
- Check Vercel logs for build errors
- Use browser console for client-side errors
- Use `./status-check.sh` for backend health

---

## 📚 Full Documentation

For complete details, see: [`VERCEL_DEPLOYMENT_GUIDE.md`](./VERCEL_DEPLOYMENT_GUIDE.md)

---

## 🎉 You're Ready!

Set these values in Vercel and deploy:
1. ✅ Root Directory: `praxifi-frontend`
2. ✅ NEXT_PUBLIC_API_URL: `https://api.praxifi.com`
3. ✅ MAILERSEND_API_KEY: `mlsn.3551b2ff...ca1d`

Your full-stack app will be live! 🚀
