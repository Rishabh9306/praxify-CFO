# Praxifi CFO - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Step 2: Prepare Your Data

Create a CSV file with your financial data. Example format:

```csv
date,revenue,expenses,profit
2024-01-01,100000,70000,30000
2024-02-01,110000,72000,38000
2024-03-01,105000,68000,37000
```

### Step 3: Upload and Analyze

1. Navigate to `/upload`
2. Drag and drop your CSV file
3. Select your preferences:
   - **Persona**: Finance Guardian (conservative) or Financial Storyteller (narrative)
   - **Forecast Metric**: Revenue, Expenses, Profit, or Cash Flow
4. Choose your experience:
   - **Generate Static Report** → Go to `/insights` for comprehensive dashboard
   - **Launch AI Chat** → Go to `/chat` for interactive analysis

### Step 4: Explore Features

- **View Insights**: See KPIs, forecasts, anomalies, and narratives
- **Chat with AI**: Ask questions about your data
- **Simulate Scenarios**: Test what-if changes
- **Review History**: Access past sessions in `/reports`

## 🔌 Backend Setup (Required)

The frontend expects a backend API with these endpoints:

### 1. Full Report Endpoint
```
POST /api/full_report
Content-Type: multipart/form-data

Parameters:
- file: CSV file
- persona: 'finance_guardian' | 'financial_storyteller'
- forecast_metric: 'revenue' | 'expenses' | 'profit' | 'cash_flow'

Response: FullReportResponse (see lib/types.ts)
```

### 2. AI Agent Endpoint
```
POST /api/agent/analyze_and_respond
Content-Type: multipart/form-data

Parameters:
- file: CSV file
- persona: string
- forecast_metric: string
- user_query: string
- session_id: string (optional, for continuation)

Response: AgentAnalyzeResponse (see lib/types.ts)
```

### 3. Simulation Endpoint
```
POST /api/simulate
Content-Type: multipart/form-data

Parameters:
- file: CSV file
- persona: string
- forecast_metric: string
- parameter: string (e.g., 'revenue')
- change_percent: number

Response: SimulationResult (see lib/types.ts)
```

## 📝 Example Backend (Python FastAPI)

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/full_report")
async def full_report(
    file: UploadFile = File(...),
    persona: str = Form(...),
    forecast_metric: str = Form(...)
):
    # Process file and return analysis
    return {
        "kpis": {...},
        "forecast_chart": {...},
        "anomalies": [...],
        "profit_drivers": [...],
        "narratives": [...]
    }

@app.post("/api/agent/analyze_and_respond")
async def agent_analyze(
    file: UploadFile = File(...),
    persona: str = Form(...),
    forecast_metric: str = Form(...),
    user_query: str = Form(...),
    session_id: str = Form(None)
):
    # Process with AI agent
    return {
        "session_id": "...",
        "user_query": "...",
        "ai_response": "...",
        "full_analysis_report": {...},
        "conversation_history": [...]
    }

@app.post("/api/simulate")
async def simulate(
    file: UploadFile = File(...),
    persona: str = Form(...),
    forecast_metric: str = Form(...),
    parameter: str = Form(...),
    change_percent: float = Form(...)
):
    # Run simulation
    return {
        "baseline": {...},
        "simulation_results": {...},
        "summary_text": "...",
        "parameter_changed": "...",
        "change_percent": ...
    }
```

## 🎯 Common Use Cases

### 1. Monthly Board Report
1. Upload monthly financial CSV
2. Select "Financial Storyteller" persona
3. Generate Static Report
4. Present `/insights` dashboard in meeting

### 2. Deep Dive Analysis
1. Upload data
2. Select "Finance Guardian" persona
3. Launch AI Chat
4. Ask specific questions about trends, risks, anomalies

### 3. Budget Planning
1. Upload current data
2. Go to `/simulate`
3. Test different scenarios (e.g., +10% revenue, -5% expenses)
4. Compare outcomes

### 4. Historical Review
1. Go to `/reports`
2. Browse past sessions
3. Export relevant analyses
4. Resume interesting conversations

## 🐛 Troubleshooting

**Problem**: API not found
- **Solution**: Ensure backend is running on expected port (default: 8000)
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Problem**: Charts not displaying
- **Solution**: Verify recharts is installed: `pnpm add recharts`

**Problem**: Session lost after refresh
- **Solution**: Check browser localStorage is enabled
- Session data persists in localStorage by design

**Problem**: File upload fails
- **Solution**: Verify CSV format matches expected structure
- Check file size (browser limits may apply)

## 📚 Next Steps

1. Read the full documentation in `/about`
2. Review API types in `lib/types.ts`
3. Customize themes in `/settings`
4. Set up your backend API
5. Deploy to production (Vercel recommended)

## 🎨 Customization

### Change Color Theme
Edit `app/globals.css` to modify the color palette:
```css
:root {
  --primary: 45 93% 47%; /* Golden yellow */
}
```

### Add New Features
1. Create new page in `app/[feature]/page.tsx`
2. Add route to navigation in `components/header.tsx`
3. Update context if needed in `lib/app-context.tsx`

## 🔐 Production Deployment

### Environment Setup
```env
NEXT_PUBLIC_API_URL=https://your-api.com
GOOGLE_GEMINI_API_KEY=your_production_key
```

### Security Checklist
- [ ] Enable HTTPS only
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Secure API keys on backend
- [ ] Set up CORS properly
- [ ] Enable CSP headers
- [ ] Add input validation
- [ ] Implement session timeout

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

**Need Help?** Contact support@praxifi.com or open an issue on GitHub
