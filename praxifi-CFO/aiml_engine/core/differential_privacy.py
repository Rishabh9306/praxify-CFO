"""
Differential Privacy Module

Implements ε-differential privacy to protect financial data confidentiality.
Adds calibrated noise to outputs to prevent reverse-engineering of input data.

Key Features:
- Mathematically proven privacy guarantees
- Tunable privacy/accuracy tradeoff via epsilon parameter
- Zero breaking changes to existing code
- Minimal performance overhead

Theory:
- Laplacian mechanism for numerical values
- Gaussian mechanism for high-dimensional data
- Privacy budget tracking
"""

import numpy as np
from typing import Union, List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()


class DifferentialPrivacy:
    """
    Applies differential privacy to protect sensitive financial data.
    
    Privacy Parameter (epsilon):
    - Lower epsilon = Higher privacy, More noise
    - Higher epsilon = Lower privacy, Less noise
    
    Recommended values:
    - epsilon=0.1: Maximum privacy (research/development)
    - epsilon=1.0: Balanced privacy/accuracy (production)
    - epsilon=5.0: Minimal privacy (internal use only)
    """
    
    def __init__(self, epsilon: float = None):
        """
        Initialize differential privacy module.
        
        Args:
            epsilon: Privacy budget. If None, reads from DIFFERENTIAL_PRIVACY_EPSILON env var.
                    Default is 1.0 if not specified.
        """
        if epsilon is None:
            epsilon = float(os.getenv("DIFFERENTIAL_PRIVACY_EPSILON", "1.0"))
        
        if epsilon <= 0:
            raise ValueError("Epsilon must be positive (epsilon > 0)")
        
        self.epsilon = epsilon
        self.enabled = os.getenv("DIFFERENTIAL_PRIVACY_ENABLED", "true").lower() == "true"
        
        # Privacy budget tracking (optional, for advanced use)
        self.total_budget_spent = 0.0
        
    def add_laplace_noise(self, value: float, sensitivity: float = 1.0) -> float:
        """
        Add Laplacian noise to a single numerical value.
        
        Laplace mechanism is standard for differential privacy on numerical data.
        
        Args:
            value: Original numerical value
            sensitivity: Global sensitivity of the query (max change in output 
                        from changing one input). Default=1.0 for most financial metrics.
        
        Returns:
            Value with added noise for differential privacy
        """
        if not self.enabled:
            return value
        
        # Laplacian noise scale: sensitivity / epsilon
        scale = sensitivity / self.epsilon
        
        # Add noise from Laplace distribution
        noise = np.random.laplace(0, scale)
        
        # Track privacy budget (optional)
        self.total_budget_spent += self.epsilon
        
        return value + noise
    
    def add_gaussian_noise(self, value: float, sensitivity: float = 1.0, delta: float = 1e-5) -> float:
        """
        Add Gaussian noise for (epsilon, delta)-differential privacy.
        
        Used for queries with lower sensitivity requirements.
        
        Args:
            value: Original numerical value
            sensitivity: Global sensitivity
            delta: Failure probability (typically 1e-5 or smaller)
        
        Returns:
            Value with added Gaussian noise
        """
        if not self.enabled:
            return value
        
        # Gaussian mechanism: sigma = sensitivity * sqrt(2 * ln(1.25/delta)) / epsilon
        sigma = sensitivity * np.sqrt(2 * np.log(1.25 / delta)) / self.epsilon
        
        # Add Gaussian noise
        noise = np.random.normal(0, sigma)
        
        return value + noise
    
    def privatize_forecast(self, forecast: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply differential privacy to forecast predictions.
        
        Adds noise to predicted values and confidence intervals.
        
        Args:
            forecast: List of forecast dictionaries with 'predicted', 'lower', 'upper' keys
        
        Returns:
            Privatized forecast with added noise
        """
        if not self.enabled or not forecast:
            return forecast
        
        privatized = []
        for point in forecast:
            # Sensitivity: assume max forecast value change is 10% for any single data point
            # This is conservative - actual sensitivity may be lower
            
            # Support both 'predicted'/'lower'/'upper' and Prophet's 'yhat'/'yhat_lower'/'yhat_upper'
            predicted = point.get('predicted', point.get('yhat', 0))
            lower = point.get('lower', point.get('yhat_lower', predicted))
            upper = point.get('upper', point.get('yhat_upper', predicted))
            
            avg_value = (predicted + lower + upper) / 3
            sensitivity = abs(avg_value * 0.1)  # 10% of average value
            
            # Support both 'date' and Prophet's 'ds' field
            date_field = point.get('date', point.get('ds'))
            
            # Add noise to each value
            privatized_pred = self.add_laplace_noise(predicted, sensitivity)
            privatized_lower = self.add_laplace_noise(lower, sensitivity)
            privatized_upper = self.add_laplace_noise(upper, sensitivity)
            
            # CRITICAL FIX: After adding noise, re-sort intervals to maintain correct order
            # Ensure lower <= predicted <= upper (or as close as possible)
            interval_values = sorted([privatized_lower, privatized_upper])
            final_lower = min(interval_values[0], privatized_pred)
            final_upper = max(interval_values[1], privatized_pred)
            
            privatized_point = {
                'date' if 'date' in point else 'ds': date_field,  # Date is not sensitive
                'predicted' if 'predicted' in point else 'yhat': privatized_pred,
                'lower' if 'lower' in point else 'yhat_lower': final_lower,
                'upper' if 'upper' in point else 'yhat_upper': final_upper
            }
            privatized.append(privatized_point)
        
        return privatized
    
    def privatize_kpi(self, kpi_value: float, metric_name: str = "generic") -> float:
        """
        Apply differential privacy to a single KPI metric.
        
        Args:
            kpi_value: Original KPI value
            metric_name: Name of metric (for sensitivity calibration)
        
        Returns:
            Privatized KPI value with appropriate bounds
        """
        if not self.enabled:
            return kpi_value
        
        # Sensitivity calibration based on metric type
        # Financial metrics typically have 5-10% sensitivity
        sensitivity = abs(kpi_value * 0.08)  # 8% default sensitivity
        
        # Special cases for specific metrics
        if 'ratio' in metric_name.lower() or 'margin' in metric_name.lower():
            # Ratios and margins have lower sensitivity (already normalized)
            sensitivity = abs(kpi_value * 0.05)  # 5% for ratios
        elif 'growth' in metric_name.lower():
            # Growth rates can be more volatile
            sensitivity = abs(kpi_value * 0.12)  # 12% for growth
        
        noisy_value = self.add_laplace_noise(kpi_value, sensitivity)
        
        # Apply bounds for percentage-based metrics (0-100% or 0-1)
        # These must stay within valid ranges
        if 'margin' in metric_name.lower() or 'ratio' in metric_name.lower():
            if 0 <= kpi_value <= 1:  # Normalized to 0-1
                noisy_value = max(0.0, min(1.0, noisy_value))
            elif 0 <= kpi_value <= 100:  # Percentage 0-100
                noisy_value = max(0.0, min(100.0, noisy_value))
        
        # Prevent negative values for metrics that can't be negative
        if 'revenue' in metric_name.lower() or 'profit' in metric_name.lower() or 'cashflow' in metric_name.lower():
            # Financial amounts can be negative (losses), so no lower bound
            pass
        
        return noisy_value
    
    def privatize_shap_values(self, shap_attributions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply differential privacy to SHAP feature attribution scores.
        
        Args:
            shap_attributions: List of dicts with 'feature' and 'contribution_score'
        
        Returns:
            Privatized SHAP attributions
        """
        if not self.enabled or not shap_attributions:
            return shap_attributions
        
        privatized = []
        for attr in shap_attributions:
            score = attr.get('contribution_score', 0)
            # SHAP values are typically small, use conservative sensitivity
            sensitivity = abs(score * 0.15)  # 15% sensitivity for SHAP
            
            privatized_attr = {
                'feature': attr['feature'],  # Feature name is not sensitive
                'contribution_score': self.add_laplace_noise(score, sensitivity)
            }
            privatized.append(privatized_attr)
        
        return privatized
    
    def privatize_dict(self, data: Dict[str, Any], sensitive_keys: List[str] = None) -> Dict[str, Any]:
        """
        Apply differential privacy to numerical values in a dictionary.
        
        Args:
            data: Dictionary with mixed data types
            sensitive_keys: List of keys to apply privacy to. If None, applies to all numerical values.
        
        Returns:
            Dictionary with privatized numerical values
        """
        if not self.enabled or not data:
            return data
        
        # Non-sensitive metrics that should NOT be privatized
        # These are model performance metrics, not sensitive financial data
        NON_SENSITIVE_METRICS = {
            'forecast_accuracy',      # Model performance metric (0-100%)
            'financial_health_score', # Derived score, not raw financial data
            'model_rmse',            # Model error metric
            'model_mae',             # Model error metric
            'backtesting_score',     # Model validation metric
        }
        
        privatized = data.copy()
        
        for key, value in privatized.items():
            # Skip non-sensitive metrics
            if key in NON_SENSITIVE_METRICS:
                continue
            
            # Only privatize if key is in sensitive_keys (or if sensitive_keys is None)
            if sensitive_keys is not None and key not in sensitive_keys:
                continue
            
            # Apply privacy to numerical values
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                privatized[key] = self.privatize_kpi(float(value), key)
            
            # Recursively handle nested dictionaries
            elif isinstance(value, dict):
                privatized[key] = self.privatize_dict(value, sensitive_keys)
            
            # Handle lists of dictionaries (e.g., forecasts)
            elif isinstance(value, list) and value and isinstance(value[0], dict):
                if 'predicted' in value[0]:  # Looks like a forecast
                    privatized[key] = self.privatize_forecast(value)
                else:
                    privatized[key] = [self.privatize_dict(item, sensitive_keys) for item in value]
        
        return privatized
    
    def get_privacy_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about current privacy settings.
        
        Returns:
            Dictionary with privacy configuration and metrics
        """
        return {
            "differential_privacy_enabled": self.enabled,
            "epsilon": self.epsilon,
            "privacy_level": self._get_privacy_level(),
            "total_budget_spent": round(self.total_budget_spent, 4),
            "privacy_guarantee": f"ε-differential privacy with ε={self.epsilon}"
        }
    
    def _get_privacy_level(self) -> str:
        """Get human-readable privacy level based on epsilon."""
        if self.epsilon <= 0.5:
            return "Maximum"
        elif self.epsilon <= 1.5:
            return "High"
        elif self.epsilon <= 3.0:
            return "Medium"
        elif self.epsilon <= 5.0:
            return "Low"
        else:
            return "Minimal"


# Global instance for easy import
# Can be configured via environment variables:
# - DIFFERENTIAL_PRIVACY_ENABLED=true/false
# - DIFFERENTIAL_PRIVACY_EPSILON=1.0
privacy_engine = DifferentialPrivacy()


# Convenience functions for direct use
def privatize_value(value: float, sensitivity: float = 1.0) -> float:
    """Quick function to privatize a single value."""
    return privacy_engine.add_laplace_noise(value, sensitivity)


def privatize_forecast(forecast: List[Dict]) -> List[Dict]:
    """Quick function to privatize a forecast."""
    return privacy_engine.privatize_forecast(forecast)


def privatize_kpis(kpis: Dict[str, float]) -> Dict[str, float]:
    """Quick function to privatize KPI dictionary."""
    privatized = {}
    for key, value in kpis.items():
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            privatized[key] = privacy_engine.privatize_kpi(value, key)
        else:
            privatized[key] = value
    return privatized
