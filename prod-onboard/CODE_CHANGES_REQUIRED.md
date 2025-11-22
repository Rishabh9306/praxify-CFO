# 🔧 Code Changes Required Before Production Deploy

## Critical Updates Needed

### ⚠️ MUST UPDATE - Replace ALL instances of "yourdomain.com"

Use Find & Replace in VS Code or run these commands:

---

## 1. Nginx Configuration

**File**: `/praxifi-CFO/nginx.production.conf`

**Find**: `yourdomain.com` (appears 12 times)  
**Replace with**: `your-actual-domain.com`

**Lines to update**:
- Line 17: `server_name yourdomain.com www.yourdomain.com api.yourdomain.com;`
- Line 30: `server_name yourdomain.com www.yourdomain.com;`
- Line 75: `server_name api.yourdomain.com;`

---

## 2. Backend CORS Configuration

**File**: `/praxifi-CFO/aiml_engine/api/app.py`

**Find**: `yourdomain.com` (appears 3 times)  
**Replace with**: `your-actual-domain.com`

**Lines to update** (around line 18-22):
```python
ALLOWED_ORIGINS = [
    "https://yourdomain.com",       # ← UPDATE THIS
    "https://www.yourdomain.com",   # ← UPDATE THIS
    "https://api.yourdomain.com",   # ← UPDATE THIS
]
```

---

## 3. Environment Files

### Backend: `/praxifi-CFO/.env`

Create from template:
```bash
cp /praxifi-CFO/.env.production.example /praxifi-CFO/.env
```

**Update these values**:
```bash
# Line 12: Add your Google API key
GOOGLE_API_KEY=your_actual_google_api_key_here

# Line 29: Update domain (optional, for reference)
DOMAIN_NAME=your-actual-domain.com
```

### Frontend: `/praxifi-frontend/.env.production`

Create from template:
```bash
cp /praxifi-frontend/.env.production.example /praxifi-frontend/.env.production
```

**Update this value**:
```bash
# Line 4: Update API URL with your domain
NEXT_PUBLIC_API_URL=https://api.your-actual-domain.com
```

---

## 4. PM2 Configuration (Already Correct ✓)

**File**: `/praxifi-frontend/ecosystem.config.js`

No changes needed - paths are already set to `/opt/praxifi/`

---

## 5. Docker Compose (Verify SSL Mount)

**File**: `/praxifi-CFO/docker-compose.yml`

When deploying, ensure nginx volumes section has:
```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
  - /etc/letsencrypt/live/YOUR-DOMAIN:/etc/nginx/ssl:ro
```

**Update** `YOUR-DOMAIN` to your actual domain name when on VPS.

---

## Automated Find & Replace Script

Save this as `update-domain.sh` and run it:

```bash
#!/bin/bash

# Replace yourdomain.com with actual domain
# Usage: ./update-domain.sh actual-domain.com

if [ -z "$1" ]; then
    echo "Usage: $0 <your-domain.com>"
    exit 1
fi

DOMAIN=$1

echo "Updating domain to: $DOMAIN"

# Update nginx config
sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-CFO/nginx.production.conf

# Update CORS config
sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-CFO/aiml_engine/api/app.py

# Update frontend env example
sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-frontend/.env.production.example

# Update backend env example
sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-CFO/.env.production.example

echo "✓ Domain updated in all files"
echo ""
echo "Next steps:"
echo "1. Create .env files from examples"
echo "2. Add your Google API key to praxifi-CFO/.env"
echo "3. Commit changes: git add . && git commit -m 'Update domain config'"
```

**Run it**:
```bash
chmod +x update-domain.sh
./update-domain.sh myactualsite.com
```

---

## Manual Verification Checklist

Before committing, verify these files contain your actual domain:

- [ ] `/praxifi-CFO/nginx.production.conf` - 12 instances updated
- [ ] `/praxifi-CFO/aiml_engine/api/app.py` - 3 instances updated
- [ ] `/praxifi-CFO/.env` - Created and GOOGLE_API_KEY added
- [ ] `/praxifi-frontend/.env.production` - Created and API URL updated

**Quick Check**:
```bash
# Search for remaining "yourdomain.com" references
grep -r "yourdomain\.com" praxifi-CFO/ praxifi-frontend/ | grep -v node_modules | grep -v .next

# Should only show example files, not actual config files
```

---

## Git Commands After Updates

```bash
# Stage all changes
git add .

# Commit
git commit -m "Update production configuration with actual domain"

# Push to v3 branch
git push origin v3

# Tag the release (optional but recommended)
git tag -a v3.0-production -m "Production-ready deployment"
git push origin v3.0-production
```

---

## What NOT to Commit

Make sure these are in `.gitignore`:

```gitignore
# Environment files (already in .gitignore)
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
.next/
__pycache__/

# Logs
*.log
logs/

# SSL certificates (will be generated on server)
ssl/
*.pem
*.key
```

---

## Final Verification Before Deploy

Run these checks locally:

```bash
# 1. Check no sensitive data in git
git diff HEAD~1

# 2. Verify .env files are NOT tracked
git ls-files | grep "\.env$"
# Should return nothing (empty)

# 3. Build backend locally
cd praxifi-CFO
docker compose build
# Should complete without errors

# 4. Build frontend locally
cd ../praxifi-frontend
pnpm build
# Should complete without errors

# 5. Check for domain references
grep -r "yourdomain\.com" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
# Should only show .example files
```

---

## Ready to Deploy?

Once all updates are complete:

1. ✅ Domain updated in all files
2. ✅ `.env` files created (not committed)
3. ✅ Google API key added
4. ✅ Code committed and pushed
5. ✅ Local builds successful

**You're ready!** Proceed to VPS deployment:
👉 See `QUICK_START_DEPLOY.md` or `PRODUCTION_DEPLOYMENT_GUIDE.md`

---

**Last Updated**: November 22, 2025  
**Version**: v3
