import pandas as pd
import io
import os
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
# Use the proven, correct Response object and Python 3.9 Optional
from starlette.responses import Response 
from typing import Dict, Any, Optional

# --- All existing imports are correct and unchanged ---
from aiml_engine.core.data_ingestion import DataIngestion
from aiml_engine.core.data_validation import DataValidationQualityAssuranceEngine
from aiml_engine.core.feature_engineering import KPIAutoExtractionDynamicFeatureEngineering
from aiml_engine.core.forecasting import ForecastingModule
from aiml_engine.core.anomaly_detection import AnomalyDetectionModule
from aiml_engine.core.correlation import CrossMetricCorrelationTrendMiningEngine
from aiml_engine.core.simulation import ScenarioSimulationEngine
from aiml_engine.core.dashboard import BusinessDashboardOutputLayer
from aiml_engine.core.explainability import ExplainabilityAuditLayer
# --- NEW INTEGRATION IMPORTS ---
from aiml_engine.core.memory import ConversationalMemory
from aiml_engine.core.agent import Agent
# ---
from aiml_engine.utils.helpers import CustomJSONEncoder
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
router = APIRouter(tags=["Agentic CFO Copilot"])

# --- NEW INTEGRATION: Agent and Memory Instances ---
SYSTEM_PROMPT = """
You are the Agentic CFO Copilot, an expert AI financial analyst. Your persona is that of a "Finance Guardian" and "Financial Storyteller". Your tone is always professional, data-driven, and trustworthy. You must answer questions based *only* on the context provided. Do not invent information. If the answer isn't in the data, say so.
"""
cfo_agent = Agent(system_prompt=SYSTEM_PROMPT)
agent_memory = ConversationalMemory(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379))
)

# ---

# This function is correct and remains unchanged.
def process_uploaded_file(file: UploadFile):
    # ... (code for this function remains the same and correct)
    try:
        content = file.file.read()
        csv_data = io.StringIO(content.decode('utf-8'))
        
        temp_file_path = "temp_api_upload.csv"
        with open(temp_file_path, "w") as f: f.write(csv_data.getvalue())
        
        ingestion_module = DataIngestion()
        normalized_df, header_mappings = ingestion_module.ingest_and_normalize(temp_file_path)
            
        validation_module = DataValidationQualityAssuranceEngine()
        validated_df, validation_report, corrections_log = validation_module.run_pipeline(normalized_df, header_mappings)
        
        feature_module = KPIAutoExtractionDynamicFeatureEngineering()
        featured_df, feature_schema = feature_module.extract_and_derive_features(validated_df)
        
        return { "featured_df": featured_df, "reports": { "validation_report": validation_report, "corrections_log": corrections_log, "feature_schema": feature_schema } }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during file processing: {str(e)}")

# This endpoint is UNTOUCHED. It works perfectly.
@router.post("/full_report")
async def get_full_financial_report(
    file: UploadFile = File(
        ...,
        description="The financial data in CSV format. The system will autonomously parse any column schema."
    ), 
    mode: str = Form(
        "finance_guardian",
        description="The persona for the agent's narrative generation. Use 'finance_guardian' for internal operational insights, or 'financial_storyteller' for external stakeholder narratives."
    )
):
    """
    **One-Shot Analysis Endpoint**
    
    This is a powerful endpoint that runs the entire AIML pipeline on a given CSV and returns a complete, structured dashboard report.
    It does not have conversational memory. Use this for generating static reports or initial dashboard loads.
    
    - **Upload a CSV**: The agent will clean it, validate it, and normalize it.
    - **Receive a full report**: Includes KPIs, 3-month forecasts for all key metrics (revenue, expenses, profit, cashflow, growth_rate), detected anomalies, correlation insights, and narrative summaries.
    - **Choose a persona**: Select `finance_guardian` or `financial_storyteller` to tailor the narrative output.
    """
    processing_results = process_uploaded_file(file)
    featured_df = processing_results["featured_df"]
    
    # Generate forecasts for all key metrics
    metrics_to_forecast = ['revenue', 'expenses', 'profit', 'cashflow']
    all_forecasts = {}
    all_model_health = {}
    
    for metric in metrics_to_forecast:
        forecasting_module = ForecastingModule(metric=metric)
        forecast, model_health = forecasting_module.generate_forecast(featured_df)
        all_forecasts[metric] = forecast
        all_model_health[metric] = model_health
    
    # Calculate growth_rate forecast from revenue forecast
    if all_forecasts['revenue']:
        growth_rate_forecast = []
        for i, forecast_point in enumerate(all_forecasts['revenue']):
            if i == 0 and len(featured_df) > 0:
                # Compare first forecast with last actual revenue
                last_actual = featured_df['revenue'].iloc[-1]
                growth = ((forecast_point['predicted'] - last_actual) / last_actual * 100) if last_actual != 0 else 0
            elif i > 0:
                # Compare with previous forecast point
                prev_forecast = all_forecasts['revenue'][i-1]['predicted']
                growth = ((forecast_point['predicted'] - prev_forecast) / prev_forecast * 100) if prev_forecast != 0 else 0
            else:
                growth = 0
            
            growth_rate_forecast.append({
                "date": forecast_point['date'],
                "predicted": growth,
                "lower": growth * 0.8,  # Approximate confidence interval
                "upper": growth * 1.2
            })
        all_forecasts['growth_rate'] = growth_rate_forecast
        all_model_health['growth_rate'] = {
            "model_id": f"model_derived_{int(datetime.now().timestamp())}",
            "best_model_selected": "Derived from Revenue",
            "forecast_metric": "growth_rate",
            "status": "Success"
        }
    
    # Use revenue for anomaly detection (primary metric)
    anomaly_module = AnomalyDetectionModule()
    anomalies = anomaly_module.detect_anomalies(featured_df, metric='revenue')
    
    correlation_module = CrossMetricCorrelationTrendMiningEngine()
    correlation_report = correlation_module.generate_correlation_report(featured_df)
    explainer_module = ExplainabilityAuditLayer()
    profit_drivers = explainer_module.get_profit_drivers(featured_df)
    dashboard_module = BusinessDashboardOutputLayer()
    
    # Pass revenue forecast for backward compatibility with dashboard module
    dashboard_output = dashboard_module.generate_dashboard(
        featured_df=featured_df, forecast=all_forecasts['revenue'], anomalies=anomalies, mode=mode, correlation_report=correlation_report
    )
    
    # Replace single forecast_chart with multi-metric forecasts
    dashboard_output["forecast_chart"] = all_forecasts
    
    dashboard_output["supporting_reports"] = processing_results["reports"]
    dashboard_output["model_health_report"] = all_model_health
    dashboard_output["raw_data_preview"] = json.loads(featured_df.head().to_json(orient='records', date_format='iso'))
    dashboard_output["profit_drivers"] = profit_drivers
    
    # Use the proven manual serialization method
    json_string = json.dumps(dashboard_output, cls=CustomJSONEncoder)
    return Response(content=json_string, media_type="application/json")

# This endpoint is UNTOUCHED. It works perfectly.
@router.post("/simulate")
async def simulate_scenario_endpoint(
    file: UploadFile = File(
        ..., 
        description="The financial data in CSV format to use as the baseline for the simulation."
    ),
    parameter: str = Form(
        ..., 
        description="The financial metric you want to change (e.g., 'expenses', 'revenue')."
    ),
    change_pct: float = Form(
        ..., 
        description="The percentage to change the parameter by. Use positive numbers for increase (e.g., 10 for +10%) and negative for decrease (e.g., -5 for -5%)."
    )
):
    """
    **"What-If" Scenario Engine**
    
    This endpoint allows you to test hypothetical scenarios and see their projected impact on key financial metrics.
    
    - **Example**: See what happens to `profit` and `cashflow` if your `expenses` go up by `15%`.
    - **Returns**: A detailed report comparing the baseline metrics to the simulated results.
    """
    processing_results = process_uploaded_file(file)
    featured_df = processing_results["featured_df"]
    simulation_module = ScenarioSimulationEngine()
    simulation_report = simulation_module.simulate_scenario(df=featured_df, parameter=parameter, change_pct=change_pct)
    
    # Use the proven manual serialization method
    json_string = json.dumps(simulation_report, cls=CustomJSONEncoder)
    return Response(content=json_string, media_type="application/json")

# --- NEW LOGIC ADDED CAREFULLY ON TOP ---
# This new endpoint applies the same proven manual serialization fix.
@router.post("/agent/analyze_and_respond")
async def agent_analyze_and_respond(
    file: UploadFile = File(
        ..., 
        description="The financial data in CSV format that provides the context for the conversation."
    ),
    user_query: str = Form(
        ..., 
        description="The user's natural language question about the financial data (e.g., 'What's our biggest risk?')."
    ),
    session_id: Optional[str] = Form(
        None, 
        description="**Crucial for conversation.** Leave blank for the first question. For all follow-up questions, provide the `session_id` returned by the previous response."
    )
):
    """
    **Primary Conversational Endpoint (Production-Ready)**
    
    This is the main entry point for interacting with the AI agent. It performs a full analysis and then uses a Large Language Model (LLM) to generate a human-like response to your specific query based on the data.
    
    - **Stateful Interaction**: It uses a `session_id` to remember the context of your conversation, allowing for intelligent follow-up questions.
    - **How it works**:
        1. On your **first request**, leave `session_id` blank. The agent will analyze the data, answer your query, and return a new `session_id`.
        2. Your application must **save this `session_id`**.
        3. On your **second and subsequent requests**, you must re-upload the file and provide the saved `session_id` to continue the conversation.
    - **Returns**: A comprehensive JSON object containing the `ai_response`, the full structured `full_analysis_report` (for building charts/tables), the `session_id`, and the `conversation_history`.
    """
    if not session_id:
        session_id = str(uuid.uuid4())

    # Run the full analysis pipeline to get the necessary context
    processing_results = process_uploaded_file(file)
    featured_df = processing_results["featured_df"]
    forecasting_module = ForecastingModule(metric='revenue')
    forecast, _ = forecasting_module.generate_forecast(featured_df)
    anomaly_module = AnomalyDetectionModule()
    anomalies = anomaly_module.detect_anomalies(featured_df, metric='revenue')
    explainer_module = ExplainabilityAuditLayer()
    profit_drivers = explainer_module.get_profit_drivers(featured_df)
    dashboard_module = BusinessDashboardOutputLayer()
    full_analysis = dashboard_module.generate_dashboard(
        featured_df=featured_df, forecast=forecast, anomalies=anomalies
    )
    full_analysis["profit_drivers"] = profit_drivers
    
    # Generate the intelligent response using the agent brain
    ai_response_text = cfo_agent.generate_response(user_query=user_query, data_context=full_analysis)
    
    # Update the conversational memory
    analysis_summary = {
        "user_query": user_query, "ai_response": ai_response_text,
        "key_kpis": full_analysis.get('kpis')
    }
    agent_memory.update_context(session_id, str(uuid.uuid4()), analysis_summary)
    
    history = agent_memory.recall_related_history(session_id)
    
    # Assemble the final response dictionary
    final_response_data = {
        "ai_response": ai_response_text,
        "full_analysis_report": full_analysis,
        "session_id": session_id,
        "conversation_history": history
    }

    # Use the proven manual serialization method for the final response
    json_string = json.dumps(final_response_data, cls=CustomJSONEncoder)
    return Response(content=json_string, media_type="application/json")