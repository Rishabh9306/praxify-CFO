.PHONY: help build run stop clean test logs shell push deploy

# Configuration
IMAGE_NAME := praxify-cfo-aiml-engine
IMAGE_TAG := latest
CONTAINER_NAME := praxify-cfo-aiml-engine
REGISTRY := your-registry  # Update with your registry
PORT := 8000

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Docker Commands
build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

build-no-cache: ## Build Docker image without cache
	@echo "Building Docker image without cache..."
	docker build --no-cache -t $(IMAGE_NAME):$(IMAGE_TAG) .

run: ## Run container with docker-compose
	@echo "Starting services with docker-compose..."
	docker-compose up -d
	@echo "Services started. API available at http://localhost:$(PORT)"
	@echo "API documentation at http://localhost:$(PORT)/docs"

run-dev: ## Run container in development mode with live reload
	@echo "Starting in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

run-with-nginx: ## Run container with nginx reverse proxy
	@echo "Starting services with nginx..."
	docker-compose --profile with-nginx up -d

stop: ## Stop running containers
	@echo "Stopping containers..."
	docker-compose down

stop-all: ## Stop and remove all containers, networks, and volumes
	@echo "Stopping and removing all resources..."
	docker-compose down -v

restart: stop run ## Restart containers

logs: ## Show container logs
	docker-compose logs -f aiml-engine

logs-all: ## Show all container logs
	docker-compose logs -f

shell: ## Get shell access to running container
	docker-compose exec aiml-engine /bin/bash

ps: ## List running containers
	docker-compose ps

# Testing
test: ## Run tests inside container
	docker-compose exec aiml-engine pytest tests/ -v

test-unit: ## Run unit tests only
	docker-compose exec aiml-engine pytest tests/unit/ -v

test-integration: ## Run integration tests only
	docker-compose exec aiml-engine pytest tests/integration/ -v

test-coverage: ## Run tests with coverage report
	docker-compose exec aiml-engine pytest tests/ -v --cov=aiml_engine --cov-report=html

# Docker Image Management
tag: ## Tag image for registry
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

push: tag ## Push image to registry
	@echo "Pushing image to registry..."
	docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

pull: ## Pull image from registry
	docker pull $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

# Cleanup
clean: ## Remove stopped containers and unused images
	@echo "Cleaning up..."
	docker-compose down
	docker system prune -f

clean-all: ## Remove all containers, images, and volumes
	@echo "Deep cleaning..."
	docker-compose down -v
	docker system prune -af --volumes

# Development
dev-setup: ## Setup development environment
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Please update .env with your configuration"

install: ## Install dependencies locally (for development)
	pip install -r requirements.txt

lint: ## Run linter
	docker-compose exec aiml-engine flake8 aiml_engine/ --max-line-length=120

format: ## Format code
	docker-compose exec aiml-engine black aiml_engine/

# Deployment
deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	# Add your staging deployment commands here

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	# Add your production deployment commands here

# Kubernetes
k8s-deploy: ## Deploy to Kubernetes
	kubectl apply -f k8s-deployment.yaml

k8s-delete: ## Delete from Kubernetes
	kubectl delete -f k8s-deployment.yaml

k8s-status: ## Check Kubernetes deployment status
	kubectl get pods -n praxify-cfo
	kubectl get services -n praxify-cfo

# Monitoring
health: ## Check application health
	@curl -f http://localhost:$(PORT)/ || echo "Service is not healthy"

api-docs: ## Open API documentation
	@echo "Opening API documentation..."
	@which xdg-open > /dev/null && xdg-open http://localhost:$(PORT)/docs || open http://localhost:$(PORT)/docs

# Security
scan: ## Scan image for vulnerabilities
	@echo "Scanning image for vulnerabilities..."
	docker scout cves $(IMAGE_NAME):$(IMAGE_TAG) || trivy image $(IMAGE_NAME):$(IMAGE_TAG)

# Backup
backup-volumes: ## Backup Docker volumes
	@echo "Backing up volumes..."
	docker run --rm -v praxify-cfo_uploads_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/uploads-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
	docker run --rm -v praxify-cfo_outputs_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/outputs-$$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# Utility
version: ## Show version information
	@echo "Docker version:"
	@docker --version
	@echo "Docker Compose version:"
	@docker-compose --version
	@echo "Image: $(IMAGE_NAME):$(IMAGE_TAG)"

stats: ## Show container resource usage
	docker stats $(CONTAINER_NAME)

inspect: ## Inspect container
	docker inspect $(CONTAINER_NAME)
