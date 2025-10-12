import pandas as pd
import numpy as np
from typing import Tuple, List, Dict

class KPIAutoExtractionDynamicFeatureEngineering:
    """
    Automatically extracts and derives core KPIs and financial features from a normalized dataset.
    This version is hardened to handle potentially unclean date columns.
    """
    def extract_and_derive_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        """
        Derives key features and financial KPIs with robust error handling.
        """
        featured_df = df.copy()
        feature_schema = []

        def add_feature_to_schema(name, sources, transform_desc):
            # Check if feature was successfully created before adding to schema
            if name in featured_df.columns:
                feature_schema.append({
                    "feature": name,
                    "type": str(featured_df[name].dtype),
                    "source": sources,
                    "transformation": transform_desc
                })

        # --- DATA HARDENING ---
        # Before any calculations, ensure the date column is in the correct format.
        # This is a critical defensive step against messy data.
        if 'date' in featured_df.columns:
            featured_df['date'] = pd.to_datetime(featured_df['date'], errors='coerce')

        # --- CALCULATIONS ---

        if 'revenue' in featured_df.columns and 'expenses' in featured_df.columns:
            # Ensure profit exists or is calculated
            if 'profit' not in featured_df.columns:
                featured_df['profit'] = featured_df['revenue'] - featured_df['expenses']
                add_feature_to_schema('profit', ['revenue', 'expenses'], 'revenue - expenses')
            
            featured_df['profit_margin'] = np.where(featured_df['revenue'] > 0, (featured_df['profit']) / featured_df['revenue'], 0)
            add_feature_to_schema('profit_margin', ['profit', 'revenue'], 'profit / revenue')

        if 'assets' in featured_df.columns and 'liabilities' in featured_df.columns:
            featured_df['debt_to_asset_ratio'] = np.where(featured_df['assets'] > 0, featured_df['liabilities'] / featured_df['assets'], 0)
            add_feature_to_schema('debt_to_asset_ratio', ['liabilities', 'assets'], 'liabilities / assets')

        # Time-series calculations now guarded by a check for a valid date column
        if 'date' in featured_df.columns and pd.api.types.is_datetime64_any_dtype(featured_df['date']):
            # Drop rows where the date is invalid (NaT), as they cannot be used in time series
            featured_df.dropna(subset=['date'], inplace=True)
            featured_df = featured_df.sort_values(by='date').reset_index(drop=True)
            
            # Days Sales Outstanding (DSO)
            if 'ar' in featured_df.columns and 'revenue' in featured_df.columns:
                # Using .dt is now safe
                days_in_period = featured_df['date'].dt.days_in_month.astype(float)
                featured_df['dso'] = np.where(featured_df['revenue'] > 0, (featured_df['ar'] / featured_df['revenue']) * days_in_period, 0)
                add_feature_to_schema('dso', ['ar', 'revenue', 'date'], '(accounts_receivable / revenue) * days_in_period')
                
            # Growth Rates (Month-over-Month)
            for metric in ['revenue', 'profit', 'expenses']:
                if metric in featured_df.columns:
                    col_name = f'{metric}_mom_growth'
                    featured_df[col_name] = featured_df[metric].pct_change().fillna(0) * 100
                    add_feature_to_schema(col_name, [metric], 'pandas.pct_change()')

        # Fill any NaNs created during calculations (e.g., from pct_change on the first row)
        return featured_df.fillna(0), feature_schema