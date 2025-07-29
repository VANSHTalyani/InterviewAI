"""
Comprehensive analysis API routes for speech-to-text and AI analysis
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from typing import Dict, Any, Optional
import os
from datetime import datetime

from app.core.config import settings
from app.core.logging import logger
from app.services.transcription_service import transcription_service
from app.services.gemini_service import gemini_service
from app.services.report_service import report_service
from app.services.video_processor import video_processor

router = APIRouter()


def _calculate_grade(score: float) -> str:
    """
    Calculate letter grade from numerical score (0-100)
    """
    if score >= 90:
        return 'A+'
    elif score >= 85:
        return 'A'
    elif score >= 80:
        return 'A-'
    elif score >= 75:
        return 'B+'
    elif score >= 70:
        return 'B'
    elif score >= 65:
        return 'B-'
    elif score >= 60:
        return 'C+'
    elif score >= 55:
        return 'C'
    elif score >= 50:
        return 'C-'
    elif score >= 40:
        return 'D'
    else:
        return 'F'


@router.post("/analyze-speech")
async def comprehensive_speech_analysis(
    filename: str,
    user_id: Optional[str] = "default_user",
    generate_report: bool = True
):
    """
    Perform comprehensive speech analysis using Deepgram and Gemini
    
    Args:
        filename: Name of the uploaded video file
        user_id: User ID for the analysis
        generate_report: Whether to generate comprehensive report
        
    Returns:
        Complete analysis results with transcription and AI analysis
    """
    try:
        # Check if file exists
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        logger.info(f"Starting comprehensive analysis for {filename}")
        
        # Step 1: Extract audio from video if needed
        audio_path = await video_processor.get_video_audio_path(filename)
        if not audio_path:
            # Extract audio
            audio_path = await video_processor._extract_audio(file_path, filename)
            if not audio_path:
                raise HTTPException(status_code=500, detail="Failed to extract audio from video")
        
        # Step 2: Transcribe audio using Deepgram (prioritized in transcription_service)
        logger.info("Starting transcription with Deepgram")
        transcription_data = await transcription_service.transcribe_audio(audio_path)
        
        if not transcription_data or not transcription_data.get('text'):
            raise HTTPException(status_code=500, detail="Transcription failed")
        
        # Step 3: Analyze text with Gemini
        logger.info("Starting AI analysis with Gemini")
        context = {
            'duration': transcription_data.get('duration', 0),
            'service_used': transcription_data.get('service', 'unknown'),
            'timestamp': datetime.now().isoformat()
        }
        
        analysis_results = await gemini_service.analyze_speech_text(
            transcription_data['text'], 
            context
        )
        
        # Step 3.1: Get detailed filler words analysis with timestamps
        logger.info("Getting detailed filler words analysis")
        detailed_filler_analysis = await gemini_service.analyze_filler_words(
            transcription_data['text'],
            transcription_data.get('duration', 0)
        )
        
        # Step 4: Get video metadata
        video_metadata = await video_processor._get_video_metadata(file_path)
        
        # Step 5: Generate comprehensive report if requested
        report_info = None
        if generate_report:
            logger.info("Generating comprehensive report")
            user_info = {'user_id': user_id, 'analysis_date': datetime.now().isoformat()}
            
            report_info = await report_service.generate_comprehensive_report(
                transcription_data=transcription_data,
                analysis_results=analysis_results,
                video_metadata=video_metadata,
                user_info=user_info
            )
        
        # Step 6: Compile response - Enhanced for frontend display
        response = {
            'success': True,
            'filename': filename,
            'user_id': user_id,
            'analysis_timestamp': datetime.now().isoformat(),
            'message': 'Analysis completed successfully',
            'status': 'completed',
            'transcription': {
                'service': transcription_data.get('service', 'unknown'),
                'text': transcription_data['text'],
                'confidence': transcription_data.get('confidence', 0),
                'duration': transcription_data.get('duration', 0),
                'word_count': transcription_data.get('word_count', 0),
                'segments_count': len(transcription_data.get('segments', [])),
                'metadata': transcription_data.get('metadata', {})
            },
            'ai_analysis': analysis_results,
            'detailed_filler_analysis': detailed_filler_analysis,  # Enhanced filler word data
            'quick_insights': {
                'overall_score': analysis_results.get('overall_assessment', {}).get('overall_score', 0),
                'confidence_level': analysis_results.get('overall_assessment', {}).get('confidence_score', 0),
                'clarity_score': analysis_results.get('overall_assessment', {}).get('clarity_score', 0),
                'filler_word_count': detailed_filler_analysis.get('total_count', 0),
                'filler_frequency_per_minute': detailed_filler_analysis.get('frequency_per_minute', 0),
                'speaking_rate': transcription_data.get('word_count', 0) / (transcription_data.get('duration', 60) / 60) if transcription_data.get('duration', 0) > 0 else 0,
                'readiness_level': analysis_results.get('interview_readiness', {}).get('level', 'intermediate')
            },
            'recommendations': {
                'top_3_strengths': analysis_results.get('communication_strengths', [])[:3],
                'top_3_improvements': analysis_results.get('areas_for_improvement', [])[:3],
                'immediate_actions': analysis_results.get('recommendations', [])[:3]
            },
            'video_metadata': video_metadata,
            'report_info': report_info,
            # Enhanced frontend display data
            'display_summary': {
                'title': f'Analysis Results for {filename}',
                'completion_status': 'Analysis Complete!',
                'description': 'Your interview has been analyzed. Here\'s your detailed feedback.',
                'overall_grade': _calculate_grade(analysis_results.get('overall_assessment', {}).get('overall_score', 0)),
                'key_metrics': {
                    'speaking_confidence': f"{analysis_results.get('overall_assessment', {}).get('confidence_score', 0):.0f}%",
                    'speech_clarity': f"{analysis_results.get('overall_assessment', {}).get('clarity_score', 0):.0f}%",
                    'filler_usage': f"{analysis_results.get('filler_words', {}).get('severity', 'low').title()}",
                    'readiness': analysis_results.get('interview_readiness', {}).get('level', 'intermediate').title()
                }
            }
        }
        
        logger.info(f"Comprehensive analysis completed for {filename}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/quick-analyze")
async def quick_speech_analysis(filename: str):
    """
    Quick speech analysis without full report generation
    
    Args:
        filename: Name of the uploaded video file
        
    Returns:
        Quick analysis results
    """
    try:
        # Check if file exists
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Get or extract audio
        audio_path = await video_processor.get_video_audio_path(filename)
        if not audio_path:
            audio_path = await video_processor._extract_audio(file_path, filename)
        
        # Quick transcription
        transcription_data = await transcription_service.transcribe_audio(audio_path)
        
        if not transcription_data or not transcription_data.get('text'):
            raise HTTPException(status_code=500, detail="Transcription failed")
        
        # Quick analysis with Gemini (just confidence and filler words)
        filler_analysis = await gemini_service.analyze_filler_words(transcription_data['text'])
        confidence_analysis = await gemini_service.analyze_speech_confidence(transcription_data['text'])
        
        return {
            'success': True,
            'filename': filename,
            'quick_results': {
                'transcription_service': transcription_data.get('service', 'unknown'),
                'word_count': transcription_data.get('word_count', 0),
                'duration': transcription_data.get('duration', 0),
                'speaking_rate_wpm': transcription_data.get('word_count', 0) / (transcription_data.get('duration', 60) / 60),
                'confidence_score': confidence_analysis.get('confidence_score', 0),
                'filler_word_count': filler_analysis.get('total_count', 0),
                'filler_severity': filler_analysis.get('severity', 'low')
            },
            'text_preview': transcription_data['text'][:500] + '...' if len(transcription_data['text']) > 500 else transcription_data['text']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Quick analysis failed: {str(e)}")


@router.get("/analysis-status/{filename}")
async def get_analysis_status(filename: str):
    """
    Get the analysis status and available results for a file
    
    Args:
        filename: Name of the video file
        
    Returns:
        Status of analysis and available data
    """
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Check what's been processed
        base_name = os.path.splitext(filename)[0]
        
        # Check audio extraction
        audio_path = await video_processor.get_video_audio_path(filename)
        audio_ready = audio_path is not None
        
        # Check frame extraction
        frames_path = await video_processor.get_video_frames_path(filename)
        frames_ready = frames_path is not None
        
        # Check for existing reports
        reports_dir = report_service.reports_dir
        existing_reports = []
        
        for report_file in reports_dir.glob(f"*{base_name}*"):
            existing_reports.append({
                'filename': report_file.name,
                'type': report_file.suffix[1:],  # Remove the dot
                'size': report_file.stat().st_size,
                'created': datetime.fromtimestamp(report_file.stat().st_ctime).isoformat()
            })
        
        return {
            'filename': filename,
            'processing_status': {
                'audio_extracted': audio_ready,
                'frames_extracted': frames_ready,
                'ready_for_analysis': audio_ready
            },
            'existing_reports': existing_reports,
            'last_updated': datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="Status check failed")


@router.post("/regenerate-report")
async def regenerate_report(
    filename: str, 
    report_type: str = "comprehensive",
    user_id: str = "default_user"
):
    """
    Regenerate report for an already analyzed file
    
    Args:
        filename: Name of the video file
        report_type: Type of report (comprehensive, quick, summary)
        user_id: User ID
        
    Returns:
        New report information
    """
    try:
        # Check if we have existing analysis data
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Check if audio exists
        audio_path = await video_processor.get_video_audio_path(filename)
        if not audio_path:
            raise HTTPException(status_code=400, detail="Audio not extracted. Run full analysis first.")
        
        # Re-transcribe and re-analyze
        transcription_data = await transcription_service.transcribe_audio(audio_path)
        
        if not transcription_data or not transcription_data.get('text'):
            raise HTTPException(status_code=500, detail="Re-transcription failed")
        
        context = {
            'duration': transcription_data.get('duration', 0),
            'service_used': transcription_data.get('service', 'unknown'),
            'timestamp': datetime.now().isoformat()
        }
        
        analysis_results = await gemini_service.analyze_speech_text(
            transcription_data['text'], 
            context
        )
        
        # Generate new report
        video_metadata = await video_processor._get_video_metadata(file_path)
        user_info = {'user_id': user_id, 'regenerated_at': datetime.now().isoformat()}
        
        report_info = await report_service.generate_comprehensive_report(
            transcription_data=transcription_data,
            analysis_results=analysis_results,
            video_metadata=video_metadata,
            user_info=user_info
        )
        
        return {
            'success': True,
            'filename': filename,
            'report_regenerated': True,
            'report_info': report_info,
            'updated_analysis': {
                'overall_score': analysis_results.get('overall_assessment', {}).get('overall_score', 0),
                'readiness_level': analysis_results.get('interview_readiness', {}).get('level', 'intermediate'),
                'top_recommendation': analysis_results.get('recommendations', ['Practice regularly'])[0] if analysis_results.get('recommendations') else 'Continue practicing'
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report regeneration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Report regeneration failed: {str(e)}")


@router.get("/services-status")
async def get_services_status():
    """
    Check the status of all AI services
    
    Returns:
        Status of Deepgram, Gemini, and other services
    """
    try:
        # Check service availability
        status = {
            'timestamp': datetime.now().isoformat(),
            'services': {
                'deepgram': {
                    'available': transcription_service.deepgram_client is not None,
                    'configured': settings.DEEPGRAM_API_KEY is not None
                },
                'gemini': {
                    'available': gemini_service.model is not None,
                    'configured': settings.GEMINI_API_KEY is not None
                },
                'openai': {
                    'available': transcription_service.openai_client is not None,
                    'configured': settings.OPENAI_API_KEY is not None
                },
                'assemblyai': {
                    'available': transcription_service.assemblyai_client is not None,
                    'configured': settings.ASSEMBLYAI_API_KEY is not None
                },
                'google_speech': {
                    'available': transcription_service.google_client is not None,
                    'configured': settings.GOOGLE_APPLICATION_CREDENTIALS is not None
                }
            },
            'primary_transcription_service': 'deepgram' if transcription_service.deepgram_client else 'fallback',
            'analysis_service': 'gemini' if gemini_service.model else 'mock',
            'overall_status': 'ready' if transcription_service.deepgram_client and gemini_service.model else 'limited'
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Services status check failed: {e}")
        raise HTTPException(status_code=500, detail="Services status check failed")


@router.post("/test-analysis")
async def test_analysis_pipeline():
    """
    Test the analysis pipeline with sample text
    
    Returns:
        Test results from the AI analysis pipeline
    """
    try:
        # Sample text for testing
        test_text = """
        Hello, thank you for this opportunity to interview with your company. 
        I'm really excited about this position because, um, I believe my background in, 
        you know, software development aligns well with your needs. I have, uh, 
        five years of experience in Python development and I'm confident that I can, 
        like, contribute meaningfully to your team. I've worked on various projects including, 
        well, web applications and data analysis tools.
        """
        
        # Test Gemini analysis
        test_context = {
            'duration': 30,
            'service_used': 'test',
            'timestamp': datetime.now().isoformat()
        }
        
        analysis_results = await gemini_service.analyze_speech_text(test_text, test_context)
        
        # Test individual analysis functions
        filler_analysis = await gemini_service.analyze_filler_words(test_text)
        confidence_analysis = await gemini_service.analyze_speech_confidence(test_text)
        
        return {
            'success': True,
            'test_timestamp': datetime.now().isoformat(),
            'test_text_length': len(test_text),
            'full_analysis': analysis_results,
            'detailed_analysis': {
                'filler_words': filler_analysis,
                'confidence': confidence_analysis
            },
            'services_working': {
                'gemini_full_analysis': bool(analysis_results.get('overall_assessment')),
                'filler_word_detection': bool(filler_analysis.get('total_count') is not None),
                'confidence_analysis': bool(confidence_analysis.get('confidence_score') is not None)
            }
        }
        
    except Exception as e:
        logger.error(f"Test analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Test analysis failed: {str(e)}")
