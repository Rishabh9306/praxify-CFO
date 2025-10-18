# 📁 Setup Folder - Documentation Index

**Last Updated:** October 18, 2025

This folder contains all setup scripts, deployment guides, and technical documentation for Praxify CFO.

---

## 📚 Documentation Files

### 🚀 Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - Main setup guide (START HERE)
  - Prerequisites and installation
  - Docker and local development options
  - Testing instructions
  - Common issues and solutions

### 🔧 Troubleshooting & Fixes
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Complete bug fixes archive
  - CORS errors and solutions
  - Data structure mismatches fixed
  - Chart visibility issues resolved
  - All historical fixes consolidated

### 🌐 Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
  - Vercel + Local Backend setup
  - Vercel + ngrok setup
  - Full production deployment
  - Docker deployment
  - Security checklist

### 🏗️ Architecture & Technical Reference
- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - Visual system architecture
  - System overview diagrams
  - Data flow diagrams
  - Component interactions
  - API endpoint flows

- **[CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md)** - Deep codebase analysis
  - Project structure breakdown
  - Module-by-module documentation
  - Code patterns and conventions
  - Database schemas

- **[FRONTEND_SPECIFICATION.md](./FRONTEND_SPECIFICATION.md)** - Frontend requirements
  - Feature specifications
  - Component requirements
  - Data mapping guidelines
  - UI/UX patterns

---

## 🛠️ Setup Scripts

All scripts are located in this folder and are executable.

### Main Scripts

#### `quick-start.sh`
Complete automated setup script. Runs everything in one go.
```bash
./setup/quick-start.sh
```

#### `verify-setup.sh`
Verifies that your setup is correct and all services are running.
```bash
./setup/verify-setup.sh
```

#### `start-frontend.sh`
Quick script to start the frontend development server.
```bash
./setup/start-frontend.sh
```

#### `test_api.sh`
Tests API connectivity and endpoints.
```bash
./setup/test_api.sh
```

#### `setup-ngrok.sh`
Sets up ngrok tunnel for public backend access.
```bash
./setup/setup-ngrok.sh
```

---

## 📊 Sample Data

- **`temp_api_upload.csv`** - Sample financial data for testing
  - Use this file to test uploads and reports
  - Contains realistic financial metrics

---

## 🎯 Quick Navigation

### I'm New Here
1. Read [QUICK_START.md](./QUICK_START.md)
2. Run `./setup/quick-start.sh`
3. Open http://localhost:3000

### I Have an Issue
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Run `./setup/verify-setup.sh`
3. Check relevant error section

### I Want to Deploy
1. Read [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Choose deployment option
3. Follow step-by-step guide

### I Want to Understand the Code
1. Review [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
2. Read [CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md)
3. Check [FRONTEND_SPECIFICATION.md](./FRONTEND_SPECIFICATION.md)

---

## 📝 Development Workflow

### Standard Development Flow
```bash
# 1. Start backend (Docker)
docker compose up -d

# 2. Start frontend
cd praxify-frontend
pnpm dev

# 3. Test
open http://localhost:3000
```

### With ngrok (Public Access)
```bash
# 1. Start backend
docker compose up -d

# 2. Setup ngrok
./setup/setup-ngrok.sh

# 3. Update Vercel env with ngrok URL

# 4. Deploy to Vercel
cd praxify-frontend
vercel --prod
```

---

## 🔄 Recently Fixed Issues (October 2025)

✅ **Charts invisible in dark mode** - Fixed using CSS variables  
✅ **Navbar overlapping content** - Reduced height and added blur effect  
✅ **Financial storyteller persona** - Fixed different narratives structure  
✅ **CORS errors** - Configured Docker environment properly  
✅ **Chat messages not visible** - Added proper text colors  
✅ **Data structure mismatches** - Updated TypeScript types  

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for details.

---

## 📚 External Resources

- **Backend API Docs:** http://localhost:8000/docs (when running)
- **Next.js Documentation:** https://nextjs.org/docs
- **FastAPI Documentation:** https://fastapi.tiangolo.com
- **Docker Documentation:** https://docs.docker.com
- **Vercel Documentation:** https://vercel.com/docs

---

## 🆘 Getting Help

1. **Check Documentation:** Start with QUICK_START.md
2. **Run Verification:** `./setup/verify-setup.sh`
3. **Check Logs:**
   - Backend: `docker compose logs -f`
   - Frontend: Check terminal where `pnpm dev` is running
4. **Review Troubleshooting:** TROUBLESHOOTING.md has most common fixes

---

## 📦 File Summary

```
setup/
├── README.md                    ← You are here
├── QUICK_START.md               ← Start here for setup
├── TROUBLESHOOTING.md           ← All bug fixes
├── DEPLOYMENT.md                ← Production deployment
├── ARCHITECTURE_DIAGRAMS.md     ← System architecture
├── CODEBASE_ANALYSIS.md         ← Code documentation
├── FRONTEND_SPECIFICATION.md    ← Frontend requirements
├── quick-start.sh               ← Automated setup
├── verify-setup.sh              ← Verify installation
├── start-frontend.sh            ← Start frontend
├── test_api.sh                  ← Test API
├── setup-ngrok.sh               ← Setup ngrok tunnel
└── temp_api_upload.csv          ← Sample data
```

---

## 💡 Tips

- Always start with QUICK_START.md
- Use Docker for easiest setup
- Run verify-setup.sh after any configuration changes
- Check TROUBLESHOOTING.md before asking for help
- Sample data file is great for testing features
- All scripts have detailed comments inside

---

**Happy Coding! 🚀**
