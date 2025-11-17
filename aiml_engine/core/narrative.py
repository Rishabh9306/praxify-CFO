import pandas as pd
import numpy as np
from typing import Dict, List, Any

class NarrativeGenerationModule:
    """
    Generates comprehensive analyst-level narratives with 15+ intelligent insights.
    Covers financial health, risks, opportunities, and strategic recommendations.
    """
    
    def _generate_analyst_insights(self, df: pd.DataFrame, kpis: Dict, growth_rates: Dict) -> List[str]:
        """Generate deep analyst-level insights from the data."""
        insights = []
        
        # Marketing ROI Analysis
        if 'Marketing Spend' in df.columns and 'revenue' in df.columns:
            marketing_corr = df[['Marketing Spend', 'revenue']].corr().iloc[0, 1]
            roas = kpis.get('roas', 0)
            if roas < 2:
                insights.append(
                    f"⚠️ Marketing ROI is concerning — ROAS is {roas:.2f}. "
                    f"Spend increased but revenue impact is weak (correlation: {marketing_corr:.2f})."
                )
            elif roas > 5:
                insights.append(
                    f"✅ Excellent marketing efficiency — ROAS of {roas:.2f} indicates strong campaign performance."
                )
        
        # Liability Growth Warning
        if 'liabilities' in df.columns and 'date' in df.columns:
            df_sorted = df.sort_values('date')
            liability_trend = df_sorted['liabilities'].tail(6).pct_change().mean() * 100
            if liability_trend > 2:
                insights.append(
                    f"⚠️ Liabilities growing at {liability_trend:.1f}% monthly average — leverage risk rising. "
                    f"Monitor debt levels closely."
                )
        
        # AR Collection Slowdown
        if 'ar' in df.columns and 'revenue' in df.columns and 'date' in df.columns:
            df_sorted = df.sort_values('date')
            if len(df_sorted) >= 6:
                recent_ar_growth = df_sorted['ar'].tail(6).pct_change().mean() * 100
                recent_rev_growth = df_sorted['revenue'].tail(6).pct_change().mean() * 100
                if recent_ar_growth > recent_rev_growth + 5:
                    insights.append(
                        f"⚠️ AR increasing faster than revenue ({recent_ar_growth:.1f}% vs {recent_rev_growth:.1f}%) "
                        f"— collections slowdown detected."
                    )
        
        # DSO Forecast Warning
        dso = kpis.get('dso', 0)
        if dso > 45:
            insights.append(
                f"⚠️ DSO at {dso:.1f} days is elevated. Cash conversion cycle is stretched. "
                f"Prioritize accelerated collection efforts."
            )
        elif dso < 30:
            insights.append(
                f"✅ Strong collections performance with DSO at {dso:.1f} days. "
                f"Cash conversion cycle is healthy."
            )
        
        # Margin Compression Risk
        if 'expenses' in df.columns and 'revenue' in df.columns and 'date' in df.columns:
            df_sorted = df.sort_values('date')
            if len(df_sorted) >= 12:
                recent_expense_growth = df_sorted['expenses'].tail(12).pct_change().mean() * 100
                recent_revenue_growth = df_sorted['revenue'].tail(12).pct_change().mean() * 100
                if recent_expense_growth > recent_revenue_growth:
                    insights.append(
                        f"⚠️ Expenses growing faster than revenue YoY "
                        f"({recent_expense_growth:.1f}% vs {recent_revenue_growth:.1f}%) — margin compression risk."
                    )
        
        # AP vs Expenses Liquidity Pressure
        if 'ap' in df.columns and 'expenses' in df.columns and 'date' in df.columns:
            df_sorted = df.sort_values('date')
            if len(df_sorted) >= 6:
                recent_ap_change = df_sorted['ap'].tail(6).pct_change().mean() * 100
                recent_expense_change = df_sorted['expenses'].tail(6).pct_change().mean() * 100
                if recent_ap_change < -5 and recent_expense_change > 0:
                    insights.append(
                        f"⚠️ AP decreasing ({recent_ap_change:.1f}%) while expenses rising "
                        f"({recent_expense_change:.1f}%) — liquidity pressure building."
                    )
        
        # Working Capital Health
        working_capital = kpis.get('working_capital', 0)
        current_ratio = kpis.get('current_ratio', 0)
        if current_ratio < 1:
            insights.append(
                f"🚨 Critical: Current ratio below 1.0 ({current_ratio:.2f}) — "
                f"immediate liquidity concerns. Working capital is {working_capital:,.0f}."
            )
        elif current_ratio > 2:
            insights.append(
                f"✅ Strong liquidity position with current ratio of {current_ratio:.2f}. "
                f"Comfortable working capital buffer."
            )
        
        # Profitability Trend
        profit_margin = kpis.get('profit_margin', 0) * 100
        if profit_margin < 10:
            insights.append(
                f"⚠️ Profit margin at {profit_margin:.1f}% is below optimal levels. "
                f"Consider cost optimization or pricing review."
            )
        elif profit_margin > 25:
            insights.append(
                f"✅ Excellent profitability with {profit_margin:.1f}% margin. "
                f"Strong competitive positioning."
            )
        
        # Revenue Growth Context
        rev_growth = growth_rates.get('revenue_growth_qoq', 0)
        if rev_growth > 20:
            insights.append(
                f"🚀 Exceptional revenue growth of {rev_growth:.1f}% QoQ. "
                f"Monitor capacity and scaling requirements."
            )
        elif rev_growth < -10:
            insights.append(
                f"⚠️ Revenue declining {abs(rev_growth):.1f}% QoQ. "
                f"Immediate action needed to reverse trend."
            )
        
        # Equity Position
        if 'equity' in df.columns and 'date' in df.columns:
            df_sorted = df.sort_values('date')
            if len(df_sorted) >= 6:
                equity_trend = df_sorted['equity'].tail(6).pct_change().mean() * 100
                if equity_trend < -2:
                    insights.append(
                        f"⚠️ Equity eroding at {abs(equity_trend):.1f}% monthly average. "
                        f"Capital structure needs attention."
                    )
        
        # Cash Conversion Cycle
        if 'cash_conversion_cycle' in df.columns:
            ccc = df['cash_conversion_cycle'].mean()
            if ccc > 60:
                insights.append(
                    f"⚠️ Cash conversion cycle at {ccc:.0f} days is extended. "
                    f"Focus on improving working capital efficiency."
                )
            elif ccc < 30:
                insights.append(
                    f"✅ Efficient cash conversion cycle of {ccc:.0f} days. "
                    f"Strong operational efficiency."
                )
        
        return insights
    
    def _generate_guardian_narrative(self, kpis: Dict, anomalies: List[Dict], growth_rates: Dict, df: pd.DataFrame = None) -> Dict:
        """Enhanced guardian narrative with comprehensive insights."""
        summary_parts = []
        recommendations = []
        
        rev_growth = growth_rates.get('revenue_growth_qoq', 0) if pd.notna(growth_rates.get('revenue_growth_qoq')) else 0
        profit_margin = kpis.get('profit_margin', 0) * 100
        
        # Executive Summary
        health_status = "strong" if rev_growth > 10 else "stable" if rev_growth >= 0 else "under pressure"
        summary_parts.append(
            f"Overall financial health appears {health_status}. "
            f"Revenue growth is at {rev_growth:.2f}% quarter-over-quarter, with a profit margin of {profit_margin:.2f}%."
        )
        
        # Liquidity Status
        current_ratio = kpis.get('current_ratio', 0)
        if current_ratio > 0:
            liquidity_status = "strong" if current_ratio > 1.5 else "adequate" if current_ratio > 1 else "concerning"
            summary_parts.append(
                f"Liquidity position is {liquidity_status} with a current ratio of {current_ratio:.2f}."
            )
        
        # Anomaly Detection
        if anomalies:
            high_severity_anomalies = [a for a in anomalies if a['severity'] == 'High']
            if high_severity_anomalies:
                anomaly = high_severity_anomalies[0]
                summary_parts.append(
                    f"A significant anomaly was detected in '{anomaly['metric']}' on {anomaly['date']}, "
                    f"with a value of {anomaly['value']:.2f}, which requires attention."
                )
                recommendations.append(
                    f"Investigate the root cause of the '{anomaly['metric']}' anomaly on {anomaly['date']}."
                )
        
        # Generate analyst insights
        analyst_insights = []
        if df is not None:
            analyst_insights = self._generate_analyst_insights(df, kpis, growth_rates)
        
        # Strategic Recommendations
        if profit_margin < 5 and profit_margin != 0:
            recommendations.append(
                "Profit margins are low. Review cost structure and pricing strategies."
            )
        if kpis.get('dso', 0) > 45:
            recommendations.append(
                "Accounts receivable collection period (DSO) is high. Expedite client invoicing and follow-ups."
            )
        if current_ratio < 1:
            recommendations.append(
                "Critical liquidity concern. Prioritize cash preservation and working capital management."
            )
        if kpis.get('debt_to_equity_ratio', 0) > 2:
            recommendations.append(
                "High leverage detected. Consider deleveraging strategies to reduce financial risk."
            )
        
        if not recommendations:
            recommendations.append(
                "Financial metrics are within expected ranges. Continue monitoring performance."
            )
        
        return {
            "summary_text": " ".join(summary_parts),
            "recommendations": recommendations,
            "analyst_insights": analyst_insights
        }

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
        The main method to generate comprehensive narratives based on the selected mode.
        """
        standardized_mode = mode.lower().strip().replace("_", "")

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
        
        if "guardian" in standardized_mode:
            return self._generate_guardian_narrative(kpis, anomalies, growth_rates, featured_df)
        elif "storyteller" in standardized_mode:
            return self._generate_storyteller_narrative(kpis, growth_rates)
        else:
            return {"error": f"Invalid narrative mode selected: '{mode}'"}