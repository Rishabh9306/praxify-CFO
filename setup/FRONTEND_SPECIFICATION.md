```bash
╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                                   ║
║                        Praxify Agentic CFO COPILOT : FRONTEND FUNCTIONAL DOCUMENTATION                            ║
║                                                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

**Objective:**  
To build a dynamic, dual-mode web application that serves as the face for the AIML Core. The frontend is responsible for managing the user interaction flow, calling the appropriate API endpoints, and visualizing the rich data returned by the agent.

---

## Core Principle: The Application is a Conversation

The entire application should be structured around a central conversational experience. Even when displaying charts and KPIs, these elements should be presented as the agent's response to a user's query about a specific dataset.

---

## Global Component Requirements

These components should be present and accessible across most of the application.

### **Session State Management:**
**Functionality:** The application MUST maintain a client-side state for the `session_id`.

**Logic:**
- Upon the first successful call to `/api/agent/analyze_and_respond`, the `session_id` from the response MUST be stored (e.g., in `localStorage` or a state management library like Redux/Vuex).  
- For all subsequent calls to this endpoint within the same user session, this stored `session_id` MUST be retrieved and sent with the request.  
- Provide a **"New Chat"** or **"Reset Session"** button that clears the stored `session_id` and the chat history.

### **File Memory Component:**
**Functionality:** To support a seamless conversational flow, the application should "remember" the last successfully uploaded CSV file for a given session.

**Logic:**
- Store the uploaded `File` object in the application's state.  
- When a user submits a follow-up query, automatically attach this stored `File` object to the API request so the user doesn't have to re-upload it every time.

---

## Page & Feature Breakdown

The application can be envisioned as a single, powerful **Dashboard** page that re-renders its content based on the API response.

---

## The Main Analysis & Chat Page

This is the central hub of the application. It contains the input controls and the primary display area for the agent's output.

### **1. Input Section (e.g., in a Sidebar or Header)**

#### **Feature: File Uploader**
**Functionality:** A standard HTML file input that accepts `.csv` files. This is the `file` parameter for all API calls.

#### **Feature: Chat Input / Query Box**
**Functionality:** A text input field where the user types their questions. This is the `user_query` parameter for the `/api/agent/analyze_and_respond` endpoint.

#### **Feature: "Analyze" Button**
**Functionality:** A submit button that triggers the API call to `/api/agent/analyze_and_respond`.  
It should be disabled until a file is uploaded.

#### **Feature: Persona Mode Toggle (Optional but Recommended)**
**Functionality:** A toggle or dropdown that allows the user to select the agent's persona.  
**Logic:** The selected value (`finance_guardian` or `financial_storyteller`) should be sent as the `mode` parameter in the API request.

---

### **2. Main Display Area**

This area is populated with the data from the JSON response of `/api/agent/analyze_and_respond`.

#### **Feature: Conversational Log / Chat History**
**Functionality:** The main view of the page, displaying the conversation turn-by-turn.

**Data Mapping:**
- Render the `conversation_history` array from the API response.  
- For each item in the array, display:
  - `summary.user_query` as the **user's message**  
  - `summary.ai_response` as the **agent's message**
- The `ai_response` text should be rendered as **Markdown** to support formatting (headings, bullet points, bold text, etc.).

#### **Feature: Dynamic KPI Dashboard**
**Functionality:** A section displaying the key performance indicators for the current analysis.

**Data Mapping (from `full_analysis_report.kpis`):**
- **Total Revenue:** Display `total_revenue` (formatted as currency).  
- **Total Expenses:** Display `total_expenses` (formatted as currency).  
- **Profit Margin:** Display `profit_margin` (formatted as a percentage).  
- **Cash Flow:** Display `cashflow` (formatted as currency).  
- **Financial Health Score:** Display `financial_health_score` as a gauge or a "score out of 100".  
- **YoY Growth:** Display `growth_rate` (formatted as a percentage).  
- **DSO:** Display `dso` (formatted as a number of days).

#### **Feature: Interactive Forecast Chart**
**Functionality:** A line chart visualizing the agent's forecast.

**Data Mapping (from `full_analysis_report.forecast_chart`):**
- Use a charting library (**Plotly**, **Chart.js**, **Recharts**, etc.).  
- The **X-axis** should be the `date`.  
- Plot the `predicted` value as a primary line (e.g., dashed).  
- Plot the `lower` and `upper` values to create a shaded confidence interval band around the prediction.  
- If the `forecast_chart` array is empty, display the message from `full_analysis_report.model_health_report.reason` (e.g., `"Not enough data..."`).

#### **Feature: Anomaly Alerts Table**
**Functionality:** A table or list that appears only if the agent detects anomalies.

**Logic:**  
If the `full_analysis_report.anomalies_table` array is not empty, render a table.

**Data Mapping (for each object in the array):**
- **Date:** Display `date`.  
- **Metric:** Display `metric`.  
- **Value:** Display `value` (formatted as currency).  
- **Severity:** Display `severity` (consider using color-coding: red for "High", yellow for "Medium").  
- **Reason:** Display `reason`.

#### **Feature: Key Profit Drivers Display**
**Functionality:** A component that explains the "Why" behind profitability.

**Data Mapping (from `full_analysis_report.profit_drivers`):**
- Display the **main insight text**.  
- Render the `feature_attributions` array as a bar chart or a ranked list, showing the `feature` and its `contribution_score`.

---

## The "What-If" Simulation Page/Modal

This can be a separate page or, more effectively, a modal window that can be launched from the main dashboard.

### **1. Input Section**

#### **Feature: Parameter Selection**
**Functionality:** A dropdown menu to select the financial parameter to change.  
**Options:** `revenue`, `expenses`.

#### **Feature: Percentage Change Input**
**Functionality:** A number input or a slider to set the `change_pct`.

#### **Feature: "Run Simulation" Button**
**Functionality:** Triggers the API call to `POST /simulate`, sending the currently loaded file, the selected parameter, and the `change_pct`.

---

### **2. Display Area**

#### **Feature: Simulation Impact Report**
**Functionality:** Display the results from the simulation API response.

**Data Mapping:**
- Display the `summary_text` as the **primary result**.  
- Create comparison cards or a table to show:
  - **Before:** `baseline.total_profit`  
  - **After:** `simulation_results.total_profit`  
- Use the `impact.profit_impact_percentage` to show a clear indicator (e.g., `"+17.8%"` in green text or `"-5.2%"` in red text).

---

By building these features and mapping them to the provided API responses, you will create a comprehensive, powerful, and truly **agentic user experience** that showcases every capability of the AIML Core.