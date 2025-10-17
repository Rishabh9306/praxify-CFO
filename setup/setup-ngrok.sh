#!/bin/bash
# ngrok Setup Script for Praxify CFO
# This script helps you set up ngrok tunneling for local backend + Vercel frontend

set -e  # Exit on error

echo "🚀 Praxify CFO - ngrok Tunneling Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok is not installed or not in PATH${NC}"
    echo "Please install ngrok from: https://ngrok.com/download"
    exit 1
fi

echo -e "${GREEN}✅ ngrok found!${NC}"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on port 8000${NC}"
    echo "Please start the backend first:"
    echo "  docker-compose up -d"
    echo "  OR"
    echo "  docker start praxify-cfo-aiml-engine"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running on port 8000${NC}"
echo ""

# Check if Redis is running
if ! docker ps | grep -q "praxify-cfo-redis"; then
    echo -e "${YELLOW}⚠️  Redis container not found${NC}"
    echo "Starting Redis..."
    docker run -d -p 6379:6379 --name praxify-redis redis:7-alpine || true
fi

echo -e "${GREEN}✅ Redis is running${NC}"
echo ""

# Get current CORS origins
CURRENT_CORS=$(grep "CORS_ORIGINS=" /home/draxxy/praxify-CFO/.env | cut -d '=' -f 2)
echo "Current CORS origins:"
echo "  $CURRENT_CORS"
echo ""

echo "📡 Starting ngrok tunnel..."
echo ""
echo -e "${YELLOW}IMPORTANT INSTRUCTIONS:${NC}"
echo "1. ngrok will start and show you a URL like: https://abc123.ngrok.io"
echo "2. Copy that HTTPS URL"
echo "3. Press Ctrl+Z to pause ngrok (don't close it!)"
echo "4. Add the URL to your backend .env CORS_ORIGINS"
echo "5. Restart the backend: docker restart praxify-cfo-aiml-engine"
echo "6. Resume ngrok: type 'fg' and press Enter"
echo "7. Use the ngrok URL as NEXT_PUBLIC_API_URL in Vercel"
echo ""
echo "Press Enter to start ngrok..."
read

# Start ngrok
echo ""
echo -e "${GREEN}🚀 Starting ngrok on port 8000...${NC}"
echo ""
ngrok http 8000
