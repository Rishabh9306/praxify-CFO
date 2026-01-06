# TaxIQ - GST & Tax Intelligence Engine

## 🎯 Overview

TaxIQ is an AI-powered GST compliance and tax optimization platform integrated into Praxifi CFO. It provides intelligent analysis for:

- **ITC Recovery**: Detect and recover lost Input Tax Credit
- **RCM Detection**: Auto-detect Reverse Charge Mechanism liabilities
- **Tax Optimization**: AI-powered tax-saving scenarios
- **Compliance Risk**: Real-time risk assessment and audit probability
- **GSTR Reconciliation**: Auto-reconcile GSTR-2A/2B with purchase register

---

## 🚀 Quick Start

### 1. Upload Data

**Purchase Register:**
```bash
curl -X POST "http://localhost:8000/api/tax/upload/purchase-register" \
  -F "file=@purchase_register.csv"
```

**Sales Register:**
```bash
curl -X POST "http://localhost:8000/api/tax/upload/sales-register" \
  -F "file=@sales_register.csv"
```

**Expense Register (Optional for RCM):**
```bash
curl -X POST "http://localhost:8000/api/tax/upload/expense-register" \
  -F "file=@expense_register.csv"
```

### 2. Get Complete Dashboard

```bash
curl "http://localhost:8000/api/tax/dashboard"
```

---

## 📊 CSV Formats

### Purchase Register (purchase_register.csv)

**Required Columns:**
- `invoice_no`: Invoice number
- `date`: Invoice date (YYYY-MM-DD)
- `vendor_name`: Vendor name
- `taxable_value`: Taxable amount
- `total`: Total invoice value

**Optional Columns:**
- `vendor_gstin`: Vendor GSTIN (15 characters)
- `cgst`: CGST amount
- `sgst`: SGST amount
- `igst`: IGST amount
- `expense_category`: Category (Legal Services, Professional Fees, etc.)

**Example:**
```csv
invoice_no,date,vendor_gstin,vendor_name,taxable_value,cgst,sgst,igst,total,expense_category
INV001,2024-12-01,29ABCDE1234F1Z5,ABC Suppliers,100000,9000,9000,0,118000,Raw Materials
INV002,2024-12-02,,Legal Firm,50000,0,0,9000,59000,Legal Services
```

### Sales Register (sales_register.csv)

**Required Columns:**
- `invoice_no`: Invoice number
- `date`: Invoice date
- `buyer_name`: Buyer name
- `taxable_value`: Taxable amount
- `total`: Total invoice value

**Optional Columns:**
- `buyer_gstin`: Buyer GSTIN
- `cgst`, `sgst`, `igst`: Tax amounts
- `state`: State of buyer

**Example:**
```csv
invoice_no,date,buyer_gstin,buyer_name,taxable_value,cgst,sgst,igst,total,state
SI001,2024-12-01,29PQRST9012H1Z5,Customer A,200000,18000,18000,0,236000,Karnataka
SI002,2024-12-02,27XYZPQ3456H1Z5,Customer B,150000,0,0,27000,177000,Maharashtra
```

### Expense Register (expense_register.csv)

**Required Columns:**
- `date`: Expense date
- `description`: Expense description
- `amount`: Expense amount

**Optional Columns:**
- `category`: Category
- `vendor_gstin`: Vendor GSTIN
- `payment_mode`: Payment mode
- `gst_amount`: GST amount

**Example:**
```csv
date,description,amount,category,vendor_gstin,payment_mode,gst_amount
2024-12-01,Lawyer consultation,50000,Legal Services,27XYZAB5678G1Z5,Bank Transfer,9000
2024-12-02,Security services,30000,Security Services,,Cash,0
```

---

## 🔌 API Endpoints

### 1. ITC Recovery Analysis
```
GET /api/tax/analysis/itc-recovery
```

**Response:**
```json
{
  "total_itc_available": 450000.0,
  "itc_claimed": 385000.0,
  "itc_unclaimed": 25000.0,
  "itc_at_risk": 40000.0,
  "recovery_rate": 85.6,
  "vendor_risks": [
    {
      "vendor_name": "ABC Corp",
      "risk_score": 75,
      "itc_at_risk": 40000,
      "recommendation": "Obtain valid GSTIN immediately"
    }
  ],
  "potential_savings": 45000.0,
  "recommendations": [
    "🔴 CRITICAL: ₹40,000 ITC at risk. Verify vendor GSTIN compliance immediately."
  ]
}
```

### 2. RCM Detection
```
GET /api/tax/analysis/rcm-detection
```

**Response:**
```json
{
  "total_rcm_applicable": 90000.0,
  "rcm_paid": 45000.0,
  "rcm_pending": 45000.0,
  "rcm_liability": 48000.0,
  "risk_score": 65.0,
  "penalties_at_risk": 5400.0,
  "detected_expenses": [
    {
      "category": "Legal Services",
      "amount": 50000,
      "rcm_liability": 9000,
      "confidence": 0.9,
      "reason": "Legal Services is always under RCM as per Section 9(3)"
    }
  ],
  "recommendations": [
    "🔴 URGENT: Pay pending RCM of ₹45,000 immediately to avoid penalties."
  ]
}
```

### 3. Tax Optimization
```
GET /api/tax/analysis/tax-optimization?industry=manufacturing
```

**Response:**
```json
{
  "current_tax_liability": 285000.0,
  "optimized_tax_liability": 245000.0,
  "potential_savings": 40000.0,
  "savings_percentage": 14.0,
  "effective_tax_rate": 22.8,
  "industry_benchmark": 21.5,
  "scenarios": [
    {
      "name": "Maximize ITC Claims",
      "savings": 40000,
      "implementation": "Obtain GSTIN from vendors",
      "effort": "Low"
    }
  ],
  "forecast_next_quarter": {
    "forecasted_liability": 295000.0
  }
}
```

### 4. Compliance Risk Assessment
```
GET /api/tax/analysis/compliance-risk
```

**Response:**
```json
{
  "overall_risk_score": 45.0,
  "risk_level": "Medium",
  "compliance_score": 55.0,
  "audit_probability": 35.0,
  "potential_penalties": 12500.0,
  "critical_issues": [
    {
      "type": "Missing GSTIN on High-Value Purchases",
      "severity": "Critical",
      "penalty_risk": 40000,
      "action_required": "Obtain GSTIN from vendors immediately"
    }
  ],
  "upcoming_deadlines": [
    {
      "return_type": "GSTR-3B",
      "deadline": "20 Jan 2025",
      "days_remaining": 11,
      "importance": "Critical"
    }
  ]
}
```

### 5. Complete Dashboard
```
GET /api/tax/dashboard
```

**Query Parameters:**
- `include_itc`: true/false (default: true)
- `include_rcm`: true/false (default: true)
- `include_optimization`: true/false (default: true)
- `include_risk`: true/false (default: true)
- `include_reconciliation`: true/false (default: false)
- `industry`: manufacturing/services/trading/retail/default

### 6. Quick Summary
```
GET /api/tax/summary
```

Returns condensed metrics for dashboard cards.

---

## 🧪 Testing

### Test with Sample Data

1. **Create test CSV files** (see examples above)

2. **Upload data:**
```bash
# Purchase register
curl -X POST "http://localhost:8000/api/tax/upload/purchase-register" \
  -F "file=@test_purchase.csv"

# Sales register
curl -X POST "http://localhost:8000/api/tax/upload/sales-register" \
  -F "file=@test_sales.csv"
```

3. **Get analysis:**
```bash
# ITC Analysis
curl "http://localhost:8000/api/tax/analysis/itc-recovery"

# Complete Dashboard
curl "http://localhost:8000/api/tax/dashboard"
```

4. **Clear data:**
```bash
curl -X DELETE "http://localhost:8000/api/tax/data/clear"
```

---

## 🎯 Key Features

### 1. ITC Recovery Engine
- **Vendor Risk Scoring**: AI-based risk assessment for each vendor
- **Leakage Detection**: Identify unclaimed ITC opportunities
- **Time-bar Tracking**: Alert before ITC claims expire
- **Mismatch Detection**: Find unusual GST rates and errors

### 2. RCM Detection Engine
- **Auto-Classification**: AI classifies expenses into RCM categories
- **Rule-based Engine**: Uses GST Act Section 9(3) & 9(4) rules
- **Penalty Calculator**: Calculates interest and late fees
- **Payment Calendar**: Track RCM payment deadlines

### 3. Tax Optimization Engine
- **Scenario Planning**: 5+ tax-saving scenarios
- **Forecasting**: Predict next quarter liability
- **Industry Benchmarking**: Compare with industry averages
- **Working Capital**: IGST impact analysis

### 4. Compliance Risk Engine
- **Risk Scoring**: 0-100 risk score with Critical/High/Medium/Low levels
- **Audit Probability**: AI-predicted audit chance
- **Issue Detection**: 15+ compliance checks
- **Action Items**: Prioritized to-do list

### 5. Reconciliation Engine
- **Fuzzy Matching**: Smart invoice matching (85% accuracy threshold)
- **GSTIN-based**: Match by GSTIN first, then fuzzy logic
- **Discrepancy Report**: Detailed list of mismatches
- **ITC Impact**: Calculate impact of mismatches

---

## 🔒 Production Considerations

### Security
- **API Authentication**: Add JWT/OAuth in production
- **Rate Limiting**: Prevent abuse
- **Data Encryption**: Encrypt sensitive GST data at rest

### Scalability
- **Database**: Replace in-memory store with PostgreSQL/MongoDB
- **Caching**: Use Redis for frequently accessed data
- **Queue**: Use Celery for long-running analysis

### Integration
- **GSTN API**: Integrate with official GSTN API for GSTR-2A/2B
- **Accounting Software**: Connect with Tally, QuickBooks, Zoho
- **Email Alerts**: Send compliance deadline reminders

### Monitoring
- **Logging**: Structured logging with ELK stack
- **Metrics**: Prometheus + Grafana for monitoring
- **Alerts**: Alert on critical issues detected

---

## 📈 Business Value

### For ₹50 Crore Revenue Company:

**ITC Recovery**: 10-25% more ITC = ₹2-5L savings/year
**RCM Compliance**: ₹50K-5L penalty avoidance
**Tax Optimization**: 3-7% rate reduction = ₹10-50L savings/year

**Total Annual Savings**: ₹15-75 Lakhs

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python)
- **AI/ML**: Scikit-learn, Pandas, NumPy
- **Validation**: Pydantic models
- **Testing**: Pytest (future)
- **Documentation**: OpenAPI/Swagger (auto-generated)

---

## 📞 Support

For issues or questions:
1. Check `/docs` for interactive API documentation
2. Review this README
3. Check logs in `aiml_engine.log`

---

## 🔄 Changelog

### v1.0.0 (December 2024)
- ✅ ITC Recovery Analysis
- ✅ RCM Detection & Compliance
- ✅ Tax Optimization Scenarios
- ✅ Compliance Risk Assessment
- ✅ GSTR-2A/2B Reconciliation
- ✅ Complete Dashboard API
- ✅ CSV Upload & Validation

---

## 🚀 Roadmap

### Phase 2 (Future)
- [ ] AI Tax Advisor Chatbot
- [ ] E-Invoice Integration
- [ ] E-Way Bill Tracking
- [ ] Multi-state Optimization
- [ ] GST Return Auto-filing
- [ ] Vendor Compliance Monitoring
- [ ] Real-time GSTN API Integration

---

**TaxIQ - Making GST Compliance Intelligent** 🚀
