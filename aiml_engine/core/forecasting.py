import pandas as pd
import pmdarima as pm
from prophet import Prophet
from sklearn.metrics import mean_squared_error
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime

class ForecastingModule:
    """
    Builds a predictive model for key metrics using the best model between
    AutoARIMA and Prophet.
    """
    def __init__(self, metric: str = 'revenue', date_col: str = 'date', forecast_horizon: int = 3):
        self.metric = metric
        self.date_col = date_col
        self.forecast_horizon = forecast_horizon

    def _prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepares the DataFrame for time series forecasting."""
        df_ts = df[[self.date_col, self.metric]].copy()
        df_ts.rename(columns={self.date_col: 'ds', self.metric: 'y'}, inplace=True)
        df_ts['ds'] = pd.to_datetime(df_ts['ds'])
        df_ts = df_ts.sort_values(by='ds').set_index('ds')
        return df_ts.resample('MS').sum()

    def _train_auto_arima(self, train_series: pd.Series) -> pm.arima.ARIMA:
        """Trains an AutoARIMA model."""
        # --- FIX IS HERE ---
        # The default seasonal test ('ch') can be too sensitive for short series.
        # 'ocsb' is more robust and less likely to produce singular matrices.
        model = pm.auto_arima(train_series,
                              seasonal=True,
                              m=12,  # Assuming yearly seasonality
                              seasonal_test='ocsb',  # Using a more robust test
                              suppress_warnings=True,
                              stepwise=True,
                              trace=False)
        return model

    def _train_prophet(self, train_df: pd.DataFrame) -> Prophet:
        """Trains a Prophet model."""
        model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
        model.fit(train_df.reset_index())
        return model

    def generate_forecast(self, df: pd.DataFrame) -> Tuple[List[Dict], Dict]:
        """
        Generates a forecast by selecting the best model based on backtesting.
        """
        data = self._prepare_data(df)
        if len(data) < 24: # Not enough data for robust seasonal model or split
            return [], {"status": "Failed", "reason": "Not enough data (< 24 months) for reliable forecast."}

        # Split data for backtesting (last 6 months)
        train_size = len(data) - 6
        train_data, test_data = data[:train_size], data[train_size:]

        # AutoARIMA evaluation
        try:
            arima_model = self._train_auto_arima(train_data['y'])
            arima_preds = arima_model.predict(n_periods=len(test_data))
            arima_rmse = np.sqrt(mean_squared_error(test_data['y'], arima_preds))
        except ValueError as e:
            print(f"Warning: AutoARIMA failed during backtesting. Defaulting to Prophet. Error: {e}")
            arima_rmse = float('inf') # Set a high RMSE so Prophet is chosen

        # Prophet evaluation
        prophet_model = self._train_prophet(train_data)
        future_df = prophet_model.make_future_dataframe(periods=len(test_data), freq='MS')
        prophet_forecast = prophet_model.predict(future_df)
        prophet_preds = prophet_forecast['yhat'][-len(test_data):]
        prophet_rmse = np.sqrt(mean_squared_error(test_data['y'], prophet_preds))

        # Select the best model and retrain on full data
        if arima_rmse < prophet_rmse:
            best_model_name = "AutoARIMA"
            final_model = self._train_auto_arima(data['y'])
            preds, conf_int = final_model.predict(n_periods=self.forecast_horizon, return_conf_int=True)
            forecast_dates = pd.date_range(start=data.index.max(), periods=self.forecast_horizon + 1, freq='MS')[1:]
            
            output = [
                {"date": date.strftime('%Y-%m-%d'), 
                 "predicted": pred, 
                 "lower": ci[0], 
                 "upper": ci[1]}
                for date, pred, ci in zip(forecast_dates, preds, conf_int)
            ]
        else:
            best_model_name = "Prophet"
            final_model = self._train_prophet(data)
            future = final_model.make_future_dataframe(periods=self.forecast_horizon, freq='MS')
            forecast = final_model.predict(future)
            
            forecast_data = forecast.iloc[-self.forecast_horizon:]
            output = [
                {"date": row['ds'].strftime('%Y-%m-%d'), 
                 "predicted": row['yhat'], 
                 "lower": row['yhat_lower'], 
                 "upper": row['yhat_upper']}
                for _, row in forecast_data.iterrows()
            ]

        model_health_report = {
            "model_id": f"model_{best_model_name.lower()}_{int(datetime.now().timestamp())}",
            "best_model_selected": best_model_name,
            "backtesting_rmse": {"AutoARIMA": arima_rmse if arima_rmse != float('inf') else 'N/A', "Prophet": prophet_rmse},
            "forecast_metric": self.metric,
            "status": "Success"
        }

        return output, model_health_report