#!/bin/bash
cd /home/draxxy/praxify-CFO/praxify-frontend
echo "📂 Current directory: $(pwd)"
echo "📄 Checking .env.local..."
cat .env.local
echo ""
echo "🚀 Starting Next.js dev server..."
pnpm run dev
