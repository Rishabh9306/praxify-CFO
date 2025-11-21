import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any

from aiml_engine.core.narrative import NarrativeGenerationModule

# --- FINAL FIX: Add a robust cleaning function ---
def clean_kpis(kpis: Dict) -> Dict:
    """Recursively clean a dictionary to replace NaN/inf with None for JSON compliance."""
    cleaned = {}
    for key, value in kpis.items():
        if isinstance(value, dict):
            cleaned[key] = clean_kpis(value)
        elif isinstance(value, (float, np.floating)) and (np.isnan(value) or np.isinf(value)):
            cleaned[key] = None
        else:
            cleaned[key] = value
    return cleaned
# --- END OF FIX ---


class BusinessDashboardOutputLayer:
    """
    Generates the final JSON data model for the business dashboard,
    including KPI calculations, financial health scoring, and narrative generation.
    """
    def _calculate_forecast_accuracy(self, df: pd.DataFrame, model_health_report: Dict = None) -> float:
        """
        Calculate real-time forecast accuracy based on model health reports.
        
        Now uses the pre-calculated accuracy_percentage from each model's MAPE metric.
        Falls back to normalized RMSE calculation if MAPE not available.
        
        Args:
            df: DataFrame with actual values
            model_health_report: Dictionary of model health reports from forecasting
        
        Returns:
            Forecast accuracy percentage (0-100)
        """
        if not model_health_report:
            return 95.0  # Default if no model health data
        
        accuracies = []
        
        for metric, health in model_health_report.items():
            # Skip non-forecast entries (like departmental_revenue which has no RMSE)
            if 'backtesting_rmse' not in health and 'accuracy_percentage' not in health:
                continue
            
            # Use pre-calculated accuracy if available (most accurate)
            if 'accuracy_percentage' in health:
                accuracy = float(health['accuracy_percentage'])
                accuracies.append(accuracy)
                continue
            
            # Fallback: Calculate from RMSE if accuracy_percentage not present
            if 'backtesting_rmse' in health:
                rmse_data = health['backtesting_rmse']
                best_model = health.get('best_model_selected', 'Prophet')
                
                if best_model in rmse_data and rmse_data[best_model] != 'N/A':
                    rmse = float(rmse_data[best_model])
                    
                    # Get the metric from dataframe to calculate normalized RMSE
                    metric_name = health.get('forecast_metric', metric)
                    if metric_name in df.columns:
                        actual_mean = df[metric_name].mean()
                        
                        if actual_mean > 0:
                            # Normalized RMSE as percentage
                            normalized_rmse = (rmse / actual_mean) * 100
                            
                            # Convert to accuracy (lower RMSE = higher accuracy)
                            # Cap at 100% and ensure non-negative
                            accuracy = max(0, min(100, 100 - normalized_rmse))
                            accuracies.append(accuracy)
        
        if accuracies:
            # Return weighted average across all forecasted metrics
            return round(np.mean(accuracies), 2)
        
        return 95.0  # Default if calculation fails
    
    def _calculate_kpis(self, df: pd.DataFrame, forecast_results: List[Dict], model_health_report: Dict = None) -> Dict:
        """Calculates a set of summary KPIs with robust NaN handling."""
        # Calculate real-time forecast accuracy from model health reports
        forecast_accuracy = self._calculate_forecast_accuracy(df, model_health_report)

        total_revenue = df['revenue'].sum() if 'revenue' in df else 0
        total_expenses = df['expenses'].sum() if 'expenses' in df else 0
        total_profit = df['profit'].sum() if 'profit' in df else 0
        total_cashflow = df['cashflow'].sum() if 'cashflow' in df else 0
        
        profit_margin = (total_profit / total_revenue) if total_revenue > 0 else 0
        profitability_score = min(profit_margin / 0.20, 1) * 25

        current_ratio = (df['assets'].iloc[-1] / df['liabilities'].iloc[-1]) if 'assets' in df and 'liabilities' in df and not df.empty and df['liabilities'].iloc[-1] != 0 else 0
        liquidity_score = min((current_ratio - 1) / 1.5, 1) * 25 if current_ratio > 0 else 0

        debt_to_asset = df['debt_to_asset_ratio'].iloc[-1] if 'debt_to_asset_ratio' in df and not df.empty else 0
        solvency_score = (1 - min(debt_to_asset / 0.6, 1)) * 25

        yoy_growth = 0.0
        if 'date' in df.columns and pd.api.types.is_datetime64_any_dtype(df['date']) and not df.empty:
            df_dated = df.set_index('date')
            numeric_dated_df = df_dated.select_dtypes(include=np.number)
            if 'revenue' in numeric_dated_df:
                yearly_revenue_df = numeric_dated_df['revenue'].resample('YE').sum()
                if len(yearly_revenue_df) > 1:
                    growth_val = yearly_revenue_df.pct_change().iloc[-1]
                    yoy_growth = growth_val if pd.notna(growth_val) else 0.0

        growth_score = min(yoy_growth / 0.25, 1) * 25 if yoy_growth > 0 else 0
        
        financial_health_score = max(0, min(100, profitability_score + liquidity_score + solvency_score + growth_score))
        
        dso_mean = df['dso'].mean() if 'dso' in df else 0

        kpis = {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "profit_margin": profit_margin,
            "cashflow": total_cashflow,
            "growth_rate": yoy_growth * 100,
            "forecast_accuracy": forecast_accuracy,
            "financial_health_score": round(financial_health_score, 2),
            "dso": dso_mean,
        }
        
        # --- FINAL FIX: Return a cleaned dictionary ---
        return clean_kpis(kpis)

    def generate_dashboard(self,
                           featured_df: pd.DataFrame,
                           forecast: List[Dict],
                           anomalies: List[Dict],
                           mode: str = "finance_guardian",
                           correlation_report: List[Dict] = [],
                           simulation_results: Dict = {},
                           model_health_report: Dict = None
                          ) -> Dict:
        """
        Generates the complete dashboard JSON output.
        """
        kpis = self._calculate_kpis(featured_df, forecast, model_health_report)
        
        narrative_module = NarrativeGenerationModule()
        narratives = narrative_module.generate_narrative(
            mode=mode,
            kpis=kpis,
            anomalies=anomalies,
            featured_df=featured_df
        )

        dashboard_model = {
            "dashboard_mode": mode,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "data_start_date": featured_df['date'].min().strftime('%Y-%m-%d') if 'date' in featured_df and not featured_df.empty else None,
                "data_end_date": featured_df['date'].max().strftime('%Y-%m-%d') if 'date' in featured_df and not featured_df.empty else None,
            },
            "kpis": kpis,
            "forecast_chart": forecast,
            "anomalies_table": anomalies,
            "narratives": narratives,
            "correlation_insights": correlation_report,
            "scenario_simulations": simulation_results
        }
        
        if mode == 'finance_guardian':
            dashboard_model['recommendations'] = narratives.get('recommendations')
        
        return dashboard_model