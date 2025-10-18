# 🚀 Praxify CFO - Quick Start Guide

**Last Updated:** October 18, 2025

## Prerequisites

- Node.js 18+ and pnpm installed
- Docker and Docker Compose installed
- Python 3.11+ (if running backend locally without Docker)
- Redis (if running backend locally without Docker)

---

## 🎯 Quick Start (Recommended Setup)

### Option 1: Full Docker Setup (Easiest)

```bash
# 1. Clone and navigate to project
cd /home/draxxy/praxify-CFO

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY (optional)

# 3. Start backend with Docker
docker compose up -d

# 4. Start frontend
cd praxify-frontend
pnpm install
pnpm dev
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Option 2: Local Development (Backend + Frontend)

#### Backend Setup

```bash
# 1. Start Redis
redis-server --port 6379

# 2. Install Python dependencies
cd aiml_engine
pip install -r ../requirements.txt

# 3. Set environment variables
export REDIS_HOST=localhost
export REDIS_PORT=6379
export GOOGLE_API_KEY=your_key_here  # Optional

# 4. Start backend
python -m api.app
```

#### Frontend Setup

```bash
# 1. Navigate to frontend
cd praxify-frontend

# 2. Install dependencies
pnpm install

# 3. Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 4. Start development server
pnpm dev
```

---

## 📋 Environment Variables

### Backend (.env)
```bash
REDIS_HOST=redis              # Use 'redis' for Docker, 'localhost' for local
REDIS_PORT=6379
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GOOGLE_API_KEY=               # Optional - for Gemini AI features
ENVIRONMENT=development
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing the Setup

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Upload and analyze a file
curl -X POST http://localhost:8000/api/full_report \
  -F "file=@setup/temp_api_upload.csv" \
  -F "persona=finance_guardian" \
  -F "metric_names=Revenue"
```

### Test Frontend

1. Open http://localhost:3000
2. Navigate to MVP → Upload page
3. Upload a CSV file
4. Select persona and metric
5. Generate report

---

## 🛠️ Useful Scripts

Located in `setup/` folder:

```bash
# Quick start everything
./setup/quick-start.sh

# Verify setup is correct
./setup/verify-setup.sh

# Start frontend only
./setup/start-frontend.sh

# Test API connectivity
./setup/test_api.sh
```

---

## 📦 Docker Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up -d --build

# Remove everything (including volumes)
docker compose down -v
```

---

## 🔧 Common Issues

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Redis Connection Failed
```bash
# Start Redis
redis-server --port 6379

# Or use Docker Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### Frontend Can't Reach Backend
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify CORS settings in `.env`
3. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

### Docker Build Issues
```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 📚 Project Structure

```
praxify-CFO/
├── aiml_engine/           # Backend FastAPI application
│   ├── api/              # API endpoints
│   ├── core/             # ML/AI logic
│   └── data/             # Sample data
├── praxify-frontend/      # Next.js 15 frontend
│   ├── app/              # App router pages
│   ├── components/       # Reusable components
│   └── lib/              # Utilities and types
├── setup/                # Setup scripts and guides
├── docker-compose.yml    # Docker configuration
└── requirements.txt      # Python dependencies
```

---

## 🎓 Next Steps

1. **Explore Features:**
   - Upload CSV files at `/upload`
   - Generate reports at `/mvp/static-report`
   - Chat with AI at `/mvp/ai-agent`
   - Run simulations at `/simulate`

2. **Read Documentation:**
   - See `setup/TROUBLESHOOTING.md` for fixes
   - See `setup/DEPLOYMENT.md` for production setup
   - API docs at http://localhost:8000/docs

3. **Deploy to Production:**
   - See `setup/DEPLOYMENT.md` for Vercel + ngrok setup

---

## 💡 Tips

- Use `finance_guardian` persona for detailed analysis
- Use `financial_storyteller` persona for narrative reports
- Charts are optimized for dark mode
- All features work offline (except Gemini AI)
- Redis is used for session management

---

## 🆘 Need Help?

- Check `setup/TROUBLESHOOTING.md` for common fixes
- Review API documentation at http://localhost:8000/docs
- Check Docker logs: `docker compose logs -f`
- Verify setup: `./setup/verify-setup.sh`
