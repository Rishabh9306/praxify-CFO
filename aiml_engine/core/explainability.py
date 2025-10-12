import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, List, Any

class ExplainabilityAuditLayer:
    """
    Adds feature attribution using SHAP (SHapley Additive exPlanations)
    to explain model predictions or key insights.
    """

    def get_profit_drivers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Uses a simple RandomForest model to determine the key drivers of profit.

        Args:
            df (pd.DataFrame): The feature-engineered DataFrame.

        Returns:
            A dictionary containing feature attributions (SHAP values).
        """
        if 'profit' not in df.columns:
            return {"error": "Profit column not available for analysis."}

        # Define features and target
        features = df.select_dtypes(include=['float64', 'int64']).columns.drop('profit', errors='ignore')
        X = df[features].fillna(0)
        y = df['profit'].fillna(0)

        if len(X.columns) == 0:
            return {"error": "No features available to explain profit."}

        # Train a model to learn the relationships
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)

        # Use SHAP to explain the model's predictions
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)

        # Summarize the SHAP values to get global feature importance
        mean_abs_shap = pd.DataFrame(abs(shap_values), columns=X.columns).mean().sort_values(ascending=False)

        feature_attributions = [
            {"feature": feature, "contribution": round(contribution, 4)}
            for feature, contribution in mean_abs_shap.head(5).to_dict().items()
        ]

        return {
            "insight": "Top 5 drivers impacting profit based on historical data.",
            "feature_attributions": feature_attributions,
            "model_version": f"Explainability_RF_{pd.Timestamp.now().strftime('%Y-%m-%d')}"
        }