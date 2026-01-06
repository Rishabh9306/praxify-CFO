#!/usr/bin/env python3
"""
Gemini API Debug Test Script
Tests Gemini API connection, quota limits, and basic functionality
"""

import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime

# Load environment variables
load_dotenv()

def test_api_key():
    """Test if API key is configured"""
    api_key = os.getenv("GOOGLE_API_KEY")
    print("=" * 60)
    print("TEST 1: API Key Configuration")
    print("=" * 60)
    
    if not api_key:
        print("❌ GOOGLE_API_KEY not found in environment")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-4:]}")
    print(f"   Length: {len(api_key)} characters")
    return True


def test_api_connection():
    """Test basic API connection"""
    print("\n" + "=" * 60)
    print("TEST 2: API Connection")
    print("=" * 60)
    
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        
        # List available models
        print("\n📋 Available Models:")
        models = genai.list_models()
        for model in models:
            if 'gemini' in model.name.lower():
                print(f"  • {model.name}")
                print(f"    - Input limit: {model.input_token_limit} tokens")
                print(f"    - Output limit: {model.output_token_limit} tokens")
        
        print("\n✅ API connection successful")
        return True
        
    except Exception as e:
        print(f"❌ API connection failed: {str(e)}")
        return False


def test_gemini_flash():
    """Test with Gemini Flash (lower tier, higher quota)"""
    print("\n" + "=" * 60)
    print("TEST 3: Gemini 1.5 Flash (Fallback Model)")
    print("=" * 60)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say 'Hello from Gemini Flash!'")
        
        print(f"✅ Flash Model Response: {response.text}")
        return True
        
    except Exception as e:
        print(f"❌ Flash model failed: {str(e)}")
        return False


def test_gemini_pro():
    """Test with Gemini 2.5 Pro (your current model)"""
    print("\n" + "=" * 60)
    print("TEST 4: Gemini 2.5 Pro (Current Model)")
    print("=" * 60)
    
    try:
        model = genai.GenerativeModel('gemini-2.5-pro-exp-0114')
        response = model.generate_content("Say 'Hello from Gemini Pro!'")
        
        print(f"✅ Pro Model Response: {response.text}")
        return True
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Pro model failed: {error_msg}")
        
        # Parse quota information
        if "429" in error_msg and "quota" in error_msg.lower():
            print("\n🔍 Quota Analysis:")
            print("   • Error Type: 429 - Quota Exceeded")
            
            if "free_tier_requests" in error_msg:
                print("   • Issue: Free tier request limit reached")
                print("   • Daily Limit: 50 requests per day (free tier)")
                print("   • Per Minute: 2 requests per minute (free tier)")
            
            if "input_token_count" in error_msg:
                print("   • Issue: Token limit exceeded")
                print("   • Daily Tokens: 1,500 tokens per day (free tier)")
            
            if "retry_delay" in error_msg:
                import re
                delay_match = re.search(r'(\d+\.\d+)s', error_msg)
                if delay_match:
                    delay = float(delay_match.group(1))
                    print(f"   • Retry After: {delay:.0f} seconds (~{delay/60:.1f} minutes)")
            
            print("\n💡 Solutions:")
            print("   1. Wait for quota reset (resets at midnight PST)")
            print("   2. Upgrade to paid tier ($0.35 per 1M tokens)")
            print("   3. Use Gemini 1.5 Flash instead (2x higher quota)")
            print("   4. Use different API key (if available)")
        
        return False


def test_quota_status():
    """Check current quota status"""
    print("\n" + "=" * 60)
    print("TEST 5: Quota Status Check")
    print("=" * 60)
    
    print("\n📊 Gemini 2.5 Pro Free Tier Limits:")
    print("   • Requests per day: 50")
    print("   • Requests per minute: 2")
    print("   • Input tokens per day: 1,500")
    print("   • Input tokens per minute: 1,000")
    print("   • Output tokens per day: 1,500")
    
    print("\n📊 Gemini 1.5 Flash Free Tier Limits:")
    print("   • Requests per day: 1,500")
    print("   • Requests per minute: 15")
    print("   • Input tokens per day: 1,000,000")
    print("   • Input tokens per minute: 4,000")
    
    print("\n⏰ Current Time:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("   Quota resets at: Midnight PST (Pacific Standard Time)")


def test_conversation_simulation():
    """Test a typical Praxifi conversation"""
    print("\n" + "=" * 60)
    print("TEST 6: Praxifi-Style Conversation Test")
    print("=" * 60)
    
    try:
        # Try Flash first (more likely to succeed)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        test_prompt = """
        You are a CFO financial analyst. Analyze this data:
        
        Revenue: ₹50,00,000
        Expenses: ₹30,00,000
        Profit: ₹20,00,000
        
        Provide 2 insights in bullet points.
        """
        
        print("📤 Sending test prompt...")
        response = model.generate_content(test_prompt)
        
        print(f"\n✅ Response received:")
        print(f"{response.text}")
        
        # Check token usage
        print(f"\n📊 Token Usage:")
        print(f"   • Prompt tokens: ~{len(test_prompt.split()) * 1.3:.0f}")
        print(f"   • Response tokens: ~{len(response.text.split()) * 1.3:.0f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Conversation test failed: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("\n🔍 GEMINI API DEBUG TEST SUITE")
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    results = {
        "API Key": test_api_key(),
        "Connection": test_api_connection(),
        "Flash Model": test_gemini_flash(),
        "Pro Model": test_gemini_pro(),
        "Conversation": test_conversation_simulation(),
    }
    
    test_quota_status()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed_count = sum(results.values())
    total_count = len(results)
    
    print(f"\n🎯 Result: {passed_count}/{total_count} tests passed")
    
    if not results["Pro Model"]:
        print("\n⚠️  RECOMMENDATION:")
        print("   Switch to Gemini 1.5 Flash in your code:")
        print("   Change: 'gemini-2.5-pro-exp-0114'")
        print("   To:     'gemini-1.5-flash'")
        print("   Or upgrade to paid tier for Pro model access")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
