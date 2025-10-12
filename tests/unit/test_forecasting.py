import pandas as pd
import pytest
from aiml_engine.core.forecasting import ForecastingModule

@pytest.fixture
def sample_time_series_df():
    """Creates a sample DataFrame for forecasting tests."""
    dates = pd.to_datetime(pd.date_range(start="2022-01-01", periods=36, freq='MS'))
    # A simple series with a linear trend and some noise
    revenue = [100 + i * 10 + (i % 5) * 5 for i in range(36)]
    df = pd.DataFrame({'date': dates, 'revenue': revenue})
    return df

def test_forecasting_module_runs(sample_time_series_df):
    """Tests that the forecast generates an output with the correct structure."""
    forecaster = ForecastingModule(metric='revenue', forecast_horizon=3)
    forecast, model_health = forecaster.generate_forecast(sample_time_series_df)

    assert isinstance(forecast, list)
    assert len(forecast) == 3
    assert all(k in forecast[0] for k in ['date', 'predicted', 'lower', 'upper'])
    
    assert isinstance(model_health, dict)
    assert 'best_model_selected' in model_health
    assert model_health['status'] == 'Success'

def test_forecasting_with_insufficient_data():
    """Tests that the forecast fails gracefully with too little data."""
    dates = pd.date_range(start="2023-01-01", periods=12, freq='MS')
    df = pd.DataFrame({'date': dates, 'revenue': range(12)})
    
    forecaster = ForecastingModule()
    forecast, model_health = forecaster.generate_forecast(df)
    
    assert forecast == []
    assert model_health['status'] == 'Failed'
    assert 'Not enough data' in model_health['reason']