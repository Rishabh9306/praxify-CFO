#!/bin/bash

# Praxifi Production Deployment Script
# Run this script on your VPS to deploy/update the application

set -e  # Exit on error

echo "==================================="
echo "  Praxifi Production Deployment"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
APP_DIR="/opt/praxifi"

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
cd $APP_DIR
sudo -u $ACTUAL_USER git pull origin v3

echo ""
echo -e "${YELLOW}Step 2: Checking environment files...${NC}"

# Check backend .env
if [ ! -f "$APP_DIR/praxifi-CFO/.env" ]; then
    echo -e "${RED}Error: Backend .env file not found!${NC}"
    echo "Please create .env from .env.production.example"
    exit 1
else
    echo -e "${GREEN}✓ Backend .env exists${NC}"
fi

# Check frontend .env.production
if [ ! -f "$APP_DIR/praxifi-frontend/.env.production" ]; then
    echo -e "${RED}Error: Frontend .env.production file not found!${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
else
    echo -e "${GREEN}✓ Frontend .env.production exists${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Building backend...${NC}"
cd $APP_DIR/praxifi-CFO
docker compose build
echo -e "${GREEN}✓ Backend built successfully${NC}"

echo ""
echo -e "${YELLOW}Step 4: Starting backend services...${NC}"
docker compose --profile with-nginx up -d
sleep 5

# Check if containers are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Backend services started${NC}"
else
    echo -e "${RED}✗ Backend services failed to start${NC}"
    docker compose logs --tail=50
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Building frontend...${NC}"
cd $APP_DIR/praxifi-frontend
sudo -u $ACTUAL_USER pnpm install
sudo -u $ACTUAL_USER pnpm build
echo -e "${GREEN}✓ Frontend built successfully${NC}"

echo ""
echo -e "${YELLOW}Step 6: Restarting frontend with PM2...${NC}"
sudo -u $ACTUAL_USER pm2 restart praxifi-frontend || sudo -u $ACTUAL_USER pm2 start ecosystem.config.js
sudo -u $ACTUAL_USER pm2 save
echo -e "${GREEN}✓ Frontend restarted${NC}"

echo ""
echo -e "${YELLOW}Step 7: Checking service status...${NC}"
echo ""
echo "Backend services:"
docker compose ps
echo ""
echo "Frontend status:"
sudo -u $ACTUAL_USER pm2 list

echo ""
echo -e "${GREEN}==================================="
echo -e "  Deployment Completed Successfully!"
echo -e "===================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test frontend: https://praxifi.com"
echo "2. Test API: https://api.praxifi.com/docs"
echo "3. Check logs:"
echo "   - Backend: docker compose logs -f"
echo "   - Frontend: pm2 logs praxifi-frontend"
echo ""
