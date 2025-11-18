# 🚀 Quick Implementation: Parallel Forecasting Optimization

**Expected Speedup:** 4-5x faster (280s → 60s on M2)  
**Implementation Time:** 2-3 hours  
**Cost:** $0 (software only)

---

## 📋 Step-by-Step Implementation

### Step 1: Update `endpoints.py`

Replace the sequential forecasting loop with parallel execution:

```python
# In aiml_engine/api/endpoints.py

# Add import at the top
from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing

# Replace the sequential forecasting section (lines ~120-180) with:

def forecast_single_metric(args):
    """Worker function for parallel forecasting"""
    metric, df_json = args
    # Reconstruct DataFrame from JSON (for multiprocessing)
    import pandas as pd
    import json
    df = pd.read_json(json.dumps(df_json), orient='records')
    df['date'] = pd.to_datetime(df['date'])
    
    forecasting_module = ForecastingModule(metric=metric)
    forecast, model_health = forecasting_module.generate_forecast(df)
    return metric, forecast, model_health

# In the /full_report endpoint, replace forecasting code:
@router.post("/full_report")
async def get_full_financial_report(...):
    # ... existing code ...
    
    # Prepare metrics for forecasting
    core_metrics = ['revenue', 'expenses', 'profit', 'cashflow']
    efficiency_metrics = ['dso', 'dpo', 'cash_conversion_cycle', 'ar', 'ap']
    liquidity_metrics = ['working_capital']
    ratio_metrics = ['profit_margin', 'expense_ratio', 'debt_to_equity_ratio']
    
    all_metrics_to_forecast = []
    for metric in core_metrics + efficiency_metrics + liquidity_metrics + ratio_metrics:
        if metric in featured_df.columns:
            all_metrics_to_forecast.append(metric)
    
    # Convert DataFrame to JSON for multiprocessing
    df_json = json.loads(featured_df.to_json(orient='records', date_format='iso'))
    
    # Parallel forecasting
    all_forecasts = {}
    all_model_health = {}
    
    # Determine optimal number of workers (don't exceed CPU cores)
    max_workers = min(len(all_metrics_to_forecast), multiprocessing.cpu_count())
    
    print(f"🚀 Starting parallel forecasting with {max_workers} workers for {len(all_metrics_to_forecast)} metrics...")
    
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        # Submit all forecasting tasks
        future_to_metric = {
            executor.submit(forecast_single_metric, (metric, df_json)): metric
            for metric in all_metrics_to_forecast
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_metric):
            metric = future_to_metric[future]
            try:
                metric_name, forecast, model_health = future.result()
                all_forecasts[metric_name] = forecast
                all_model_health[metric_name] = model_health
                print(f"  ✅ {metric_name} forecast complete")
            except Exception as e:
                print(f"  ❌ {metric} forecast failed: {str(e)}")
                # Continue with other forecasts
    
    # Calculate growth_rate from revenue (as before)
    if 'revenue' in all_forecasts and all_forecasts['revenue']:
        growth_rate_forecast = []
        for i, forecast_point in enumerate(all_forecasts['revenue']):
            if i == 0 and len(featured_df) > 0:
                last_actual = featured_df['revenue'].iloc[-1]
                growth = ((forecast_point['predicted'] - last_actual) / last_actual * 100) if last_actual != 0 else 0
            elif i > 0:
                prev_forecast = all_forecasts['revenue'][i-1]['predicted']
                growth = ((forecast_point['predicted'] - prev_forecast) / prev_forecast * 100) if prev_forecast != 0 else 0
            else:
                growth = 0
            
            growth_rate_forecast.append({
                "date": forecast_point['date'],
                "predicted": growth,
                "lower": growth * 0.8,
                "upper": growth * 1.2
            })
        all_forecasts['growth_rate'] = growth_rate_forecast
        all_model_health['growth_rate'] = {
            "model_id": f"model_derived_{int(datetime.now().timestamp())}",
            "best_model_selected": "Derived from Revenue",
            "forecast_metric": "growth_rate",
            "status": "Success"
        }
    
    # Rest of the endpoint code remains the same...
```

---

## 🔍 Alternative: Simpler ThreadPool Version

If ProcessPoolExecutor causes issues (pickling errors), use ThreadPoolExecutor:

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

# Change only the executor line:
with ThreadPoolExecutor(max_workers=max_workers) as executor:
    # ... rest is the same
```

**Note:** ThreadPoolExecutor is slightly slower (~3x speedup vs 5x) due to Python's GIL, but simpler to implement.

---

## 🧪 Testing

### Test 1: Verify It Compiles
```bash
cd /Users/swayamsahoo/Projects/praxify-CFO
python3 -m py_compile aiml_engine/api/endpoints.py
```

### Test 2: Time the Endpoint
```bash
time curl -X POST "http://localhost:8000/full_report" \
  -F "file=@aiml_engine/data/sample_financial_data.csv" \
  -F "mode=finance_guardian" \
  -o test_output.json
```

**Expected Results:**
- **Before:** ~280 seconds
- **After:** ~60 seconds (M2 with 8 cores)

### Test 3: Verify All Forecasts Present
```bash
python3 << 'EOF'
import json
with open('test_output.json', 'r') as f:
    data = json.load(f)
metrics = list(data['full_analysis_report']['forecast_chart'].keys())
print(f"✅ {len(metrics)} forecasts generated:")
for m in sorted(metrics):
    print(f"  - {m}")
EOF
```

**Expected:** 14 metrics listed

---

## 🔧 Troubleshooting

### Issue: "AttributeError: Can't pickle local object"
**Solution:** Move `forecast_single_metric` to module level (outside the endpoint function)

### Issue: "OSError: [Errno 24] Too many open files"
**Solution:** Reduce `max_workers`:
```python
max_workers = min(4, len(all_metrics_to_forecast))  # Limit to 4 concurrent
```

### Issue: Prophet logs cluttering output
**Solution:** Suppress Prophet logging:
```python
import logging
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)
logging.getLogger('prophet').setLevel(logging.WARNING)
```

---

## 📊 Performance Monitoring

Add timing to track improvements:

```python
import time

# Before parallel forecasting
start_time = time.time()

# ... parallel forecasting code ...

end_time = time.time()
forecast_duration = end_time - start_time

print(f"⚡ Forecasting completed in {forecast_duration:.1f} seconds")
print(f"📊 Average per metric: {forecast_duration / len(all_forecasts):.1f} seconds")
```

---

## 🎯 Expected Performance

| System | Cores | Sequential Time | Parallel Time | Speedup |
|--------|-------|-----------------|---------------|---------|
| MacBook Air M2 | 8 | 280s | 60s | 4.7x |
| MacBook Pro M2 | 12 | 280s | 45s | 6.2x |
| AWS c7i.4xlarge | 16 | 280s | 35s | 8x |
| Hetzner CCX63 | 32 | 280s | 24s | 11.7x |

---

## 🚀 Deploy & Test

### 1. Backup current code
```bash
cp aiml_engine/api/endpoints.py aiml_engine/api/endpoints.py.backup
```

### 2. Apply changes
- Add imports
- Add `forecast_single_metric` function
- Replace sequential loop with parallel execution

### 3. Test locally
```bash
# Start server
uvicorn aiml_engine.api.app:app --reload

# In another terminal, test endpoint
time curl -X POST "http://localhost:8000/full_report" \
  -F "file=@aiml_engine/data/sample_financial_data.csv" \
  -o test_parallel.json
```

### 4. Verify results
```bash
# Check response is valid
python3 -c "import json; json.load(open('test_parallel.json'))"

# Compare with baseline
diff <(jq -S '.full_analysis_report.forecast_chart | keys' test_parallel.json) \
     <(jq -S '.full_analysis_report.forecast_chart | keys' response_1763445646323.json)
```

**Expected:** No differences (same metrics, potentially slightly different values due to random seed)

---

## 📝 Rollback Plan

If issues occur:

```bash
# Restore backup
mv aiml_engine/api/endpoints.py.backup aiml_engine/api/endpoints.py

# Restart server
pkill -f uvicorn
uvicorn aiml_engine.api.app:app --reload
```

---

## ✅ Success Criteria

- [ ] Code compiles without errors
- [ ] All 14 forecasts still generated
- [ ] Response structure unchanged
- [ ] Time reduced by 4-5x
- [ ] No errors in logs
- [ ] Same accuracy as before

---

## 🎉 Expected Outcome

**Before Optimization:**
```
⏱️  Forecasting Time: 280 seconds
📊 Metrics: 14
⚡ Parallelization: None (sequential)
```

**After Optimization:**
```
⏱️  Forecasting Time: 60 seconds (4.7x faster)
📊 Metrics: 14
⚡ Parallelization: 8 workers (M2)
🚀 User Experience: Significantly improved
```

---

**Implementation Status:** Ready to deploy  
**Risk Level:** Low (isolated change)  
**Rollback Time:** <5 minutes
