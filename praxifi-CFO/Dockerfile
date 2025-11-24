# Multi-stage Dockerfile for Agentic CFO Copilot
# Optimized for production deployment with minimal image size

# Stage 1: Builder stage for dependencies
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies required for Python packages
# Use multiple mirror attempts with retries
RUN (apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*) || \
    (sed -i 's|deb.debian.org|ftp.us.debian.org|g' /etc/apt/sources.list && \
    apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*)

# Copy requirements file
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install wheel
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install runtime system dependencies (including curl for healthcheck)
# Use multiple mirror attempts with retries
RUN (apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*) || \
    (sed -i 's|deb.debian.org|ftp.us.debian.org|g' /etc/apt/sources.list && \
    apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*)

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Copy application code
COPY aiml_engine/ ./aiml_engine/
COPY tests/ ./tests/

# Create directories for data persistence
RUN mkdir -p /app/uploads /app/outputs /app/logs

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/', timeout=5)" || exit 1

# Default command to run the FastAPI application
# --timeout-keep-alive: Increased to 30 minutes for long-running requests (large datasets)
# --timeout-graceful-shutdown: Allow 60 seconds for graceful shutdown
CMD ["sh", "-c", "uvicorn aiml_engine.api.app:app --host 0.0.0.0 --port ${API_PORT:-8080} --timeout-keep-alive 1800 --timeout-graceful-shutdown 60"]
