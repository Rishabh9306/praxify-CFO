import argparse
import json
import os # <-- 1. ADD THIS IMPORT
import pandas as pd

from aiml_engine.core.data_ingestion import DataIngestion
from aiml_engine.core.data_validation import DataValidationQualityAssuranceEngine
from aiml_engine.core.feature_engineering import KPIAutoExtractionDynamicFeatureEngineering
from aiml_engine.core.forecasting import ForecastingModule
from aiml_engine.core.anomaly_detection import AnomalyDetectionModule
from aiml_engine.core.dashboard import BusinessDashboardOutputLayer
from aiml_engine.utils.helpers import save_json

def run_pipeline(file_path: str):
    """
    Executes the full AIML pipeline from data ingestion to dashboard generation
    for command-line usage.

    Args:
        file_path (str): The path to the input CSV file.
    """
    print("🚀 Starting Agentic CFO Copilot AIML Pipeline...")
    
    # --- THE FIX IS HERE ---
    # Convert the user-provided path to an absolute path.
    # This ensures it's found regardless of where the script is executed from.
    absolute_file_path = os.path.abspath(file_path) # <-- 2. ADD THIS LINE
    # --- END OF FIX ---

    # Step 1: Ingest and Normalize Data
    print("Step 1: Ingesting and Normalizing Data...")
    ingestion_module = DataIngestion()
    normalized_df, header_mappings = ingestion_module.ingest_and_normalize(absolute_file_path) # <-- 3. USE THE NEW VARIABLE
    if normalized_df.empty:
        print("❌ Pipeline stopped: Data ingestion failed.")
        return

    # Step 2: Data Validation & Quality Assurance
    print("Step 2: Validating Data Quality...")
    validation_module = DataValidationQualityAssuranceEngine()
    validated_df, validation_report, _ = validation_module.run_pipeline(normalized_df, header_mappings)
    print(f"Validation complete. {validation_report['missing_values_imputed']} values imputed.")

    # Step 3: KPI Auto-Extraction & Feature Engineering
    print("Step 3: Engineering Features and KPIs...")
    feature_module = KPIAutoExtractionDynamicFeatureEngineering()
    featured_df, _ = feature_module.extract_and_derive_features(validated_df)
    print("Feature engineering complete.")

    # Step 4: Forecasting
    print("Step 4: Generating Forecast...")
    forecasting_module = ForecastingModule(metric='revenue')
    forecast, model_health = forecasting_module.generate_forecast(featured_df)
    print(f"Forecasting complete. Best model: {model_health.get('best_model_selected', 'N/A')}")

    # Step 5: Anomaly Detection
    print("Step 5: Detecting Anomalies...")
    anomaly_module = AnomalyDetectionModule()
    anomalies = anomaly_module.detect_anomalies(featured_df, metric='revenue')
    print(f"{len(anomalies)} anomalies detected.")

    # Step 6: Generate Dashboard Output
    print("Step 6: Generating Final Dashboard Output...")
    dashboard_module = BusinessDashboardOutputLayer()
    dashboard_output = dashboard_module.generate_dashboard(
        featured_df=featured_df,
        forecast=forecast,
        anomalies=anomalies,
        mode="finance_guardian" # Default mode for CLI
    )

    # Save the final output to a file
    output_filename = 'dashboard_output.json'
    save_json(dashboard_output, output_filename)

    print(f"\n✅ Pipeline finished successfully! Output saved to '{output_filename}'.")
    return dashboard_output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Agentic CFO Copilot AIML Engine.")
    parser.add_argument("--file_path", type=str, required=True, help="Path to the financial data CSV file.")
    args = parser.parse_args()

    run_pipeline(args.file_path)