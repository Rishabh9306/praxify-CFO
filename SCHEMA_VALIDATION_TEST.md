# Schema Validation Testing Guide

## Overview
The frontend now includes built-in schema validation for multiple CSV file uploads. When uploading 2 or more files, the system automatically checks if all files have the same column structure.

## How It Works

### Validation Process
1. **When triggered**: Runs automatically when:
   - Multiple files are selected at once
   - Additional files are added to existing uploads
   
2. **What it checks**:
   - ✅ Same number of columns across all files
   - ✅ Same column names (case-insensitive)
   - ✅ No missing columns
   - ✅ No extra columns

3. **What happens on mismatch**:
   - ❌ Files are NOT added to the upload list
   - ⚠️ Error message displayed with specific details
   - 📋 Shows which file has the issue and what columns are affected

### Error Messages

#### Example 1: Different column count
```
Schema mismatch: "file1.csv" has 12 columns, but "file2.csv" has 11 columns
```

#### Example 2: Missing columns
```
Schema mismatch between "sample_financial_data_part1.csv" and "sample_financial_data_part3b.csv". 
Missing columns in "sample_financial_data_part3b.csv": marketing spend
```

#### Example 3: Extra columns
```
Schema mismatch between "file1.csv" and "file2.csv". 
Extra columns in "file2.csv": bonus_column, extra_field
```

## Test Files Provided

### ✅ Valid Files (Same Schema - 12 columns)
- `sample_financial_data_part1.csv` - 12 data rows, Sep 2022 - Aug 2023
- `sample_financial_data_part2.csv` - 12 data rows, Sep 2023 - Aug 2024
- `sample_financial_data_part3.csv` - 16 data rows, Sep 2024 - Dec 2025

**Schema:**
```
Transaction Date, Sales Revenue, Operating Costs, Marketing Spend, Region, 
Department, Net Profit, Cash Flow from Operations, Accounts Receivable, 
Accounts Payable, Total Assets, Total Liabilities
```

### ❌ Invalid File (Different Schema - 11 columns)
- `sample_financial_data_part3b.csv` - 16 data rows, MISSING "Marketing Spend" column

**Schema:**
```
Transaction Date, Sales Revenue, Operating Costs, Region, Department, 
Net Profit, Cash Flow from Operations, Accounts Receivable, 
Accounts Payable, Total Assets, Total Liabilities
```

## Testing Scenarios

### Test 1: Valid Multi-Upload (Should Work ✅)
1. Navigate to upload page
2. Select all 3 valid files:
   - `sample_financial_data_part1.csv`
   - `sample_financial_data_part2.csv`
   - `sample_financial_data_part3.csv`
3. **Expected Result**: All 3 files accepted, no error message
4. Click "Generate Report" - should merge into 40 rows

### Test 2: Invalid Multi-Upload (Should Fail ❌)
1. Navigate to upload page
2. Select 2 files with different schemas:
   - `sample_financial_data_part1.csv` (12 columns)
   - `sample_financial_data_part3b.csv` (11 columns - missing "Marketing Spend")
3. **Expected Result**: 
   - Files NOT added to upload list
   - Error message displayed:
     ```
     Schema mismatch between "sample_financial_data_part1.csv" and 
     "sample_financial_data_part3b.csv". Missing columns in 
     "sample_financial_data_part3b.csv": marketing spend
     ```

### Test 3: Add More Files with Schema Mismatch (Should Fail ❌)
1. Upload valid file: `sample_financial_data_part1.csv` ✅
2. Click "Add More Files"
3. Select invalid file: `sample_financial_data_part3b.csv` ❌
4. **Expected Result**:
   - Invalid file NOT added
   - Error message shows schema mismatch
   - Original file remains in upload list

### Test 4: Remove and Re-Upload (Should Work ✅)
1. Upload file with error scenario (Test 2)
2. Click ❌ to remove all files
3. Upload only valid files (Test 1)
4. **Expected Result**: Valid files accepted, ready to generate report

### Test 5: Single File Upload (No Validation)
1. Upload single file: `sample_financial_data_part3b.csv`
2. **Expected Result**: File accepted (validation only runs for 2+ files)
3. Note: Backend will still process it, but may fail if required columns missing

## Implementation Details

### Frontend Validation Logic
```typescript
const validateSchemas = async (filesToCheck: File[]): Promise<{
  valid: boolean; 
  message?: string 
}> => {
  // Only validates when 2+ files
  if (filesToCheck.length < 2) return { valid: true };

  // Reads CSV headers from each file
  // Compares column names (case-insensitive)
  // Returns detailed error messages on mismatch
}
```

### Key Features
- ⚡ **Client-side validation**: Instant feedback, no server round-trip
- 📝 **Detailed errors**: Tells you exactly what's wrong
- 🔄 **Works with "Add More Files"**: Validates against existing uploads
- 🎯 **Case-insensitive**: "Marketing Spend" = "marketing spend"
- 🛡️ **Single file bypass**: Doesn't block single file uploads

## Backend Processing

Even with frontend validation, the backend still applies:
- Column name normalization (50+ synonyms)
- Data validation and quality checks
- Missing column inference (when possible)

**Best Practice**: Ensure all files have the same schema before upload for optimal results.

## Troubleshooting

### Issue: Files not uploading despite same columns
**Solution**: Check for:
- Extra spaces in column names
- Hidden special characters
- Different column order (order doesn't matter, names do)

### Issue: Error persists after removing files
**Solution**: Refresh the page or clear browser cache

### Issue: Want to upload files with different schemas
**Solution**: Either:
- Standardize your CSV files to have the same columns
- Upload files separately (one at a time)
- Let backend handle it (it has smarter normalization)

## Files Location

All test files are in:
```
/praxifi-CFO/data/
├── sample_financial_data_part1.csv  ✅ Valid (12 cols)
├── sample_financial_data_part2.csv  ✅ Valid (12 cols)
├── sample_financial_data_part3.csv  ✅ Valid (12 cols)
└── sample_financial_data_part3b.csv ❌ Invalid (11 cols - missing Marketing Spend)
```

## Expected Behavior Summary

| Scenario | Files | Validation | Result |
|----------|-------|------------|--------|
| Upload 3 valid files | part1, part2, part3 | ✅ Pass | All accepted, 40 rows merged |
| Upload 2 mismatched | part1, part3b | ❌ Fail | Error shown, files rejected |
| Upload 1 file | part3b | ⚠️ Skip | Accepted (single file bypass) |
| Add mismatched to valid | part1 → add part3b | ❌ Fail | part3b rejected, part1 remains |
| Add valid to valid | part1 → add part2 | ✅ Pass | Both accepted |

---

**Note**: This validation is a UX enhancement. The backend has robust column normalization that can handle many schema variations, but frontend validation provides immediate feedback and prevents obvious errors.
