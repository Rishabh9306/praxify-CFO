import pandas as pd
from statsmodels.tsa.stattools import grangercausalitytests
from typing import List, Dict, Optional

class CrossMetricCorrelationTrendMiningEngine:
    """
    Discovers relationships, leading indicators, and trends across various financial KPIs.
    """
    def generate_correlation_matrix(self, df: pd.DataFrame, metrics: Optional[List[str]] = None) -> Optional[pd.DataFrame]:
        """
        Calculates the Pearson correlation matrix for the given numeric metrics.

        Args:
            df (pd.DataFrame): The input DataFrame.
            metrics (Optional[List[str]]): A list of columns to correlate. If None, uses a default list.

        Returns:
            pd.DataFrame or None: The correlation matrix.
        """
        if metrics is None:
            metrics = ['revenue', 'expenses', 'profit', 'cashflow', 'marketing_spend'] # marketing_spend might not exist, handle it

        # Filter for metrics that actually exist in the DataFrame
        existing_metrics = [m for m in metrics if m in df.columns]

        if len(existing_metrics) < 2:
            print("Warning: Not enough metrics to compute a correlation matrix.")
            return None

        return df[existing_metrics].corr()

    def find_granger_causality(self, df: pd.DataFrame, metric_a: str, metric_b: str, max_lag: int = 3) -> Optional[Dict]:
        """
        Checks for Granger causality between two time series metrics. This test checks if past values of
        metric_a can predict the future values of metric_b.

        Args:
            df (pd.DataFrame): DataFrame with 'date' and metrics.
            metric_a (str): The name of the first metric (the potential cause).
            metric_b (str): The name of the second metric (the potential effect).
            max_lag (int): The maximum number of lags to test.

        Returns:
            Dict or None: A dictionary summarizing the test results if causality is found.
        """
        if 'date' not in df.columns or metric_a not in df.columns or metric_b not in df.columns:
            return None
        
        # Data must be stationary for Granger Causality. We use first differencing.
        data = df[['date', metric_a, metric_b]].set_index('date').resample('MS').sum().dropna()
        data_diff = data.diff().dropna()
        
        if len(data_diff) < 20: # Test requires a minimum number of observations
            return None

        try:
            results = grangercausalitytests(data_diff[[metric_b, metric_a]], maxlag=max_lag, verbose=False)
            
            # Check p-values for significance (e.g., p < 0.05)
            for lag in range(1, max_lag + 1):
                p_value = results[lag][0]['ssr_ftest'][1]
                if p_value < 0.05:
                    return {
                        "metric_a": metric_a,
                        "metric_b": metric_b,
                        "lag_months": lag,
                        "p_value": p_value,
                        "conclusion": f"'{metric_a}' significantly Granger-causes '{metric_b}' with a {lag}-month lag."
                    }
            return {
                "metric_a": metric_a,
                "metric_b": metric_b,
                "conclusion": "No significant Granger causality found within the max lag."
            }
            
        except Exception as e:
            print(f"Error during Granger Causality test for {metric_a} and {metric_b}: {e}")
            return None

    def generate_correlation_report(self, df: pd.DataFrame) -> List[Dict]:
        """
        Generates a comprehensive report of correlations and causalities.
        This is a high-level function that calls the others.

        Returns:
            A list of dictionaries, where each dict is a discovered relationship.
        """
        report = []
        correlation_matrix = self.generate_correlation_matrix(df)
        
        if correlation_matrix is not None:
            # Unstack the matrix to get pairs and filter for high correlations
            corr_pairs = correlation_matrix.unstack().sort_values(ascending=False)
            # Remove self-correlations and duplicates
            corr_pairs = corr_pairs[corr_pairs != 1.0]
            corr_pairs = corr_pairs.reset_index()
            corr_pairs.columns = ['metric_a', 'metric_b', 'correlation']
            
            # Avoid duplicate pairs (e.g., (A,B) and (B,A))
            corr_pairs['sorted_metrics'] = corr_pairs.apply(lambda row: tuple(sorted((row['metric_a'], row['metric_b']))), axis=1)
            corr_pairs = corr_pairs.drop_duplicates(subset='sorted_metrics').drop(columns='sorted_metrics')

            # Filter for significant correlations
            significant_correlations = corr_pairs[abs(corr_pairs['correlation']) > 0.7]
            report.extend(significant_correlations.to_dict('records'))

        # Check causality for highly correlated pairs
        for item in report:
            if item['correlation'] > 0.7:
                causality_result = self.find_granger_causality(df, item['metric_a'], item['metric_b'])
                if causality_result and causality_result.get('p_value', 1.0) < 0.05:
                    item.update(causality_result) # Add causality info to the report item

        return report