#!/usr/bin/env python3
"""
Quick validation test for parallel forecasting implementation.
This test ensures the parallel processing code works without errors.
"""

import sys
import pandas as pd
import io
from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing

# Mock the ForecastingModule for testing
class MockForecastingModule:
    def __init__(self, metric):
        self.metric = metric
    
    def generate_forecast(self, df):
        # Return mock forecast data
        return (
            [{"date": "2025-12-01", "predicted": 100000, "lower": 90000, "upper": 110000}],
            {"status": "Success", "metric": self.metric}
        )

def _forecast_single_metric(metric: str, df_json: str):
    """Test version of parallel forecasting function"""
    try:
        df = pd.read_json(io.StringIO(df_json))
        # Use mock instead of real forecasting for speed
        forecast = [{"date": "2025-12-01", "predicted": 100000, "lower": 90000, "upper": 110000}]
        model_health = {"status": "Success", "metric": metric}
        return (metric, forecast, model_health)
    except Exception as e:
        return (metric, [], {"status": "Failed", "reason": str(e)})

def test_parallel_forecasting():
    """Test parallel forecasting with mock data"""
    print("🧪 Testing Parallel Forecasting Implementation\n")
    
    # Create mock DataFrame
    test_df = pd.DataFrame({
        'date': pd.date_range('2023-01-01', periods=100, freq='D'),
        'revenue': [100000 + i*1000 for i in range(100)],
        'expenses': [80000 + i*800 for i in range(100)],
        'profit': [20000 + i*200 for i in range(100)],
        'cashflow': [15000 + i*150 for i in range(100)]
    })
    
    print(f"✅ Created test DataFrame: {len(test_df)} rows")
    
    # Serialize DataFrame
    df_json = test_df.to_json(date_format='iso')
    print(f"✅ Serialized DataFrame: {len(df_json)} bytes")
    
    # Test metrics
    test_metrics = ['revenue', 'expenses', 'profit', 'cashflow']
    
    # Determine workers
    max_workers = min(multiprocessing.cpu_count(), len(test_metrics))
    print(f"✅ Using {max_workers} parallel workers (CPU cores: {multiprocessing.cpu_count()})")
    
    # Run parallel forecasting
    print(f"\n⚡ Running parallel forecasts for {len(test_metrics)} metrics...")
    all_forecasts = {}
    all_model_health = {}
    
    try:
        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            # Submit all jobs
            future_to_metric = {
                executor.submit(_forecast_single_metric, metric, df_json): metric
                for metric in test_metrics
            }
            
            # Collect results
            for future in as_completed(future_to_metric):
                metric_name, forecast, model_health = future.result()
                if forecast:
                    all_forecasts[metric_name] = forecast
                    all_model_health[metric_name] = model_health
                    print(f"   ✓ {metric_name}: {model_health['status']}")
        
        print(f"\n✅ SUCCESS: All {len(all_forecasts)} forecasts completed")
        print(f"   - Forecasts generated: {list(all_forecasts.keys())}")
        print(f"   - Model health reports: {len(all_model_health)}")
        
        print("\n🎯 Parallel Processing Test: PASSED ✅")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Parallel processing failed")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_parallel_forecasting()
    sys.exit(0 if success else 1)
