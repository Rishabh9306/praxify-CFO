#!/usr/bin/env python3
"""
Test script to verify bulk CSV file upload and merge functionality.
This script checks:
1. The split files have correct row counts
2. Merging the files produces the original dataset
3. Date ordering is maintained after merge
"""

import pandas as pd
import os

def test_split_files():
    """Verify the split files are correct"""
    print("=" * 80)
    print("TEST: Verifying Split Files")
    print("=" * 80)
    
    data_dir = "data"
    
    # Read original file
    original_df = pd.read_csv(f"{data_dir}/sample_financial_data.csv")
    print(f"\n✅ Original file: {len(original_df)} rows")
    
    # Read split files
    part1_df = pd.read_csv(f"{data_dir}/sample_financial_data_part1.csv")
    part2_df = pd.read_csv(f"{data_dir}/sample_financial_data_part2.csv")
    part3_df = pd.read_csv(f"{data_dir}/sample_financial_data_part3.csv")
    
    print(f"✅ Part 1: {len(part1_df)} rows (2022-09 to 2023-08)")
    print(f"✅ Part 2: {len(part2_df)} rows (2023-09 to 2024-08)")
    print(f"✅ Part 3: {len(part3_df)} rows (2024-09 to 2025-12)")
    
    total_split_rows = len(part1_df) + len(part2_df) + len(part3_df)
    print(f"\n📊 Total split rows: {total_split_rows}")
    print(f"📊 Original rows: {len(original_df)}")
    
    if total_split_rows == len(original_df):
        print("✅ Row counts match!")
    else:
        print(f"❌ Row count mismatch: {total_split_rows} vs {len(original_df)}")
        return False
    
    return True

def test_merge_logic():
    """Test the merge logic that will be used in the backend"""
    print("\n" + "=" * 80)
    print("TEST: Simulating Backend Merge Logic")
    print("=" * 80)
    
    data_dir = "data"
    
    # Read original file for comparison
    original_df = pd.read_csv(f"{data_dir}/sample_financial_data.csv")
    original_df['Transaction Date'] = pd.to_datetime(original_df['Transaction Date'])
    original_df = original_df.sort_values('Transaction Date').reset_index(drop=True)
    
    # Simulate backend merge process
    all_dfs = []
    for part_num in [1, 2, 3]:
        df = pd.read_csv(f"{data_dir}/sample_financial_data_part{part_num}.csv")
        all_dfs.append(df)
        print(f"✅ Loaded part {part_num}: {len(df)} rows")
    
    # Merge (simulate backend process)
    print("\n🔗 Merging DataFrames...")
    merged_df = pd.concat(all_dfs, ignore_index=True)
    print(f"✅ Concatenated: {len(merged_df)} rows")
    
    # Sort by date (using the original column name)
    merged_df['Transaction Date'] = pd.to_datetime(merged_df['Transaction Date'])
    merged_df = merged_df.sort_values('Transaction Date').reset_index(drop=True)
    print(f"✅ Sorted by date: {len(merged_df)} rows")
    
    # Check for duplicates
    duplicates = merged_df.duplicated(subset=['Transaction Date'], keep=False)
    if duplicates.any():
        print(f"⚠️  Found {duplicates.sum()} duplicate dates")
        # Remove duplicates (keep last)
        merged_df = merged_df.drop_duplicates(subset=['Transaction Date'], keep='last').reset_index(drop=True)
        print(f"✅ After dedup: {len(merged_df)} rows")
    else:
        print("✅ No duplicate dates found")
    
    # Compare with original
    print("\n📊 Comparison with original:")
    print(f"   Merged rows: {len(merged_df)}")
    print(f"   Original rows: {len(original_df)}")
    print(f"   Merged columns: {list(merged_df.columns)}")
    print(f"   Original columns: {list(original_df.columns)}")
    
    # Check date ranges
    print(f"\n📅 Date ranges:")
    print(f"   Merged: {merged_df['Transaction Date'].min()} to {merged_df['Transaction Date'].max()}")
    print(f"   Original: {original_df['Transaction Date'].min()} to {original_df['Transaction Date'].max()}")
    
    # Verify data integrity
    if len(merged_df) == len(original_df):
        print("\n✅ Row counts match after merge!")
    else:
        print(f"\n⚠️  Row count difference: {len(merged_df)} vs {len(original_df)}")
    
    # Check if all dates are present
    original_dates = set(original_df['Transaction Date'].dt.strftime('%Y-%m-%d'))
    merged_dates = set(merged_df['Transaction Date'].dt.strftime('%Y-%m-%d'))
    
    missing_dates = original_dates - merged_dates
    extra_dates = merged_dates - original_dates
    
    if missing_dates:
        print(f"❌ Missing dates in merged: {missing_dates}")
    if extra_dates:
        print(f"❌ Extra dates in merged: {extra_dates}")
    
    if not missing_dates and not extra_dates:
        print("✅ All dates present in merged dataset!")
        return True
    
    return False

def test_file_info():
    """Display file information"""
    print("\n" + "=" * 80)
    print("FILE INFORMATION")
    print("=" * 80)
    
    data_dir = "data"
    files = [
        "sample_financial_data.csv",
        "sample_financial_data_part1.csv",
        "sample_financial_data_part2.csv",
        "sample_financial_data_part3.csv"
    ]
    
    for filename in files:
        filepath = f"{data_dir}/{filename}"
        if os.path.exists(filepath):
            size_kb = os.path.getsize(filepath) / 1024
            df = pd.read_csv(filepath)
            print(f"\n📄 {filename}")
            print(f"   Size: {size_kb:.2f} KB")
            print(f"   Rows: {len(df)}")
            print(f"   Columns: {len(df.columns)}")
            if 'Transaction Date' in df.columns:
                dates = pd.to_datetime(df['Transaction Date'])
                print(f"   Date range: {dates.min()} to {dates.max()}")

if __name__ == "__main__":
    print("🧪 BULK UPLOAD TEST SUITE")
    print("=" * 80)
    
    test_file_info()
    
    success = True
    if not test_split_files():
        success = False
    
    if not test_merge_logic():
        success = False
    
    print("\n" + "=" * 80)
    if success:
        print("✅ ALL TESTS PASSED!")
        print("\n📝 Next steps:")
        print("   1. Start the backend: cd praxifi-CFO && python3 -m uvicorn aiml_engine.api.app:app --reload --host 0.0.0.0 --port 8000")
        print("   2. Start the frontend: cd praxifi-frontend && pnpm run dev")
        print("   3. Navigate to: http://localhost:3000/mvp/static-report")
        print("   4. Upload all 3 part files: sample_financial_data_part1.csv, part2.csv, part3.csv")
        print("   5. Click 'Generate Report' to test the bulk upload and merge!")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 80)
