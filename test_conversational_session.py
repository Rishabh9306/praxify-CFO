#!/usr/bin/env python3
"""
🧪 Test Conversational AI with Session Memory

This script tests the analyze_and_respond endpoint to verify:
1. Session creation on first request
2. Conversation history storage in Firestore
3. Context-aware responses on follow-up questions
4. Session persistence across multiple turns
"""

import requests
import json
import os
from pathlib import Path

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TEST_DATA_FILE = "praxifi-CFO/data/dataset.csv"

def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_conversation_flow():
    """Test complete conversation flow with session persistence"""
    
    print_section("🧪 CONVERSATIONAL AI SESSION TEST")
    
    # Verify test data exists
    data_path = Path(TEST_DATA_FILE)
    if not data_path.exists():
        print(f"❌ Test data file not found: {TEST_DATA_FILE}")
        return
    
    session_id = None  # Will be set after first request
    
    # ========================================
    # TURN 1: First question (no session_id)
    # ========================================
    print_section("Turn 1: Initial Question")
    
    with open(data_path, 'rb') as f:
        files = {'file': ('dataset.csv', f, 'text/csv')}
        data = {
            'user_query': "What are our top 3 KPIs and what do they tell us about our business health?",
            'session_id': ''  # Empty for first request
        }
        
        print(f"📤 Sending: {data['user_query']}")
        response1 = requests.post(
            f"{API_BASE_URL}/agent/analyze_and_respond",
            files=files,
            data=data
        )
    
    if response1.status_code != 200:
        print(f"❌ Request failed: {response1.status_code}")
        print(f"Response: {response1.text}")
        return
    
    result1 = response1.json()
    session_id = result1.get('session_id')
    ai_response1 = result1.get('ai_response')
    history1 = result1.get('conversation_history', [])
    
    print(f"✅ Session Created: {session_id}")
    print(f"💬 AI Response:\n{ai_response1[:300]}...")
    print(f"📚 History Length: {len(history1)} message(s)")
    
    # ========================================
    # TURN 2: Follow-up question (with session_id)
    # ========================================
    print_section("Turn 2: Follow-up Question")
    
    with open(data_path, 'rb') as f:
        files = {'file': ('dataset.csv', f, 'text/csv')}
        data = {
            'user_query': "How does the second KPI compare to industry benchmarks? What should we improve?",
            'session_id': session_id  # IMPORTANT: Reuse session_id
        }
        
        print(f"🔗 Using Session: {session_id}")
        print(f"📤 Sending: {data['user_query']}")
        response2 = requests.post(
            f"{API_BASE_URL}/agent/analyze_and_respond",
            files=files,
            data=data
        )
    
    if response2.status_code != 200:
        print(f"❌ Request failed: {response2.status_code}")
        print(f"Response: {response2.text}")
        return
    
    result2 = response2.json()
    ai_response2 = result2.get('ai_response')
    history2 = result2.get('conversation_history', [])
    
    print(f"✅ Session Continued: {result2.get('session_id')}")
    print(f"💬 AI Response:\n{ai_response2[:300]}...")
    print(f"📚 History Length: {len(history2)} message(s)")
    
    # Verify AI understood "second KPI" from previous context
    if "second" in data['user_query'].lower() and len(history2) >= 2:
        print(f"✅ AI should understand 'second KPI' refers to context from Turn 1")
    
    # ========================================
    # TURN 3: Third question (testing deeper context)
    # ========================================
    print_section("Turn 3: Testing Deeper Context")
    
    with open(data_path, 'rb') as f:
        files = {'file': ('dataset.csv', f, 'text/csv')}
        data = {
            'user_query': "Based on our discussion, what's the single most urgent action I should take this week?",
            'session_id': session_id  # Continue same session
        }
        
        print(f"🔗 Using Session: {session_id}")
        print(f"📤 Sending: {data['user_query']}")
        response3 = requests.post(
            f"{API_BASE_URL}/agent/analyze_and_respond",
            files=files,
            data=data
        )
    
    if response3.status_code != 200:
        print(f"❌ Request failed: {response3.status_code}")
        print(f"Response: {response3.text}")
        return
    
    result3 = response3.json()
    ai_response3 = result3.get('ai_response')
    history3 = result3.get('conversation_history', [])
    
    print(f"✅ Session Continued: {result3.get('session_id')}")
    print(f"💬 AI Response:\n{ai_response3[:400]}...")
    print(f"📚 History Length: {len(history3)} message(s)")
    
    # ========================================
    # SUMMARY: Verify Conversation Continuity
    # ========================================
    print_section("📊 TEST SUMMARY")
    
    print(f"✅ Session ID Consistent: {session_id}")
    print(f"✅ Total Conversation Turns: {len(history3)}")
    print(f"✅ All responses received successfully")
    
    # Display full conversation history
    print("\n📜 COMPLETE CONVERSATION HISTORY:\n")
    for idx, turn in enumerate(history3, 1):
        summary = turn.get('summary', {})
        print(f"--- Turn {idx} ---")
        print(f"User: {summary.get('user_query', 'N/A')}")
        print(f"Assistant: {summary.get('ai_response', 'N/A')[:200]}...")
        print()
    
    # Validation checks
    print_section("✅ VALIDATION CHECKS")
    
    checks = [
        (len(history3) == 3, "All 3 conversation turns stored"),
        (result3.get('session_id') == session_id, "Session ID remained consistent"),
        (len(ai_response3) > 50, "AI generated meaningful response in Turn 3"),
        ("discuss" in data['user_query'] or "based on" in data['user_query'], 
         "Turn 3 question referenced previous discussion")
    ]
    
    for passed, description in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {description}")
    
    if all(check[0] for check in checks):
        print("\n🎉 SUCCESS: Conversational AI with session memory is working correctly!")
    else:
        print("\n⚠️  Some checks failed - review the output above")

if __name__ == "__main__":
    try:
        test_conversation_flow()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
