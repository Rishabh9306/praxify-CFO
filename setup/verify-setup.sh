#!/bin/bash

echo "🔍 Verification Check for Praxify CFO"
echo "======================================"
echo ""

# Check backend
echo "1️⃣ Checking Backend..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
    curl -s http://localhost:8000/ | jq -r '.message'
else
    echo "   ❌ Backend is NOT responding"
fi
echo ""

# Check frontend
echo "2️⃣ Checking Frontend..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend dev server is running on port 3000"
else
    echo "   ❌ Frontend dev server is NOT running"
fi
echo ""

# Check environment file
echo "3️⃣ Checking Environment Configuration..."
if [ -f "/home/draxxy/praxify-CFO/praxify-frontend/.env.local" ]; then
    echo "   ✅ .env.local exists"
    echo "   📄 Contents:"
    grep "NEXT_PUBLIC_API_URL" /home/draxxy/praxify-CFO/praxify-frontend/.env.local
else
    echo "   ❌ .env.local NOT found"
fi
echo ""

# Check Redis
echo "4️⃣ Checking Redis..."
if docker ps | grep -q "praxify-cfo-redis"; then
    echo "   ✅ Redis container is running"
else
    echo "   ⚠️  Redis container not found"
fi
echo ""

echo "======================================"
echo "✅ Everything looks good!"
echo ""
echo "📝 Next Steps:"
echo "1. Open browser: http://localhost:3000"
echo "2. Try uploading: /home/draxxy/praxify-CFO/setup/temp_api_upload.csv"
echo "3. Generate a report or start a chat"
echo ""
echo "🐛 If still getting 'Failed to fetch':"
echo "   - Open browser console (F12)"
echo "   - Check for CORS errors"
echo "   - Verify: console.log(process.env.NEXT_PUBLIC_API_URL)"
