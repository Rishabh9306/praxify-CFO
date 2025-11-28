import pandas as pd
import numpy as np
from typing import Dict, List, Any
from scipy import stats


def make_json_serializable(obj):
    """Convert numpy/pandas types to native Python types for JSON serialization."""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        # Check for NaN/inf BEFORE converting to float
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.ndarray):
        # Recursively handle arrays that may contain NaN values
        return [make_json_serializable(item) for item in obj.tolist()]
    elif isinstance(obj, list):
        # Recursively handle lists that may contain NaN values
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, pd.Series):
        return [make_json_serializable(item) for item in obj.tolist()]
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict('records')
    elif pd.isna(obj):
        return None
    return obj


class VisualizationDataGenerator:
    """
    Generates structured data for 20+ visualizations including breakdowns,
    time-series charts, and correlation matrices.
    """
    
    def generate_all_charts(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Main method to generate all visualization data."""
        charts = {}
        
        # Breakdowns
        charts['breakdowns'] = self._generate_breakdowns(df)
        
        # Time-series charts
        charts['time_series'] = self._generate_time_series(df)
        
        # Correlation charts
        charts['correlations'] = self._generate_correlation_charts(df)
        
        return charts
    
    def _generate_breakdowns(self, df: pd.DataFrame) -> Dict[str, List[Dict]]:
        """Generate regional and departmental breakdowns."""
        breakdowns = {}
        
        # Revenue by Region
        if 'region' in df.columns and 'revenue' in df.columns:
            revenue_by_region = df.groupby('region')['revenue'].sum().reset_index()
            breakdowns['revenue_by_region'] = [
                {"region": str(row['region']), "total_revenue": make_json_serializable(row['revenue'])}
                for _, row in revenue_by_region.iterrows()
            ]
        
        # Profit by Region
        if 'region' in df.columns and 'profit' in df.columns:
            profit_by_region = df.groupby('region')['profit'].sum().reset_index()
            breakdowns['profit_by_region'] = [
                {"region": str(row['region']), "total_profit": make_json_serializable(row['profit'])}
                for _, row in profit_by_region.iterrows()
            ]
        
        # Expenses by Department
        if 'department' in df.columns and 'expenses' in df.columns:
            expenses_by_dept = df.groupby('department')['expenses'].sum().reset_index()
            breakdowns['expenses_by_department'] = [
                {"department": str(row['department']), "total_expenses": make_json_serializable(row['expenses'])}
                for _, row in expenses_by_dept.iterrows()
            ]
        
        # Cashflow by Department
        if 'department' in df.columns and 'cashflow' in df.columns:
            cashflow_by_dept = df.groupby('department')['cashflow'].sum().reset_index()
            breakdowns['cashflow_by_department'] = [
                {"department": str(row['department']), "total_cashflow": make_json_serializable(row['cashflow'])}
                for _, row in cashflow_by_dept.iterrows()
            ]
        
        # Marketing Spend by Region
        if 'region' in df.columns and 'Marketing Spend' in df.columns:
            marketing_by_region = df.groupby('region')['Marketing Spend'].sum().reset_index()
            breakdowns['marketing_spend_by_region'] = [
                {"region": str(row['region']), "total_marketing_spend": make_json_serializable(row['Marketing Spend'])}
                for _, row in marketing_by_region.iterrows()
            ]
        
        # AR/AP by Region
        if 'region' in df.columns:
            if 'ar' in df.columns:
                ar_by_region = df.groupby('region')['ar'].mean().reset_index()
                breakdowns['ar_by_region'] = [
                    {"region": str(row['region']), "avg_ar": make_json_serializable(row['ar'])}
                    for _, row in ar_by_region.iterrows()
                ]
            
            if 'ap' in df.columns:
                ap_by_region = df.groupby('region')['ap'].mean().reset_index()
                breakdowns['ap_by_region'] = [
                    {"region": str(row['region']), "avg_ap": make_json_serializable(row['ap'])}
                    for _, row in ap_by_region.iterrows()
                ]
        
        return breakdowns
    
    def _generate_time_series(self, df: pd.DataFrame) -> Dict[str, List[Dict]]:
        """Generate time-series chart data."""
        time_series = {}
        
        if 'date' not in df.columns or not pd.api.types.is_datetime64_any_dtype(df['date']):
            return time_series
        
        df_sorted = df.sort_values('date').copy()
        
        # Revenue vs Marketing Spend (Dual-axis)
        if 'revenue' in df_sorted.columns and 'Marketing Spend' in df_sorted.columns:
            time_series['revenue_vs_marketing'] = [
                {
                    "date": row['date'].strftime('%Y-%m-%d'),
                    "revenue": make_json_serializable(row['revenue']),
                    "marketing_spend": make_json_serializable(row['Marketing Spend'])
                }
                for _, row in df_sorted[['date', 'revenue', 'Marketing Spend']].iterrows()
            ]
        
        # AR/AP Trends
        if 'ar' in df_sorted.columns:
            time_series['ar_trend'] = [
                {"date": row['date'].strftime('%Y-%m-%d'), "ar": make_json_serializable(row['ar'])}
                for _, row in df_sorted[['date', 'ar']].iterrows()
            ]
        
        if 'ap' in df_sorted.columns:
            time_series['ap_trend'] = [
                {"date": row['date'].strftime('%Y-%m-%d'), "ap": make_json_serializable(row['ap'])}
                for _, row in df_sorted[['date', 'ap']].iterrows()
            ]
        
        # Working Capital Trend
        if 'working_capital' in df_sorted.columns:
            time_series['working_capital_trend'] = [
                {"date": row['date'].strftime('%Y-%m-%d'), "working_capital": make_json_serializable(row['working_capital'])}
                for _, row in df_sorted[['date', 'working_capital']].iterrows()
            ]
        
        # Assets vs Liabilities Trend
        if 'assets' in df_sorted.columns and 'liabilities' in df_sorted.columns:
            time_series['assets_vs_liabilities'] = [
                {
                    "date": row['date'].strftime('%Y-%m-%d'),
                    "assets": make_json_serializable(row['assets']),
                    "liabilities": make_json_serializable(row['liabilities'])
                }
                for _, row in df_sorted[['date', 'assets', 'liabilities']].iterrows()
            ]
        
        # Profit Margin Trend
        if 'profit_margin' in df_sorted.columns:
            time_series['profit_margin_trend'] = [
                {"date": row['date'].strftime('%Y-%m-%d'), "profit_margin": make_json_serializable(row['profit_margin'])}
                for _, row in df_sorted[['date', 'profit_margin']].iterrows()
            ]
        
        # Cashflow Trend
        if 'cashflow' in df_sorted.columns:
            time_series['cashflow_trend'] = [
                {"date": row['date'].strftime('%Y-%m-%d'), "cashflow": make_json_serializable(row['cashflow'])}
                for _, row in df_sorted[['date', 'cashflow']].iterrows()
            ]
        
        # Rolling Averages (30-day for revenue, profit, expenses)
        for metric in ['revenue', 'profit', 'expenses']:
            if metric in df_sorted.columns:
                df_sorted[f'{metric}_rolling_30'] = df_sorted[metric].rolling(window=min(30, len(df_sorted)), min_periods=1).mean()
                time_series[f'{metric}_rolling_avg'] = [
                    {
                        "date": row['date'].strftime('%Y-%m-%d'),
                        "actual": make_json_serializable(row[metric]),
                        "rolling_avg": make_json_serializable(row[f'{metric}_rolling_30'])
                    }
                    for _, row in df_sorted[['date', metric, f'{metric}_rolling_30']].iterrows()
                ]
        
        return time_series
    
    def _generate_correlation_charts(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate correlation and diagnostic chart data."""
        correlations = {}
        
        # Select numeric columns only
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        if len(numeric_cols) < 2:
            return correlations
        
        # Correlation Heatmap
        corr_matrix = df[numeric_cols].corr()
        correlations['correlation_matrix'] = {
            "columns": numeric_cols,
            "values": make_json_serializable(corr_matrix.values)
        }
        
        # Revenue vs Marketing Spend Scatter
        if 'revenue' in df.columns and 'Marketing Spend' in df.columns:
            scatter_data = df[['revenue', 'Marketing Spend']].dropna()
            if len(scatter_data) > 0:
                correlations['revenue_vs_marketing_scatter'] = [
                    {"revenue": make_json_serializable(row['revenue']), 
                     "marketing_spend": make_json_serializable(row['Marketing Spend'])}
                    for _, row in scatter_data.iterrows()
                ]
                
                # Add regression line
                if len(scatter_data) >= 2:
                    # Check if values have variance (not all identical)
                    if scatter_data['Marketing Spend'].nunique() > 1 and scatter_data['revenue'].nunique() > 1:
                        try:
                            slope, intercept, r_value, _, _ = stats.linregress(
                                scatter_data['Marketing Spend'], scatter_data['revenue']
                            )
                            correlations['revenue_vs_marketing_regression'] = {
                                "slope": float(slope),
                                "intercept": float(intercept),
                                "r_squared": float(r_value ** 2)
                            }
                        except (ValueError, Exception):
                            # Skip regression if calculation fails
                            pass
        
        # AR vs Cashflow Scatter
        if 'ar' in df.columns and 'cashflow' in df.columns:
            scatter_data = df[['ar', 'cashflow']].dropna()
            if len(scatter_data) > 0:
                correlations['ar_vs_cashflow_scatter'] = [
                    {"ar": make_json_serializable(row['ar']), 
                     "cashflow": make_json_serializable(row['cashflow'])}
                    for _, row in scatter_data.iterrows()
                ]
        
        # Profit vs Assets Scatter with Regression
        if 'profit' in df.columns and 'assets' in df.columns:
            scatter_data = df[['profit', 'assets']].dropna()
            if len(scatter_data) > 0:
                correlations['profit_vs_assets_scatter'] = [
                    {"profit": make_json_serializable(row['profit']), 
                     "assets": make_json_serializable(row['assets'])}
                    for _, row in scatter_data.iterrows()
                ]
                
                if len(scatter_data) >= 2:
                    # Check if x values have variance (not all identical)
                    if scatter_data['assets'].nunique() > 1 and scatter_data['profit'].nunique() > 1:
                        try:
                            slope, intercept, r_value, _, _ = stats.linregress(
                                scatter_data['assets'], scatter_data['profit']
                            )
                            correlations['profit_vs_assets_regression'] = {
                                "slope": float(slope),
                                "intercept": float(intercept),
                                "r_squared": float(r_value ** 2)
                            }
                        except (ValueError, Exception):
                            # Skip regression if calculation fails
                            pass
        
        # Regional Correlation Segmentation
        if 'region' in df.columns and len(numeric_cols) >= 2:
            regional_corrs = {}
            for region in df['region'].unique():
                region_df = df[df['region'] == region][numeric_cols]
                if len(region_df) > 1:
                    region_corr = region_df.corr()
                    # Store top correlations for each region
                    regional_corrs[str(region)] = {
                        "columns": numeric_cols,
                        "values": make_json_serializable(region_corr.values)
                    }
            if regional_corrs:
                correlations['regional_correlations'] = regional_corrs
        
        return correlations


class TableGenerator:
    """
    Generates comprehensive summary and diagnostic tables.
    """
    
    def generate_all_tables(self, df: pd.DataFrame, forecasts: Dict = None) -> Dict[str, Any]:
        """Main method to generate all tables."""
        tables = {}
        
        # Summary tables
        tables['summaries'] = self._generate_summary_tables(df)
        
        # Diagnostic tables
        tables['diagnostics'] = self._generate_diagnostic_tables(df)
        
        # Forecast tables
        if forecasts:
            tables['forecast_tables'] = self._generate_forecast_tables(forecasts)
        
        return tables
    
    def _generate_summary_tables(self, df: pd.DataFrame) -> Dict[str, List[Dict]]:
        """Generate quarterly, annual, regional, and departmental summary tables."""
        summaries = {}
        
        if 'date' not in df.columns or not pd.api.types.is_datetime64_any_dtype(df['date']):
            return summaries
        
        df_dated = df.set_index('date')
        numeric_cols = df_dated.select_dtypes(include=[np.number]).columns
        
        # Quarterly Summary
        quarterly = df_dated[numeric_cols].resample('QE').sum()
        if len(quarterly) > 0:
            summaries['quarterly_summary'] = [
                {"quarter": f"{idx.year}-Q{idx.quarter}", 
                 **{k: make_json_serializable(v) for k, v in row.to_dict().items()}}
                for idx, row in quarterly.iterrows()
            ]
        
        # Annual Summary
        annual = df_dated[numeric_cols].resample('YE').sum()
        if len(annual) > 0:
            summaries['annual_summary'] = [
                {"year": int(idx.year), 
                 **{k: make_json_serializable(v) for k, v in row.to_dict().items()}}
                for idx, row in annual.iterrows()
            ]
        
        # Region-wise Performance Table
        if 'region' in df.columns:
            region_metrics = ['revenue', 'expenses', 'profit', 'cashflow']
            available_metrics = [m for m in region_metrics if m in df.columns]
            if available_metrics:
                region_summary = df.groupby('region')[available_metrics].agg(['sum', 'mean', 'std'])
                # Flatten multi-level columns to avoid tuple keys
                region_summary.columns = ['_'.join(col).strip() for col in region_summary.columns.values]
                region_summary = region_summary.reset_index()
                summaries['regional_performance'] = region_summary.to_dict('records')
        
        # Department-wise Breakdown
        if 'department' in df.columns:
            dept_metrics = ['revenue', 'expenses', 'profit', 'cashflow']
            available_metrics = [m for m in dept_metrics if m in df.columns]
            if available_metrics:
                dept_summary = df.groupby('department')[available_metrics].agg(['sum', 'mean'])
                # Flatten multi-level columns to avoid tuple keys
                dept_summary.columns = ['_'.join(col).strip() for col in dept_summary.columns.values]
                dept_summary = dept_summary.reset_index()
                summaries['departmental_breakdown'] = dept_summary.to_dict('records')
        
        # Marketing Spend Effectiveness Table
        if 'Marketing Spend' in df.columns and 'revenue' in df.columns and 'profit' in df.columns:
            marketing_data = df[['Marketing Spend', 'revenue', 'profit']]
            total_marketing = marketing_data['Marketing Spend'].sum()
            total_revenue = marketing_data['revenue'].sum()
            total_profit = marketing_data['profit'].sum()
            avg_marketing = marketing_data['Marketing Spend'].mean()
            avg_revenue = marketing_data['revenue'].mean()
            avg_profit = marketing_data['profit'].mean()
            
            summaries['marketing_effectiveness'] = {
                'total_marketing_spend': float(total_marketing),
                'total_revenue': float(total_revenue),
                'total_profit': float(total_profit),
                'avg_marketing_spend': float(avg_marketing),
                'avg_revenue': float(avg_revenue),
                'avg_profit': float(avg_profit),
                'roas': float(total_revenue / total_marketing) if total_marketing > 0 else 0,
                'marketing_efficiency': float(total_profit / total_marketing) if total_marketing > 0 else 0
            }
        
        # Working Capital Breakdown
        if 'working_capital' in df.columns and 'assets' in df.columns and 'liabilities' in df.columns:
            wc_data = df[['assets', 'liabilities', 'working_capital']]
            summaries['working_capital_breakdown'] = {
                'assets_mean': float(wc_data['assets'].mean()),
                'assets_min': float(wc_data['assets'].min()),
                'assets_max': float(wc_data['assets'].max()),
                'liabilities_mean': float(wc_data['liabilities'].mean()),
                'liabilities_min': float(wc_data['liabilities'].min()),
                'liabilities_max': float(wc_data['liabilities'].max()),
                'working_capital_mean': float(wc_data['working_capital'].mean()),
                'working_capital_min': float(wc_data['working_capital'].min()),
                'working_capital_max': float(wc_data['working_capital'].max())
            }
        
        return summaries
    
    def _generate_diagnostic_tables(self, df: pd.DataFrame) -> Dict[str, List[Dict]]:
        """Generate diagnostic tables for spikes, delays, and risks."""
        diagnostics = {}
        
        # Top 5 Revenue Spikes
        if 'revenue' in df.columns and 'date' in df.columns:
            cols = ['date', 'revenue'] + ([c for c in ['region', 'department'] if c in df.columns])
            top_revenue = df.nlargest(5, 'revenue')[cols]
            diagnostics['top_revenue_spikes'] = [
                {**{"date": row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else None}, 
                 **{k: make_json_serializable(v) for k, v in row.items() if k != 'date'}}
                for _, row in top_revenue.iterrows()
            ]
        
        # Top 5 Expense Spikes
        if 'expenses' in df.columns and 'date' in df.columns:
            cols = ['date', 'expenses'] + ([c for c in ['region', 'department'] if c in df.columns])
            top_expenses = df.nlargest(5, 'expenses')[cols]
            diagnostics['top_expense_spikes'] = [
                {**{"date": row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else None},
                 **{k: make_json_serializable(v) for k, v in row.items() if k != 'date'}}
                for _, row in top_expenses.iterrows()
            ]
        
        # Biggest AR Delays
        if 'dso' in df.columns and 'date' in df.columns:
            cols = ['date', 'dso'] + (['ar'] if 'ar' in df.columns else [])
            top_ar_delays = df.nlargest(5, 'dso')[cols]
            diagnostics['biggest_ar_delays'] = [
                {**{"date": row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else None},
                 **{k: make_json_serializable(v) for k, v in row.items() if k != 'date'}}
                for _, row in top_ar_delays.iterrows()
            ]
        
        # Largest AP Drops
        if 'ap' in df.columns and 'date' in df.columns:
            df_sorted = df.sort_values('date').copy()
            df_sorted['ap_change'] = df_sorted['ap'].diff()
            largest_ap_drops = df_sorted.nsmallest(5, 'ap_change')[['date', 'ap', 'ap_change']]
            diagnostics['largest_ap_drops'] = [
                {**{"date": row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else None},
                 **{k: make_json_serializable(v) for k, v in row.items() if k != 'date'}}
                for _, row in largest_ap_drops.iterrows()
            ]
        
        # High-risk Periods
        high_risk = df.copy()
        risk_conditions = []
        
        if 'working_capital' in df.columns:
            risk_conditions.append(high_risk['working_capital'] < 0)
        if 'cashflow' in df.columns:
            cashflow_threshold = high_risk['cashflow'].quantile(0.1)  # Bottom 10%
            risk_conditions.append(high_risk['cashflow'] < cashflow_threshold)
        if 'dso' in df.columns:
            dso_threshold = high_risk['dso'].quantile(0.9)  # Top 10%
            risk_conditions.append(high_risk['dso'] > dso_threshold)
        
        if risk_conditions and 'date' in df.columns:
            high_risk['risk_flag'] = pd.concat(risk_conditions, axis=1).any(axis=1)
            cols = ['date'] + [c for c in ['working_capital', 'cashflow', 'dso'] if c in high_risk.columns]
            risk_periods = high_risk[high_risk['risk_flag']][cols]
            if len(risk_periods) > 0:
                diagnostics['high_risk_periods'] = [
                    {**{"date": row['date'].strftime('%Y-%m-%d') if pd.notna(row['date']) else None},
                     **{k: make_json_serializable(v) for k, v in row.items() if k != 'date'}}
                    for _, row in risk_periods.head(10).iterrows()
                ]
        
        return diagnostics
    
    def _generate_forecast_tables(self, forecasts: Dict) -> Dict[str, Any]:
        """Generate structured forecast tables."""
        forecast_tables = {}
        
        # 3-month forecast table for key metrics
        key_metrics = ['revenue', 'profit', 'cashflow', 'expenses']
        for metric in key_metrics:
            if metric in forecasts and forecasts[metric]:
                forecast_tables[f'{metric}_3month_forecast'] = forecasts[metric]
        
        # Regional forecast table
        if 'regional_revenue' in forecasts:
            forecast_tables['regional_forecast'] = forecasts['regional_revenue']
        
        # Departmental forecast table
        if 'departmental_revenue' in forecasts:
            forecast_tables['departmental_forecast'] = forecasts['departmental_revenue']
        
        return forecast_tables
