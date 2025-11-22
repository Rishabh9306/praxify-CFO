#!/bin/bash

# Praxifi Domain Update Script
# Replaces all instances of "yourdomain.com" with your actual domain

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Praxifi Domain Update Script ===${NC}"
echo ""

# Check if domain provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No domain specified${NC}"
    echo ""
    echo "Usage: $0 <your-domain.com>"
    echo "Example: $0 mycompany.com"
    exit 1
fi

DOMAIN=$1

# Validate domain format (basic check)
if [[ ! $DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}Error: Invalid domain format${NC}"
    echo "Domain should be like: example.com"
    exit 1
fi

echo -e "${GREEN}Updating domain to: $DOMAIN${NC}"
echo ""

# Backup original files
echo "Creating backups..."
cp praxifi-CFO/nginx.production.conf praxifi-CFO/nginx.production.conf.backup
cp praxifi-CFO/aiml_engine/api/app.py praxifi-CFO/aiml_engine/api/app.py.backup

# Update nginx configuration
echo "Updating nginx configuration..."
sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-CFO/nginx.production.conf
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ nginx.production.conf updated${NC}"
else
    echo -e "${RED}✗ Failed to update nginx.production.conf${NC}"
    exit 1
fi

# Update CORS configuration
echo "Updating CORS configuration..."
sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-CFO/aiml_engine/api/app.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ app.py CORS updated${NC}"
else
    echo -e "${RED}✗ Failed to update app.py${NC}"
    exit 1
fi

# Copy nginx.production.conf to nginx.conf for deployment
echo "Setting production nginx config as default..."
cp praxifi-CFO/nginx.production.conf praxifi-CFO/nginx.conf
echo -e "${GREEN}✓ nginx.conf updated${NC}"

# Create .env files from examples if they don't exist
echo ""
echo "Checking environment files..."

if [ ! -f "praxifi-CFO/.env" ]; then
    echo "Creating backend .env from example..."
    cp praxifi-CFO/.env.production.example praxifi-CFO/.env
    # Update domain in .env
    sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-CFO/.env
    echo -e "${YELLOW}⚠ Remember to add your GOOGLE_API_KEY to praxifi-CFO/.env${NC}"
else
    echo -e "${GREEN}✓ Backend .env already exists${NC}"
fi

if [ ! -f "praxifi-frontend/.env.production" ]; then
    echo "Creating frontend .env.production from example..."
    cp praxifi-frontend/.env.production.example praxifi-frontend/.env.production
    # Update API URL with domain
    sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-frontend/.env.production
    echo -e "${GREEN}✓ Frontend .env.production created${NC}"
else
    echo -e "${GREEN}✓ Frontend .env.production already exists${NC}"
    # Update domain in existing file
    sed -i "s/yourdomain\.com/$DOMAIN/g" praxifi-frontend/.env.production
fi

echo ""
echo -e "${GREEN}=== Domain Update Complete! ===${NC}"
echo ""
echo "Files updated:"
echo "  - praxifi-CFO/nginx.production.conf (12 instances)"
echo "  - praxifi-CFO/nginx.conf (production config)"
echo "  - praxifi-CFO/aiml_engine/api/app.py (3 instances)"
echo "  - praxifi-CFO/.env (created/updated)"
echo "  - praxifi-frontend/.env.production (created/updated)"
echo ""
echo "Backups created:"
echo "  - praxifi-CFO/nginx.production.conf.backup"
echo "  - praxifi-CFO/aiml_engine/api/app.py.backup"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open praxifi-CFO/.env and add your GOOGLE_API_KEY"
echo "2. Verify changes: grep -r '$DOMAIN' praxifi-CFO/ praxifi-frontend/"
echo "3. Test locally: docker compose build && pnpm build"
echo "4. Commit changes:"
echo "   git add ."
echo "   git commit -m 'Configure for production: $DOMAIN'"
echo "   git push origin v3"
echo ""
echo -e "${GREEN}Ready to deploy to VPS!${NC}"
