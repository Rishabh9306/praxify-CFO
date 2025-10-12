import pandas as pd
from typing import Dict

class ScenarioSimulationEngine:
    """
    Implements a 'what-if' engine to simulate the impact of hypothetical scenarios
    on key financial metrics.
    """

    def simulate_scenario(self, df: pd.DataFrame, parameter: str, change_pct: float) -> Dict:
        """
        Simulates the impact of changing a financial parameter on profit and cashflow.

        Args:
            df (pd.DataFrame): The input DataFrame.
            parameter (str): The financial metric to change (e.g., 'revenue', 'expenses').
            change_pct (float): The percentage change to apply (e.g., 10.0 for +10%, -5.0 for -5%).

        Returns:
            A dictionary summarizing the impact of the simulation.
        """
        if parameter not in df.columns:
            return {"error": f"Parameter '{parameter}' not found in the dataset."}

        # Create a deep copy to avoid modifying the original data
        sim_df = df.copy()

        # --- Calculate Baseline Metrics ---
        # Ensure 'profit' and 'cashflow' columns exist and are numeric
        if 'profit' not in sim_df.columns and 'revenue' in sim_df.columns and 'expenses' in sim_df.columns:
            sim_df['profit'] = sim_df['revenue'] - sim_df['expenses']
        if 'cashflow' not in sim_df.columns:
            sim_df['cashflow'] = 0 # Assume 0 if not present for this simulation
        
        baseline_total_profit = sim_df['profit'].sum()
        baseline_total_cashflow = sim_df['cashflow'].sum()
        
        # --- Apply the Change ---
        multiplier = 1 + (change_pct / 100.0)
        sim_df[parameter] *= multiplier
        
        # --- Recalculate Dependent Metrics ---
        # The core of the simulation: how does the change propagate?
        if 'revenue' in sim_df.columns and 'expenses' in sim_df.columns:
            # Recalculate profit based on the potentially modified revenue or expenses
            sim_df['simulated_profit'] = sim_df['revenue'] - sim_df['expenses']
        else:
            sim_df['simulated_profit'] = sim_df.get('profit', 0)

        # For this simulation, we'll assume cashflow changes proportionally to profit change
        if baseline_total_profit != 0:
            profit_change_ratio = sim_df['simulated_profit'].sum() / baseline_total_profit
            sim_df['simulated_cashflow'] = sim_df['cashflow'] * profit_change_ratio
        else:
             sim_df['simulated_cashflow'] = sim_df['cashflow']


        # --- Calculate the Impact ---
        simulated_total_profit = sim_df['simulated_profit'].sum()
        simulated_total_cashflow = sim_df['simulated_cashflow'].sum()

        profit_impact = simulated_total_profit - baseline_total_profit
        cashflow_impact = simulated_total_cashflow - baseline_total_cashflow

        # --- Generate Summary Report ---
        report = {
            "scenario": {
                "parameter_changed": parameter,
                "change_percentage": change_pct
            },
            "baseline": {
                "total_profit": baseline_total_profit,
                "total_cashflow": baseline_total_cashflow
            },
            "simulation_results": {
                "total_profit": simulated_total_profit,
                "total_cashflow": simulated_total_cashflow
            },
            "impact": {
                "profit_impact_absolute": profit_impact,
                "profit_impact_percentage": (profit_impact / baseline_total_profit * 100) if baseline_total_profit != 0 else 0,
                "cashflow_impact_absolute": cashflow_impact,
                "cashflow_impact_percentage": (cashflow_impact / baseline_total_cashflow * 100) if baseline_total_cashflow != 0 else 0,
            },
            "summary_text": (f"A {change_pct}% change in '{parameter}' is projected to change total profit by "
                             f"{profit_impact:,.2f} ({((profit_impact / baseline_total_profit) * 100):.2f}%) "
                             f"and total cashflow by {cashflow_impact:,.2f} ({((cashflow_impact / baseline_total_cashflow) * 100):.2f}%).")
        }

        return report