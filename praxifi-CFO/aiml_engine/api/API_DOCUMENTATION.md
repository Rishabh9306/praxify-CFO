# Agentic CFO Copilot: AIML Core API Documentation

**Version:** 1.0.0  
**Base URL:** `http://127.0.0.1:8000/api`

Welcome to the AIML Core for the Agentic CFO Copilot. This API provides a powerful, stateful, and conversational financial analysis engine.

This document outlines the three primary endpoints your application will interact with.  
For a live, interactive version of this documentation (Swagger UI), please run the server and visit **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

---

## 🔑 Authentication
The current version of the API running locally does not require an authentication header.

---

## ✨ Primary Endpoint (For Conversational UI)

This is the main endpoint your application should use for all primary user interactions. It combines data analysis with conversational AI.

### **POST** `/agent/analyze_and_respond`

This endpoint performs a full analysis of an uploaded financial CSV and then uses a Large Language Model (LLM) to generate a human-like response to a specific user query, based on the results of that analysis.  
It is designed to be **stateful**, maintaining conversational context via a `session_id`.

---

### **Request Body (multipart/form-data)**

| Parameter   | Type          | Required | Description                                                                                                  | Example                    |
|--------------|---------------|-----------|--------------------------------------------------------------------------------------------------------------|-----------------------------|
| `file`       | File (binary) | Yes       | The user's financial data in CSV format.                                                                     | `financials_q3.csv`         |
| `user_query` | string        | Yes       | The user's natural language question about the data.                                                         | `"What's our biggest risk?"` |
| `session_id` | string        | No        | Crucial for conversation. Leave blank for the first question. For follow-ups, use the session_id from prior response. | `"abc-123-def-456"`         |

---

### **Success Response (Code 200 OK)**

The endpoint returns a comprehensive JSON object containing both the AI's natural language answer and the structured data needed to build the UI.

#### Example JSON Response:
```json
{
  "ai_response": "Based on the data, a key recommendation is to focus on optimizing your Accounts Receivable (AR) process. 'AR' is a top profit driver, and improving collection speed can significantly enhance cash flow.",
  "full_analysis_report": {
    "dashboard_mode": "finance_guardian",
    "metadata": {
      "generated_at": "2025-10-13T15:30:00Z",
      "data_start_date": "2023-01-31",
      "data_end_date": "2024-12-31"
    },
    "kpis": {
      "total_revenue": 3932500,
      "profit_margin": 0.311,
      "financial_health_score": 48.36,
      "...": "..."
    },
    "forecast_chart": [
      {"date": "2025-01-01", "predicted": 74250, "...": "..."},
      {"date": "2025-02-01", "predicted": 59672, "...": "..."}
    ],
    "anomalies_table": [],
    "narratives": { "...": "..." },
    "profit_drivers": { "...": "..." }
  },
  "session_id": "abc-123-def-456",
  "conversation_history": [
    {
      "query_id": "xyz-987",
      "summary": {
        "user_query": "What's our biggest risk?",
        "ai_response": "..."
      }
    },
    {
      "query_id": "pqr-654",
      "summary": {
        "user_query": "Based on that, what is a recommendation?",
        "ai_response": "..."
      }
    }
  ]
}
```
---

### **How to Use This Response in the Frontend:**

- Use **`ai_response`** to display the primary, human-like answer in the chat interface.  
- Use **`full_analysis_report.kpis`** to populate the main KPI cards.  
- Use **`full_analysis_report.forecast_chart`** to render the forecast graph using a library like **Plotly** or **Chart.js**.  
- Use **`conversation_history`** to display the historical chat log to the user.  
- Crucially, **save the `session_id`** in your application’s state.

---

## ⚙️ Utility Endpoints

These are powerful, one-shot endpoints that perform specific tasks.  
They are **stateless** (they do not use `session_id`).

---

### **POST** `/simulate`

This endpoint runs a **“What-If” simulation** on a given dataset to see the projected impact of a financial change.

---

### **Request Body (multipart/form-data)**

| Parameter     | Type          | Required | Description                                                                 | Example              |
|----------------|---------------|-----------|-----------------------------------------------------------------------------|----------------------|
| `file`         | File (binary) | Yes       | The baseline financial data in CSV format.                                 | `financials_q3.csv`  |
| `parameter`    | string        | Yes       | The financial metric to change. Must match a schema key like `expenses` or `revenue`. | `"expenses"`         |
| `change_pct`   | number        | Yes       | The percentage to change the parameter by. Use `10` for +10% or `-5` for -5%. | `-10`                |

---

### **Success Response (Code 200 OK)**

Returns a detailed simulation report.

#### Example JSON Response:
```json
{
  "scenario": {
    "parameter_changed": "expenses",
    "change_percentage": -10
  },
  "baseline": {
    "total_profit": 1223200,
    "...": "..."
  },
  "simulation_results": {
    "total_profit": 1440930,
    "...": "..."
  },
  "impact": {
    "profit_impact_absolute": 217730,
    "profit_impact_percentage": 17.8,
    "...": "..."
  },
  "summary_text": "A -10.0% change in 'expenses' is projected to increase total profit by 217,730.00 (17.80%)..."
}
```
---

### **How to Use This in the Frontend:**

Ideal for powering **interactive sliders** or **input boxes** where a user can test scenarios.  
Display the **`summary_text`** directly and use the **`impact`** object to create visual indicators of the change.

---

### **POST** `/full_report`

This is the **foundational analysis endpoint**.  
It performs the same comprehensive data analysis as `/agent/analyze_and_respond` but **does not include the conversational AI layer**.

**Use Case:**  
Perfect for scenarios where you just need the raw data and analysis without asking a question, such as:
- Initial dashboard load  
- Generating static, non-interactive reports  

---

### **Request Body (multipart/form-data)**

| Parameter         | Type          | Required | Description                                                                 | Example                     |
|-------------------|---------------|-----------|-----------------------------------------------------------------------------|------------------------------|
| `file`            | File (binary) | Yes       | The financial data in CSV format.                                           | `financials_q3.csv`          |
| `mode`            | string        | No        | The narrative persona to use (`finance_guardian` or `financial_storyteller`). Defaults to `finance_guardian`. | `"financial_storyteller"`    |
| `forecast_metric` | string        | No        | The primary metric to analyze (`revenue`, `expenses`, etc.). Defaults to `revenue`. | `"expenses"`                 |

---

### **Success Response (Code 200 OK)**

Returns a comprehensive JSON object very similar to the **`full_analysis_report`** from the main agent endpoint, including all supporting reports.

---