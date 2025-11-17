# NaN/Inf to null JSON Fix - Summary

## Problem
The API was returning invalid JSON with literal `NaN`, `Infinity`, and `-Infinity` values which cannot be parsed:
```json
{
  "correlation": {
    "values": [[1.0, 0.5, NaN], [0.5, 1.0, NaN]]
  }
}
```

This violates JSON specification (RFC 8259) which only allows `null` for missing/invalid values.

## Root Cause
1. **NumPy correlation matrices** generate `NaN` values when correlating:
   - Zero-variance columns (constant values)
   - Columns with insufficient data
   - Missing data points

2. **Python's json module** serializes `float('nan')` as literal string `NaN` (not valid JSON)

3. **JSONEncoder.default()** method is NOT called for `float('nan')` because it's considered serializable by Python's json module

## Solution

### Phase 1: Pre-processing (CRITICAL)
**Modified: `aiml_engine/api/endpoints.py`**
- Added import: `from aiml_engine.utils.helpers import convert_numpy_types`
- Line ~360: Pre-process entire response before JSON serialization:
  ```python
  # Pre-process the entire data structure to convert NaN/Inf to None
  cleaned_data = convert_numpy_types(final_response_data)
  json_string = json.dumps(cleaned_data, cls=CustomJSONEncoder)
  ```

### Phase 2: Recursive Converter Enhancement
**Modified: `aiml_engine/utils/helpers.py`**

Enhanced `convert_numpy_types()` function to handle:
1. **NumPy types**: `np.float64(nan)` → `None`
2. **Python float NaN/Inf**: `float('nan')` → `None` (from `.tolist()` conversions)
3. **Nested structures**: Recursively processes dicts, lists, and numpy arrays

Key additions:
```python
# Handle numpy arrays
if isinstance(obj, np.ndarray):
    return [convert_numpy_types(element) for element in obj.tolist()]

# Handle Python float NaN/Inf (from .tolist() conversions)
if isinstance(obj, float):
    import math
    if math.isnan(obj) or math.isinf(obj):
        return None
```

### Phase 3: Correlation Matrix Generation
**Modified: `aiml_engine/core/visualizations.py`**

Updated correlation matrix generation to use helper function:
- Line ~207: `"values": make_json_serializable(corr_matrix.values)`
- Line ~272: `"values": make_json_serializable(region_corr.values)`

Enhanced `make_json_serializable()` to:
- Check NaN/Inf before float conversion
- Recursively handle nested arrays

## Testing

Created comprehensive test suite (`test_nan_fix.py`) with 4 test cases:

✅ **Test 1**: Direct NaN/Inf values
```python
{"value2": null, "value3": null}  # ✓ Valid JSON
```

✅ **Test 2**: Nested arrays with NaN
```python
{"matrix": [[1.0, 2.0, null], [4.0, null, 6.0]]}  # ✓ Valid JSON
```

✅ **Test 3**: Pandas correlation matrix with NaN
```python
{"correlation": {"values": [[1.0, 1.0, null], [null, null, null]]}}  # ✓ Valid JSON
```

✅ **Test 4**: Complex nested structure (simulating full API response)
```python
{
  "full_analysis_report": {
    "visualizations": {
      "correlations": [{"values": [[null, null, null]]}],
      "trends": {"revenue": {"values": [100.0, 200.0, null, 400.0]}}
    }
  }
}
```

**All tests pass!** 🎉

## Files Modified

1. **aiml_engine/api/endpoints.py**
   - Added import: `convert_numpy_types`
   - Pre-process response before JSON serialization

2. **aiml_engine/utils/helpers.py**
   - Enhanced `convert_numpy_types()` to handle Python float NaN/Inf
   - Added numpy array handling

3. **aiml_engine/core/visualizations.py**
   - Updated `make_json_serializable()` with NaN checks
   - Fixed correlation matrix generation

## Verification

✅ All files compile without errors
✅ All test cases pass
✅ JSON output is now valid and parseable
✅ NaN/Inf values correctly converted to `null`

## Impact

- **Before**: API returned unparseable JSON with literal `NaN` values
- **After**: API returns valid JSON with `null` for missing/invalid values
- **Compatibility**: Client applications can now parse JSON responses correctly
- **No data loss**: NaN values are semantically preserved as `null`

## Usage

The fix is transparent - no changes needed in calling code. The API automatically:
1. Detects NaN/Inf values in numpy/pandas data structures
2. Recursively converts them to `None` before JSON serialization
3. Returns valid JSON with `null` values

Example:
```python
# Correlation matrix with NaN
corr_matrix = pd.DataFrame(...).corr()  # Contains NaN for zero-variance columns

# API automatically handles it
response = await full_report_endpoint(...)  # Returns valid JSON with null values
```
