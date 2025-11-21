# Agentic CFO Copilot - The AIML Intelligence Core

This repository contains the complete, production-ready AIML intelligence layer for the **Agentic CFO Copilot**. It is an autonomous, conversational AI agent designed to act as a dual-mode financial brain for any organization: a **Finance Guardian** for internal operations and a **Financial Storyteller** for external communication.

This engine is built to be robust, scalable, and autonomous. It can ingest any financial data from a CSV file, regardless of the schema, and perform a full suite of analyses—from forecasting and anomaly detection to generating strategic, AI-powered narratives.

---

## 📂 Project Repository Structure

The project is organized with a clean separation of concerns, making it modular and easy to maintain.
```bash
/praxifi-CFO
|
|-- 📂 aiml_engine
| |-- 📂 api
| | |-- init.py
| | |-- app.py
| | |-- endpoints.py
| |-- 📂 core
| | |-- __init__.py
| | |-- agent.py
| | |-- anomaly_detection.py
| | |-- correlation.py
| | |-- dashboard.py
| | |-- data_ingestion.py
| | |-- data_validation.py
| | |-- explainability.py
| | |-- feature_engineering.py
| | |-- forecasting.py
| | |-- memory.py
| | |-- narrative.py
| | |-- simulation.py
| |-- 📂 data
| | |-- messy_financial_data.csv
| | |-- sample_financial_data.csv
| |-- 📂 utils
| | |-- init.py
| | |-- helpers.py
| |-- main.py
|-- 📂 notebooks
| |-- aiml_demo.ipynb
|-- 📂 tests
| |-- 📂 integration
| | |-- init.py
| | |-- test_pipeline.py
| |-- 📂 unit
| | |-- init.py
| | |-- test_anomaly_detection.py
| | |-- test_data_ingestion.py
| | |-- test_forecasting.py
|-- 📄 .env
|-- 📄 .gitignore
|-- 📄 README.md
|-- 📄 requirements.txt
```
---

## 🚀 Key Features

*   **Autonomous Data Ingestion:** Reads any CSV file and uses NLP to automatically understand, clean, and normalize varied column names (`Sales Revenue`, `Operating Costs`, etc.) into a unified schema.
*   **Intelligent Data Validation:** A hardened pipeline that handles messy, real-world data, including mixed data types, missing values, and special characters.
*   **Multi-Model Forecasting:** Generates 3-month forecasts for key metrics by intelligently selecting the best model (Prophet or AutoARIMA) based on the data's characteristics.
*   **Proactive Anomaly Detection:** Scans financial metrics for significant outliers and deviations from the trend, providing early warnings.
*   **"What-If" Scenario Simulation:** An interactive engine to model the financial impact of business decisions (e.g., "What happens if costs increase by 10%?").
*   **Explainable AI (XAI):** Integrates SHAP to identify and rank the key drivers of profitability, answering the crucial question of "Why?".
*   **Conversational AI with Memory:** Powered by Google's Gemini, the agent can understand natural language questions, synthesize data-driven answers, and remember the context of the conversation through a persistent, Redis-backed memory.
*   **Dual-Persona Narrative Generation:**
    *   **Finance Guardian:** Generates tactical, internal-facing summaries and actionable recommendations.
    *   **Financial Storyteller:** Crafts polished, strategic narratives suitable for board meetings and investor updates.
*   **Production-Ready API:** A fully documented, robust FastAPI backend that exposes all the agent's capabilities through a clean set of endpoints.

---

## 🛠️ Technology Stack

*   **Backend:** Python, FastAPI, Uvicorn
*   **Data Science:** Pandas, NumPy, Scikit-learn, Statsmodels
*   **Forecasting:** Prophet, PMDArima
*   **NLP & Explainability:** spaCy, SHAP
*   **Generative AI:** Google Generative AI (Gemini)
*   **Memory Store:** Redis
*   **Development & Deployment:** Docker, python-dotenv

---

## 🏁 Getting Started: A Step-by-Step Guide

Follow these instructions perfectly to set up and run the entire AIML agent on your local machine.

### **Prerequisites**

1.  **Python 3.9:** Ensure you have Python 3.9 installed. You can check with `python3.9 --version`.
2.  **Docker Desktop:** Install and run Docker Desktop from the [official Docker website](https://www.docker.com/products/docker-desktop/). This is required to run the Redis memory store.
3.  **Google AI API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/).
    *   Click **"Get API key"** and **"Create API key in new project"**.
    *   Copy the secret key.

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/Rishabh9306/praxifi-CFO.git
cd praxifi-CFO
```

### **Step 2: Set Up the Environment**
This project uses a .env file to manage secret keys.

Create the .env file in the project's root directory:
```bash
touch .env
```
Add your Google API Key to the .env file. The file should contain these three lines:
```bash
GOOGLE_API_KEY="paste_your_google_api_key_here"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### **Step 3: Start the Redis Memory Store**
With Docker running, start the Redis container with this single command in your terminal:
```bash
docker run --name agentic-cfo-redis -p 6379:6379 -d redis
```
This will run a Redis server in the background. You only need to do this once.
Next time run this
```bash
docker start agentic-cfo-redis
```

### **Step 4: Set Up the Python Virtual Environment**
This ensures all dependencies are isolated from your system.
```bash
# Create the virtual environment
python3.9 -m venv venv

# Activate the environment
source venv/bin/activate

# Upgrade pip and install all required packages
pip install -r requirements.txt
```

### **Step 5: Launch the Agent!**
You are ready. Run the API server with this command:
```bash
python -m uvicorn aiml_engine.api.app:app --reload
```
You should see output indicating that the Uvicorn server is running and has successfully connected to Redis: ✅ Successfully connected to Redis.

---

## ✅ How to Test the Agent
The agent is now live. You can test every feature using the interactive API documentation.

**Open your browser and go to: http://127.0.0.1:8000/docs**

#### **Test 1: The Full Conversational Flow (Recommended)**
This single test validates all core modules, from data processing to conversational memory.

1. Go to the POST /api/agent/analyze_and_respond endpoint.
2. First Question (Establishes Context):
    * file: Upload data/sample_financial_data.csv.
    * user_query: Enter "Provide a high-level summary of our financial performance. What are the top factors that influence our profit, and what does the forecast for the next quarter look like?"
    * session_id: Leave this blank.
    * Click "Execute".
    * From the successful response, copy the session_id.
3. Second Question (Tests Memory):
    * file: Re-upload data/sample_financial_data.csv.
    * user_query: Enter "That's insightful. Based on the profit drivers you just identified, what is one strategic recommendation you would make to improve profitability?"
    * session_id: Paste the session_id you copied.
    * Click "Execute".

You should see an intelligent, contextual AI response that references the profit drivers from the first query, proving the agent's memory is working.

### **Test 2: Robustness with Messy Data**
This test proves the agent's ability to handle poorly formatted, real-world data.

1. Go to the POST /api/full_report endpoint.
2. file: Upload data/messy_financial_data.csv.
3. Click "Execute".
In the JSON response, check the supporting_reports to see how the agent correctly parsed the messy headers (header_mappings) and imputed the missing values (corrections_log). Note that the forecast will gracefully fail with a "Not enough data" message, which is the correct behavior.

### **Test 3: The "What-If" Simulation Engine**
1. Go to the POST /api/simulate endpoint.
2. file: Upload data/sample_financial_data.csv.
3. parameter: Enter expenses.
4. change_pct: Enter -10.
5. Click "Execute".

The response will show a detailed report on how a 10% decrease in expenses would positively impact profit and cashflow.