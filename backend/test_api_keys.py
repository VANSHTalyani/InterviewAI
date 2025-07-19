#!/usr/bin/env python3
"""
API Key Testing Script
Tests the validity of API keys for various services used in the InterviewAI project.
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_api(api_key):
    """Test OpenAI API key"""
    if not api_key:
        return False, "API key not found in environment variables"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get("https://api.openai.com/v1/models", headers=headers, timeout=10)
        if response.status_code == 200:
            return True, "API key is valid"
        elif response.status_code == 401:
            return False, "Invalid API key"
        else:
            return False, f"Unexpected status code: {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}"

def test_assemblyai_api(api_key):
    """Test AssemblyAI API key"""
    if not api_key:
        return False, "API key not found in environment variables"
    
    headers = {
        "authorization": api_key,
        "content-type": "application/json"
    }
    
    try:
        response = requests.get("https://api.assemblyai.com/v2/transcript", headers=headers, timeout=10)
        if response.status_code in [200, 400]:  # 400 is expected without transcript ID
            return True, "API key is valid"
        elif response.status_code == 401:
            return False, "Invalid API key"
        else:
            return False, f"Unexpected status code: {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}"

def test_gemini_api(api_key):
    """Test Google Gemini API key"""
    if not api_key:
        return False, "API key not found in environment variables"
    
    try:
        # First try to list models to test the API key
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            return True, "API key is valid"
        elif response.status_code == 400:
            # Try with gemini-1.5-flash model
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [{
                        "text": "Hello"
                    }]
                }]
            }
            
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                return True, "API key is valid"
            elif response.status_code in [400, 403, 404]:
                return False, f"Invalid API key or model not accessible (Status: {response.status_code})"
            else:
                return False, f"Unexpected status code: {response.status_code}"
        elif response.status_code in [401, 403]:
            return False, "Invalid API key or access denied"
        else:
            return False, f"Unexpected status code: {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}"

def test_deepgram_api(api_key):
    """Test Deepgram API key"""
    if not api_key:
        return False, "API key not found in environment variables"
    
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get("https://api.deepgram.com/v1/projects", headers=headers, timeout=10)
        if response.status_code == 200:
            return True, "API key is valid"
        elif response.status_code == 401:
            return False, "Invalid API key"
        else:
            return False, f"Unexpected status code: {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}"

def main():
    """Main function to test all API keys"""
    print("🔑 Testing API Keys...\n")
    print("=" * 50)
    
    # Get API keys from environment
    api_tests = [
        ("OpenAI", os.getenv("OPENAI_API_KEY"), test_openai_api),
        ("AssemblyAI", os.getenv("ASSEMBLYAI_API_KEY"), test_assemblyai_api),
        ("Google Gemini", os.getenv("GEMINI_API_KEY"), test_gemini_api),
        ("Deepgram", os.getenv("DEEPGRAM_API_KEY"), test_deepgram_api)
    ]
    
    results = []
    
    for service_name, api_key, test_func in api_tests:
        print(f"Testing {service_name}...")
        
        if not api_key:
            print(f"❌ {service_name}: No API key found in environment")
            results.append((service_name, False, "No API key configured"))
        else:
            # Show partial key for verification (first 8 chars + ...)
            masked_key = api_key[:8] + "..." if len(api_key) > 8 else "..."
            print(f"   Key: {masked_key}")
            
            success, message = test_func(api_key)
            
            if success:
                print(f"✅ {service_name}: {message}")
            else:
                print(f"❌ {service_name}: {message}")
            
            results.append((service_name, success, message))
        
        print()
    
    # Summary
    print("=" * 50)
    print("📊 Summary:")
    working_count = sum(1 for _, success, _ in results if success)
    total_count = len(results)
    
    print(f"Working API keys: {working_count}/{total_count}")
    
    if working_count == total_count:
        print("🎉 All API keys are working!")
    elif working_count == 0:
        print("⚠️  No API keys are working. Please check your configuration.")
    else:
        print("⚠️  Some API keys need attention.")

if __name__ == "__main__":
    main()
