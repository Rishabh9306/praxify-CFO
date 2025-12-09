#!/bin/bash
# Quick Status Check for Praxifi Backend & Cloudflare Tunnel

echo "=========================================="
echo "   PRAXIFI BACKEND STATUS CHECK"
echo "=========================================="
echo ""

# Check Backend
echo "🔧 BACKEND (localhost:8080):"
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "   ✅ Running"
    curl -s http://localhost:8080/ | python3 -m json.tool 2>/dev/null || echo "   Response OK"
else
    echo "   ❌ Not responding"
    echo "   To start: cd praxifi-CFO && docker-compose up -d"
fi
echo ""

# Check Tunnel
echo "🌐 CLOUDFLARE TUNNEL:"
if ps aux | grep -q "[c]loudflared tunnel"; then
    echo "   ✅ Running (PID: $(ps aux | grep "[c]loudflared tunnel" | awk '{print $2}'))"
else
    echo "   ❌ Not running"
    echo "   To start: ./start-cloudflare-tunnel.sh"
fi
echo ""

# Check Public Access
echo "🌍 PUBLIC ACCESS (https://api.praxifi.com):"
if curl -s https://api.praxifi.com/ > /dev/null 2>&1; then
    echo "   ✅ Accessible"
    curl -s https://api.praxifi.com/ | python3 -m json.tool 2>/dev/null || echo "   Response OK"
else
    echo "   ❌ Not accessible"
    echo "   Check tunnel logs: tail -20 cloudflare-tunnel.log"
fi
echo ""

# Recent tunnel logs
if [ -f "cloudflare-tunnel.log" ]; then
    echo "📋 RECENT TUNNEL LOGS (last 5 lines):"
    tail -5 cloudflare-tunnel.log | sed 's/^/   /'
    echo ""
fi

# Show tunnel connection status
if [ -f "cloudflare-tunnel.log" ]; then
    LAST_CONNECTION=$(grep "Registered tunnel connection" cloudflare-tunnel.log | tail -1)
    if [ ! -z "$LAST_CONNECTION" ]; then
        echo "🔗 LAST SUCCESSFUL CONNECTION:"
        echo "   $LAST_CONNECTION"
        echo ""
    fi
fi

echo "=========================================="
echo "   QUICK COMMANDS"
echo "=========================================="
echo "Start Backend:    cd praxifi-CFO && docker-compose up -d"
echo "Start Tunnel:     ./start-cloudflare-tunnel.sh"
echo "Stop Tunnel:      pkill -f 'cloudflared tunnel'"
echo "View Logs:        tail -f cloudflare-tunnel.log"
echo "Test Local:       curl http://localhost:8080/"
echo "Test Public:      curl https://api.praxifi.com/"
echo "API Docs:         https://api.praxifi.com/docs"
echo "=========================================="
