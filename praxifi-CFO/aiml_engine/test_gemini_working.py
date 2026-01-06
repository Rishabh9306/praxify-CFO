#!/usr/bin/env python3
"""
Test Gemini with CORRECT model names (2026 versions)
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def test_all_models():
    """Test all available models to find which one works"""
    api_key = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=api_key)
    
    # Models to test (from most likely to work to least)
    test_models = [
        "gemini-2.5-flash",           # Newest flash, high quota
        "gemini-3-flash-preview",      # Latest generation flash
        "gemini-2.0-flash",            # Stable flash
        "gemini-flash-latest",         # Always latest flash
        "gemini-2.5-pro",              # Your current model (quota issue)
        "gemini-3-pro-preview",        # Latest pro
    ]
    
    test_prompt = "Say 'Hello from Gemini!' and nothing else."
    
    print("🔍 Testing Available Gemini Models")
    print("=" * 60)
    
    working_models = []
    
    for model_name in test_models:
        try:
            print(f"\n📤 Testing: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(test_prompt)
            
            print(f"✅ SUCCESS - Response: {response.text.strip()}")
            working_models.append(model_name)
            
        except Exception as e:
            error = str(e)
            if "429" in error:
                print(f"⚠️  QUOTA EXCEEDED - This model is rate-limited")
            elif "404" in error:
                print(f"❌ NOT FOUND - Model doesn't exist")
            else:
                print(f"❌ ERROR: {error[:100]}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 WORKING MODELS:")
    print("=" * 60)
    
    if working_models:
        for i, model in enumerate(working_models, 1):
            print(f"{i}. {model}")
        
        print(f"\n💡 RECOMMENDATION: Use '{working_models[0]}' in your code")
    else:
        print("❌ NO WORKING MODELS FOUND")
        print("\n🔍 Possible reasons:")
        print("   1. All models quota exceeded (wait for reset)")
        print("   2. API key invalid or expired")
        print("   3. Network/API issue")
    
    return working_models


def test_praxifi_conversation(model_name):
    """Test a real Praxifi-style conversation"""
    api_key = os.getenv("GOOGLE_API_KEY")
    genai.configure(api_key=api_key)
    
    print("\n" + "=" * 60)
    print(f"🧪 Testing Praxifi Conversation with {model_name}")
    print("=" * 60)
    
    try:
        model = genai.GenerativeModel(model_name)
        
        prompt = """
You are a CFO financial analyst. Based on this data:

Revenue: ₹50,00,000
Expenses: ₹30,00,000  
Profit: ₹20,00,000
Profit Margin: 40%

Provide 3 brief insights in bullet points.
"""
        
        print("\n📤 Sending prompt...")
        response = model.generate_content(prompt)
        
        print("\n✅ Response:")
        print("-" * 60)
        print(response.text)
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Failed: {str(e)[:200]}")
        return False


if __name__ == "__main__":
    # Find working models
    working = test_all_models()
    
    # Test with the best working model
    if working:
        print("\n" + "=" * 60)
        print("🎯 Testing with best available model")
        print("=" * 60)
        test_praxifi_conversation(working[0])
    
    print("\n✅ Testing complete!")
