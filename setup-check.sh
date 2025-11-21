#!/bin/bash

# Praxify CFO - Quick Setup Script
# This script helps you verify and set up the project configuration

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║        PRAXIFY CFO - CONFIGURATION CHECK & SETUP                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Define paths
PROJECT_ROOT="/home/draxxy/praxifi"
BACKEND_DIR="$PROJECT_ROOT/praxifi-CFO"
FRONTEND_DIR="$PROJECT_ROOT/praxifi-frontend"

# Check if running from correct directory
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ ERROR: Project directories not found!"
    echo "   Expected structure:"
    echo "   $PROJECT_ROOT/"
    echo "   ├── praxifi-CFO/"
    echo "   └── praxifi-frontend/"
    exit 1
fi

echo "📁 Project Structure Check"
echo "   ✅ Backend directory found: $BACKEND_DIR"
echo "   ✅ Frontend directory found: $FRONTEND_DIR"
echo ""

# Check Frontend Configuration
echo "🎨 Frontend Configuration Check"
if [ -f "$FRONTEND_DIR/.env.local" ]; then
    echo "   ✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_API_URL=http://localhost:8000" "$FRONTEND_DIR/.env.local"; then
        echo "   ✅ API URL configured correctly"
    else
        echo "   ⚠️  API URL may need verification"
    fi
else
    echo "   ❌ .env.local missing"
    echo "   Creating .env.local..."
    cat > "$FRONTEND_DIR/.env.local" << 'EOF'
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    echo "   ✅ Created .env.local with default configuration"
fi

if [ -d "$FRONTEND_DIR/node_modules" ]; then
    echo "   ✅ Frontend dependencies installed"
else
    echo "   ❌ Frontend dependencies missing"
    echo "   Run: cd $FRONTEND_DIR && pnpm install"
fi
echo ""

# Check Backend Configuration
echo "🔧 Backend Configuration Check"
if [ -f "$BACKEND_DIR/.env" ]; then
    echo "   ✅ .env file exists"
    
    if grep -q "GOOGLE_API_KEY=.*[a-zA-Z0-9]" "$BACKEND_DIR/.env"; then
        echo "   ✅ GOOGLE_API_KEY is set"
    else
        echo "   ⚠️  GOOGLE_API_KEY appears to be empty or not set"
        echo "   Please edit $BACKEND_DIR/.env and add your API key"
    fi
else
    echo "   ❌ .env file missing"
    echo ""
    read -p "   Would you like to create it from .env.example? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo "   ✅ Created .env from .env.example"
        echo ""
        echo "   ⚠️  IMPORTANT: You must edit $BACKEND_DIR/.env"
        echo "      and add your Google Gemini API key:"
        echo "      GOOGLE_API_KEY=your_actual_key_here"
        echo ""
        echo "   Get your API key from: https://ai.google.dev/"
    fi
fi
echo ""

# Check Docker
echo "🐳 Docker Check"
if command -v docker &> /dev/null; then
    echo "   ✅ Docker is installed"
    if docker compose version &> /dev/null; then
        echo "   ✅ Docker Compose is available"
    else
        echo "   ⚠️  Docker Compose not found (may need 'docker-compose' instead)"
    fi
else
    echo "   ❌ Docker is not installed"
    echo "   Install from: https://docs.docker.com/get-docker/"
fi
echo ""

# Check if services are running
echo "🚀 Service Status Check"
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is not running"
    echo "   Start with: cd $BACKEND_DIR && docker compose up -d"
fi

if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 3000"
else
    echo "   ❌ Frontend is not running"
    echo "   Start with: cd $FRONTEND_DIR && pnpm dev"
fi
echo ""

# Summary and Next Steps
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                      NEXT STEPS                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "1️⃣  Create backend .env file:"
    echo "   cd $BACKEND_DIR"
    echo "   cp .env.example .env"
    echo "   # Edit .env and add GOOGLE_API_KEY"
    echo ""
fi

echo "2️⃣  Start the backend:"
echo "   cd $BACKEND_DIR"
echo "   docker compose up -d"
echo ""

echo "3️⃣  Start the frontend:"
echo "   cd $FRONTEND_DIR"
echo "   pnpm dev"
echo ""

echo "4️⃣  Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

echo "📚 For detailed instructions, see:"
echo "   $PROJECT_ROOT/SETUP_GUIDE.md"
echo "   $PROJECT_ROOT/CONFIGURATION_STATUS.md"
echo ""
