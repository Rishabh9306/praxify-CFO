import pandas as pd
import pytest
from aiml_engine.core.anomaly_detection import AnomalyDetectionModule

@pytest.fixture
def sample_df_with_anomaly():
    """Creates a DataFrame with a clear anomaly."""
    dates = pd.to_datetime(pd.date_range(start="2023-01-01", periods=12, freq='MS'))
    revenue = [100, 105, 110, 108, 500, 112, 115, 120, 118, 122, 125, 128]
    df = pd.DataFrame({'date': dates, 'revenue': revenue})
    return df

def test_iqr_anomaly_detection(sample_df_with_anomaly):
    """Tests the IQR method for finding anomalies."""
    detector = AnomalyDetectionModule()
    anomalies = detector.detect_anomalies(sample_df_with_anomaly, metric='revenue', method='iqr')

    assert len(anomalies) == 1
    anomaly = anomalies[0]
    assert anomaly['value'] == 500
    assert anomaly['severity'] == 'High'
    assert anomaly['date'] == '2023-05-01'

def test_isolation_forest_anomaly_detection(sample_df_with_anomaly):
    """Tests the Isolation Forest method for finding anomalies."""
    detector = AnomalyDetectionModule()
    anomalies = detector.detect_anomalies(sample_df_with_anomaly, metric='revenue', method='isolation_forest')

    # Isolation Forest may be more or less sensitive, but should catch the obvious one
    assert len(anomalies) >= 1
    assert any(a['value'] == 500 for a in anomalies)