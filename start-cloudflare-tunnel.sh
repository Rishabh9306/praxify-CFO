#!/bin/bash
# Start Cloudflare Tunnel for Praxifi Backend
# This script starts the Cloudflare tunnel to expose the backend at api.praxifi.com

echo "Starting Cloudflare Tunnel for Praxifi Backend..."
echo "Tunnel ID: 74d09ce1-0c25-4211-bb94-be4b0d64ddff"
echo "Hostname: api.praxifi.com"
echo "Local Service: http://localhost:8080"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8080/ > /dev/null; then
    echo "⚠️  WARNING: Backend doesn't seem to be running on localhost:8080"
    echo "Please start the backend first with: cd praxifi-CFO && docker-compose up"
    echo ""
fi

# Start the tunnel
cloudflared tunnel --config /home/draxxy/.cloudflared/config.yml run praxifi-backend
