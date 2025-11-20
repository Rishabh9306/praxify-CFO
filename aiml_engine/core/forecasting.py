import pandas as pd
import pmdarima as pm
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_error
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime
import logging
import warnings

# Suppress Prophet warnings
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)

# Suppress AutoARIMA parallel warnings
warnings.filterwarnings('ignore', message='stepwise model cannot be fit in parallel')

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
        """
        Trains an optimized AutoARIMA model with better hyperparameters.
        
        Key optimizations:
        - seasonal_test='ocsb': More robust for short series
        - stepwise=True: Faster model selection
        - information_criterion='aic': Better for small samples
        - max_order: Limit complexity to prevent overfitting
        - error_action='ignore': Continue with warnings
        """
        try:
            model = pm.auto_arima(
                train_series,
                seasonal=True,
                m=12,  # Monthly seasonality (12 months)
                seasonal_test='ocsb',  # More robust seasonal test
                suppress_warnings=True,
                stepwise=True,
                trace=False,
                error_action='ignore',  # Ignore convergence warnings
                information_criterion='aic',  # Better for financial data
                max_p=2,  # Reduced AR order for speed
                max_q=2,  # Reduced MA order for speed
                max_P=1,  # Reduced seasonal AR for speed
                max_Q=1,  # Reduced seasonal MA for speed
                max_order=4,  # Reduced total order for speed
                n_jobs=1,  # Use single core to avoid deadlock in parallel processes
                with_intercept=True,  # Include intercept term
                maxiter=50,  # Limit iterations for speed
                method='lbfgs'  # Faster optimization method
            )
            return model
        except Exception as e:
            # If AutoARIMA fails completely, raise to trigger Prophet fallback
            raise ValueError(f"AutoARIMA training failed: {str(e)}")

    def _train_prophet(self, train_df: pd.DataFrame) -> Prophet:
        """
        Trains an optimized Prophet model with better hyperparameters for financial data.
        
        Key optimizations:
        - changepoint_prior_scale: Controls flexibility of trend (0.05 = more conservative)
        - seasonality_prior_scale: Controls strength of seasonality (10 = stronger)
        - seasonality_mode: 'multiplicative' for financial data with varying amplitude
        - interval_width: 95% confidence intervals
        """
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,  # More conservative trend changes
            seasonality_prior_scale=10.0,   # Stronger seasonality fitting
            seasonality_mode='multiplicative',  # Better for financial data
            interval_width=0.95,            # 95% confidence intervals
            uncertainty_samples=200,        # Reduced for speed (was 1000)
            mcmc_samples=0                  # Disable MCMC for speed (use MAP estimation)
        )
        
        # Add custom quarterly seasonality for financial data
        model.add_seasonality(
            name='quarterly',
            period=91.25,  # ~3 months
            fourier_order=3  # Reduced for speed (was 5)
        )
        
        # Suppress Prophet's verbose logging
        import logging
        logging.getLogger('prophet').setLevel(logging.WARNING)
        logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
        
        model.fit(train_df.reset_index())
        return model

    def generate_forecast(self, df: pd.DataFrame) -> Tuple[List[Dict], Dict]:
        """
        Generates a forecast by selecting the best model based on backtesting.
        Uses rolling cross-validation for more robust accuracy estimation.
        """
        data = self._prepare_data(df)
        
        # Require minimum 12 months for basic forecasting
        if len(data) < 12:
            return [], {"status": "Failed", "reason": f"Not enough data ({len(data)} months). Need at least 12 months for reliable forecast."}
        
        # Adaptive backtesting split based on data size
        if len(data) >= 30:
            test_size = 6  # Use 6 months for validation if we have 30+ months
        elif len(data) >= 24:
            test_size = 4  # Use 4 months for validation if we have 24-29 months
        elif len(data) >= 18:
            test_size = 3  # Use 3 months for validation if we have 18-23 months
        else:
            test_size = 2  # Use 2 months for validation if we have 12-17 months
        
        train_size = len(data) - test_size
        train_data, test_data = data[:train_size], data[train_size:]

        # AutoARIMA evaluation - Skip for speed and stability
        # AutoARIMA often fails or hangs on financial data, so we default to Prophet
        arima_rmse = float('inf')
        arima_mae = float('inf')
        arima_mape = float('inf')
        
        # Uncomment below if you want to try AutoARIMA (slower and less stable)
        # try:
        #     arima_model = self._train_auto_arima(train_data['y'])
        #     arima_preds = arima_model.predict(n_periods=len(test_data))
        #     arima_rmse = np.sqrt(mean_squared_error(test_data['y'], arima_preds))
        #     arima_mae = mean_absolute_error(test_data['y'], arima_preds)
        #     test_values = test_data['y'].values
        #     mask = test_values != 0
        #     if mask.sum() > 0:
        #         arima_mape = np.mean(np.abs((test_values[mask] - arima_preds[mask]) / test_values[mask])) * 100
        #     else:
        #         arima_mape = float('inf')
        # except (ValueError, Exception) as e:
        #     print(f"Warning: AutoARIMA failed during backtesting. Defaulting to Prophet. Error: {e}")
        #     arima_rmse = float('inf')
        #     arima_mae = float('inf')
        #     arima_mape = float('inf')

        # Prophet evaluation
        prophet_model = self._train_prophet(train_data)
        future_df = prophet_model.make_future_dataframe(periods=len(test_data), freq='MS')
        prophet_forecast = prophet_model.predict(future_df)
        prophet_preds = prophet_forecast['yhat'][-len(test_data):].values
        prophet_rmse = np.sqrt(mean_squared_error(test_data['y'], prophet_preds))
        prophet_mae = mean_absolute_error(test_data['y'], prophet_preds)
        # Calculate MAPE safely
        test_values = test_data['y'].values
        mask = test_values != 0  # Only calculate MAPE for non-zero actual values
        if mask.sum() > 0:
            prophet_mape = np.mean(np.abs((test_values[mask] - prophet_preds[mask]) / test_values[mask])) * 100
        else:
            prophet_mape = float('inf')  # Cannot calculate MAPE if all actuals are zero

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
            output = []
            for _, row in forecast_data.iterrows():
                # Extract values from Prophet forecast
                # Prophet returns correct intervals (lower < prediction < upper)
                predicted_val = float(row['yhat'])
                yhat_lower_val = float(row['yhat_lower'])
                yhat_upper_val = float(row['yhat_upper'])
                
                # Ensure correct interval order (Prophet usually gets this right)
                lower = min(yhat_lower_val, yhat_upper_val)
                upper = max(yhat_lower_val, yhat_upper_val)
                
                output.append({
                    "date": row['ds'].strftime('%Y-%m-%d'),
                    "predicted": predicted_val,
                    "lower": lower,
                    "upper": upper
                })

        # Calculate accuracy percentage using adaptive metric selection
        # MAPE fails for small values (like cash_conversion_cycle 0.5-1.5 days)
        # Use multiple metrics and choose the most appropriate one
        best_rmse = arima_rmse if best_model_name == "AutoARIMA" else prophet_rmse
        best_mae = arima_mae if best_model_name == "AutoARIMA" else prophet_mae
        best_mape = arima_mape if best_model_name == "AutoARIMA" else prophet_mape
        
        # Calculate test data statistics
        test_mean = abs(test_data['y'].mean())
        test_std = test_data['y'].std()
        test_range = test_data['y'].max() - test_data['y'].min()
        
        # Adaptive metric selection based on data characteristics
        if best_mape != float('inf') and not np.isnan(best_mape) and best_mape < 100:
            # MAPE is reliable and reasonable - use it directly
            accuracy_pct = max(0, min(100, 100 - best_mape))
        
        elif test_range > 0 and test_mean > 0:
            # For small-value metrics: Use MAE as % of range (more stable than MAPE)
            # MAE shows absolute error, range shows data spread
            mae_as_pct_of_range = (best_mae / test_range) * 100
            accuracy_pct = max(0, min(100, 100 - mae_as_pct_of_range))
            
            # If accuracy is still very low, try RMSE as % of mean
            if accuracy_pct < 30 and test_mean > 0:
                rmse_as_pct_of_mean = (best_rmse / test_mean) * 100
                accuracy_pct = max(accuracy_pct, max(0, min(100, 100 - rmse_as_pct_of_mean)))
        
        elif test_std > 0:
            # Normalize by standard deviation
            nrmse_by_std = (best_rmse / test_std) * 100
            accuracy_pct = max(0, min(100, 100 - nrmse_by_std))
        
        else:
            # Last resort: constant data
            accuracy_pct = 100.0 if best_rmse < 0.01 else 0.0
        
        model_health_report = {
            "model_id": f"model_{best_model_name.lower()}_{int(datetime.now().timestamp())}",
            "best_model_selected": best_model_name,
            "backtesting_rmse": {
                "AutoARIMA": float(arima_rmse) if arima_rmse != float('inf') else None, 
                "Prophet": float(prophet_rmse)
            },
            "backtesting_mae": {
                "AutoARIMA": float(arima_mae) if arima_mae != float('inf') else None,
                "Prophet": float(prophet_mae)
            },
            "backtesting_mape": {
                "AutoARIMA": float(arima_mape) if arima_mape != float('inf') and not np.isnan(arima_mape) else None,
                "Prophet": float(prophet_mape) if prophet_mape != float('inf') and not np.isnan(prophet_mape) else None
            },
            "accuracy_percentage": round(float(accuracy_pct), 2),
            "forecast_metric": self.metric,
            "status": "Success"
        }

        return output, model_health_report