#!/bin/bash

# Praxify CFO - Quick Start Script
# This script helps you quickly set up and deploy the AIML Engine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Praxify CFO - AIML Engine Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Main script
print_header

echo "Checking prerequisites..."
echo ""

# Check Docker
if check_command docker; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    print_info "Docker version: $DOCKER_VERSION"
else
    print_error "Docker is required but not installed."
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if check_command docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | tr -d ',')
    print_info "Docker Compose version: $COMPOSE_VERSION"
elif docker compose version &> /dev/null; then
    print_success "Docker Compose (plugin) is installed"
    COMPOSE_VERSION=$(docker compose version --short)
    print_info "Docker Compose version: $COMPOSE_VERSION"
else
    print_error "Docker Compose is required but not installed."
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo ""
print_info "All prerequisites satisfied!"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_success "Created .env file. You may want to customize it."
else
    print_info ".env file already exists"
fi

echo ""
echo "What would you like to do?"
echo ""
echo "1) Build and start the application (API only)"
echo "2) Build and start with Nginx reverse proxy"
echo "3) Start in development mode (with live reload)"
echo "4) Just build the Docker image"
echo "5) View logs of running containers"
echo "6) Stop all containers"
echo "7) Run tests"
echo "8) Clean up (remove containers and images)"
echo "9) Exit"
echo ""
read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        print_info "Building and starting the application..."
        docker-compose build
        docker-compose up -d
        echo ""
        print_success "Application started successfully!"
        echo ""
        print_info "API is available at: http://localhost:8000"
        print_info "API documentation at: http://localhost:8000/docs"
        echo ""
        print_info "View logs with: docker-compose logs -f aiml-engine"
        ;;
    2)
        print_info "Building and starting with Nginx..."
        docker-compose --profile with-nginx build
        docker-compose --profile with-nginx up -d
        echo ""
        print_success "Application started with Nginx!"
        echo ""
        print_info "API is available at: http://localhost:80"
        print_info "API documentation at: http://localhost:80/docs"
        echo ""
        print_info "View logs with: docker-compose logs -f"
        ;;
    3)
        print_info "Starting in development mode..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
        ;;
    4)
        print_info "Building Docker image..."
        docker-compose build
        print_success "Docker image built successfully!"
        ;;
    5)
        print_info "Viewing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    6)
        print_info "Stopping all containers..."
        docker-compose down
        print_success "All containers stopped!"
        ;;
    7)
        print_info "Running tests..."
        if docker-compose ps | grep -q "aiml-engine.*Up"; then
            docker-compose exec aiml-engine pytest tests/ -v
        else
            print_warning "Containers are not running. Starting them first..."
            docker-compose up -d
            sleep 5
            docker-compose exec aiml-engine pytest tests/ -v
        fi
        ;;
    8)
        print_warning "This will remove all containers, images, and volumes."
        read -p "Are you sure? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker-compose down -v
            docker system prune -af --volumes
            print_success "Cleanup complete!"
        else
            print_info "Cleanup cancelled."
        fi
        ;;
    9)
        print_info "Goodbye!"
        exit 0
        ;;
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
print_success "Done!"
echo ""
print_info "For more options, check out:"
echo "  - Makefile (run 'make help' to see all commands)"
echo "  - DOCKER_DEPLOYMENT.md (comprehensive deployment guide)"
echo "  - CLOUD_DEPLOYMENT_GUIDE.md (cloud platform comparisons)"
