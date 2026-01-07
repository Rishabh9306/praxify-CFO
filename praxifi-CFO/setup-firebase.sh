#!/bin/bash

# 🔥 Firebase Setup Script for Praxifi CFO
# This script helps configure Firebase Firestore for the application

echo "🔥 Firebase Firestore Setup for Praxifi CFO"
echo "=========================================="
echo ""

# Check if firebase-service-account.json exists
if [ -f "firebase-service-account.json" ]; then
    echo "✅ Found firebase-service-account.json"
    
    # Ask if user wants to use file path or JSON string
    echo ""
    echo "Choose configuration method:"
    echo "1) File path (local development)"
    echo "2) JSON string (production/Docker)"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" == "1" ]; then
        # File path method
        export FIREBASE_SERVICE_ACCOUNT_PATH="$PWD/firebase-service-account.json"
        export FIREBASE_SERVICE_ACCOUNT_LOCAL_PATH="./firebase-service-account.json"
        
        echo ""
        echo "✅ Configured for file path method"
        echo ""
        echo "Add to your .env file:"
        echo "FIREBASE_SERVICE_ACCOUNT_PATH=$PWD/firebase-service-account.json"
        echo "FIREBASE_SERVICE_ACCOUNT_LOCAL_PATH=./firebase-service-account.json"
        
    elif [ "$choice" == "2" ]; then
        # JSON string method
        json_content=$(cat firebase-service-account.json | tr -d '\n' | tr -d ' ')
        export FIREBASE_SERVICE_ACCOUNT_JSON="$json_content"
        
        echo ""
        echo "✅ Configured for JSON string method"
        echo ""
        echo "Add to your .env file:"
        echo "FIREBASE_SERVICE_ACCOUNT_JSON='$json_content'"
        
    else
        echo "❌ Invalid choice"
        exit 1
    fi
    
else
    echo "❌ firebase-service-account.json not found"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to Firebase Console: https://console.firebase.google.com/"
    echo "2. Select your project"
    echo "3. Go to Project Settings → Service Accounts"
    echo "4. Click 'Generate new private key'"
    echo "5. Save the JSON file as 'firebase-service-account.json' in this directory"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "📝 Next Steps:"
echo "=========================================="
echo ""
echo "1. Install Firebase dependencies:"
echo "   pip install firebase-admin==6.5.0 google-cloud-firestore==2.16.0"
echo ""
echo "2. Enable Firestore in Firebase Console:"
echo "   - Go to Firestore Database"
echo "   - Click 'Create database'"
echo "   - Choose 'production mode'"
echo "   - Select your region"
echo ""
echo "3. Set up Firestore Security Rules:"
echo "   - See FIREBASE_MIGRATION_GUIDE.md for rules"
echo ""
echo "4. Start the application:"
echo "   docker-compose up -d"
echo ""
echo "5. Check logs for successful connection:"
echo "   docker-compose logs -f aiml-engine"
echo "   Look for: '✅ Successfully connected to Firestore'"
echo ""
echo "=========================================="
echo "📚 Documentation:"
echo "=========================================="
echo ""
echo "- Setup Guide: FIREBASE_MIGRATION_GUIDE.md"
echo "- Summary: FIREBASE_MIGRATION_SUMMARY.md"
echo ""
echo "✅ Configuration complete!"
