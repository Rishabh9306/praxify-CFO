import pandas as pd
import numpy as np
from typing import Dict, List, Any

class NarrativeGenerationModule:
    """
    Generates compelling, data-driven narratives for different audiences.
    This final version includes the correct target string for all modes.
    """
    def _generate_guardian_narrative(self, kpis: Dict, anomalies: List[Dict], growth_rates: Dict) -> Dict:
        # This function is correct and unchanged
        summary_parts = []
        recommendations = []
        rev_growth = growth_rates.get('revenue_growth_qoq', 0) if pd.notna(growth_rates.get('revenue_growth_qoq')) else 0
        profit_margin = kpis.get('profit_margin', 0) * 100
        summary_parts.append(
            f"Overall financial health appears {'stable' if rev_growth >= 0 else 'under pressure'}. "
            f"Revenue growth is at {rev_growth:.2f}% quarter-over-quarter, with a profit margin of {profit_margin:.2f}%."
        )
        if anomalies:
            high_severity_anomalies = [a for a in anomalies if a['severity'] == 'High']
            if high_severity_anomalies:
                anomaly = high_severity_anomalies[0]
                summary_parts.append(
                    f"A significant anomaly was detected in '{anomaly['metric']}' on {anomaly['date']}, "
                    f"with a value of {anomaly['value']:.2f}, which requires attention."
                )
                recommendations.append(f"Investigate the root cause of the '{anomaly['metric']}' anomaly on {anomaly['date']}.")
        if profit_margin < 5 and profit_margin != 0:
            recommendations.append("Profit margins are low. Review cost structure and pricing strategies.")
        if kpis.get('dso', 0) > 45:
             recommendations.append("Accounts receivable collection period (DSO) is high. Expedite client invoicing and follow-ups.")
        if not recommendations:
            recommendations.append("Financial metrics are within expected ranges. Continue monitoring performance.")
        return {"summary_text": " ".join(summary_parts), "recommendations": recommendations}

    def _generate_storyteller_narrative(self, kpis: Dict, growth_rates: Dict) -> Dict:
        # This function is correct and unchanged
        rev_growth = growth_rates.get('revenue_growth_yoy', 0) if pd.notna(growth_rates.get('revenue_growth_yoy')) else 0
        profit_growth = growth_rates.get('profit_growth_yoy', 0) if pd.notna(growth_rates.get('profit_growth_yoy')) else 0
        health_score = kpis.get('financial_health_score', 0)
        narrative = (
            f"This past year demonstrated resilient growth and strategic financial management. "
            f"We achieved a year-over-year revenue growth of {rev_growth:.2f}%, driven by strong market performance. "
            f"This growth was translated effectively to the bottom line, with net profit increasing by {profit_growth:.2f}%. "
            f"Our composite financial health score stands at a strong {health_score}/100, "
            f"indicating robust liquidity and profitability. These results position us well for sustained "
            f"long-term value creation."
        )
        if rev_growth > 15:
             narrative += " This performance significantly outperforms industry benchmarks, showcasing our competitive edge."
        return {"narrative": narrative}

    def generate_narrative(self, mode: str, kpis: Dict, anomalies: List[Dict], featured_df: pd.DataFrame) -> Dict:
        """
        The main method to generate narratives based on the selected mode.
        """
        # Standardize the input mode string for robust checking
        standardized_mode = mode.lower().strip().replace("_", "") # Now removes underscore

        growth_rates = {}
        if 'date' in featured_df.columns and pd.api.types.is_datetime64_any_dtype(featured_df['date']):
            df_dated = featured_df.dropna(subset=['date']).set_index('date')
            if not df_dated.empty:
                numeric_df = df_dated.select_dtypes(include=np.number)
                
                quarterly_sum = numeric_df.resample('QE').sum()
                yearly_sum = numeric_df.resample('YE').sum()
                
                if 'revenue' in quarterly_sum and len(quarterly_sum) > 1:
                    growth_rates['revenue_growth_qoq'] = quarterly_sum['revenue'].pct_change().iloc[-1] * 100
                if 'revenue' in yearly_sum and len(yearly_sum) > 1:
                    growth_rates['revenue_growth_yoy'] = yearly_sum['revenue'].pct_change().iloc[-1] * 100
                if 'profit' in yearly_sum and len(yearly_sum) > 1:
                    growth_rates['profit_growth_yoy'] = yearly_sum['profit'].pct_change().iloc[-1] * 100
        
        # --- THIS IS THE FINAL FIX ---
        # I am a fool. The string comparison must be perfect. The input can have spaces, underscores, or neither.
        # This will now correctly match "finance_guardian", "financinguardian", "finance guardian",
        # and most importantly, "financial_storyteller" and "financialstoryteller".
        if "guardian" in standardized_mode:
            return self._generate_guardian_narrative(kpis, anomalies, growth_rates)
        elif "storyteller" in standardized_mode:
            return self._generate_storyteller_narrative(kpis, growth_rates)
        # --- END OF FIX ---
        else:
            return {"error": f"Invalid narrative mode selected: '{mode}'"}