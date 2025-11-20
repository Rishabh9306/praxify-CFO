#!/usr/bin/env python3
"""
Test the /full_report API endpoint with the sample data.
"""

import requests
import json

print("=" * 80)
print("API ENDPOINT TEST")
print("=" * 80)

# API endpoint
url = "http://localhost:8000/api/full_report"

# File to upload
file_path = "aiml_engine/data/sample_financial_data.csv"

print(f"\n1. Uploading file: {file_path}")
print(f"2. Endpoint: {url}")
print(f"3. Mode: finance_guardian")

try:
    with open(file_path, 'rb') as f:
        files = {'file': ('sample_financial_data.csv', f, 'text/csv')}
        data = {'mode': 'finance_guardian'}
        
        print(f"\n4. Sending request...")
        response = requests.post(url, files=files, data=data, timeout=300)
        
        print(f"\n5. Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # Check visualizations
            print("\n" + "=" * 80)
            print("BREAKDOWNS CHECK")
            print("=" * 80)
            
            if 'full_analysis_report' in result and 'visualizations' in result['full_analysis_report']:
                viz = result['full_analysis_report']['visualizations']
                if 'breakdowns' in viz:
                    breakdowns = viz['breakdowns']
                    print(f"\nBreakdowns generated:")
                    for key, value in breakdowns.items():
                        if isinstance(value, list):
                            count = len(value)
                            status = "✅" if count > 0 else "❌"
                            print(f"  {status} {key}: {count} entries")
                            if count > 0:
                                print(f"      Sample: {value[0]}")
                        else:
                            print(f"  - {key}: {type(value)}")
            
            # Check forecast accuracy
            print("\n" + "=" * 80)
            print("MODEL ACCURACY CHECK")
            print("=" * 80)
            
            if 'full_analysis_report' in result and 'model_health_report' in result['full_analysis_report']:
                models = result['full_analysis_report']['model_health_report']
                accuracies = []
                for metric, health in models.items():
                    if 'accuracy_percentage' in health:
                        acc = health['accuracy_percentage']
                        accuracies.append(acc)
                        status = "✅" if acc > 50 else "❌"
                        print(f"  {status} {metric}: {acc}%")
                
                if accuracies:
                    avg_acc = sum(accuracies) / len(accuracies)
                    status = "✅" if avg_acc > 70 else "⚠️ " if avg_acc > 50 else "❌"
                    print(f"\n  {status} Average accuracy: {avg_acc:.2f}%")
                    
                    if avg_acc < 70:
                        print(f"\n  ⚠️  WARNING: Accuracy is below expected 85-90%!")
            
            # Save response for inspection
            output_file = "test_api_response.json"
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\n✓ Full response saved to: {output_file}")
            
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(response.text[:500])
            
except FileNotFoundError:
    print(f"\n❌ ERROR: File not found: {file_path}")
    print("   Make sure you're running this from the project root directory.")
except requests.exceptions.ConnectionError:
    print(f"\n❌ ERROR: Could not connect to {url}")
    print("   Make sure the API server is running:")
    print("   cd aiml_engine && uvicorn api.app:app --reload")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")

print("\n" + "=" * 80)
