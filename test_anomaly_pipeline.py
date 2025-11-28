#!/usr/bin/env python3
"""
Test the enhanced anomaly detection pipeline with test data
"""
import requests
import json
import sys

# Test configuration
API_URL = "http://localhost:8000"
TEST_FILE = "/app/data/anomaly_test_data.csv"

def test_anomaly_detection():
    """Test the anomaly detection endpoint"""
    print("🧪 Testing Enhanced Anomaly Detection Pipeline\n")
    print("=" * 60)
    
    # Test endpoint
    endpoint = f"{API_URL}/full_report"
    
    print(f"\n📡 Sending request to: {endpoint}")
    print(f"📁 Test file: {TEST_FILE}\n")
    
    try:
        # Make request
        payload = {
            "file_path": TEST_FILE,
            "persona": "CFO"
        }
        
        print("⏳ Analyzing data with 6-algorithm ensemble...")
        response = requests.post(endpoint, json=payload, timeout=60)
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return False
        
        data = response.json()
        anomalies = data.get("anomalies_table", [])
        
        print(f"\n✅ Analysis Complete!")
        print("=" * 60)
        print(f"\n📊 RESULTS SUMMARY")
        print("-" * 60)
        print(f"Total Anomalies Detected: {len(anomalies)}")
        
        # Count by severity
        severity_counts = {}
        for a in anomalies:
            severity = a.get("severity_level", a.get("severity", "unknown")).upper()
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print(f"\nBy Severity:")
        for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
            count = severity_counts.get(severity, 0)
            if count > 0:
                print(f"  • {severity}: {count}")
        
        # Calculate average confidence
        confidences = [a.get("confidence", 0) for a in anomalies if "confidence" in a]
        if confidences:
            avg_conf = sum(confidences) / len(confidences) * 100
            print(f"\nAverage Confidence: {avg_conf:.1f}%")
        
        # Show top 5 anomalies
        print(f"\n🎯 TOP ANOMALIES (sorted by confidence):")
        print("-" * 60)
        
        sorted_anomalies = sorted(anomalies, key=lambda x: x.get("confidence", 0), reverse=True)[:5]
        
        for i, anom in enumerate(sorted_anomalies, 1):
            metric = anom.get("metric", "Unknown")
            date = anom.get("date", "Unknown")
            severity = anom.get("severity_level", anom.get("severity", "unknown")).upper()
            confidence = anom.get("confidence", 0) * 100
            deviation = anom.get("deviation_percent", 0)
            
            print(f"\n{i}. {metric.upper()}")
            print(f"   Date: {date}")
            print(f"   Severity: {severity}")
            print(f"   Confidence: {confidence:.1f}%")
            print(f"   Deviation: {deviation:+.1f}%")
            
            # Show ensemble info if available
            if "detection_methods" in anom:
                methods = anom["detection_methods"]
                print(f"   Algorithms: {len(methods)}/6 agreed")
                print(f"   Methods: {', '.join(methods)}")
            
            # Show values
            if "actual_value" in anom and "expected_value" in anom:
                actual = anom["actual_value"]
                expected = anom["expected_value"]
                print(f"   Actual: ${actual:,.0f} vs Expected: ${expected:,.0f}")
        
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        print("\n💡 Check the frontend at http://localhost:3000/insights")
        print("   to see the beautiful visualization of these anomalies!")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Is the backend running?")
        print("   Run: cd praxifi-CFO && docker-compose up -d")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_anomaly_detection()
    sys.exit(0 if success else 1)
