#!/usr/bin/env python3
"""
Raw JSON API Response Collector
================================

Calls all API endpoints and saves raw JSON responses to files.
No formatting, no interpretation - just pure JSON output.

Usage:
    python3 test_api_raw_json.py

Output:
    Creates JSON files in api_responses/ directory
"""

import requests
import json
from pathlib import Path
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
DATA_DIR = Path("aiml_engine/data")
OUTPUT_DIR = Path("api_responses")

# Create output directory
OUTPUT_DIR.mkdir(exist_ok=True)

def save_json(data, filename):
    """Save data as JSON file"""
    filepath = OUTPUT_DIR / filename
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    print(f"✓ Saved: {filepath}")

def test_1_1_golden_path():
    """Test Case 1.1: First interaction"""
    print("\n=== TEST 1.1: Golden Path - First Interaction ===")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Give me a complete financial summary.",
                "session_id": ""
            }
            
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_1.1_golden_path.json")
            
            # Return session_id for next test
            return result.get("session_id")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_1_2_contextual_followup(session_id):
    """Test Case 1.2: Follow-up with memory"""
    print("\n=== TEST 1.2: Contextual Follow-up ===")
    
    if not session_id:
        print("✗ Skipped: Need session_id from Test 1.1")
        return
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Based on that forecast, what do you recommend?",
                "session_id": session_id
            }
            
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_1.2_contextual_followup.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_1_3_anomaly_detection():
    """Test Case 1.3: Anomaly detection"""
    print("\n=== TEST 1.3: Anomaly Detection ===")
    
    anomaly_file = DATA_DIR / "anomaly_test.csv"
    if not anomaly_file.exists():
        print(f"✗ Skipped: {anomaly_file} not found")
        return
    
    try:
        with open(anomaly_file, "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Analyze this file for any issues.",
                "session_id": ""
            }
            
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_1.3_anomaly_detection.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_1_4_insufficient_data():
    """Test Case 1.4: Insufficient data"""
    print("\n=== TEST 1.4: Insufficient Data ===")
    
    try:
        with open(DATA_DIR / "messy_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Forecast my revenue.",
                "session_id": ""
            }
            
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_1.4_insufficient_data.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_1_5_unrelated_query():
    """Test Case 1.5: Off-topic query"""
    print("\n=== TEST 1.5: Off-Topic Query ===")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "What is the capital of France?",
                "session_id": ""
            }
            
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_1.5_unrelated_query.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_2_1_simulation_positive():
    """Test Case 2.1: Positive impact simulation"""
    print("\n=== TEST 2.1: Simulation - Positive Impact ===")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "parameter": "expenses",
                "change_pct": -10
            }
            
            response = requests.post(f"{BASE_URL}/api/simulate", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_2.1_simulation_positive.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_2_2_simulation_negative():
    """Test Case 2.2: Negative impact simulation"""
    print("\n=== TEST 2.2: Simulation - Negative Impact ===")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "parameter": "revenue",
                "change_pct": -15
            }
            
            response = requests.post(f"{BASE_URL}/api/simulate", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_2.2_simulation_negative.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_3_1_full_report_storyteller():
    """Test Case 3.1: Full report - Storyteller"""
    print("\n=== TEST 3.1: Full Report - Storyteller ===")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "mode": "financial_storyteller",
                "forecast_metric": "revenue"
            }
            
            response = requests.post(f"{BASE_URL}/api/full_report", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_3.1_full_report_storyteller.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_3_2_full_report_guardian():
    """Test Case 3.2: Full report - Guardian"""
    print("\n=== TEST 3.2: Full Report - Guardian ===")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "mode": "finance_guardian",
                "forecast_metric": "expenses"
            }
            
            response = requests.post(f"{BASE_URL}/api/full_report", files=files, data=data)
            result = response.json()
            
            save_json(result, "test_3.2_full_report_guardian.json")
            
    except Exception as e:
        print(f"✗ Error: {e}")

def test_all_metrics():
    """Test all key metrics"""
    print("\n=== TEST: All Key Metrics ===")
    
    metrics = ["revenue", "expenses", "profit", "cashflow"]
    
    for metric in metrics:
        print(f"  Testing {metric}...")
        try:
            with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
                files = {"file": f}
                data = {
                    "mode": "finance_guardian",
                    "forecast_metric": metric
                }
                
                response = requests.post(f"{BASE_URL}/api/full_report", files=files, data=data, timeout=30)
                result = response.json()
                
                save_json(result, f"test_metric_{metric}.json")
                
        except Exception as e:
            print(f"  ✗ Error for {metric}: {e}")

def main():
    """Run all tests and save raw JSON"""
    print("="*80)
    print("Raw JSON API Response Collector")
    print("="*80)
    
    # Check API
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code != 200:
            print(f"✗ API not responding at {BASE_URL}")
            return
        print(f"✓ API is running at {BASE_URL}\n")
    except:
        print(f"✗ Cannot connect to API at {BASE_URL}")
        return
    
    # Run all tests
    print("Collecting API responses...")
    
    # Part 1: Conversational endpoint
    session_id = test_1_1_golden_path()
    test_1_2_contextual_followup(session_id)
    test_1_3_anomaly_detection()
    test_1_4_insufficient_data()
    test_1_5_unrelated_query()
    
    # Part 2: Simulations
    test_2_1_simulation_positive()
    test_2_2_simulation_negative()
    
    # Part 3: Full reports
    test_3_1_full_report_storyteller()
    test_3_2_full_report_guardian()
    
    # Part 4: All metrics
    test_all_metrics()
    
    # Summary
    print("\n" + "="*80)
    print("✓ Complete! All JSON responses saved to:")
    print(f"  {OUTPUT_DIR.absolute()}/")
    print("="*80)
    
    # List all generated files
    json_files = sorted(OUTPUT_DIR.glob("*.json"))
    print(f"\nGenerated {len(json_files)} JSON files:")
    for f in json_files:
        print(f"  - {f.name}")
    
    print("\n💡 Use these JSON files to:")
    print("  1. Design your frontend UI components")
    print("  2. Write frontend unit tests")
    print("  3. Create mock data for development")
    print("  4. Document API response formats\n")

if __name__ == "__main__":
    main()
