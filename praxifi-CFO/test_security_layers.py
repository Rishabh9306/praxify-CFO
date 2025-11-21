#!/usr/bin/env python3
"""
Test each security layer individually to find the breakpoint.
This will help identify which layer is corrupting the data.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'aiml_engine'))

import pandas as pd
import json
from aiml_engine.core.data_ingestion import DataIngestionNormalizationModule
from aiml_engine.core.data_validation import DataValidationQualityAssuranceEngine
from aiml_engine.core.feature_engineering import KPIAutoExtractionDynamicFeatureEngineering
from aiml_engine.core.visualizations import VisualizationDataGenerator
from aiml_engine.core.differential_privacy import DifferentialPrivacyEngine
from aiml_engine.core.forecasting import ForecastingModule

print("=" * 80)
print("SECURITY LAYER ISOLATION TEST")
print("=" * 80)

# Load the sample data
csv_path = "aiml_engine/data/sample_financial_data.csv"
print(f"\n1. Loading data from: {csv_path}")
with open(csv_path, 'rb') as f:
    csv_data = f.read()

# LAYER 0: Data Ingestion (Baseline)
print("\n" + "=" * 80)
print("LAYER 0: DATA INGESTION (BASELINE - NO SECURITY)")
print("=" * 80)
ingestion_module = DataIngestionNormalizationModule()
normalized_df, header_mappings = ingestion_module.auto_ingest(csv_data)
print(f"✓ Data ingested: {len(normalized_df)} rows, {len(normalized_df.columns)} columns")
print(f"✓ Columns: {list(normalized_df.columns)}")
print(f"✓ Regions: {normalized_df['region'].unique().tolist() if 'region' in normalized_df.columns else 'N/A'}")
print(f"✓ Departments: {normalized_df['department'].unique().tolist() if 'department' in normalized_df.columns else 'N/A'}")

# Validation
validation_module = DataValidationQualityAssuranceEngine()
validated_df, validation_report, corrections_log = validation_module.run_pipeline(normalized_df, header_mappings)
print(f"✓ Data validated: {len(validated_df)} rows")

# Feature Engineering
feature_module = KPIAutoExtractionDynamicFeatureEngineering()
featured_df, feature_schema = feature_module.extract_and_derive_features(validated_df)
print(f"✓ Features engineered: {len(featured_df)} rows, {len(featured_df.columns)} columns")

# TEST: Generate visualizations BEFORE any security layers
print("\n" + "=" * 80)
print("TEST 1: VISUALIZATIONS WITHOUT SECURITY")
print("=" * 80)
viz_module = VisualizationDataGenerator()
viz_data_baseline = viz_module.generate_all_charts(featured_df)

print(f"\nBreakdowns generated:")
for key, value in viz_data_baseline['breakdowns'].items():
    if isinstance(value, list):
        print(f"  - {key}: {len(value)} entries")
        if len(value) > 0:
            print(f"    Sample: {value[0]}")
    else:
        print(f"  - {key}: {type(value)}")

print(f"\nTime series generated:")
for key, value in viz_data_baseline['time_series'].items():
    if isinstance(value, list):
        print(f"  - {key}: {len(value)} entries")
    else:
        print(f"  - {key}: {type(value)}")

# TEST: Generate forecast BEFORE security
print("\n" + "=" * 80)
print("TEST 2: FORECASTING WITHOUT SECURITY")
print("=" * 80)
forecast_module = ForecastingModule(metric='revenue', forecast_horizon=3)
forecast_baseline, model_health_baseline = forecast_module.generate_forecast(featured_df)
print(f"✓ Forecast generated: {len(forecast_baseline)} periods")
print(f"✓ Model accuracy: {model_health_baseline.get('accuracy_percentage', 0):.2f}%")
print(f"✓ Model MAPE: {model_health_baseline.get('backtesting_mape', {}).get('Prophet', 'N/A')}")

# TEST: Apply differential privacy to forecasts
print("\n" + "=" * 80)
print("TEST 3: DIFFERENTIAL PRIVACY ON FORECASTS")
print("=" * 80)
privacy_engine = DifferentialPrivacyEngine(epsilon=1.0, enabled=True)
forecast_privatized = privacy_engine.privatize_forecast(forecast_baseline.copy())
print(f"✓ Forecast privatized: {len(forecast_privatized)} periods")
print("\nComparison (first period):")
print(f"  Baseline:   {forecast_baseline[0]}")
print(f"  Privatized: {forecast_privatized[0]}")

# Calculate difference
if forecast_baseline and forecast_privatized:
    diff_pct = abs(forecast_privatized[0]['predicted'] - forecast_baseline[0]['predicted']) / forecast_baseline[0]['predicted'] * 100
    print(f"  Difference: {diff_pct:.2f}%")

# TEST: Apply differential privacy to grouped data (THIS IS THE SUSPECTED ISSUE)
print("\n" + "=" * 80)
print("TEST 4: DIFFERENTIAL PRIVACY ON GROUPED DATA (SUSPECTED ISSUE)")
print("=" * 80)

# Test privatizing grouped revenue by region
if 'region' in featured_df.columns and 'revenue' in featured_df.columns:
    revenue_by_region = featured_df.groupby('region')['revenue'].sum().reset_index()
    print(f"\nOriginal revenue_by_region:")
    print(revenue_by_region)
    
    # This is what happens in the current implementation
    privatized_dict = privacy_engine.privatize_dict(revenue_by_region.to_dict('records')[0])
    print(f"\nAfter privatize_dict:")
    print(privatized_dict)
    
    # The issue: privatize_dict adds noise to ALL values, including 'region' string!
    print("\n⚠️  ISSUE IDENTIFIED: privatize_dict is adding noise to non-numeric fields!")

# TEST: Proper way to privatize grouped data
print("\n" + "=" * 80)
print("TEST 5: CORRECT PRIVATIZATION (ONLY NUMERIC VALUES)")
print("=" * 80)

if 'region' in featured_df.columns and 'revenue' in featured_df.columns:
    revenue_by_region = featured_df.groupby('region')['revenue'].sum().reset_index()
    print(f"\nOriginal grouped data:")
    for _, row in revenue_by_region.iterrows():
        print(f"  {row['region']}: ${row['revenue']:,.0f}")
    
    # Correct approach: Only privatize the numeric values, keep categorical intact
    privatized_correct = []
    for _, row in revenue_by_region.iterrows():
        privatized_correct.append({
            'region': str(row['region']),  # Keep as-is
            'total_revenue': privacy_engine.privatize_value(float(row['revenue']))  # Only privatize numeric
        })
    
    print(f"\nCorrectly privatized data:")
    for item in privatized_correct:
        print(f"  {item['region']}: ${item['total_revenue']:,.0f}")

# TEST: Check if privatization is breaking filters
print("\n" + "=" * 80)
print("TEST 6: PRIVACY IMPACT ON DATA FILTERING")
print("=" * 80)

# Simulate what happens when we privatize the DataFrame before grouping
featured_df_copy = featured_df.copy()
if 'revenue' in featured_df_copy.columns:
    print(f"Original revenue sum: ${featured_df_copy['revenue'].sum():,.0f}")
    
    # Add privacy noise to each row (THIS IS WRONG - causes compounding errors)
    for idx in featured_df_copy.index:
        featured_df_copy.loc[idx, 'revenue'] = privacy_engine.privatize_value(
            featured_df_copy.loc[idx, 'revenue']
        )
    
    print(f"After row-by-row privatization: ${featured_df_copy['revenue'].sum():,.0f}")
    
    # Now group (this compounds the error)
    if 'region' in featured_df_copy.columns:
        grouped = featured_df_copy.groupby('region')['revenue'].sum()
        print(f"\nGrouped after privatization:")
        print(grouped)
        
    print("\n⚠️  ISSUE: Privatizing raw data BEFORE grouping compounds noise!")
    print("         Each row gets noise, then grouping adds more noise on top.")

print("\n" + "=" * 80)
print("SUMMARY OF FINDINGS")
print("=" * 80)
print("""
ROOT CAUSE IDENTIFIED:
1. Differential privacy is being applied to raw DataFrames before aggregation
2. This causes compounding errors when data is grouped (region, department, etc.)
3. The privatize_dict() function adds noise to ALL dictionary values including strings
4. Empty arrays occur because the noise makes the data invalid for grouping

SOLUTION:
1. Do NOT privatize the raw DataFrame
2. Only privatize FINAL aggregated results (KPIs, forecasts)
3. Skip privatization for breakdowns and visualizations (they're already aggregated)
4. Or: Apply privacy to aggregates only, not individual rows

RECOMMENDATION:
- Remove privacy from visualization/breakdown generation
- Keep privacy only on forecasts and KPIs
- Or: Implement "privacy-aware aggregation" that groups first, then adds noise once
""")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)