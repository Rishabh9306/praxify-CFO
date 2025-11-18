import pandas as pd
import numpy as np
from typing import Tuple, List, Dict

class KPIAutoExtractionDynamicFeatureEngineering:
    """
    Automatically extracts and derives 35+ KPIs and financial features from a normalized dataset.
    Comprehensive CFO-level metrics covering profitability, liquidity, efficiency, growth, risk, and marketing.
    """
    def extract_and_derive_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        """
        Derives comprehensive financial KPIs with robust error handling.
        Returns featured dataframe and schema documenting all derived metrics.
        """
        featured_df = df.copy()
        feature_schema = []

        def add_feature_to_schema(name, sources, transform_desc):
            if name in featured_df.columns:
                feature_schema.append({
                    "feature": name,
                    "type": str(featured_df[name].dtype),
                    "source": sources,
                    "transformation": transform_desc
                })

        # --- DATA HARDENING ---
        if 'date' in featured_df.columns:
            featured_df['date'] = pd.to_datetime(featured_df['date'], errors='coerce')
            featured_df.dropna(subset=['date'], inplace=True)
            featured_df = featured_df.sort_values(by='date').reset_index(drop=True)

        # Get days in period for various calculations
        days_in_period = featured_df['date'].dt.days_in_month.astype(float) if 'date' in featured_df.columns else 30

        # ==================== PROFITABILITY METRICS ====================
        
        if 'revenue' in featured_df.columns and 'expenses' in featured_df.columns:
            # Ensure profit exists
            if 'profit' not in featured_df.columns:
                featured_df['profit'] = featured_df['revenue'] - featured_df['expenses']
                add_feature_to_schema('profit', ['revenue', 'expenses'], 'revenue - expenses')
            
            # Profit Margin (also known as Net Profit Margin)
            featured_df['profit_margin'] = np.where(featured_df['revenue'] > 0, 
                featured_df['profit'] / featured_df['revenue'], 0)
            add_feature_to_schema('profit_margin', ['profit', 'revenue'], 'profit / revenue')

        # ==================== COST METRICS ====================
        
        if 'revenue' in featured_df.columns and 'expenses' in featured_df.columns:
            # Expense Ratio
            featured_df['expense_ratio'] = np.where(featured_df['revenue'] > 0,
                featured_df['expenses'] / featured_df['revenue'], 0)
            add_feature_to_schema('expense_ratio', ['expenses', 'revenue'], 'expenses / revenue')
        
        if 'Marketing Spend' in featured_df.columns and 'revenue' in featured_df.columns:
            # Marketing Spend Ratio
            featured_df['marketing_spend_ratio'] = np.where(featured_df['revenue'] > 0,
                featured_df['Marketing Spend'] / featured_df['revenue'], 0)
            add_feature_to_schema('marketing_spend_ratio', ['Marketing Spend', 'revenue'], 
                'marketing_spend / revenue')

        # ==================== CASH & LIQUIDITY METRICS ====================
        
        if 'assets' in featured_df.columns and 'liabilities' in featured_df.columns:
            # Working Capital
            featured_df['working_capital'] = featured_df['assets'] - featured_df['liabilities']
            add_feature_to_schema('working_capital', ['assets', 'liabilities'], 'assets - liabilities')
            
            # Current Ratio
            featured_df['current_ratio'] = np.where(featured_df['liabilities'] > 0,
                featured_df['assets'] / featured_df['liabilities'], 0)
            add_feature_to_schema('current_ratio', ['assets', 'liabilities'], 'assets / liabilities')
            
            # Working Capital Ratio
            featured_df['working_capital_ratio'] = np.where(featured_df['assets'] > 0,
                featured_df['working_capital'] / featured_df['assets'], 0)
            add_feature_to_schema('working_capital_ratio', ['working_capital', 'assets'], 
                'working_capital / assets')
        
        if 'cashflow' in featured_df.columns and 'ar' in featured_df.columns and 'liabilities' in featured_df.columns:
            # Quick Ratio
            featured_df['quick_ratio'] = np.where(featured_df['liabilities'] > 0,
                (featured_df['cashflow'] + featured_df['ar']) / featured_df['liabilities'], 0)
            add_feature_to_schema('quick_ratio', ['cashflow', 'ar', 'liabilities'], 
                '(cashflow + ar) / liabilities')
        
        if 'cashflow' in featured_df.columns and 'working_capital' in featured_df.columns:
            # Free Cash Flow (approximation using working capital change)
            featured_df['working_capital_change'] = featured_df['working_capital'].diff().fillna(0)
            featured_df['free_cash_flow'] = featured_df['cashflow'] - featured_df['working_capital_change']
            add_feature_to_schema('free_cash_flow', ['cashflow', 'working_capital'], 
                'cashflow - working_capital_change')

        # ==================== EFFICIENCY METRICS ====================
        
        if 'ar' in featured_df.columns and 'revenue' in featured_df.columns:
            # AR Turnover
            featured_df['ar_turnover'] = np.where(featured_df['ar'] > 0,
                featured_df['revenue'] / featured_df['ar'], 0)
            add_feature_to_schema('ar_turnover', ['revenue', 'ar'], 'revenue / ar')
            
            # DSO (Days Sales Outstanding)
            featured_df['dso'] = np.where(featured_df['revenue'] > 0,
                (featured_df['ar'] / featured_df['revenue']) * days_in_period, 0)
            add_feature_to_schema('dso', ['ar', 'revenue', 'date'], 
                '(ar / revenue) * days_in_period')
        
        if 'ap' in featured_df.columns and 'expenses' in featured_df.columns:
            # AP Turnover
            featured_df['ap_turnover'] = np.where(featured_df['ap'] > 0,
                featured_df['expenses'] / featured_df['ap'], 0)
            add_feature_to_schema('ap_turnover', ['expenses', 'ap'], 'expenses / ap')
            
            # DPO (Days Payable Outstanding)
            featured_df['dpo'] = np.where(featured_df['expenses'] > 0,
                (featured_df['ap'] / featured_df['expenses']) * days_in_period, 0)
            add_feature_to_schema('dpo', ['ap', 'expenses', 'date'], 
                '(ap / expenses) * days_in_period')
        
        # Cash Conversion Cycle (CCC = DSO + DIO - DPO, assuming DIO = 0 without inventory data)
        if 'dso' in featured_df.columns and 'dpo' in featured_df.columns:
            featured_df['cash_conversion_cycle'] = featured_df['dso'] - featured_df['dpo']
            add_feature_to_schema('cash_conversion_cycle', ['dso', 'dpo'], 'dso - dpo')

        # ==================== GROWTH METRICS ====================
        
        if 'date' in featured_df.columns and pd.api.types.is_datetime64_any_dtype(featured_df['date']):
            # Month-over-Month Growth
            for metric in ['revenue', 'profit', 'expenses']:
                if metric in featured_df.columns:
                    col_name = f'{metric}_mom_growth'
                    featured_df[col_name] = featured_df[metric].pct_change().fillna(0) * 100
                    add_feature_to_schema(col_name, [metric], 'pct_change() * 100')
            
            # Year-over-Year Growth
            featured_df['year'] = featured_df['date'].dt.year
            featured_df['month'] = featured_df['date'].dt.month
            
            for metric in ['revenue', 'profit']:
                if metric in featured_df.columns:
                    col_name = f'{metric}_yoy_growth'
                    featured_df[col_name] = featured_df.groupby('month')[metric].pct_change(periods=1).fillna(0) * 100
                    add_feature_to_schema(col_name, [metric, 'date'], 'yoy pct_change() * 100')
            
            # CAGR calculation (requires at least 2 years of data)
            for metric in ['revenue', 'profit']:
                if metric in featured_df.columns:
                    yearly_data = featured_df.groupby('year')[metric].sum()
                    if len(yearly_data) >= 2:
                        years = len(yearly_data) - 1
                        cagr = ((yearly_data.iloc[-1] / yearly_data.iloc[0]) ** (1/years) - 1) * 100
                        featured_df[f'{metric}_cagr'] = cagr
                        add_feature_to_schema(f'{metric}_cagr', [metric, 'date'], 
                            f'CAGR over {years} years')

        # ==================== RISK & LEVERAGE METRICS ====================
        
        if 'assets' in featured_df.columns and 'liabilities' in featured_df.columns:
            # Debt-to-Asset Ratio
            featured_df['debt_to_asset_ratio'] = np.where(featured_df['assets'] > 0,
                featured_df['liabilities'] / featured_df['assets'], 0)
            add_feature_to_schema('debt_to_asset_ratio', ['liabilities', 'assets'], 
                'liabilities / assets')
            
            # Equity
            featured_df['equity'] = featured_df['assets'] - featured_df['liabilities']
            
            # Debt-to-Equity Ratio
            featured_df['debt_to_equity_ratio'] = np.where(featured_df['equity'] > 0,
                featured_df['liabilities'] / featured_df['equity'], 0)
            add_feature_to_schema('debt_to_equity_ratio', ['liabilities', 'equity'], 
                'liabilities / equity')
        
        if 'profit' in featured_df.columns and 'liabilities' in featured_df.columns:
            # Solvency Ratio
            featured_df['solvency_ratio'] = np.where(featured_df['liabilities'] > 0,
                featured_df['profit'] / featured_df['liabilities'], 0)
            add_feature_to_schema('solvency_ratio', ['profit', 'liabilities'], 
                'profit / liabilities')

        # ==================== MARKETING EFFICIENCY METRICS ====================
        
        if 'Marketing Spend' in featured_df.columns:
            if 'revenue' in featured_df.columns:
                # ROAS (Return on Ad Spend)
                featured_df['roas'] = np.where(featured_df['Marketing Spend'] > 0,
                    featured_df['revenue'] / featured_df['Marketing Spend'], 0)
                add_feature_to_schema('roas', ['revenue', 'Marketing Spend'], 
                    'revenue / marketing_spend')
            
            if 'profit' in featured_df.columns:
                # Marketing Efficiency Ratio
                featured_df['marketing_efficiency'] = np.where(featured_df['Marketing Spend'] > 0,
                    featured_df['profit'] / featured_df['Marketing Spend'], 0)
                add_feature_to_schema('marketing_efficiency', ['profit', 'Marketing Spend'], 
                    'profit / marketing_spend')

        # Fill any remaining NaNs
        numeric_cols = featured_df.select_dtypes(include=[np.number]).columns
        featured_df[numeric_cols] = featured_df[numeric_cols].fillna(0)
        
        return featured_df, feature_schema