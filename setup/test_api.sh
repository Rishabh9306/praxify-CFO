#!/bin/bash

# Praxify CFO - API Testing Script
# This script tests the Docker containerized API

set -e

echo "🧪 Testing Praxify CFO AIML Engine API"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"
CSV_FILE="./aiml_engine/data/sample_financial_data.csv"

# Check if API is running
echo -e "${BLUE}Checking if API is running...${NC}"
if curl -s "${API_URL}/" > /dev/null; then
    echo -e "${GREEN}✓ API is running!${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠ API is not responding. Starting Docker Compose...${NC}"
    docker compose up -d
    sleep 5
fi

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file not found at $CSV_FILE"
    exit 1
fi

echo -e "${BLUE}📊 Test 1: Full Report - Finance Guardian Mode${NC}"
echo "Mode: finance_guardian"
echo "Forecast Metric: revenue"
echo ""

curl -X POST "${API_URL}/api/full_report" \
  -F "file=@${CSV_FILE}" \
  -F "mode=finance_guardian" \
  -F "forecast_metric=revenue" \
  -o response_guardian.json

if [ -f response_guardian.json ]; then
    echo -e "${GREEN}✓ Finance Guardian report generated!${NC}"
    echo "Saved to: response_guardian.json"
    echo ""
    echo "Preview (first 500 chars):"
    head -c 500 response_guardian.json
    echo ""
    echo "..."
    echo ""
else
    echo -e "${YELLOW}⚠ Failed to generate report${NC}"
fi

echo ""
echo -e "${BLUE}📊 Test 2: Full Report - Financial Storyteller Mode${NC}"
echo "Mode: financial_storyteller"
echo "Forecast Metric: expense"
echo ""

curl -X POST "${API_URL}/api/full_report" \
  -F "file=@${CSV_FILE}" \
  -F "mode=financial_storyteller" \
  -F "forecast_metric=expense" \
  -o response_storyteller.json

if [ -f response_storyteller.json ]; then
    echo -e "${GREEN}✓ Financial Storyteller report generated!${NC}"
    echo "Saved to: response_storyteller.json"
    echo ""
fi

echo ""
echo -e "${BLUE}📊 Test 3: Scenario Simulation${NC}"
echo "Parameter: revenue"
echo "Change: -10% (10% decrease)"
echo ""

curl -X POST "${API_URL}/api/simulate" \
  -F "file=@${CSV_FILE}" \
  -F "parameter=revenue" \
  -F "change_pct=-10" \
  -o simulation_decrease.json

if [ -f simulation_decrease.json ]; then
    echo -e "${GREEN}✓ Simulation (decrease) completed!${NC}"
    echo "Saved to: simulation_decrease.json"
    echo ""
fi

echo ""
echo -e "${BLUE}📊 Test 4: Scenario Simulation (Increase)${NC}"
echo "Parameter: revenue"
echo "Change: +10% (10% increase)"
echo ""

curl -X POST "${API_URL}/api/simulate" \
  -F "file=@${CSV_FILE}" \
  -F "parameter=revenue" \
  -F "change_pct=10" \
  -o simulation_increase.json

if [ -f simulation_increase.json ]; then
    echo -e "${GREEN}✓ Simulation (increase) completed!${NC}"
    echo "Saved to: simulation_increase.json"
    echo ""
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Generated files:"
ls -lh response_*.json simulation_*.json 2>/dev/null || echo "No output files found"
echo ""
echo "📚 View API documentation at: ${API_URL}/docs"
echo "🔍 View interactive testing at: ${API_URL}/docs"
echo ""
echo "To view a report in formatted JSON:"
echo "  cat response_guardian.json | python -m json.tool | less"
echo ""
