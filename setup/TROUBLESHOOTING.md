# 🔧 Troubleshooting Guide

**Last Updated:** October 18, 2025

This guide consolidates all bug fixes and solutions discovered during development.

---

## 🐛 Fixed Issues Archive

### 1. CORS Errors - "Failed to Fetch"

**Problem:** Frontend couldn't connect to backend API due to CORS policy.

**Solution:**
1. Updated `docker-compose.yml` to pass CORS_ORIGINS environment variable:
   ```yaml
   environment:
     - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000,http://127.0.0.1:3000}
   ```

2. Updated `.env` file:
   ```bash
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://praxify-cfo.vercel.app
   ```

3. Modified `aiml_engine/api/app.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Development only
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

**Files Changed:**
- `/home/draxxy/praxify-CFO/docker-compose.yml`
- `/home/draxxy/praxify-CFO/.env`
- `/home/draxxy/praxify-CFO/aiml_engine/api/app.py`

---

### 2. Data Structure Mismatches

**Problem:** Frontend expected different JSON structures than backend provided.

**Fixed Structures:**

#### forecast_chart
**Before:** `{dates: [], actual: [], forecast: []}`  
**After:** Array of `{date, predicted, lower, upper}`

#### profit_drivers
**Before:** Simple array  
**After:** `{insight, feature_attributions[], model_version}`

#### narratives (Persona-Dependent)
- `finance_guardian`: `{summary_text, recommendations[]}`
- `financial_storyteller`: `{narrative}`

#### raw_data_preview
**Before:** `{columns: [], rows: []}`  
**After:** `Array<Record<string, any>>`

**Files Changed:**
- `/home/draxxy/praxify-CFO/praxify-frontend/lib/types.ts`
- `/home/draxxy/praxify-CFO/praxify-frontend/app/insights/page.tsx`
- `/home/draxxy/praxify-CFO/praxify-frontend/app/chat/page.tsx`

---

### 3. Financial Storyteller Persona Not Working

**Problem:** `financial_storyteller` persona crashed the frontend.

**Root Cause:** Narratives structure differs between personas.

**Solution:**
1. Updated `Narrative` type to union type:
   ```typescript
   export type Narrative = 
     | { summary_text: string; recommendations: string[] }
     | { narrative: string };
   ```

2. Added conditional rendering in insights page:
   ```tsx
   {'narrative' in fullReportData.narratives && (
     <p>{fullReportData.narratives.narrative}</p>
   )}
   
   {'summary_text' in fullReportData.narratives && (
     <>
       <p>{fullReportData.narratives.summary_text}</p>
       <ul>{fullReportData.narratives.recommendations.map(...)}</ul>
     </>
   )}
   ```

**Files Changed:**
- `/home/draxxy/praxify-CFO/praxify-frontend/lib/types.ts`
- `/home/draxxy/praxify-CFO/praxify-frontend/app/insights/page.tsx`

---

### 4. Chat Messages Not Visible

**Problem:** Chat messages had black text on dark background.

**Solutions:**
1. Added `text-foreground` class to messages
2. Fixed conversation_history format conversion
3. Changed message append logic (don't replace all messages)

**Files Changed:**
- `/home/draxxy/praxify-CFO/praxify-frontend/app/chat/page.tsx`
- `/home/draxxy/praxify-CFO/praxify-frontend/app/mvp/ai-agent/page.tsx`

---

### 5. Charts Invisible in Dark Mode

**Problem:** Chart lines and axes were black on black background.

**Root Cause:** Charts used `hsl(var(--foreground))` which resolved to dark colors.

**Solution:**
1. Replaced all chart colors with CSS variables:
   - `hsl(var(--foreground))` → `var(--color-foreground)`
   - `hsl(var(--primary))` → `var(--color-primary)`
   - `hsl(var(--border))` → `var(--color-border)`

2. Added color to Tooltip contentStyle:
   ```tsx
   contentStyle={{
     backgroundColor: 'var(--color-background)',
     border: '1px solid var(--color-border)',
     color: 'var(--color-foreground)'  // ← Added this
   }}
   ```

3. Updated `styles/globals.css` dark theme:
   ```css
   .dark {
     --color-primary: oklch(0.985 0 0);  /* Bright white */
     --color-foreground: oklch(0.985 0 0);  /* Bright white */
   }
   ```

**Files Changed:**
- `/home/draxxy/praxify-CFO/praxify-frontend/app/performance/page.tsx`
- `/home/draxxy/praxify-CFO/praxify-frontend/app/insights/page.tsx`
- `/home/draxxy/praxify-CFO/praxify-frontend/app/chat/page.tsx`
- `/home/draxxy/praxify-CFO/praxify-frontend/styles/globals.css`

---

### 6. Navbar Overlapping Content

**Problem:** Large navbar covered content when scrolling.

**Solutions:**
1. Reduced navbar height: `pt-8 md:pt-14` → `py-3 md:py-4`
2. Added scroll-based blur effect:
   ```tsx
   const [isScrolled, setIsScrolled] = useState(false);
   
   useEffect(() => {
     const handleScroll = () => {
       setIsScrolled(window.scrollY > 10);
     };
     window.addEventListener('scroll', handleScroll);
     return () => window.removeEventListener('scroll', handleScroll);
   }, []);
   ```

3. Applied backdrop blur when scrolled:
   ```tsx
   className={`... ${isScrolled ? 'backdrop-blur-lg bg-background/80 shadow-md' : ''}`}
   ```

4. Adjusted page padding from `pt-32` to `pt-20` across all pages

**Files Changed:**
- `/home/draxxy/praxify-CFO/praxify-frontend/components/header.tsx`
- All page files (insights, chat, performance, etc.)

---

### 7. AI Agent "Unprocessable Entity" Error

**Problem:** AI agent endpoint rejected requests with 422 error.

**Root Cause:** Sending unsupported parameters (`persona`, `forecast_metric`).

**Solution:**
1. Removed unsupported parameters from agent calls
2. Added file validation before API calls
3. Updated user-facing error messages

**Files Changed:**
- `/home/draxxy/praxify-CFO/praxify-frontend/app/mvp/ai-agent/page.tsx`

---

### 8. Docker Container Not Reloading Environment

**Problem:** Changes to `.env` file weren't reflected in running container.

**Solution:**
1. Stop containers: `docker compose down`
2. Rebuild: `docker compose build --no-cache`
3. Start: `docker compose up -d`

**Better approach:** Pass env vars in docker-compose.yml:
```yaml
environment:
  - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000}
```

---

## 🔍 Debugging Tips

### Check Backend Health
```bash
curl http://localhost:8000/health
```

### Check CORS Headers
```bash
curl -I -X OPTIONS http://localhost:8000/api/full_report \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

### View Docker Logs
```bash
docker compose logs -f aiml-engine
```

### Check Redis Connection
```bash
redis-cli -h localhost -p 6379 ping
# Should return: PONG
```

### Test API with Sample Data
```bash
curl -X POST http://localhost:8000/api/full_report \
  -F "file=@setup/temp_api_upload.csv" \
  -F "persona=finance_guardian" \
  -F "metric_names=Revenue" | jq
```

---

## 🚨 Common Error Messages

### "Failed to fetch"
- **Cause:** CORS or backend not running
- **Fix:** Check CORS_ORIGINS in .env, restart Docker

### "Cannot read properties of undefined (reading 'map')"
- **Cause:** Data structure mismatch
- **Fix:** Check backend response format matches TypeScript types

### "Redis connection refused"
- **Cause:** Redis not running
- **Fix:** Start Redis or check REDIS_HOST/REDIS_PORT

### "Port already in use"
- **Cause:** Another process using port 8000 or 3000
- **Fix:** `lsof -i :8000` and `kill -9 <PID>`

### Chart/Graph not visible
- **Cause:** Dark mode color issues
- **Fix:** Already fixed - use `var(--color-*)` CSS variables

---

## 📝 Development Notes

### Type Definitions Location
All TypeScript interfaces are in: `/home/draxxy/praxify-CFO/praxify-frontend/lib/types.ts`

### API Endpoints
- `/api/full_report` - Generate complete financial report
- `/api/agent/analyze_and_respond` - AI chat interaction
- `/api/simulate` - Run what-if simulations
- `/health` - Health check

### Persona Types
- `finance_guardian` - Data-focused analysis
- `financial_storyteller` - Narrative-focused reports

### Metric Names
Available metrics: `Revenue`, `Expenses`, `Profit`, `Cash_Flow`, `Debt`, `Assets`

---

## 🔄 Recent Changes Log

**October 18, 2025:**
- ✅ Fixed navbar height and added blur effect
- ✅ Adjusted page padding across all pages
- ✅ Consolidated setup folder (36 → 13 files)
- ✅ Created comprehensive documentation structure

**October 17, 2025:**
- ✅ Fixed chart visibility in dark mode
- ✅ Updated all chart components to use CSS variables

**October 16, 2025:**
- ✅ Fixed CORS configuration
- ✅ Fixed data structure mismatches
- ✅ Fixed financial_storyteller persona
- ✅ Fixed chat message visibility
- ✅ Consolidated documentation
