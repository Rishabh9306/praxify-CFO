# 🚀 Praxifi CFO - Complete Setup Guide

This guide will help you set up and run both the backend (AI/ML engine) and frontend (Next.js) of the Praxifi CFO application.

## 📁 Project Structure

```
/home/draxxy/praxifi/
├── praxifi-CFO/          # Backend (Python FastAPI + AI/ML)
├── praxifi-frontend/     # Frontend (Next.js + React)
└── SETUP_GUIDE.md        # This file
```

## ✅ Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **pnpm** (for frontend package management)
- **Redis** (for conversational memory - runs via Docker)
- **Docker & Docker Compose** (recommended for backend deployment)

---

## 🔧 Backend Setup (praxifi-CFO)

### Option 1: Docker (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd /home/draxxy/praxifi/praxifi-CFO
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file and add your Google API key:**
   ```bash
   # Required: Add your Google Gemini API key
   GOOGLE_API_KEY=your_actual_api_key_here
   
   # Optional: Customize ports
   API_PORT=8000
   REDIS_PORT=6380
   ```

4. **Start services with Docker Compose:**
   ```bash
   docker compose up -d
   ```

5. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/
   ```
   
   Expected response:
   ```json
   {
     "message": "Welcome to the Agentic CFO Copilot API",
     "documentation": "/docs"
   }
   ```

6. **View API documentation:**
   - Open browser: http://localhost:8000/docs

### Option 2: Local Python Environment

1. **Navigate to backend directory:**
   ```bash
   cd /home/draxxy/praxifi/praxifi-CFO
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env and add GOOGLE_API_KEY
   ```

5. **Start Redis (required for memory):**
   ```bash
   docker run -d -p 6380:6379 --name praxifi-redis redis:7-alpine
   ```

6. **Run the API server:**
   ```bash
   uvicorn aiml_engine.api.app:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 🎨 Frontend Setup (praxifi-frontend)

1. **Navigate to frontend directory:**
   ```bash
   cd /home/draxxy/praxifi/praxifi-frontend
   ```

2. **Verify `.env.local` exists and is configured:**
   ```bash
   cat .env.local
   ```
   
   Should contain:
   ```bash
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Install dependencies (if not already done):**
   ```bash
   pnpm install
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

5. **Access the application:**
   - Open browser: http://localhost:3000

---

## 🔍 Configuration Check

### Backend Configuration (`/home/draxxy/praxifi/praxifi-CFO/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ Yes | - | Google Gemini API key for AI agent |
| `API_PORT` | No | 8000 | Backend API port |
| `REDIS_HOST` | No | redis | Redis hostname (use `localhost` if not using Docker) |
| `REDIS_PORT` | No | 6379 | Redis internal port |
| `ENV` | No | production | Environment: development/staging/production |
| `LOG_LEVEL` | No | info | Logging level: debug/info/warning/error |

### Frontend Configuration (`/home/draxxy/praxifi/praxifi-frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | http://localhost:8000 | Backend API endpoint |

---

## 🧪 Testing the Integration

### 1. Test Backend Health

```bash
curl http://localhost:8000/
```

### 2. Test Frontend Connection

Navigate to: http://localhost:3000/api-test

This page will:
- ✅ Check if `NEXT_PUBLIC_API_URL` is set
- ✅ Test connection to backend root endpoint
- ✅ Test API endpoints with sample data

### 3. Test Full Pipeline

1. Go to **Upload page**: http://localhost:3000/upload
2. Upload a sample financial CSV file
3. Select persona (Finance Guardian or Financial Storyteller)
4. Select metric (revenue, profit, etc.)
5. Click "Analyze"
6. View insights on the dashboard

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'aiml_engine'`
- **Solution:** Make sure you're in the virtual environment and installed requirements.txt

**Problem:** `Connection refused to Redis`
- **Solution:** 
  - If using Docker: `docker compose up -d`
  - If local: `docker run -d -p 6380:6379 redis:7-alpine`
  - Update `REDIS_HOST` in `.env` to `localhost` if not using Docker Compose

**Problem:** `GOOGLE_API_KEY not set`
- **Solution:** Add your API key to `.env` file in backend directory

### Frontend Issues

**Problem:** `NEXT_PUBLIC_API_URL is UNDEFINED`
- **Solution:** 
  1. Create `.env.local` file in `/home/draxxy/praxifi/praxifi-frontend/`
  2. Add: `NEXT_PUBLIC_API_URL=http://localhost:8000`
  3. Restart dev server: `pnpm dev`

**Problem:** `Cannot connect to backend`
- **Solution:** 
  1. Verify backend is running: `curl http://localhost:8000/`
  2. Check CORS settings (should be enabled by default)
  3. Verify port 8000 is not blocked by firewall

**Problem:** `node_modules not found` or dependency errors
- **Solution:** Run `pnpm install` in frontend directory

---

## 📊 Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check & welcome message |
| `/docs` | GET | Interactive API documentation (Swagger) |
| `/api/full_report` | POST | Generate complete financial analysis |
| `/api/agent/analyze_and_respond` | POST | Conversational AI analysis |
| `/api/simulate` | POST | Scenario simulation (what-if analysis) |
| `/api/conversation/clear_memory` | POST | Clear conversation history |

---

## 🚀 Quick Start Commands

### Start Everything (Docker)

```bash
# Terminal 1: Start backend with Docker
cd /home/draxxy/praxifi/praxifi-CFO
docker compose up -d

# Terminal 2: Start frontend
cd /home/draxxy/praxifi/praxifi-frontend
pnpm dev
```

### Start Everything (Local Development)

```bash
# Terminal 1: Start Redis
docker run -d -p 6380:6379 --name praxifi-redis redis:7-alpine

# Terminal 2: Start backend
cd /home/draxxy/praxifi/praxifi-CFO
source venv/bin/activate
uvicorn aiml_engine.api.app:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Start frontend
cd /home/draxxy/praxifi/praxifi-frontend
pnpm dev
```

### Stop Everything

```bash
# Stop Docker services
cd /home/draxxy/praxifi/praxifi-CFO
docker compose down

# Stop Redis (if running standalone)
docker stop praxifi-redis
docker rm praxifi-redis

# Stop dev servers: Press Ctrl+C in their terminal windows
```

---

## 🎯 Next Steps

1. ✅ **Backend running** on http://localhost:8000
2. ✅ **Frontend running** on http://localhost:3000
3. 📝 Upload sample financial data
4. 🤖 Test the AI agent with questions
5. 📊 Explore scenario simulations
6. 🔒 Review security settings (optional)

---

## 📚 Additional Resources

- **Backend README**: `/home/draxxy/praxifi/praxifi-CFO/README.md`
- **Frontend README**: `/home/draxxy/praxifi/praxifi-frontend/README.md`
- **API Documentation**: http://localhost:8000/docs (when backend is running)
- **Security Architecture**: `/home/draxxy/praxifi/praxifi-CFO/SECURITY_ARCHITECTURE.md`

---

## ⚠️ Important Notes

1. **Google API Key Required**: The backend will not work without a valid Google Gemini API key
2. **Redis Required**: Conversational memory requires Redis to be running
3. **CORS**: Backend is configured to allow frontend connections from localhost:3000
4. **Port Conflicts**: Ensure ports 8000 (backend) and 3000 (frontend) are available
5. **Environment Variables**: Frontend needs `NEXT_PUBLIC_API_URL` to be set before build

---

**Status**: ✅ Configuration Complete | Ready to run!
