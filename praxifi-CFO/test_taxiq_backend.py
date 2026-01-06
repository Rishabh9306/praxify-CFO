#!/usr/bin/env python3
"""
TaxIQ Backend Test Script
Tests all TaxIQ endpoints with sample data
"""

import requests
import json
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
DATA_DIR = Path(__file__).parent / "data"

def print_section(title):
    """Print formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")

def print_response(response, show_full=False):
    """Print API response"""
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if show_full:
            print(json.dumps(data, indent=2, default=str))
        else:
            # Print summary
            if isinstance(data, dict):
                for key, value in list(data.items())[:10]:  # First 10 keys
                    if isinstance(value, (int, float, str, bool)):
                        print(f"  {key}: {value}")
                    elif isinstance(value, list):
                        print(f"  {key}: [{len(value)} items]")
                    elif isinstance(value, dict):
                        print(f"  {key}: {{{len(value)} keys}}")
    else:
        print(f"Error: {response.text}")
    print()

def test_health_check():
    """Test TaxIQ health endpoint"""
    print_section("1. Health Check")
    response = requests.get(f"{BASE_URL}/api/tax/health")
    print_response(response, show_full=True)
    return response.status_code == 200

def test_upload_purchase_register():
    """Test purchase register upload"""
    print_section("2. Upload Purchase Register")
    
    file_path = DATA_DIR / "sample_purchase_register.csv"
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'rb') as f:
        files = {'file': ('purchase_register.csv', f, 'text/csv')}
        response = requests.post(
            f"{BASE_URL}/api/tax/upload/purchase-register",
            files=files
        )
    
    print_response(response, show_full=True)
    return response.status_code == 200

def test_upload_sales_register():
    """Test sales register upload"""
    print_section("3. Upload Sales Register")
    
    file_path = DATA_DIR / "sample_sales_register.csv"
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'rb') as f:
        files = {'file': ('sales_register.csv', f, 'text/csv')}
        response = requests.post(
            f"{BASE_URL}/api/tax/upload/sales-register",
            files=files
        )
    
    print_response(response, show_full=True)
    return response.status_code == 200

def test_upload_expense_register():
    """Test expense register upload"""
    print_section("4. Upload Expense Register")
    
    file_path = DATA_DIR / "sample_expense_register.csv"
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'rb') as f:
        files = {'file': ('expense_register.csv', f, 'text/csv')}
        response = requests.post(
            f"{BASE_URL}/api/tax/upload/expense-register",
            files=files
        )
    
    print_response(response, show_full=True)
    return response.status_code == 200

def test_itc_analysis():
    """Test ITC recovery analysis"""
    print_section("5. ITC Recovery Analysis")
    
    response = requests.get(f"{BASE_URL}/api/tax/analysis/itc-recovery")
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        print("📊 ITC Summary:")
        print(f"  Total ITC Available: ₹{data.get('total_itc_available', 0):,.0f}")
        print(f"  ITC Claimed: ₹{data.get('itc_claimed', 0):,.0f}")
        print(f"  ITC at Risk: ₹{data.get('itc_at_risk', 0):,.0f}")
        print(f"  Recovery Rate: {data.get('recovery_rate', 0):.1f}%")
        print(f"  Potential Savings: ₹{data.get('potential_savings', 0):,.0f}")
        print(f"\n  Top Recommendation: {data.get('recommendations', ['N/A'])[0]}")
    
    return response.status_code == 200

def test_rcm_analysis():
    """Test RCM detection"""
    print_section("6. RCM Detection & Compliance")
    
    response = requests.get(f"{BASE_URL}/api/tax/analysis/rcm-detection")
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        print("📊 RCM Summary:")
        print(f"  Total RCM Applicable: ₹{data.get('total_rcm_applicable', 0):,.0f}")
        print(f"  RCM Paid: ₹{data.get('rcm_paid', 0):,.0f}")
        print(f"  RCM Pending: ₹{data.get('rcm_pending', 0):,.0f}")
        print(f"  Risk Score: {data.get('risk_score', 0):.0f}/100")
        print(f"  Penalties at Risk: ₹{data.get('penalties_at_risk', 0):,.0f}")
        print(f"\n  Top Recommendation: {data.get('recommendations', ['N/A'])[0]}")
    
    return response.status_code == 200

def test_tax_optimization():
    """Test tax optimization"""
    print_section("7. Tax Optimization Analysis")
    
    response = requests.get(f"{BASE_URL}/api/tax/analysis/tax-optimization")
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        print("📊 Optimization Summary:")
        print(f"  Current Tax Liability: ₹{data.get('current_tax_liability', 0):,.0f}")
        print(f"  Optimized Liability: ₹{data.get('optimized_tax_liability', 0):,.0f}")
        print(f"  Potential Savings: ₹{data.get('potential_savings', 0):,.0f}")
        print(f"  Savings %: {data.get('savings_percentage', 0):.1f}%")
        print(f"  Effective Tax Rate: {data.get('effective_tax_rate', 0):.1f}%")
        print(f"  Industry Benchmark: {data.get('industry_benchmark', 0):.1f}%")
        
        scenarios = data.get('scenarios', [])
        if scenarios:
            print(f"\n  Top Scenario: {scenarios[0].get('name')}")
            print(f"    Savings: ₹{scenarios[0].get('savings', 0):,.0f}")
            print(f"    Implementation: {scenarios[0].get('implementation', 'N/A')}")
    
    return response.status_code == 200

def test_compliance_risk():
    """Test compliance risk assessment"""
    print_section("8. Compliance Risk Assessment")
    
    response = requests.get(f"{BASE_URL}/api/tax/analysis/compliance-risk")
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        print("📊 Risk Summary:")
        print(f"  Overall Risk Score: {data.get('overall_risk_score', 0):.0f}/100")
        print(f"  Risk Level: {data.get('risk_level', 'N/A')}")
        print(f"  Compliance Score: {data.get('compliance_score', 0):.0f}/100")
        print(f"  Audit Probability: {data.get('audit_probability', 0):.0f}%")
        print(f"  Potential Penalties: ₹{data.get('potential_penalties', 0):,.0f}")
        
        critical = data.get('critical_issues', [])
        print(f"\n  Critical Issues: {len(critical)}")
        if critical:
            print(f"    - {critical[0].get('type')}: {critical[0].get('description')}")
        
        deadlines = data.get('upcoming_deadlines', [])
        if deadlines:
            print(f"\n  Next Deadline: {deadlines[0].get('return_type')} on {deadlines[0].get('deadline')}")
    
    return response.status_code == 200

def test_quick_summary():
    """Test quick summary"""
    print_section("9. Quick Summary")
    
    response = requests.get(f"{BASE_URL}/api/tax/summary")
    print_response(response, show_full=True)
    
    return response.status_code == 200

def test_complete_dashboard():
    """Test complete dashboard"""
    print_section("10. Complete Dashboard")
    
    response = requests.get(f"{BASE_URL}/api/tax/dashboard")
    
    if response.status_code == 200:
        data = response.json()
        summary = data.get('summary', {})
        
        print("📊 COMPLETE TAXIQ DASHBOARD")
        print("\n" + "-"*80)
        print("DATA OVERVIEW:")
        print(f"  Purchases: {summary.get('total_purchases', 0)}")
        print(f"  Sales: {summary.get('total_sales', 0)}")
        print(f"  Expenses: {summary.get('total_expenses', 0)}")
        
        print("\n" + "-"*80)
        print("FINANCIAL IMPACT:")
        print(f"  Total Potential Savings: ₹{summary.get('total_potential_savings', 0):,.0f}")
        print(f"  ITC Recovery Potential: ₹{summary.get('itc_recovery_potential', 0):,.0f}")
        print(f"  Tax Optimization Savings: ₹{summary.get('optimization_savings', 0):,.0f}")
        print(f"  RCM Pending: ₹{summary.get('rcm_pending', 0):,.0f}")
        
        print("\n" + "-"*80)
        print("COMPLIANCE STATUS:")
        print(f"  Risk Score: {summary.get('risk_score', 0):.0f}/100")
        print(f"  Compliance Score: {summary.get('compliance_score', 0):.0f}/100")
        
        print("\n" + "-"*80)
        print("✅ Dashboard generated successfully!")
    else:
        print_response(response)
    
    return response.status_code == 200

def run_all_tests():
    """Run all TaxIQ tests"""
    print("\n" + "🚀"*40)
    print("  TAXIQ BACKEND TEST SUITE")
    print("🚀"*40)
    
    tests = [
        ("Health Check", test_health_check),
        ("Upload Purchase Register", test_upload_purchase_register),
        ("Upload Sales Register", test_upload_sales_register),
        ("Upload Expense Register", test_upload_expense_register),
        ("ITC Analysis", test_itc_analysis),
        ("RCM Analysis", test_rcm_analysis),
        ("Tax Optimization", test_tax_optimization),
        ("Compliance Risk", test_compliance_risk),
        ("Quick Summary", test_quick_summary),
        ("Complete Dashboard", test_complete_dashboard),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except requests.exceptions.ConnectionError:
            print(f"\n❌ ERROR: Cannot connect to {BASE_URL}")
            print("Make sure the backend server is running:")
            print("  cd praxifi-CFO && uvicorn aiml_engine.api.app:app --reload")
            return
        except Exception as e:
            print(f"\n❌ ERROR in {name}: {str(e)}")
            results.append((name, False))
    
    # Print summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} - {name}")
    
    print(f"\n{'='*80}")
    print(f"  RESULTS: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print(f"{'='*80}\n")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! TaxIQ backend is ready!")
    else:
        print(f"⚠️  {total - passed} test(s) failed. Check logs above for details.")

if __name__ == "__main__":
    print("\n⚡ Starting TaxIQ Backend Tests...")
    print(f"Target: {BASE_URL}")
    print("Waiting 2 seconds for server to be ready...\n")
    time.sleep(2)
    
    run_all_tests()
