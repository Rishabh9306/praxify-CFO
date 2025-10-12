import pandas as pd
import io
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from starlette.responses import Response 
from typing import Dict, Any

from aiml_engine.core.data_ingestion import DataIngestion
from aiml_engine.core.data_validation import DataValidationQualityAssuranceEngine
from aiml_engine.core.feature_engineering import KPIAutoExtractionDynamicFeatureEngineering
from aiml_engine.core.forecasting import ForecastingModule
from aiml_engine.core.anomaly_detection import AnomalyDetectionModule
from aiml_engine.core.correlation import CrossMetricCorrelationTrendMiningEngine
from aiml_engine.core.simulation import ScenarioSimulationEngine
from aiml_engine.core.dashboard import BusinessDashboardOutputLayer
from aiml_engine.utils.helpers import CustomJSONEncoder

router = APIRouter()

def process_uploaded_file(file: UploadFile):
    """
    This function is correct and remains unchanged. It runs the core
    data processing pipeline.
    """
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


@router.post("/full_report")
async def get_full_financial_report(
    file: UploadFile = File(...), 
    mode: str = Form("finance_guardian"), 
    forecast_metric: str = Form("revenue")
):
    """
    Processes a CSV, runs the full AIML pipeline, and returns a robust JSON response.
    """
    processing_results = process_uploaded_file(file)
    featured_df = processing_results["featured_df"]
    
    # Run the core AIML modules
    forecasting_module = ForecastingModule(metric=forecast_metric)
    forecast, model_health = forecasting_module.generate_forecast(featured_df)
    
    anomaly_module = AnomalyDetectionModule()
    anomalies = anomaly_module.detect_anomalies(featured_df, metric=forecast_metric)
    
    correlation_module = CrossMetricCorrelationTrendMiningEngine()
    correlation_report = correlation_module.generate_correlation_report(featured_df)
    
    dashboard_module = BusinessDashboardOutputLayer()
    dashboard_output = dashboard_module.generate_dashboard(
        featured_df=featured_df, forecast=forecast, anomalies=anomalies,
        mode=mode, correlation_report=correlation_report
    )
    
    # Assemble the final dictionary
    dashboard_output["supporting_reports"] = processing_results["reports"]
    dashboard_output["model_health_report"] = model_health

    # --- THIS IS THE DATE FORMAT FIX ---
    # Add the raw data preview with human-readable ISO date format.
    # The `to_json` function handles the conversion from Unix time to a string.
    dashboard_output["raw_data_preview"] = json.loads(
        featured_df.head().to_json(orient='records', date_format='iso')
    )
    # --- END OF FIX ---

    # Manually serialize the final dictionary to a JSON string using our proven encoder.
    # This guarantees all NumPy, NaN, and other special types are correctly handled.
    json_string = json.dumps(dashboard_output, cls=CustomJSONEncoder)
    
    # Return a raw Starlette Response object, bypassing FastAPI's problematic logic.
    return Response(content=json_string, media_type="application/json")


@router.post("/simulate")
async def simulate_scenario_endpoint(
    file: UploadFile = File(...), parameter: str = Form(...), change_pct: float = Form(...)
):
    """
    Runs the simulation engine and returns a robust JSON response.
    """
    processing_results = process_uploaded_file(file)
    featured_df = processing_results["featured_df"]

    simulation_module = ScenarioSimulationEngine()
    simulation_report = simulation_module.simulate_scenario(
        df=featured_df, parameter=parameter, change_pct=change_pct
    )
    
    # Apply the same manual serialization here for guaranteed robustness.
    json_string = json.dumps(simulation_report, cls=CustomJSONEncoder)
    return Response(content=json_string, media_type="application/json")