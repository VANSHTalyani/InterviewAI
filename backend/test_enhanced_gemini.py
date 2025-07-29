#!/usr/bin/env python3
"""
Test script for enhanced Gemini analysis service
Tests the comprehensive analysis with all new parameters
"""

import asyncio
import json
from app.services.gemini_service import gemini_service
from app.services.report_service import report_service

# Sample interview transcript for testing
SAMPLE_TRANSCRIPT = """
Um, well, I think I'm really excited about this opportunity. So, like, I have about five years of experience in software development, and I've worked on various projects. You know, I started my career at a small startup where I learned, um, how to work in a fast-paced environment.

Actually, my biggest achievement was when I led a team of three developers to build a customer management system. We used React for the frontend and Node.js for the backend. I'm confident that this experience has prepared me well for this role.

However, I guess I should mention that I sometimes struggle with public speaking. But I've been working on it by joining a local Toastmasters group. I believe that continuous learning is important in this field.

So, um, what I find most interesting about your company is the focus on innovation. I think I can contribute by bringing my technical skills and, well, my passion for creating user-friendly applications.
"""

SAMPLE_CONTEXT = {
    'duration': 120,  # 2 minutes
    'timestamp': '2025-01-19T07:00:00Z'
}

async def test_enhanced_gemini_analysis():
    """Test the enhanced Gemini analysis service"""
    
    print("🔬 Testing Enhanced Gemini Analysis Service")
    print("=" * 60)
    
    try:
        # Test comprehensive speech analysis
        print("1. Running comprehensive speech analysis...")
        analysis_result = await gemini_service.analyze_speech_text(
            SAMPLE_TRANSCRIPT, 
            SAMPLE_CONTEXT
        )
        
        print(f"✅ Analysis completed successfully!")
        print(f"   Service: {analysis_result.get('metadata', {}).get('service', 'unknown')}")
        print(f"   Model: {analysis_result.get('metadata', {}).get('model', 'unknown')}")
        
        # Display key metrics
        overall_assessment = analysis_result.get('overall_assessment', {})
        print(f"\n📊 Overall Assessment:")
        print(f"   Confidence Score: {overall_assessment.get('confidence_score', 'N/A')}")
        print(f"   Clarity Score: {overall_assessment.get('clarity_score', 'N/A')}")
        print(f"   Professionalism Score: {overall_assessment.get('professionalism_score', 'N/A')}")
        print(f"   Overall Score: {overall_assessment.get('overall_score', 'N/A')}")
        
        # Display speech quality metrics
        speech_quality = analysis_result.get('speech_quality', {})
        print(f"\n🎤 Speech Quality:")
        print(f"   Pace: {speech_quality.get('pace', 'N/A')}")
        print(f"   Articulation: {speech_quality.get('articulation', 'N/A')}")
        print(f"   Fluency: {speech_quality.get('fluency', 'N/A')}")
        print(f"   Coherence: {speech_quality.get('coherence', 'N/A')}")
        
        # Display filler word analysis
        filler_words = analysis_result.get('filler_words', {})
        print(f"\n🚫 Filler Words Analysis:")
        print(f"   Total Count: {filler_words.get('total_count', 'N/A')}")
        print(f"   Frequency per Minute: {filler_words.get('frequency_per_minute', 'N/A')}")
        print(f"   Severity: {filler_words.get('severity', 'N/A')}")
        
        # Display interview readiness
        interview_readiness = analysis_result.get('interview_readiness', {})
        print(f"\n💼 Interview Readiness:")
        print(f"   Score: {interview_readiness.get('score', 'N/A')}")
        print(f"   Level: {interview_readiness.get('level', 'N/A')}")
        
        # Display recommendations
        recommendations = analysis_result.get('recommendations', [])
        print(f"\n💡 Top Recommendations:")
        for i, rec in enumerate(recommendations[:3], 1):
            print(f"   {i}. {rec}")
        
        # Test individual analysis methods
        print(f"\n2. Testing individual analysis methods...")
        
        # Test filler word analysis
        filler_analysis = await gemini_service.analyze_filler_words(SAMPLE_TRANSCRIPT)
        print(f"✅ Filler word analysis: {filler_analysis.get('total_count', 0)} fillers found")
        
        # Test confidence analysis
        confidence_analysis = await gemini_service.analyze_speech_confidence(SAMPLE_TRANSCRIPT)
        print(f"✅ Confidence analysis: {confidence_analysis.get('confidence_score', 'N/A')} score")
        
        # Test comprehensive report generation
        print(f"\n3. Testing comprehensive report generation...")
        
        # Mock transcription data
        transcription_data = {
            'text': SAMPLE_TRANSCRIPT,
            'duration': 120,
            'word_count': len(SAMPLE_TRANSCRIPT.split()),
            'confidence': 0.92,
            'service': 'test_service',
            'segments': [
                {'start_time': 0, 'end_time': 30, 'text': 'First segment'},
                {'start_time': 30, 'end_time': 60, 'text': 'Second segment'},
                {'start_time': 60, 'end_time': 90, 'text': 'Third segment'},
                {'start_time': 90, 'end_time': 120, 'text': 'Fourth segment'}
            ]
        }
        
        # Mock video metadata
        video_metadata = {
            'filename': 'test_interview.mp4',
            'duration': 120,
            'resolution': '1920x1080',
            'file_size': 25000000
        }
        
        # Mock user info
        user_info = {
            'name': 'Test User',
            'email': 'test@example.com',
            'interview_type': 'Software Engineer'
        }
        
        # Generate comprehensive report
        report_result = await report_service.generate_comprehensive_report(
            transcription_data=transcription_data,
            analysis_results=analysis_result,
            video_metadata=video_metadata,
            user_info=user_info
        )
        
        print(f"✅ Comprehensive report generated!")
        print(f"   Report ID: {report_result.get('report_id', 'N/A')}")
        print(f"   Files generated: {list(report_result.get('files', {}).keys())}")
        
        # Display report summary
        summary = report_result.get('summary', {})
        print(f"\n📋 Report Summary:")
        print(f"   Overall Score: {summary.get('overall_score', 'N/A')}")
        print(f"   Readiness Level: {summary.get('readiness_level', 'N/A')}")
        print(f"   Key Strengths: {len(summary.get('key_strengths', []))}")
        print(f"   Key Improvements: {len(summary.get('key_improvements', []))}")
        
        # Save detailed results for inspection
        with open('enhanced_analysis_results.json', 'w') as f:
            json.dump({
                'analysis': analysis_result,
                'report': report_result
            }, f, indent=2, default=str)
        
        print(f"\n💾 Detailed results saved to 'enhanced_analysis_results.json'")
        print(f"\n🎉 All tests completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_analysis_accuracy():
    """Test the accuracy of the enhanced analysis"""
    
    print("\n🎯 Testing Analysis Accuracy")
    print("=" * 40)
    
    # Test cases with expected outcomes
    test_cases = [
        {
            'name': 'High Filler Word Content',
            'text': 'Um, well, like, you know, I think, um, that, like, this is, you know, really, um, important.',
            'expected_filler_severity': 'high'
        },
        {
            'name': 'Confident Speech',
            'text': 'I am confident in my abilities. I know I can deliver excellent results. I definitely have the skills needed.',
            'expected_confidence': 'high'
        },
        {
            'name': 'Uncertain Speech',
            'text': 'I think maybe I could try to do this. I guess I might be able to help. Perhaps I could contribute somehow.',
            'expected_confidence': 'low'
        }
    ]
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        
        # Run analysis
        result = await gemini_service.analyze_speech_text(test_case['text'])
        
        # Check filler word severity if expected
        if 'expected_filler_severity' in test_case:
            actual_severity = result.get('filler_words', {}).get('severity', 'unknown')
            expected_severity = test_case['expected_filler_severity']
            print(f"   Filler Severity - Expected: {expected_severity}, Actual: {actual_severity}")
        
        # Check confidence level if expected
        if 'expected_confidence' in test_case:
            confidence_score = result.get('overall_assessment', {}).get('confidence_score', 0)
            actual_confidence = 'high' if confidence_score > 75 else 'medium' if confidence_score > 50 else 'low'
            expected_confidence = test_case['expected_confidence']
            print(f"   Confidence Level - Expected: {expected_confidence}, Actual: {actual_confidence} ({confidence_score})")
    
    print(f"\n✅ Accuracy tests completed!")

async def main():
    """Run all tests"""
    print("🚀 Starting Enhanced Gemini Analysis Tests\n")
    
    # Test basic functionality
    success = await test_enhanced_gemini_analysis()
    
    if success:
        # Test accuracy
        await test_analysis_accuracy()
        
        print("\n" + "=" * 60)
        print("🎊 All enhanced Gemini tests completed successfully!")
        print("📁 Check the generated report files for detailed analysis.")
        print("🔗 Use the download endpoints to get PDF and JSON reports.")
    else:
        print("\n❌ Tests failed. Please check the error messages above.")

if __name__ == "__main__":
    asyncio.run(main())
