import pandas as pd
import numpy as np
from datetime import datetime
from typing import Tuple, List, Dict

class DataValidationQualityAssuranceEngine:
    """
    Runs a comprehensive data quality pipeline that validates, standardizes,
    and repairs ingested datasets. This final version ensures NaN values are never logged.
    """
    def __init__(self):
        self.corrections_log = []

    def _impute_missing_values(self, df: pd.DataFrame, column: str, method='median') -> pd.DataFrame:
        """Imputes missing values and logs the changes safely."""
        if column not in df.columns or not df[column].isnull().any():
            return df

        original_null_indices = df.index[df[column].isnull()]
        
        # Ensure the column is numeric before calculating median/mean
        if pd.api.types.is_numeric_dtype(df[column]):
            impute_value = df[column].median() if method == 'median' else df[column].mean()
        else:
            impute_value = 0 # Default to 0 for non-numeric or empty columns

        # --- FINAL NAN FIX ---
        # If the impute value itself is NaN (e.g., from an all-NaN column),
        # replace it with 0 before filling and logging.
        if pd.isna(impute_value):
            impute_value = 0
        # --- END OF FIX ---
        
        df[column] = df[column].fillna(impute_value)
        
        for index in original_null_indices:
            row_id = int(index[0]) if isinstance(index, tuple) else int(index)
            
            self.corrections_log.append({
                "row_id": row_id, "column": column, "original": "N/A",
                "correction": float(impute_value), "method": f"{method}_impute",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })
        return df

    def _pre_screen_outliers(self, df: pd.DataFrame, column: str, threshold=3.0) -> pd.DataFrame:
        if column not in df.columns or not pd.api.types.is_numeric_dtype(df[column]):
            return df
        # (This function is fine and remains unchanged)
        # ...
        return df

    def run_pipeline(self, df: pd.DataFrame, header_mappings: Dict) -> Tuple[pd.DataFrame, Dict, List[Dict]]:
        self.corrections_log = []
        cleaned_df = df.copy().reset_index(drop=True)

        numeric_cols = ['revenue', 'expenses', 'profit', 'cashflow', 'assets', 'liabilities', 'ar', 'ap']
        
        for col in numeric_cols:
            if col in cleaned_df.columns:
                cleaned_df = self._impute_missing_values(cleaned_df, col, method='median')
                cleaned_df = self._pre_screen_outliers(cleaned_df, col)

        validation_report = {
            "dataset_id": f"ds_{int(datetime.now().timestamp())}", "original_shape": df.shape,
            "cleaned_shape": cleaned_df.shape, "missing_values_imputed": len(self.corrections_log) > 0,
            "imputed_columns_summary": {
                col: sum(1 for log in self.corrections_log if log['column'] == col)
                for col in set(log['column'] for log in self.corrections_log)
            }, "header_mappings": header_mappings
        }
        
        return cleaned_df, validation_report, self.corrections_log