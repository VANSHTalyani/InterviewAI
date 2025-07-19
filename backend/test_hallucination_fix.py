#!/usr/bin/env python3
"""
Test script to verify AI hallucination prevention
"""
import asyncio
from app.services.gemini_service import gemini_service

async def test_hallucination_prevention():
    """Test that Gemini doesn't hallucinate filler words that aren't in the text"""
    
    print("🧪 Testing AI Hallucination Prevention")
    print("=" * 50)
    
    # Test text with NO filler words (like your TED talk example)
    clean_text = """
    What an audience. But if I'm being honest, I don't care what you think of my talk. 
    I don't. I care what the Internet thinks of my talk. Because they're the ones who 
    get it seen and get it shared. And I think that's where most people get it wrong. 
    They're talking to you here, instead of talking to you, random person scrolling Facebook. 
    Thanks for the click.
    """
    
    print(f"📝 Testing with clean text (no filler words):")
    print(f"Text: {clean_text[:100]}...")
    
    # Run our precise filler word analysis first
    actual_analysis = await gemini_service.analyze_filler_words(clean_text)
    print(f"\n🔍 Actual filler word count: {actual_analysis['total_count']}")
    
    # Run full Gemini analysis (which should now be corrected if hallucination occurs)
    full_analysis = await gemini_service.analyze_speech_text(clean_text)
    
    print(f"\n🤖 Gemini Analysis Results:")
    print(f"Service: {full_analysis['metadata']['service']}")
    print(f"Model: {full_analysis['metadata']['model']}")
    print(f"Filler words reported: {full_analysis['filler_words']['total_count']}")
    print(f"Frequency per 100 words: {full_analysis['filler_words']['frequency_per_100_words']}%")
    print(f"Severity: {full_analysis['filler_words']['severity']}")
    
    # Check for hallucination correction
    if 'hallucination_detected' in full_analysis['metadata']:
        print(f"🚨 Hallucination detected and corrected!")
        print(f"✅ Cross-validation working correctly")
    else:
        print(f"✅ No hallucination detected - analysis is accurate")
    
    # Test with text that HAS filler words
    print(f"\n" + "=" * 50)
    print(f"🧪 Testing with text containing filler words:")
    
    filler_text = """
    Um, well, I think that, you know, this position is, like, really interesting to me. 
    I have, uh, several years of experience and, you know, I believe I can, um, 
    contribute to your team. So, like, I'm really excited about this opportunity.
    """
    
    print(f"Text: {filler_text[:100]}...")
    
    # Run analysis
    actual_filler_analysis = await gemini_service.analyze_filler_words(filler_text)
    full_filler_analysis = await gemini_service.analyze_speech_text(filler_text)
    
    print(f"\n🔍 Actual filler count: {actual_filler_analysis['total_count']}")
    print(f"🤖 Gemini reported: {full_filler_analysis['filler_words']['total_count']}")
    print(f"Frequency: {full_filler_analysis['filler_words']['frequency_per_100_words']}%")
    print(f"Severity: {full_filler_analysis['filler_words']['severity']}")
    
    # Show detailed breakdown
    if full_filler_analysis['filler_words']['common_fillers']:
        print(f"\n📊 Filler words detected:")
        for filler in full_filler_analysis['filler_words']['common_fillers']:
            if filler['count'] > 0:
                print(f"  - {filler['word']}: {filler['count']} times")
    
    print(f"\n" + "=" * 50)
    print(f"🏁 SUMMARY")
    print(f"=" * 50)
    
    # Validation
    clean_accurate = full_analysis['filler_words']['total_count'] == actual_analysis['total_count']
    filler_reasonable = abs(full_filler_analysis['filler_words']['total_count'] - actual_filler_analysis['total_count']) <= 2
    
    print(f"Clean text analysis accurate: {'✅ YES' if clean_accurate else '❌ NO'}")
    print(f"Filler text analysis reasonable: {'✅ YES' if filler_reasonable else '❌ NO'}")
    
    if clean_accurate and filler_reasonable:
        print(f"🎉 Hallucination prevention is working correctly!")
        return True
    else:
        print(f"⚠️ Issues detected in analysis accuracy")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_hallucination_prevention())
    if result:
        print(f"\n✅ All tests passed!")
    else:
        print(f"\n❌ Some tests failed!")
