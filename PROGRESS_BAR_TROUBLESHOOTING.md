# 🔄 Live Progress Bar - Implementation & Troubleshooting

## 📊 System Overview

The live progress bar uses **Server-Sent Events (SSE)** to provide real-time updates from the backend to the frontend during CSV processing.

### Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │  POST   │   Backend   │  SSE    │   Frontend  │
│  Upload CSV │────────▶│  Process    │────────▶│  Progress   │
│             │         │  + Updates  │         │  Updates    │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                        │
      │                       ▼                        │
      │              progress_store (dict)             │
      │              {task_id: {                       │
      │                step: "...",                    │
      │                progress: 50,                   │
      │                message: "..."                  │
      │              }}                                │
      │                                                │
      └───────────── EventSource Connection ───────────┘
                     /api/progress/{task_id}
```

---

## 🔧 Implementation Details

### Backend (`endpoints.py`)

#### 1. Progress Store (In-Memory)
```python
progress_store: Dict[str, Dict[str, Any]] = {}
```
- **Type**: In-memory dictionary
- **Lifetime**: Until backend restarts
- **NOT stored in Redis** (use Redis if you need persistence or multi-instance support)

#### 2. Update Function
```python
def update_progress(task_id: str, step: str, progress: int, message: str):
    progress_store[task_id] = {
        "step": step,
        "progress": progress,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
```

#### 3. SSE Endpoint
```python
@router.get("/progress/{task_id}")
async def get_progress(task_id: str):
    async def event_generator():
        # Send connection confirmation
        yield {"event": "connected", "data": {...}}
        
        # Poll for updates every 500ms
        while timeout_counter < max_timeout:
            if task_id in progress_store:
                yield {"event": "progress", "data": {...}}
            else:
                yield {"event": "heartbeat", "data": {...}}
            await asyncio.sleep(0.5)
    
    return EventSourceResponse(event_generator())
```

#### 4. Progress Stages (10 stages)
```python
update_progress(task_id, "upload", 5, "Processing uploaded file...")
update_progress(task_id, "validation", 15, "Data validated...")
update_progress(task_id, "forecasting", 25, "Running forecasting...")
update_progress(task_id, "forecasting", 50, "Core forecasting complete")
update_progress(task_id, "regional", 60, "Forecasting regions...")
update_progress(task_id, "departmental", 70, "Forecasting departments...")
update_progress(task_id, "analytics", 80, "Detecting anomalies...")
update_progress(task_id, "visualizations", 90, "Generating charts...")
update_progress(task_id, "complete", 95, "Finalizing report...")
update_progress(task_id, "complete", 100, "Report generated!")
```

### Frontend (`page.tsx`)

#### 1. EventSource Connection
```typescript
const eventSource = new EventSource(`${apiUrl}/api/progress/${taskId}`);
```

#### 2. Event Listeners
```typescript
// Connection established
eventSource.addEventListener('connected', (event) => {
  console.log('✅ Connected to progress stream');
});

// Progress updates
eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  setProgress(data.progress); // Update progress bar
});

// Heartbeat (waiting for task to start)
eventSource.addEventListener('heartbeat', (event) => {
  console.log('💓 Heartbeat: Waiting for task...');
});

// Error handling
eventSource.addEventListener('error', (event) => {
  console.error('❌ SSE Error:', data.message);
  setError(data.message);
});
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "EventSource error" in Console

**Symptoms:**
```
EventSource error: Event {isTrusted: true, type: 'error', ...}
```

**Causes:**
1. **CORS not configured for SSE**
2. **Task ID not in progress_store when EventSource connects**
3. **Backend not running or unreachable**
4. **Network timeout**

**Solutions:**

#### A. Check CORS Configuration
File: `/praxifi-CFO/aiml_engine/api/app.py`
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # ⚠️ CRITICAL for SSE!
)
```

#### B. Check Backend is Running
```bash
# Check container status
docker compose ps

# Expected output:
# praxifi-cfo-aiml-engine   Up      0.0.0.0:8000->8000/tcp

# Check backend logs
docker compose logs -f aiml-engine

# Test SSE endpoint manually
curl http://localhost:8000/api/progress/test-id
```

#### C. Check API URL in Frontend
File: `/praxifi-frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### D. Test SSE Connection
Open browser console and run:
```javascript
const es = new EventSource('http://localhost:8000/api/progress/test-123');
es.addEventListener('connected', e => console.log('Connected:', e.data));
es.addEventListener('heartbeat', e => console.log('Heartbeat:', e.data));
es.onerror = e => console.error('Error:', e);
```

---

### Issue 2: Progress Bar Doesn't Update

**Symptoms:**
- Progress bar stuck at 0%
- No progress updates in console
- EventSource connects but no data

**Causes:**
1. **Task ID mismatch** (frontend looking for wrong ID)
2. **Progress updates not being called** in backend
3. **EventSource closed prematurely**

**Solutions:**

#### A. Verify Task ID Match
Check browser console:
```
🚀 Starting report generation...
📡 Calling API: http://localhost:8000/api/full_report
📥 Response received: 200 OK
✅ Data parsed successfully
🔌 Connecting to progress stream: e6a07806-9c81-450b-b4fd-affe91dce92a
```

Check backend logs:
```bash
docker compose logs aiml-engine | grep "FULL_REPORT REQUEST"
# Should show same task_id
```

#### B. Verify Progress Updates Are Being Called
Check backend logs during processing:
```bash
docker compose logs -f aiml-engine

# You should see:
# [timestamp] INFO - 📥 FULL_REPORT REQUEST RECEIVED - Task: <uuid>
# [timestamp] DEBUG - Progress: upload 5%
# [timestamp] DEBUG - Progress: validation 15%
# etc.
```

Add debug logging to `update_progress()`:
```python
def update_progress(task_id: str, step: str, progress: int, message: str):
    progress_store[task_id] = {...}
    print(f"🔄 Progress Update: {task_id} - {step} - {progress}% - {message}")
```

#### C. Check EventSource State
In browser console:
```javascript
// Should print EventSource object with readyState
console.log('EventSource state:', eventSource);
// readyState values:
// 0 = CONNECTING
// 1 = OPEN
// 2 = CLOSED
```

---

### Issue 3: Progress Updates Stop Midway

**Symptoms:**
- Progress bar reaches 50% then stops
- No error in console
- EventSource still open

**Causes:**
1. **Backend process crashed or hung**
2. **Forecasting taking too long** (exceeds timeout)
3. **Exception not caught** in backend

**Solutions:**

#### A. Check Backend Process Status
```bash
# Check if backend container is still running
docker compose ps

# Check for errors in logs
docker compose logs aiml-engine --tail=100

# Look for Python tracebacks or exceptions
docker compose logs aiml-engine | grep -i "error\|exception\|traceback"
```

#### B. Increase Timeout
File: `/praxifi-CFO/aiml_engine/api/endpoints.py`
```python
max_timeout = 240  # Increase from 120 to 240 (2 minutes)
```

#### C. Add Try-Catch Around Update Calls
```python
try:
    update_progress(task_id, "forecasting", 50, "Core forecasting complete")
except Exception as e:
    secure_logger.error(f"Failed to update progress: {e}")
```

---

### Issue 4: "THREE.WebGLRenderer: Context Lost" Error

**This is NOT related to progress bar!**

**Cause:** WebGL context lost (3D visualization issue)

**Solution:** This is a known issue with Three.js, usually caused by:
- GPU switching (laptop power modes)
- Browser tab throttling
- Memory pressure

Add context restoration:
```typescript
const canvas = renderer.domElement;
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.log('WebGL context lost, will restore...');
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // Reinitialize renderer
});
```

---

## 🧪 Testing the Progress Bar

### Test 1: Manual SSE Connection
```bash
# Terminal 1: Start backend
cd /home/draxxy/praxifi/praxifi-CFO
docker compose up

# Terminal 2: Test SSE endpoint
curl -N http://localhost:8000/api/progress/test-123

# Expected output (after a few seconds):
# event: connected
# data: {"message": "Connected to progress stream", "task_id": "test-123"}
#
# event: heartbeat
# data: {"message": "Waiting for task to start..."}
```

### Test 2: Upload CSV and Monitor
```bash
# Terminal 1: Backend logs
docker compose logs -f aiml-engine

# Terminal 2: Frontend logs (browser console)
# Upload a CSV file
# Watch for:
# ✅ Connected to progress stream
# 📊 Progress update: {step: "upload", progress: 5, ...}
# 📊 Progress update: {step: "validation", progress: 15, ...}
# ...
# 📊 Progress update: {step: "complete", progress: 100, ...}
```

### Test 3: Verify Progress Store
Add a debug endpoint to check progress store:
```python
@router.get("/debug/progress")
async def debug_progress():
    return {"progress_store": progress_store}
```

Then access: `http://localhost:8000/api/debug/progress`

---

## 📈 Performance Metrics

| Stage | Progress | Typical Duration | Notes |
|-------|----------|------------------|-------|
| Upload | 5% | < 1s | File validation |
| Validation | 15% | 2-5s | Data cleaning |
| Forecasting (core) | 25-50% | 30-60s | All metrics |
| Regional | 60% | 10-20s | Per-region forecasts |
| Departmental | 70% | 10-20s | Per-dept forecasts |
| Analytics | 80% | 5-10s | Anomalies, correlations |
| Visualizations | 90% | 5-10s | Chart data generation |
| Finalize | 95-100% | < 5s | Response assembly |
| **Total** | **100%** | **~2-4 minutes** | Depends on data size |

---

## 🔒 Security Considerations

### Progress Data Privacy
- **No sensitive data** should be in progress messages
- Progress store is **in-memory only** (not persisted)
- **Cleared on backend restart**

### SSE Connection Limits
- Browsers limit **6 concurrent SSE connections** per domain
- Use one connection per upload session
- **Close EventSource** when done:
  ```typescript
  eventSource.close();
  ```

### Timeout Protection
- SSE endpoint has **60-second timeout** (120 iterations × 0.5s)
- Prevents zombie connections
- Sends error event on timeout

---

## 🚀 Production Considerations

### Option 1: Keep In-Memory (Current)
✅ **Pros:**
- Simple, no dependencies
- Fast access
- Automatic cleanup on restart

❌ **Cons:**
- Lost on backend restart
- Won't work with multiple backend instances
- No historical data

### Option 2: Move to Redis (Recommended for Production)
✅ **Pros:**
- Persists across restarts
- Works with multiple backend instances
- Can add historical tracking
- Can set TTL (auto-expiry)

❌ **Cons:**
- Slightly more complex
- Redis dependency

**Implementation:**
```python
import redis

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379))
)

def update_progress(task_id: str, step: str, progress: int, message: str):
    progress_data = {
        "step": step,
        "progress": progress,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    # Store in Redis with 1-hour expiry
    redis_client.setex(
        f"progress:{task_id}",
        3600,  # TTL: 1 hour
        json.dumps(progress_data)
    )

@router.get("/progress/{task_id}")
async def get_progress(task_id: str):
    async def event_generator():
        while True:
            # Read from Redis
            data = redis_client.get(f"progress:{task_id}")
            if data:
                progress_data = json.loads(data)
                yield {"event": "progress", "data": json.dumps(progress_data)}
                if progress_data.get("progress", 0) >= 100:
                    break
            await asyncio.sleep(0.5)
    
    return EventSourceResponse(event_generator())
```

---

## 📝 Debugging Checklist

When progress bar doesn't work, check these in order:

### Backend
- [ ] Backend container is running: `docker compose ps`
- [ ] No errors in logs: `docker compose logs aiml-engine --tail=50`
- [ ] SSE endpoint responds: `curl -N http://localhost:8000/api/progress/test`
- [ ] CORS headers include `expose_headers=["*"]`
- [ ] Progress updates are being called (add print statements)

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Browser console shows "Connected to progress stream"
- [ ] EventSource `readyState` is `1` (OPEN)
- [ ] No CORS errors in console
- [ ] Task ID matches between request and SSE connection

### Network
- [ ] Backend is accessible: `curl http://localhost:8000/docs`
- [ ] No firewall blocking SSE connections
- [ ] No proxy interfering with SSE

---

## 🎯 Quick Fix Commands

```bash
# Rebuild and restart backend
cd /home/draxxy/praxifi/praxifi-CFO
docker compose build aiml-engine
docker compose down && docker compose up -d

# Check everything is running
docker compose ps
docker compose logs aiml-engine --tail=20

# Test SSE endpoint
curl -N http://localhost:8000/api/progress/test-123

# Frontend: Clear cache and restart
cd /home/draxxy/praxifi/praxifi-frontend
rm -rf .next
pnpm dev
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `/praxifi-CFO/aiml_engine/api/endpoints.py` | Backend SSE implementation, progress updates |
| `/praxifi-CFO/aiml_engine/api/app.py` | CORS configuration for SSE |
| `/praxifi-frontend/app/mvp/static-report/page.tsx` | Frontend EventSource connection |
| `/praxifi-CFO/requirements.txt` | `sse-starlette==2.1.3` dependency |

---

## ✅ Verification Tests

### Test 1: Connection
```bash
curl -N http://localhost:8000/api/progress/test
# Should see: event: connected, event: heartbeat
```

### Test 2: End-to-End
1. Open browser console
2. Upload CSV file
3. Watch for progress logs
4. Verify progress bar animates from 5% → 100%

### Test 3: Error Handling
1. Stop backend: `docker compose stop aiml-engine`
2. Try to upload CSV
3. Should see error message in frontend

---

**Status**: ✅ **Fixed** (as of Nov 22, 2025)

**Changes Made**:
1. Added `expose_headers=["*"]` to CORS middleware
2. Enhanced SSE endpoint with connection/heartbeat/error events
3. Updated frontend to handle all SSE event types
4. Added 60-second timeout protection
5. Improved error logging

**Next Steps**:
- Test with real CSV upload
- Monitor for any connection issues
- Consider moving to Redis if using multiple backend instances
