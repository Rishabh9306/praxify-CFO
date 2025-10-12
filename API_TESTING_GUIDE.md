# API Testing Guide - Praxify CFO AIML Engine

This guide shows you how to test the API functionality as described by the developer.

## 🚀 Current Status

✅ **Docker container is running!**
- API URL: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Status: Healthy

## 📋 Testing Instructions

### Option 1: Interactive Testing (Web Browser)

1. **Open the API documentation in your browser:**
   ```
   http://localhost:8000/docs
   ```

2. **Test the `/api/full_report` endpoint:**
   
   a. Click on **POST /api/full_report** endpoint
   
   b. Click **"Try it out"** button
   
   c. Upload the CSV file:
      - Click "Choose File" 
      - Navigate to: `aiml_engine/data/sample_financial_data.csv`
   
   d. Set parameters:
      - **mode**: `finance_guardian` (for internal stakeholder view)
      - **forecast_metric**: `revenue`
   
   e. Click **"Execute"**
   
   f. View the response below (financial analysis report)

3. **Test Financial Storyteller mode:**
   
   - Same steps as above, but change:
     - **mode**: `financial_storyteller` (for external stakeholder view)
     - **forecast_metric**: `expense` (or try `revenue`, `profit`, etc.)

4. **Test the `/api/simulate` endpoint:**
   
   a. Click on **POST /api/simulate** endpoint
   
   b. Click **"Try it out"**
   
   c. Upload the CSV file again
   
   d. Set parameters:
      - **parameter**: `revenue` (or `expense`, `profit`)
      - **change_pct**: `-10` (for 10% decrease) or `10` (for 10% increase)
   
   e. Click **"Execute"**
   
   f. View the simulation results showing impact of the change

### Option 2: Command Line Testing (Automated)

Run the automated test script:

```bash
./test_api.sh
```

This will:
- Test Finance Guardian mode with revenue forecast
- Test Financial Storyteller mode with expense forecast
- Run scenario simulation with -10% change
- Run scenario simulation with +10% change
- Save all results as JSON files

### Option 3: Manual cURL Testing

#### Test Full Report (Finance Guardian)
```bash
curl -X POST "http://localhost:8000/api/full_report" \
  -F "file=@./aiml_engine/data/sample_financial_data.csv" \
  -F "mode=finance_guardian" \
  -F "forecast_metric=revenue" \
  -o report.json
```

#### Test Full Report (Financial Storyteller)
```bash
curl -X POST "http://localhost:8000/api/full_report" \
  -F "file=@./aiml_engine/data/sample_financial_data.csv" \
  -F "mode=financial_storyteller" \
  -F "forecast_metric=expense" \
  -o report_storyteller.json
```

#### Test Scenario Simulation
```bash
curl -X POST "http://localhost:8000/api/simulate" \
  -F "file=@./aiml_engine/data/sample_financial_data.csv" \
  -F "parameter=revenue" \
  -F "change_pct=-10" \
  -o simulation.json
```

### Option 4: Python Testing Script

```python
import requests

API_URL = "http://localhost:8000/api"

# Test 1: Full Report - Finance Guardian
with open('./aiml_engine/data/sample_financial_data.csv', 'rb') as f:
    response = requests.post(
        f"{API_URL}/full_report",
        files={'file': f},
        data={
            'mode': 'finance_guardian',
            'forecast_metric': 'revenue'
        }
    )
    print("Finance Guardian Report:", response.status_code)
    if response.status_code == 200:
        result = response.json()
        print(f"Forecast generated: {len(result.get('forecast', {}))} periods")

# Test 2: Financial Storyteller
with open('./aiml_engine/data/sample_financial_data.csv', 'rb') as f:
    response = requests.post(
        f"{API_URL}/full_report",
        files={'file': f},
        data={
            'mode': 'financial_storyteller',
            'forecast_metric': 'expense'
        }
    )
    print("Financial Storyteller Report:", response.status_code)

# Test 3: Scenario Simulation
with open('./aiml_engine/data/sample_financial_data.csv', 'rb') as f:
    response = requests.post(
        f"{API_URL}/simulate",
        files={'file': f},
        data={
            'parameter': 'revenue',
            'change_pct': -10
        }
    )
    print("Simulation Result:", response.status_code)
    if response.status_code == 200:
        result = response.json()
        print(f"Impact analysis completed")
```

## 🎯 Understanding the Endpoints

### 1. `/api/full_report`

**Purpose:** Complete financial analysis with forecasting and anomaly detection

**Parameters:**
- `file`: CSV file with financial data
- `mode`: 
  - `finance_guardian`: Internal view with detailed technical insights
  - `financial_storyteller`: External view with stakeholder-friendly narratives
- `forecast_metric`: Metric to forecast (e.g., `revenue`, `expense`, `profit`)

**Returns:** JSON with:
- Forecast predictions
- Anomaly detection results
- Correlation analysis
- KPI calculations
- Narrative summaries
- Dashboard data

### 2. `/api/simulate`

**Purpose:** Simulate "what-if" scenarios by changing a parameter

**Parameters:**
- `file`: CSV file with financial data
- `parameter`: Which metric to change (e.g., `revenue`, `expense`)
- `change_pct`: Percentage change (e.g., `-10` for 10% decrease, `10` for 10% increase)

**Returns:** JSON with:
- Simulated outcomes
- Impact on other metrics
- Recommendations based on scenario

## 📊 Available CSV Files

1. **sample_financial_data.csv** - Clean sample data
   - Location: `./aiml_engine/data/sample_financial_data.csv`
   
2. **messy_financial_data.csv** - Test data with quality issues
   - Location: `./aiml_engine/data/messy_financial_data.csv`

## 🔍 Viewing Results

### Format JSON output for readability:
```bash
cat report.json | python -m json.tool | less
```

### Extract specific fields:
```bash
# View forecast data
cat report.json | python -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('forecast', {}), indent=2))"

# View narrative
cat report.json | python -c "import sys, json; data=json.load(sys.stdin); print(data.get('narrative', {}).get('summary', 'No summary'))"
```

## 🐛 Troubleshooting

### API not responding?
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f aiml-engine

# Restart container
docker compose restart
```

### CSV file not found?
```bash
# List available CSV files
find . -name "*.csv" -type f

# Use absolute path
/home/draxxy/praxify-CFO/aiml_engine/data/sample_financial_data.csv
```

### Want to see live logs while testing?
```bash
# In one terminal
docker compose logs -f aiml-engine

# In another terminal
./test_api.sh
```

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/

## 🎓 Test Scenarios to Try

1. **Compare Guardian vs Storyteller modes** with same data
2. **Test different metrics**: revenue, expense, profit, cash_flow
3. **Try different simulation percentages**: -50, -10, 0, 10, 50
4. **Test with messy data** to see data validation in action
5. **Compare before/after** simulation scenarios

## ✅ Quick Test Checklist

- [ ] API is running (check http://localhost:8000)
- [ ] Tested Finance Guardian mode
- [ ] Tested Financial Storyteller mode
- [ ] Tested scenario simulation (decrease)
- [ ] Tested scenario simulation (increase)
- [ ] Reviewed generated reports
- [ ] Understood the difference between modes

---

**Pro Tip:** Use the web interface at http://localhost:8000/docs for the easiest testing experience!
