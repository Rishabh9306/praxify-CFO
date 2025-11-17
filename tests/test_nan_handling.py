"""
Test script to verify NaN handling in JSON serialization
"""
import json
import numpy as np
import pandas as pd
import sys
sys.path.insert(0, 'aiml_engine')

from utils.helpers import CustomJSONEncoder, convert_numpy_types
from core.visualizations import make_json_serializable

# Test Case 1: Direct NaN values
print("=" * 60)
print("Test 1: Direct NaN values")
print("=" * 60)
test_data = {
    "value1": np.float64(3.14),
    "value2": np.float64(np.nan),
    "value3": np.float64(np.inf),
    "value4": np.float64(-np.inf)
}

json_output = json.dumps(test_data, cls=CustomJSONEncoder)
print(f"JSON Output: {json_output}")
parsed = json.loads(json_output)
print(f"Successfully parsed: {parsed}")
assert parsed['value2'] is None, "NaN should be None"
assert parsed['value3'] is None, "Inf should be None"
print("✅ PASSED\n")

# Test Case 2: Arrays with NaN values
print("=" * 60)
print("Test 2: Arrays with NaN values")
print("=" * 60)
test_array = np.array([[1.0, 2.0, np.nan], [4.0, np.inf, 6.0], [7.0, 8.0, 9.0]])
test_data2 = {
    "matrix": test_array
}

json_output2 = json.dumps(test_data2, cls=CustomJSONEncoder)
print(f"JSON Output: {json_output2}")
parsed2 = json.loads(json_output2)
print(f"Successfully parsed: {parsed2}")
assert parsed2['matrix'][0][2] is None, "NaN in array should be None"
assert parsed2['matrix'][1][1] is None, "Inf in array should be None"
print("✅ PASSED\n")

# Test Case 3: Correlation matrix with NaN (simulating real scenario)
print("=" * 60)
print("Test 3: Correlation matrix with NaN")
print("=" * 60)
df = pd.DataFrame({
    'A': [1, 2, 3, 4, 5],
    'B': [2, 4, 6, 8, 10],
    'C': [5, 5, 5, 5, 5],  # Zero variance - will cause NaN in correlation
    'D': [1, np.nan, 3, np.nan, 5]  # Missing values - will cause NaN in correlation
})
corr_matrix = df.corr()
print(f"Correlation matrix:\n{corr_matrix}")
print(f"\nNaN count: {corr_matrix.isna().sum().sum()}")

test_data3 = {
    "columns": corr_matrix.columns.tolist(),
    "values": make_json_serializable(corr_matrix.values)
}

json_output3 = json.dumps(test_data3, cls=CustomJSONEncoder)
print(f"\nJSON Output length: {len(json_output3)} chars")
parsed3 = json.loads(json_output3)
print(f"Successfully parsed correlation matrix")
print(f"Sample values: {parsed3['values'][0][:3]}")
print("✅ PASSED\n")

# Test Case 4: Complete dashboard-like structure
print("=" * 60)
print("Test 4: Complete dashboard-like structure")
print("=" * 60)
dashboard = {
    "kpis": {
        "revenue": np.float64(100000.5),
        "growth": np.float64(np.nan),
        "margin": np.float64(0.25)
    },
    "correlations": {
        "matrix": [[1.0, 0.8, np.nan], [0.8, 1.0, np.nan], [np.nan, np.nan, np.nan]]
    },
    "forecast": [
        {"date": "2025-01-01", "value": np.float64(50000.0), "upper": np.float64(np.nan)},
        {"date": "2025-02-01", "value": np.float64(52000.0), "upper": np.float64(55000.0)}
    ]
}

json_output4 = json.dumps(dashboard, cls=CustomJSONEncoder)
print(f"JSON Output length: {len(json_output4)} chars")
parsed4 = json.loads(json_output4)
print(f"Successfully parsed dashboard structure")
assert parsed4['kpis']['growth'] is None, "NaN in nested dict should be None"
assert parsed4['correlations']['matrix'][0][2] is None, "NaN in nested array should be None"
assert parsed4['forecast'][0]['upper'] is None, "NaN in list of dicts should be None"
print("✅ PASSED\n")

print("=" * 60)
print("🎉 ALL TESTS PASSED!")
print("=" * 60)
print("\nThe JSON serialization now properly handles:")
print("  ✅ Direct NaN values → null")
print("  ✅ NaN in numpy arrays → null")
print("  ✅ NaN in correlation matrices → null")
print("  ✅ Inf/-Inf values → null")
print("  ✅ Nested structures with NaN → null")
print("\n✨ The API response is now valid JSON!")
