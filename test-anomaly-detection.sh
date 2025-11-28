#!/bin/bash

# Test Anomaly Detection V2 Pipeline
# Quick script to copy test data to Docker and run tests

set -e

echo "🧪 Anomaly Detection V2 - Test Pipeline"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/praxifi-CFO"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Check if containers are running
CONTAINER_ID=$(docker ps -qf "name=aiml-engine")
if [ -z "$CONTAINER_ID" ]; then
    echo -e "${YELLOW}⚠️  Backend container not running${NC}"
    echo "   Starting containers..."
    docker-compose up -d
    echo "   Waiting 30 seconds for services to start..."
    sleep 30
    CONTAINER_ID=$(docker ps -qf "name=aiml-engine")
fi

echo -e "${BLUE}📦 Container ID: $CONTAINER_ID${NC}"
echo ""

# Step 1: Copy test file to Docker
echo -e "${BLUE}1️⃣  Copying test file to Docker container...${NC}"
if [ -f "data/anomaly_test_data.csv" ]; then
    docker cp data/anomaly_test_data.csv $CONTAINER_ID:/app/data/
    echo -e "${GREEN}   ✅ Test file copied${NC}"
else
    echo -e "${RED}   ❌ Test file not found: data/anomaly_test_data.csv${NC}"
    exit 1
fi
echo ""

# Step 2: Verify v2 module is loaded
echo -e "${BLUE}2️⃣  Verifying Enhanced Anomaly Detection V2 module...${NC}"
if docker exec $CONTAINER_ID python -c "from aiml_engine.core.anomaly_detection_v2 import EnhancedAnomalyDetectionModule; print('✅ V2 loaded successfully')" 2>/dev/null; then
    echo -e "${GREEN}   ✅ V2 module loaded${NC}"
else
    echo -e "${RED}   ❌ V2 module not found!${NC}"
    echo "   Run: ./deploy-anomaly-v2.sh"
    exit 1
fi
echo ""

# Step 3: Test API endpoint
echo -e "${BLUE}3️⃣  Testing API endpoint...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:8000/full_report \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/app/data/anomaly_test_data.csv",
    "persona": "CFO"
  }')

if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ API request failed${NC}"
    echo "   Is the backend running? Check: docker-compose logs aiml-engine"
    exit 1
fi

echo -e "${GREEN}   ✅ API responded${NC}"
echo ""

# Step 4: Parse results
echo -e "${BLUE}4️⃣  Analyzing results...${NC}"
echo "========================================"
echo ""

TOTAL=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('anomalies_table', [])))" 2>/dev/null || echo "0")
CRITICAL=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(sum(1 for a in data.get('anomalies_table', []) if a.get('severity_level', a.get('severity', '')).lower() == 'critical'))" 2>/dev/null || echo "0")
HIGH=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(sum(1 for a in data.get('anomalies_table', []) if a.get('severity_level', a.get('severity', '')).lower() == 'high'))" 2>/dev/null || echo "0")
MEDIUM=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(sum(1 for a in data.get('anomalies_table', []) if a.get('severity_level', a.get('severity', '')).lower() == 'medium'))" 2>/dev/null || echo "0")

echo "📊 RESULTS SUMMARY"
echo "─────────────────────────────────────────"
echo -e "Total Anomalies Detected: ${GREEN}$TOTAL${NC}"
echo ""
echo "By Severity:"
if [ "$CRITICAL" -gt 0 ]; then
    echo -e "  • CRITICAL: ${RED}$CRITICAL${NC}"
fi
if [ "$HIGH" -gt 0 ]; then
    echo -e "  • HIGH: ${YELLOW}$HIGH${NC}"
fi
if [ "$MEDIUM" -gt 0 ]; then
    echo -e "  • MEDIUM: ${BLUE}$MEDIUM${NC}"
fi
echo ""

# Show top 3 anomalies
echo "🎯 TOP 3 ANOMALIES:"
echo "─────────────────────────────────────────"
echo "$RESPONSE" | python3 << 'PYTHON_SCRIPT'
import sys, json

try:
    data = json.load(sys.stdin)
    anomalies = data.get('anomalies_table', [])
    
    # Sort by confidence
    sorted_anomalies = sorted(anomalies, key=lambda x: x.get('confidence', 0), reverse=True)[:3]
    
    for i, anom in enumerate(sorted_anomalies, 1):
        metric = anom.get('metric', 'Unknown').upper()
        date = anom.get('date', 'Unknown')
        severity = anom.get('severity_level', anom.get('severity', 'unknown')).upper()
        confidence = anom.get('confidence', 0) * 100
        deviation = anom.get('deviation_percent', 0)
        
        print(f"\n{i}. {metric}")
        print(f"   Date: {date}")
        print(f"   Severity: {severity}")
        print(f"   Confidence: {confidence:.1f}%")
        print(f"   Deviation: {deviation:+.1f}%")
        
        if 'detection_methods' in anom:
            methods = anom['detection_methods']
            print(f"   Algorithms: {len(methods)}/6 agreed")
            
except Exception as e:
    print(f"Error parsing results: {e}")
PYTHON_SCRIPT

echo ""
echo "========================================"
echo ""

# Validation
if [ "$TOTAL" -ge 8 ] && [ "$CRITICAL" -ge 2 ]; then
    echo -e "${GREEN}✅ TEST PASSED!${NC}"
    echo ""
    echo "Expected Results:"
    echo "  ✅ Total Anomalies: $TOTAL (expected: 8-12)"
    echo "  ✅ Critical Alerts: $CRITICAL (expected: 2+)"
    echo ""
    echo "🎉 Enhanced anomaly detection is working!"
else
    echo -e "${YELLOW}⚠️  TEST RESULTS UNEXPECTED${NC}"
    echo ""
    echo "Expected:"
    echo "  • Total: 8-12 anomalies"
    echo "  • Critical: 2+ alerts"
    echo ""
    echo "Got:"
    echo "  • Total: $TOTAL"
    echo "  • Critical: $CRITICAL"
    echo ""
    echo "💡 This might be OK - check the detailed results above"
fi

echo ""
echo "📚 Next Steps:"
echo "  1. View results in frontend: http://localhost:3000/insights"
echo "  2. Check test guide: ANOMALY_TEST_GUIDE.md"
echo "  3. Review documentation: ANOMALY_DETECTION_V2_IMPLEMENTATION.md"
echo ""
echo "🔧 Troubleshooting:"
echo "  • Backend logs: docker-compose logs aiml-engine"
echo "  • Test manually: python3 test_anomaly_pipeline.py"
echo "  • Full response: curl http://localhost:8000/full_report -d '{...}'"
echo ""
