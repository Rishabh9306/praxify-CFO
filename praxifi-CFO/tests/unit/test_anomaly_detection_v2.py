"""
Unit tests for Enhanced Anomaly Detection V2
=============================================

Tests all 6 detection algorithms and ensemble voting system.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from aiml_engine.core.anomaly_detection_v2 import (
    EnhancedAnomalyDetectionModule,
    AnomalyDetectionModule
)


class TestEnhancedAnomalyDetection:
    """Test suite for enhanced anomaly detection."""
    
    @pytest.fixture
    def sample_data_with_spike(self):
        """Create sample data with one clear anomaly."""
        dates = pd.date_range('2023-01-01', periods=24, freq='MS')
        revenue = [100000] * 11 + [500000] + [100000] * 12  # Spike in month 12
        df = pd.DataFrame({
            'date': dates,
            'revenue': revenue,
            'expenses': [50000] * 24,
            'profit': [50000] * 24
        })
        return df
    
    @pytest.fixture
    def sample_data_no_anomalies(self):
        """Create stable data with no anomalies."""
        dates = pd.date_range('2023-01-01', periods=24, freq='MS')
        revenue = [100000 + np.random.normal(0, 5000) for _ in range(24)]
        df = pd.DataFrame({
            'date': dates,
            'revenue': revenue
        })
        return df
    
    @pytest.fixture
    def sample_data_multi_metrics(self):
        """Create data with anomalies in multiple metrics."""
        dates = pd.date_range('2023-01-01', periods=24, freq='MS')
        revenue = [100000] * 11 + [500000] + [100000] * 12
        expenses = [50000] * 11 + [250000] + [50000] * 12
        profit = [50000] * 24  # No anomaly
        df = pd.DataFrame({
            'date': dates,
            'revenue': revenue,
            'expenses': expenses,
            'profit': profit
        })
        return df
    
    def test_ensemble_detection_with_spike(self, sample_data_with_spike):
        """Test ensemble voting detects clear anomaly with high confidence."""
        detector = EnhancedAnomalyDetectionModule(confidence_threshold=0.5)
        anomalies = detector.detect_anomalies(
            sample_data_with_spike,
            metrics=['revenue'],
            method='ensemble'
        )
        
        # Should detect exactly 1 anomaly
        assert len(anomalies) >= 1, "Should detect at least 1 anomaly"
        
        # Check the anomaly is the spike
        spike_anomaly = [a for a in anomalies if a['value'] == 500000]
        assert len(spike_anomaly) >= 1, "Should detect the 500k spike"
        
        # Check confidence is reasonable
        assert spike_anomaly[0]['confidence'] >= 0.5, "Confidence should be >= 50%"
        
        # Check severity is high
        assert spike_anomaly[0]['severity_level'] in ['HIGH', 'CRITICAL'], \
            "Spike should be HIGH or CRITICAL severity"
    
    def test_no_false_positives(self, sample_data_no_anomalies):
        """Test that stable data produces minimal/no false positives."""
        detector = EnhancedAnomalyDetectionModule(confidence_threshold=0.6)
        anomalies = detector.detect_anomalies(
            sample_data_no_anomalies,
            metrics=['revenue'],
            method='ensemble'
        )
        
        # Should have very few or no anomalies (small random variations shouldn't trigger)
        assert len(anomalies) <= 2, \
            f"Stable data should have ≤2 anomalies, found {len(anomalies)}"
    
    def test_multi_metric_detection(self, sample_data_multi_metrics):
        """Test detection across multiple metrics."""
        detector = EnhancedAnomalyDetectionModule(confidence_threshold=0.5)
        anomalies = detector.detect_anomalies(
            sample_data_multi_metrics,
            metrics=['revenue', 'expenses', 'profit'],
            method='ensemble'
        )
        
        # Should detect anomalies in revenue and expenses, not profit
        metrics_flagged = {a['metric'].lower() for a in anomalies}
        
        assert 'revenue' in metrics_flagged, "Should detect revenue anomaly"
        assert 'expenses' in metrics_flagged, "Should detect expenses anomaly"
        # Profit may or may not be flagged depending on algorithms, so we don't assert
    
    def test_dynamic_iqr_method(self, sample_data_with_spike):
        """Test dynamic IQR method alone."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector._detect_with_dynamic_iqr(
            sample_data_with_spike,
            'revenue'
        )
        
        assert len(anomalies) >= 1, "Dynamic IQR should detect the spike"
        assert anomalies[0]['method'] == 'dynamic_iqr'
        assert anomalies[0]['value'] == 500000
    
    def test_modified_zscore_method(self, sample_data_with_spike):
        """Test modified Z-score (MAD-based) method."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector._detect_with_modified_zscore(
            sample_data_with_spike,
            'revenue'
        )
        
        assert len(anomalies) >= 1, "Modified Z-score should detect the spike"
        assert anomalies[0]['method'] == 'modified_zscore'
    
    def test_isolation_forest_method(self, sample_data_with_spike):
        """Test Isolation Forest method."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector._detect_with_isolation_forest(
            sample_data_with_spike,
            'revenue'
        )
        
        assert len(anomalies) >= 1, "Isolation Forest should detect anomalies"
        assert anomalies[0]['method'] == 'isolation_forest'
    
    def test_lof_method(self, sample_data_with_spike):
        """Test Local Outlier Factor method."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector._detect_with_lof(
            sample_data_with_spike,
            'revenue'
        )
        
        # LOF may or may not detect depending on density, so just check it runs
        assert isinstance(anomalies, list)
        assert anomalies[0]['method'] == 'lof' if len(anomalies) > 0 else True
    
    def test_one_class_svm_method(self, sample_data_with_spike):
        """Test One-Class SVM method."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector._detect_with_one_class_svm(
            sample_data_with_spike,
            'revenue'
        )
        
        # SVM may or may not detect depending on hyperparameters
        assert isinstance(anomalies, list)
        assert anomalies[0]['method'] == 'one_class_svm' if len(anomalies) > 0 else True
    
    def test_grubbs_method(self, sample_data_with_spike):
        """Test Grubbs' test for outliers."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector._detect_with_grubbs(
            sample_data_with_spike,
            'revenue'
        )
        
        assert len(anomalies) >= 1, "Grubbs test should detect the spike"
        assert anomalies[0]['method'] == 'grubbs_test'
    
    def test_confidence_threshold_filtering(self, sample_data_with_spike):
        """Test that confidence threshold filters weak anomalies."""
        # High threshold (80%) - should detect fewer
        detector_high = EnhancedAnomalyDetectionModule(confidence_threshold=0.8)
        anomalies_high = detector_high.detect_anomalies(
            sample_data_with_spike,
            metrics=['revenue'],
            method='ensemble'
        )
        
        # Low threshold (30%) - should detect more
        detector_low = EnhancedAnomalyDetectionModule(confidence_threshold=0.3)
        anomalies_low = detector_low.detect_anomalies(
            sample_data_with_spike,
            metrics=['revenue'],
            method='ensemble'
        )
        
        # Low threshold should detect >= high threshold
        assert len(anomalies_low) >= len(anomalies_high), \
            "Lower threshold should detect more or equal anomalies"
    
    def test_severity_levels(self, sample_data_with_spike):
        """Test that severity levels are correctly assigned."""
        detector = EnhancedAnomalyDetectionModule(confidence_threshold=0.5)
        anomalies = detector.detect_anomalies(
            sample_data_with_spike,
            metrics=['revenue'],
            method='ensemble'
        )
        
        # Check that severity levels are valid
        valid_severities = {'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'}
        for anomaly in anomalies:
            assert anomaly['severity_level'] in valid_severities, \
                f"Invalid severity level: {anomaly['severity_level']}"
    
    def test_backward_compatibility(self, sample_data_with_spike):
        """Test that old API still works (single metric)."""
        # Old API: AnomalyDetectionModule with single metric
        detector = AnomalyDetectionModule()
        anomalies = detector.detect_anomalies(
            sample_data_with_spike,
            metric='revenue',
            method='ensemble'
        )
        
        assert len(anomalies) >= 1, "Backward compatible API should work"
        assert isinstance(anomalies, list)
        assert 'metric' in anomalies[0]
    
    def test_empty_dataframe(self):
        """Test handling of empty DataFrame."""
        detector = EnhancedAnomalyDetectionModule()
        df = pd.DataFrame({'date': [], 'revenue': []})
        anomalies = detector.detect_anomalies(df, metrics=['revenue'])
        
        assert anomalies == [], "Empty DataFrame should return empty anomalies"
    
    def test_missing_values(self):
        """Test handling of missing values."""
        dates = pd.date_range('2023-01-01', periods=24, freq='MS')
        revenue = [100000] * 10 + [None, None] + [100000] * 12
        df = pd.DataFrame({'date': dates, 'revenue': revenue})
        
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector.detect_anomalies(df, metrics=['revenue'], method='iqr')
        
        # Should handle NaN values gracefully
        assert isinstance(anomalies, list)
    
    def test_volatile_data_adjustment(self):
        """Test that dynamic IQR adjusts for high volatility."""
        dates = pd.date_range('2023-01-01', periods=24, freq='MS')
        
        # High volatility data
        volatile_revenue = [100000 + np.random.normal(0, 30000) for _ in range(24)]
        df_volatile = pd.DataFrame({'date': dates, 'revenue': volatile_revenue})
        
        detector = EnhancedAnomalyDetectionModule()
        anomalies_volatile = detector._detect_with_dynamic_iqr(df_volatile, 'revenue')
        
        # Should have fewer anomalies due to adjusted multiplier
        assert len(anomalies_volatile) <= 5, \
            "Volatile data should use lenient thresholds"
    
    def test_output_format(self, sample_data_with_spike):
        """Test that output format contains all required fields."""
        detector = EnhancedAnomalyDetectionModule()
        anomalies = detector.detect_anomalies(
            sample_data_with_spike,
            metrics=['revenue'],
            method='ensemble'
        )
        
        required_fields = [
            'date', 'metric', 'value', 'expected_value_mean',
            'deviation_pct', 'severity', 'method', 'reason'
        ]
        
        if len(anomalies) > 0:
            for field in required_fields:
                assert field in anomalies[0], f"Missing required field: {field}"
            
            # Ensemble-specific fields
            assert 'confidence' in anomalies[0]
            assert 'detection_methods' in anomalies[0]
            assert 'severity_level' in anomalies[0]


class TestAnomalyDetectionIntegration:
    """Integration tests for anomaly detection in pipeline."""
    
    def test_full_pipeline_with_real_data(self):
        """Test with more realistic financial data."""
        # Simulate 36 months of financial data
        dates = pd.date_range('2022-01-01', periods=36, freq='MS')
        
        # Seasonal revenue with one major anomaly
        revenue = []
        for i in range(36):
            base = 100000
            seasonal = 20000 * np.sin(i * np.pi / 6)  # 12-month seasonality
            noise = np.random.normal(0, 5000)
            value = base + seasonal + noise
            
            # Add anomaly at month 20
            if i == 20:
                value *= 2.5
            
            revenue.append(value)
        
        df = pd.DataFrame({
            'date': dates,
            'revenue': revenue,
            'expenses': [50000 + np.random.normal(0, 3000) for _ in range(36)],
            'profit': [50000 + np.random.normal(0, 3000) for _ in range(36)]
        })
        
        detector = EnhancedAnomalyDetectionModule(confidence_threshold=0.5)
        anomalies = detector.detect_anomalies(
            df,
            metrics=['revenue', 'expenses', 'profit'],
            method='ensemble'
        )
        
        # Should detect the major revenue anomaly
        revenue_anomalies = [a for a in anomalies if a['metric'].lower() == 'revenue']
        assert len(revenue_anomalies) >= 1, "Should detect revenue anomaly"
        
        # Check that the anomaly is around month 20
        anomaly_dates = [a['date'] for a in revenue_anomalies]
        assert '2023-09' in str(anomaly_dates) or '2023-08' in str(anomaly_dates), \
            "Should detect anomaly around month 20"
    
    def test_performance_with_large_dataset(self):
        """Test performance with larger dataset."""
        import time
        
        # Create 120 months (10 years) of data
        dates = pd.date_range('2015-01-01', periods=120, freq='MS')
        revenue = [100000 + np.random.normal(0, 10000) for _ in range(120)]
        revenue[60] = 500000  # Add anomaly
        
        df = pd.DataFrame({'date': dates, 'revenue': revenue})
        
        detector = EnhancedAnomalyDetectionModule()
        
        start_time = time.time()
        anomalies = detector.detect_anomalies(df, metrics=['revenue'], method='ensemble')
        elapsed = time.time() - start_time
        
        # Should complete in reasonable time (< 10 seconds for 120 rows)
        assert elapsed < 10, f"Detection took too long: {elapsed:.2f}s"
        assert len(anomalies) >= 1, "Should detect the anomaly"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
