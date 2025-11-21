import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import List, Dict

class AnomalyDetectionModule:
    """
    Detects outliers and anomalies in financial metrics using multiple methods.
    """
    def _detect_with_iqr(self, df: pd.DataFrame, metric: str) -> pd.DataFrame:
        """Detect anomalies using the Interquartile Range (IQR) method."""
        Q1 = df[metric].quantile(0.25)
        Q3 = df[metric].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        anomalies = df[(df[metric] < lower_bound) | (df[metric] > upper_bound)]
        return anomalies

    def _detect_with_isolation_forest(self, df: pd.DataFrame, metric: str) -> pd.DataFrame:
        """Detect anomalies using the Isolation Forest algorithm."""
        model = IsolationForest(contamination='auto', random_state=42)
        df['anomaly'] = model.fit_predict(df[[metric]])
        
        anomalies = df[df['anomaly'] == -1].drop(columns='anomaly')
        return anomalies

    def detect_anomalies(self, df: pd.DataFrame, metric: str, method: str = 'iqr') -> List[Dict]:
        """
        Detects anomalies for a given metric and returns a structured list.
        
        Args:
            df (pd.DataFrame): Input dataframe.
            metric (str): The column name to check for anomalies.
            method (str): The method to use ('iqr' or 'isolation_forest').
        
        Returns:
            A list of dictionaries, each describing an anomaly.
        """
        if metric not in df.columns or 'date' not in df.columns:
            return []

        if method == 'iqr':
            anomalous_data = self._detect_with_iqr(df, metric)
        elif method == 'isolation_forest':
            anomalous_data = self._detect_with_isolation_forest(df, metric)
        else:
            raise ValueError("Method must be 'iqr' or 'isolation_forest'")

        if anomalous_data.empty:
            return []
            
        mean_val = df[metric].mean()
        
        results = []
        for _, row in anomalous_data.iterrows():
            deviation = (row[metric] - mean_val) / mean_val * 100
            severity = "High" if abs(deviation) > 50 else "Medium"
            
            results.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "metric": metric.capitalize(),
                "value": row[metric],
                "severity": severity,
                "reason": f"Deviation of {deviation:.2f}% from the mean of {mean_val:.2f}"
            })
            
        return results