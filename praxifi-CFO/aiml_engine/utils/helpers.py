import json
import numpy as np
import pandas as pd
from datetime import date, datetime

class CustomJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder to handle types that are not serializable by default,
    such as numpy types, datetimes, and NaN values.
    """
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, np.ndarray):
            # Recursively handle NaN values in arrays
            return convert_numpy_types(obj.tolist())
        if isinstance(obj, (datetime, date, pd.Timestamp)):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default(obj)

def save_json(data, file_path):
    """Helper function to save data to a JSON file using the robust custom encoder."""
    with open(file_path, 'w') as f:
        json.dump(data, f, cls=CustomJSONEncoder, indent=4)

def convert_numpy_types(obj):
    """
    The definitive, brute-force solution.
    Recursively traverses a dictionary or list and converts all NumPy numeric types
    to standard Python types (`int`, `float`) and NaN/inf to `None`.
    Also handles Python float NaN/Inf that result from .tolist() conversions.
    """
    if isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [convert_numpy_types(element) for element in obj]
    if isinstance(obj, np.ndarray):
        # Process arrays element by element to handle NaN properly
        return [convert_numpy_types(element) for element in obj.tolist()]
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64)):
        if np.isnan(obj) or np.isinf(obj):
            return None  # This is the crucial part for NaN values
        return float(obj)
    # Handle Python float NaN/Inf (from .tolist() conversions)
    if isinstance(obj, float):
        import math
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj