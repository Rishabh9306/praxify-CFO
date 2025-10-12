# Agentic CFO Copilot - AIML Engine

This repository contains the complete AI/ML intelligence layer for the Agentic CFO Copilot project. It is an autonomous system designed to act as both a Finance Guardian and Financial Storyteller for organizations by ingesting and analyzing financial data from any CSV file.

## Features

- **Autonomous Data Ingestion:** Automatically reads and normalizes any CSV file with financial data.
- **Data Quality Assurance:** A robust pipeline for validating, cleaning, and imputing data.
- **Dynamic KPI Extraction:** Automatically calculates key financial performance indicators.
- **Predictive Forecasting:** Generates 3-month forecasts for key metrics with confidence intervals.
- **Anomaly Detection:** Identifies outliers and unusual patterns in financial data.
- **Scenario Simulation:** A "what-if" engine to model the impact of business decisions.
- **Dual-Mode Narrative Generation:** Creates summaries and recommendations for both internal and external stakeholders.
- **Explainability and Auditability:** Provides traceable insights with feature attribution.
- **RESTful API:** Exposes all functionality through a clean and well-documented API.
- **Business Dashboard Layer:** Generates a JSON output to power an interactive dashboard.

## Project Structure

The project is organized into several key directories:

- `/aiml_engine`: The core Python package containing all the AIML logic.
- `/data`: Contains sample data for testing and demonstration.
- `/notebooks`: Jupyter notebooks for demonstration and experimentation.
- `/tests`: Unit and integration tests for the AIML engine.

## Getting Started

### Prerequisites

- Python 3.9+
- Pip

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/agentic-cfo-copilot.git
    cd agentic-cfo-copilot
    ```

2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the required dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Usage

#### Command-Line Interface

You can run the entire AIML pipeline on a CSV file from the command line:

```bash
python -m aiml_engine.main --file_path ./data/sample_financial_data.csv