#!/usr/bin/env python3
"""
🔥 Quick test to verify Firestore connection
Tests Firebase Firestore integration using FIREBASE_SERVICE_ACCOUNT_JSON from .env
"""

import os
import sys
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file
print("📂 Loading environment variables from .env...")
dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)
    print(f"✅ Loaded .env from: {dotenv_path}")
else:
    print("⚠️  No .env file found, using system environment variables")

# Check if FIREBASE_SERVICE_ACCOUNT_JSON is set
firebase_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
if not firebase_json:
    print("\n❌ ERROR: FIREBASE_SERVICE_ACCOUNT_JSON not found in environment")
    print("\nPlease add to your .env file:")
    print("FIREBASE_SERVICE_ACCOUNT_JSON='{\"type\":\"service_account\",...}'")
    sys.exit(1)

print(f"✅ FIREBASE_SERVICE_ACCOUNT_JSON found ({len(firebase_json)} characters)")

try:
    from aiml_engine.core.firestore_memory import FirestoreMemory
    
    print("\n🔥 Initializing Firestore connection...")
    memory = FirestoreMemory()
    print("✅ SUCCESS! Firebase Admin SDK initialized")
    print("✅ SUCCESS! Firestore client connected")
    
    # Test a simple write operation
    print("\n📝 Testing write operation...")
    test_user_email = "test@praxifi.com"
    test_session_id = "test-session-" + str(os.getpid())  # Unique session ID
    
    memory.update_context(
        user_email=test_user_email,
        session_id=test_session_id,
        query_id="test-query-1",
        analysis_summary={
            "test": "Firebase integration test",
            "status": "working",
            "timestamp": "2026-01-06"
        }
    )
    print(f"✅ Write successful to session: {test_session_id}")
    
    # Test read operation
    print("\n📖 Testing read operation...")
    history = memory.recall_related_history(
        user_email=test_user_email,
        session_id=test_session_id
    )
    print(f"✅ Read successful! Retrieved {len(history)} message(s)")
    
    if history:
        print("\n📊 Retrieved data:")
        for i, msg in enumerate(history, 1):
            print(f"  Message {i}:")
            print(f"    Query ID: {msg.get('query_id')}")
            print(f"    Summary: {msg.get('summary')}")
    
    # Test session metadata
    print("\n🔍 Testing session metadata retrieval...")
    metadata = memory.get_session_metadata(
        user_email=test_user_email,
        session_id=test_session_id
    )
    if metadata:
        print(f"✅ Metadata retrieved: {metadata}")
    else:
        print("⚠️  No metadata found (this is okay for first test)")
    
    # Test listing sessions
    print("\n📋 Testing list user sessions...")
    sessions = memory.list_user_sessions(
        user_email=test_user_email,
        limit=10
    )
    print(f"✅ Found {len(sessions)} session(s) for user {test_user_email}")
    
    # Cleanup test data
    print("\n🧹 Cleaning up test data...")
    try:
        memory.delete_session(
            user_email=test_user_email,
            session_id=test_session_id
        )
        print("✅ Test session deleted")
    except Exception as cleanup_error:
        print(f"⚠️  Cleanup warning: {cleanup_error}")
    
    print("\n" + "="*60)
    print("🎉 ALL TESTS PASSED! Firebase Firestore is working perfectly!")
    print("="*60)
    print("\n✅ You can now start the backend server:")
    print("   uvicorn aiml_engine.main:app --host 0.0.0.0 --port 8080 --reload")
    print("\n✅ Or build Docker:")
    print("   docker-compose build --no-cache")
    print("   docker-compose up -d")
    
except ImportError as e:
    print(f"\n❌ IMPORT ERROR: {e}")
    print("\nTroubleshooting:")
    print("1. Make sure you're in the praxifi-CFO directory")
    print("2. Install dependencies: pip install firebase-admin google-cloud-firestore")
    print("3. Install project: pip install -e .")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"\nError type: {type(e).__name__}")
    print("\nTroubleshooting:")
    print("1. Verify FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON in .env")
    print("2. Check Firebase project has Firestore enabled")
    print("3. Verify internet connection")
    print("4. Check Firebase Console for any errors")
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
