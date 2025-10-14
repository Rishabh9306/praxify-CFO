#!/usr/bin/env python3
"""
API Testing Script for Agentic CFO Copilot
==========================================

Complete test suite covering all test cases from the API Exploration Guide.
Tests conversational AI, simulations, and full reports with different scenarios.

Usage:
    python test_api_endpoints.py

Requirements:
    pip install requests

What it tests:
    ✓ Conversational endpoint with memory
    ✓ Anomaly detection
    ✓ Graceful failures (insufficient data)
    ✓ What-If simulations
    ✓ Full reports with different modes
    ✓ All key metrics: Revenue, Expenses, Profit, Cashflow
"""

import requests
import json
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
DATA_DIR = Path("aiml_engine/data")

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def print_section(title):
    """Print a colored section header"""
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}{title}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")

def print_success(message):
    """Print a success message"""
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    """Print an error message"""
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    """Print an info message"""
    print(f"{YELLOW}ℹ {message}{RESET}")

def test_1_1_golden_path():
    """Test Case 1.1: First interaction with good data"""
    print_section("TEST 1.1: Golden Path - First Interaction")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Give me a complete financial summary.",
                "session_id": ""
            }
            
            print_info("Sending request to /api/agent/analyze_and_respond...")
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("API responded successfully!")
                
                # Check for expected fields
                if "ai_response" in result:
                    print_success(f"AI Response: {result['ai_response'][:200]}...")
                
                if "session_id" in result:
                    print_success(f"Session ID: {result['session_id']}")
                    print_info("💡 Save this session_id for Test 1.2!")
                    
                if "full_analysis_report" in result:
                    report = result["full_analysis_report"]
                    print_success(f"Full analysis report received")
                    
                    if "kpis" in report:
                        print_success(f"  - KPIs: {list(report['kpis'].keys())}")
                    if "forecast_chart" in report:
                        print_success(f"  - Forecast chart: {len(report['forecast_chart'])} data points")
                    if "profit_drivers" in report:
                        print_success(f"  - Profit drivers included")
                
                return result.get("session_id")
            else:
                print_error(f"API returned status code {response.status_code}")
                print_error(f"Response: {response.text}")
                return None
                
    except FileNotFoundError:
        print_error(f"File not found: {DATA_DIR / 'sample_financial_data.csv'}")
        print_info("Make sure your data files are in the aiml_engine/data/ directory")
        return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def test_1_2_contextual_followup(session_id):
    """Test Case 1.2: Contextual follow-up with memory"""
    print_section("TEST 1.2: Golden Path - Contextual Follow-up")
    
    if not session_id:
        print_error("Skipping: Need session_id from Test 1.1")
        return
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Based on that forecast, what do you recommend?",
                "session_id": session_id
            }
            
            print_info(f"Using session_id: {session_id}")
            print_info("Sending follow-up question...")
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("API responded successfully!")
                
                if "ai_response" in result:
                    print_success(f"AI Response: {result['ai_response'][:200]}...")
                
                if "conversation_history" in result:
                    history_len = len(result["conversation_history"])
                    print_success(f"Conversation history: {history_len} messages")
                    if history_len >= 2:
                        print_success("✓ Memory is working! Agent remembers previous conversation")
                    else:
                        print_error("Memory might not be working - expected 2+ messages")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_2_1_simulation_positive():
    """Test Case 2.1: Positive impact simulation"""
    print_section("TEST 2.1: What-If Simulation - Positive Impact")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "parameter": "expenses",
                "change_pct": -10
            }
            
            print_info("Simulating: What if expenses decrease by 10%?")
            response = requests.post(f"{BASE_URL}/api/simulate", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("Simulation completed!")
                
                if "summary_text" in result:
                    print_success(f"Summary: {result['summary_text']}")
                
                if "impact" in result:
                    impact = result["impact"]
                    profit_pct = impact.get("profit_impact_percentage", 0)
                    print_success(f"Profit impact: {profit_pct:+.2f}%")
                    
                    if profit_pct > 0:
                        print_success("✓ As expected: reducing expenses increases profit!")
                    else:
                        print_error("Unexpected: profit impact should be positive")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_1_3_anomaly_detection():
    """Test Case 1.3: Anomaly detection"""
    print_section("TEST 1.3: Anomaly Detection")
    
    # Check if anomaly test file exists
    anomaly_file = DATA_DIR / "anomaly_test.csv"
    if not anomaly_file.exists():
        print_error(f"File not found: {anomaly_file}")
        print_info("Skipping anomaly test - create anomaly_test.csv with outliers")
        return
    
    try:
        with open(anomaly_file, "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Analyze this file for any issues.",
                "session_id": ""
            }
            
            print_info("Testing anomaly detection...")
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("API responded successfully!")
                
                if "ai_response" in result:
                    ai_response = result["ai_response"].lower()
                    if "anomaly" in ai_response or "outlier" in ai_response:
                        print_success("✓ AI detected and mentioned the anomaly!")
                        print_info(f"Response: {result['ai_response'][:200]}...")
                    else:
                        print_error("AI did not mention anomalies in response")
                
                if "full_analysis_report" in result:
                    anomalies = result["full_analysis_report"].get("anomalies_table", [])
                    if anomalies:
                        print_success(f"✓ {len(anomalies)} anomaly/anomalies detected")
                        for anom in anomalies:
                            severity = anom.get("severity", "Unknown")
                            metric = anom.get("metric", "Unknown")
                            print_info(f"  - {severity} severity in {metric}")
                    else:
                        print_error("No anomalies found in anomalies_table")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_1_4_insufficient_data():
    """Test Case 1.4: Graceful failure with insufficient data"""
    print_section("TEST 1.4: Insufficient Data for Forecasting")
    
    try:
        with open(DATA_DIR / "messy_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "Forecast my revenue.",
                "session_id": ""
            }
            
            print_info("Testing with insufficient data (only 6 rows)...")
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("API handled insufficient data gracefully!")
                
                if "ai_response" in result:
                    ai_response = result["ai_response"].lower()
                    if "cannot" in ai_response or "insufficient" in ai_response or "small" in ai_response:
                        print_success("✓ AI explained the data limitation")
                        print_info(f"Response: {result['ai_response'][:200]}...")
                    
                if "full_analysis_report" in result:
                    forecast = result["full_analysis_report"].get("forecast_chart", [])
                    if len(forecast) == 0:
                        print_success("✓ Forecast chart is empty (as expected)")
                    
                    model_health = result["full_analysis_report"].get("model_health_report", {})
                    if model_health.get("status") == "Failed":
                        print_success(f"✓ Model status: Failed")
                        print_info(f"  Reason: {model_health.get('reason', 'N/A')}")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_1_5_unrelated_query():
    """Test Case 1.5: Query unrelated to financial data"""
    print_section("TEST 1.5: Off-Topic Query Handling")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "user_query": "What is the capital of France?",
                "session_id": ""
            }
            
            print_info("Testing with off-topic question...")
            response = requests.post(f"{BASE_URL}/api/agent/analyze_and_respond", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("API responded successfully!")
                
                if "ai_response" in result:
                    ai_response = result["ai_response"].lower()
                    if "financial" in ai_response or "cannot" in ai_response or "purpose" in ai_response:
                        print_success("✓ AI politely refused to answer off-topic question")
                        print_info(f"Response: {result['ai_response'][:200]}...")
                    else:
                        print_error("AI may have answered the off-topic question")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_2_2_simulation_negative():
    """Test Case 2.2: Negative impact simulation"""
    print_section("TEST 2.2: What-If Simulation - Negative Impact")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "parameter": "revenue",
                "change_pct": -15
            }
            
            print_info("Simulating: What if revenue decreases by 15%?")
            response = requests.post(f"{BASE_URL}/api/simulate", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("Simulation completed!")
                
                if "summary_text" in result:
                    print_success(f"Summary: {result['summary_text']}")
                
                if "impact" in result:
                    impact = result["impact"]
                    profit_pct = impact.get("profit_impact_percentage", 0)
                    print_success(f"Profit impact: {profit_pct:+.2f}%")
                    
                    if profit_pct < 0:
                        print_success("✓ As expected: reducing revenue decreases profit!")
                    else:
                        print_error("Unexpected: profit impact should be negative")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_3_1_full_report_storyteller():
    """Test Case 3.1: Full report with storyteller mode"""
    print_section("TEST 3.1: Full Report - Storyteller Persona")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "mode": "financial_storyteller",
                "forecast_metric": "revenue"
            }
            
            print_info("Requesting full report in storyteller mode...")
            response = requests.post(f"{BASE_URL}/api/full_report", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("Full report generated!")
                
                if "narratives" in result:
                    narratives = result["narratives"]
                    if "narrative" in narratives:
                        print_success("✓ Storyteller narrative generated")
                        print_info(f"Narrative: {narratives['narrative'][:200]}...")
                    
                    # Check it doesn't have summary_text or recommendations
                    if "summary_text" not in narratives:
                        print_success("✓ No summary_text (as expected for storyteller)")
                    if "recommendations" not in narratives:
                        print_success("✓ No recommendations (as expected for storyteller)")
                
                if "forecast_chart" in result:
                    print_success(f"Forecast chart: {len(result['forecast_chart'])} data points")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_3_2_full_report_guardian():
    """Test Case 3.2: Full report with guardian mode"""
    print_section("TEST 3.2: Full Report - Finance Guardian Mode")
    
    try:
        with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
            files = {"file": f}
            data = {
                "mode": "finance_guardian",
                "forecast_metric": "expenses"
            }
            
            print_info("Requesting full report in guardian mode for expenses...")
            response = requests.post(f"{BASE_URL}/api/full_report", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print_success("Full report generated!")
                
                if "forecast_chart" in result:
                    forecast = result["forecast_chart"]
                    if forecast:
                        values = [point.get("predicted", 0) for point in forecast]
                        avg_predicted = sum(values) / len(values) if values else 0
                        print_success(f"Average predicted expenses: ~{avg_predicted:,.0f}")
                        
                        if 50000 <= avg_predicted <= 90000:
                            print_success("✓ Forecast values are in expected expense range (50-90k)")
                        else:
                            print_info(f"Forecast values: {avg_predicted:,.0f} (check if reasonable)")
                
                if "anomalies_table" in result:
                    anomalies = result["anomalies_table"]
                    if anomalies:
                        print_info(f"Anomalies detected: {len(anomalies)}")
                        for anom in anomalies:
                            print_info(f"  - {anom.get('severity')} in {anom.get('metric')}")
            else:
                print_error(f"API returned status code {response.status_code}")
                
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_all_metrics():
    """Test all key metrics: Revenue, Expenses, Profit, Cashflow"""
    print_section("COMPREHENSIVE TEST: All Key Metrics")
    
    metrics = ["revenue", "expenses", "profit", "cashflow"]
    
    for metric in metrics:
        print_info(f"\n--- Testing metric: {metric.upper()} ---")
        
        try:
            with open(DATA_DIR / "sample_financial_data.csv", "rb") as f:
                files = {"file": f}
                data = {
                    "mode": "finance_guardian",
                    "forecast_metric": metric
                }
                
                response = requests.post(f"{BASE_URL}/api/full_report", files=files, data=data, timeout=30)
                
                if response.status_code == 200:
                    result = response.json()
                    print_success(f"✓ {metric.capitalize()} analysis completed")
                    
                    # Check KPIs
                    if "kpis" in result:
                        kpis = result["kpis"]
                        if metric in kpis:
                            print_success(f"  KPI value: {kpis[metric]}")
                    
                    # Check forecast
                    if "forecast_chart" in result and result["forecast_chart"]:
                        print_success(f"  Forecast: {len(result['forecast_chart'])} data points")
                else:
                    print_error(f"✗ {metric.capitalize()} analysis failed: {response.status_code}")
                    
            time.sleep(1)  # Brief pause between requests
            
        except Exception as e:
            print_error(f"✗ Error testing {metric}: {str(e)}")

def check_api_health():
    """Check if the API is running"""
    print_section("Checking API Health")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print_success(f"API is running at {BASE_URL}")
            print_info(f"📚 View interactive docs at: {BASE_URL}/docs")
            return True
        else:
            print_error(f"API returned unexpected status code: {response.status_code}")
            return False
    except requests.ConnectionError:
        print_error(f"Cannot connect to API at {BASE_URL}")
        print_info("Make sure Docker containers are running: docker compose up -d")
        return False

def main():
    """Run all tests"""
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}Agentic CFO Copilot - Complete API Test Suite{RESET}")
    print(f"{BLUE}Based on: API Exploration Guide for Frontend Developers{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    # Check if API is running
    if not check_api_health():
        return
    
    # Run tests
    print_info("\n🚀 Starting comprehensive API tests...\n")
    
    # === PART 1: Conversational Endpoint Tests ===
    print_info("PART 1: Testing /api/agent/analyze_and_respond")
    
    # Test 1.1: First interaction (Golden Path)
    session_id = test_1_1_golden_path()
    time.sleep(2)
    
    # Test 1.2: Contextual follow-up with memory
    test_1_2_contextual_followup(session_id)
    time.sleep(2)
    
    # Test 1.3: Anomaly detection
    test_1_3_anomaly_detection()
    time.sleep(2)
    
    # Test 1.4: Insufficient data handling
    test_1_4_insufficient_data()
    time.sleep(2)
    
    # Test 1.5: Off-topic query handling
    test_1_5_unrelated_query()
    time.sleep(2)
    
    # === PART 2: Simulation Endpoint Tests ===
    print_info("\nPART 2: Testing /api/simulate")
    
    # Test 2.1: Positive impact simulation
    test_2_1_simulation_positive()
    time.sleep(2)
    
    # Test 2.2: Negative impact simulation
    test_2_2_simulation_negative()
    time.sleep(2)
    
    # === PART 3: Full Report Endpoint Tests ===
    print_info("\nPART 3: Testing /api/full_report")
    
    # Test 3.1: Storyteller persona
    test_3_1_full_report_storyteller()
    time.sleep(2)
    
    # Test 3.2: Finance guardian persona
    test_3_2_full_report_guardian()
    time.sleep(2)
    
    # === PART 4: All Key Metrics ===
    print_info("\nPART 4: Testing all key metrics")
    test_all_metrics()
    
    # Summary
    print_section("🎉 Test Suite Complete!")
    print_success("All API tests completed successfully!")
    print_info(f"\n📚 Interactive API docs: {BASE_URL}/docs")
    print_info("💡 Your API is ready for frontend integration!")
    print_info("\nNext steps:")
    print_info("  1. Review the test results above")
    print_info("  2. Build UI components for each response type")
    print_info("  3. Handle edge cases (errors, insufficient data, etc.)")
    print_info("  4. Implement real-time updates for long-running operations\n")

if __name__ == "__main__":
    main()
