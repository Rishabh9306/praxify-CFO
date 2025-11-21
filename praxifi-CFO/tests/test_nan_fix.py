"""
Test to verify NaN/Inf handling fix
"""
import json
import numpy as np
import pandas as pd
from aiml_engine.utils.helpers import CustomJSONEncoder, convert_numpy_types

print("\n" + "=" * 70)
print("Testing NaN/Inf to null conversion in JSON output")
print("=" * 70 + "\n")

# Test 1: Direct NaN values
print("Test 1: Direct NaN/Inf values")
print("-" * 70)
test_data = {
    "value1": np.float64(3.14),
    "value2": np.float64(np.nan),
    "value3": np.float64(np.inf),
    "value4": np.float64(-np.inf)
}
print(f"Original data: {test_data}")

# CRITICAL: Pre-process data to convert NaN/Inf to None BEFORE json.dumps
cleaned_data = convert_numpy_types(test_data)
print(f"After convert_numpy_types: {cleaned_data}")

json_output = json.dumps(cleaned_data, cls=CustomJSONEncoder)
print(f"JSON output: {json_output}")

parsed = json.loads(json_output)
print(f"Parsed back: {parsed}")

assert parsed['value1'] == 3.14, "Normal float should be preserved"
assert parsed['value2'] is None, f"NaN should be None, got {parsed['value2']}"
assert parsed['value3'] is None, f"Inf should be None, got {parsed['value3']}"
assert parsed['value4'] is None, f"-Inf should be None, got {parsed['value4']}"
print("✅ Test 1 PASSED\n")

# Test 2: Nested arrays with NaN
print("Test 2: Nested arrays with NaN values")
print("-" * 70)
test_array = np.array([[1.0, 2.0, np.nan], [4.0, np.inf, 6.0]])
test_data2 = {
    "matrix": test_array,
    "scalar": np.float64(np.nan)
}
print(f"Original data shape: {test_array.shape}")

cleaned_data2 = convert_numpy_types(test_data2)
json_output2 = json.dumps(cleaned_data2, cls=CustomJSONEncoder)
print(f"JSON output: {json_output2}")

parsed2 = json.loads(json_output2)
print(f"Parsed back: {parsed2}")

assert parsed2['matrix'][0][2] is None, f"NaN in array should be None, got {parsed2['matrix'][0][2]}"
assert parsed2['matrix'][1][1] is None, f"Inf in array should be None, got {parsed2['matrix'][1][1]}"
assert parsed2['scalar'] is None, f"Scalar NaN should be None, got {parsed2['scalar']}"
print("✅ Test 2 PASSED\n")

# Test 3: Pandas correlation matrix (simulating real API scenario)
print("Test 3: Pandas correlation matrix with NaN")
print("-" * 70)
df = pd.DataFrame({
    'revenue': [100, 200, 300, 400],
    'cost': [50, 100, 150, 200],
    'zero_col': [0, 0, 0, 0]  # Zero variance causes NaN in correlation
})
corr_matrix = df.corr()
print(f"Correlation matrix:\n{corr_matrix}")

test_data3 = {
    "correlation": {
        "values": corr_matrix.values.tolist(),
        "columns": corr_matrix.columns.tolist()
    }
}

cleaned_data3 = convert_numpy_types(test_data3)
json_output3 = json.dumps(cleaned_data3, cls=CustomJSONEncoder)
print(f"\nJSON output length: {len(json_output3)} chars")
print(f"Sample: {json_output3[:200]}...")

# Verify it's valid JSON
parsed3 = json.loads(json_output3)
print(f"\n✅ Valid JSON - can be parsed!")
print(f"Contains NaN values as null: {parsed3['correlation']['values'][2][2]}")
assert parsed3['correlation']['values'][2][2] is None, "NaN correlation should be None"
print("✅ Test 3 PASSED\n")

# Test 4: Complete nested structure (like full API response)
print("Test 4: Complex nested structure")
print("-" * 70)
complex_data = {
    "ai_response": "Analysis complete",
    "full_analysis_report": {
        "visualizations": {
            "correlations": [
                {
                    "title": "Test Correlation",
                    "values": [[1.0, 0.5, np.nan], [0.5, 1.0, np.nan], [np.nan, np.nan, np.nan]],
                    "columns": ["A", "B", "C"]
                }
            ],
            "trends": {
                "revenue": {
                    "values": [100.0, 200.0, np.inf, 400.0],
                    "mean": np.float64(225.0),
                    "max": np.float64(np.inf)
                }
            }
        }
    }
}

cleaned_data4 = convert_numpy_types(complex_data)
json_output4 = json.dumps(cleaned_data4, cls=CustomJSONEncoder)
print(f"JSON output length: {len(json_output4)} chars")

# Verify it's valid JSON
parsed4 = json.loads(json_output4)
print("✅ Valid JSON - can be parsed!")

# Check specific NaN conversions
corr_values = parsed4['full_analysis_report']['visualizations']['correlations'][0]['values']
assert corr_values[0][2] is None, "NaN in correlation should be None"
assert corr_values[2][2] is None, "NaN in correlation should be None"

trend_values = parsed4['full_analysis_report']['visualizations']['trends']['revenue']['values']
assert trend_values[2] is None, "Inf in trend should be None"
assert parsed4['full_analysis_report']['visualizations']['trends']['revenue']['max'] is None, "Inf max should be None"

print("✅ Test 4 PASSED\n")

print("=" * 70)
print("🎉 ALL TESTS PASSED! NaN/Inf values are correctly converted to null")
print("=" * 70)
