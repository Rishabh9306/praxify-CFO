import pandas as pd
import numpy as np
from typing import Dict, List, Any

class NarrativeGenerationModule:
    """
    Generates compelling, data-driven narratives for different audiences.
    """
    def _generate_guardian_narrative(self, kpis: Dict, anomalies: List[Dict], growth_rates: Dict) -> Dict:
        """
        Generates an internal-facing operational summary and recommendations.
        """
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
        
        if profit_margin < 5:
            recommendations.append("Profit margins are low. Review cost structure and pricing strategies.")
        
        if kpis.get('dso', 0) > 45:
             recommendations.append("Accounts receivable collection period (DSO) is high. Expedite client invoicing and follow-ups.")
             
        if not recommendations:
            recommendations.append("Financial metrics are within expected ranges. Continue monitoring performance.")

        return {
            "summary_text": " ".join(summary_parts),
            "recommendations": recommendations
        }

    def _generate_storyteller_narrative(self, kpis: Dict, growth_rates: Dict) -> Dict:
        """
        Generates a strategic, stakeholder-ready narrative.
        """
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

        return {
            "narrative": narrative
        }

    def generate_narrative(self, mode: str, kpis: Dict, anomalies: List[Dict], featured_df: pd.DataFrame) -> Dict:
        """
        The main method to generate narratives based on the selected mode.
        """
        growth_rates = {}
        if 'date' in featured_df.columns:
            # Drop non-numeric columns before resampling to prevent TypeErrors
            numeric_df = featured_df.select_dtypes(include=np.number)
            df_with_date = numeric_df.set_index(featured_df['date'])

            # Perform resampling and summation ONLY on numeric columns
            quarterly_sum = df_with_date.resample('QE').sum()
            yearly_sum = df_with_date.resample('YE').sum()
            
            if 'revenue' in quarterly_sum and len(quarterly_sum) > 1:
                growth_rates['revenue_growth_qoq'] = quarterly_sum['revenue'].pct_change().iloc[-1] * 100
            if 'revenue' in yearly_sum and len(yearly_sum) > 1:
                growth_rates['revenue_growth_yoy'] = yearly_sum['revenue'].pct_change().iloc[-1] * 100
            if 'profit' in yearly_sum and len(yearly_sum) > 1:
                growth_rates['profit_growth_yoy'] = yearly_sum['profit'].pct_change().iloc[-1] * 100
                
        if mode == "finance_guardian":
            return self._generate_guardian_narrative(kpis, anomalies, growth_rates)
        elif mode == "financial_storyteller":
            return self._generate_storyteller_narrative(kpis, growth_rates)
        else:
            return {"error": "Invalid narrative mode selected."}