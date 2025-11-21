import os
from aiml_engine.main import run_pipeline

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TEST_DIR, '..', '..'))
SAMPLE_DATA_PATH = os.path.join(PROJECT_ROOT, 'aiml_engine', 'data', 'sample_financial_data.csv')

def test_full_pipeline_execution():
    """
    Tests the end-to-end execution of the main pipeline function.
    It checks if the pipeline runs without errors and produces a valid output structure.
    """
    # This is a smoke test to ensure the pipeline runs.
    # A real test would check the output values more rigorously.
    output = run_pipeline(SAMPLE_DATA_PATH)

    assert isinstance(output, dict)
    assert "kpis" in output
    assert "forecast_chart" in output
    assert "anomalies_table" in output
    assert "narratives" in output
    
    # Check that KPI keys are present
    kpi_keys = ["total_revenue", "total_expenses", "profit_margin", "financial_health_score"]
    for key in kpi_keys:
        assert key in output["kpis"]

    # Check if the output JSON file was created
    assert os.path.exists("dashboard_output.json")
    os.remove("dashboard_output.json") # Clean up