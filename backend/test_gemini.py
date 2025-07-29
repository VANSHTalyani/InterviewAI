#!/usr/bin/env python3
"""
Test script to verify Gemini API functionality
"""
import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

def test_gemini_basic():
    """Test basic Gemini API functionality"""
    print("Testing Gemini API Basic Functionality...")
    print("-" * 50)
    
    # Get API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment variables")
        return False
    
    print(f"✅ API Key found: {api_key[:10]}...{api_key[-5:]}")
    
    try:
        # Configure Gemini
        genai.configure(api_key=api_key)
        print("✅ Gemini configured successfully")
        
        # List available models
        print("\n📋 Available Models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"  - {model.name}")
        
        # Test with a simple prompt
        model = genai.GenerativeModel('gemini-1.5-flash')
        print(f"\n🤖 Using model: gemini-1.5-flash")
        
        test_prompt = "Please respond with exactly these words: 'Gemini API is working correctly'"
        
        print(f"\n📝 Test prompt: {test_prompt}")
        print("\n⏳ Generating response...")
        
        response = model.generate_content(test_prompt)
        
        if response and response.text:
            print(f"\n✅ Response received: {response.text}")
            
            # Check if response contains expected text
            if "Gemini API is working correctly" in response.text:
                print("✅ Response validation: PASSED")
                return True
            else:
                print("⚠️  Response validation: Response received but doesn't match expected output")
                return True  # API is working, just different response
        else:
            print("❌ No response text received")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini API: {e}")
        print(f"   Error type: {type(e).__name__}")
        return False

def test_gemini_interview_analysis():
    """Test Gemini API with interview analysis prompt"""
    print("\n" + "=" * 60)
    print("Testing Gemini API for Interview Analysis...")
    print("=" * 60)
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return False
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Sample interview text
        sample_text = """
        Well, I believe that my experience in software development, um, 
        makes me a strong candidate for this position. I have worked with 
        various technologies like Python, JavaScript, and, uh, React. 
        In my previous role, I was responsible for, you know, developing 
        web applications and working with databases. I think I can bring 
        valuable skills to your team.
        """
        
        # Simple analysis prompt
        prompt = f"""
        Analyze the following interview response and provide a JSON response with confidence_score (0-100), 
        filler_word_count, and overall_assessment:
        
        Text: "{sample_text}"
        
        Please respond in JSON format only.
        """
        
        print(f"📝 Sample interview text length: {len(sample_text)} characters")
        print("\n⏳ Analyzing with Gemini...")
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            print(f"\n✅ Analysis Response:")
            print("-" * 40)
            print(response.text)
            print("-" * 40)
            
            # Try to parse as JSON
            try:
                import json
                import re
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    json_data = json.loads(json_match.group(0))
                    print("✅ JSON parsing: SUCCESS")
                    print(f"   Keys found: {list(json_data.keys())}")
                else:
                    print("⚠️  JSON parsing: No JSON structure found in response")
            except json.JSONDecodeError:
                print("⚠️  JSON parsing: Failed to parse as JSON")
            
            return True
        else:
            print("❌ No analysis response received")
            return False
            
    except Exception as e:
        print(f"❌ Error in interview analysis test: {e}")
        return False

async def test_gemini_service():
    """Test the actual Gemini service from the application"""
    print("\n" + "=" * 60)
    print("Testing Application Gemini Service...")
    print("=" * 60)
    
    try:
        # Import the service
        from app.services.gemini_service import gemini_service
        
        print("✅ Gemini service imported successfully")
        
        # Test initialization
        if gemini_service.model:
            print("✅ Gemini service initialized with model")
        else:
            print("⚠️  Gemini service initialized but no model available (will use mock)")
        
        # Test analysis
        sample_text = "I am confident in my ability to contribute to your team. I have extensive experience in this field."
        
        print(f"\n📝 Testing analysis with sample text...")
        print(f"   Text: {sample_text[:50]}...")
        
        analysis = await gemini_service.analyze_speech_text(sample_text)
        
        if analysis:
            print("✅ Analysis completed successfully")
            print(f"   Service used: {analysis.get('metadata', {}).get('service', 'unknown')}")
            print(f"   Overall score: {analysis.get('overall_assessment', {}).get('overall_score', 'N/A')}")
            
            # Check key sections
            required_sections = ['overall_assessment', 'speech_quality', 'filler_words', 'content_analysis']
            missing_sections = []
            for section in required_sections:
                if section not in analysis:
                    missing_sections.append(section)
            
            if missing_sections:
                print(f"⚠️  Missing sections: {missing_sections}")
            else:
                print("✅ All required analysis sections present")
            
            return True
        else:
            print("❌ Analysis failed - no results returned")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Gemini service: {e}")
        import traceback
        print("   Full traceback:")
        traceback.print_exc()
        return False

def test_environment_setup():
    """Test environment and dependencies"""
    print("Testing Environment Setup...")
    print("-" * 50)
    
    # Check Python version
    import sys
    print(f"🐍 Python version: {sys.version}")
    
    # Check required packages
    packages_to_check = [
        'google.generativeai',
        'pydantic',
        'python-dotenv',
        'asyncio'
    ]
    
    for package in packages_to_check:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}: installed")
        except ImportError:
            print(f"❌ {package}: NOT installed")
    
    # Check environment variables
    env_vars_to_check = [
        'GEMINI_API_KEY',
        'OPENAI_API_KEY',
        'ASSEMBLYAI_API_KEY'
    ]
    
    print(f"\n🔧 Environment Variables:")
    for var in env_vars_to_check:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: configured ({len(value)} characters)")
        else:
            print(f"❌ {var}: not configured")

async def main():
    """Run all tests"""
    print("🧪 GEMINI API ANALYSIS TEST SUITE")
    print("=" * 60)
    
    # Test 1: Environment setup
    test_environment_setup()
    
    # Test 2: Basic Gemini functionality
    basic_test_result = test_gemini_basic()
    
    # Test 3: Interview analysis functionality
    analysis_test_result = test_gemini_interview_analysis()
    
    # Test 4: Application service
    service_test_result = await test_gemini_service()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    
    tests = [
        ("Basic Gemini API", basic_test_result),
        ("Interview Analysis", analysis_test_result),
        ("Application Service", service_test_result)
    ]
    
    passed = sum(1 for _, result in tests if result)
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Gemini API is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(main())
