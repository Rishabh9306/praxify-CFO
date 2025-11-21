import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, Any

class ExplainabilityAuditLayer:
    """
    Adds feature attribution using SHAP (SHapley Additive exPlanations)
    to explain model predictions or key insights.
    This version is hardened to handle small or empty datasets.
    """

    def get_profit_drivers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Uses a simple RandomForest model to determine the key drivers of profit.
        """
        if 'profit' not in df.columns:
            return {"error": "Profit column not available for analysis."}
            
        features = df.select_dtypes(include=['float64', 'int64']).columns.drop('profit', errors='ignore')
        
        if len(features) == 0:
            return {
                "insight": "No numeric features available to determine profit drivers.",
                "feature_attributions": [], "model_version": "N/A"
            }

        X = df[features].fillna(0)
        y = df['profit'].fillna(0)

        if X.empty or y.empty:
            return {
                "insight": "Not enough data to determine profit drivers.",
                "feature_attributions": [], "model_version": "N/A"
            }

        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)

        shap_df = pd.DataFrame(shap_values, columns=X.columns) if len(shap_values.shape) > 1 else pd.DataFrame([shap_values], columns=X.columns)
        mean_abs_shap = shap_df.abs().mean().sort_values(ascending=False)

        feature_attributions = [
            {"feature": feature, "contribution_score": round(contribution, 4)}
            for feature, contribution in mean_abs_shap.head(5).to_dict().items()
        ]

        return {
            "insight": "Top 5 factors impacting profit, based on historical data.",
            "feature_attributions": feature_attributions,
            "model_version": f"Explainability_RF_{pd.Timestamp.now().strftime('%Y-%m-%d')}"
        }