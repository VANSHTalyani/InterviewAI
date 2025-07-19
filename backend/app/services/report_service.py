"""
Report generation service for interview analysis
"""
import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from pathlib import Path

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors

from app.core.config import settings
from app.core.logging import logger
from app.services.gemini_service import gemini_service
from sqlalchemy.orm import Session

# Mock classes since they're not defined yet
class ReportResponse:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

# Check if reportlab is available
try:
    from reportlab.lib.pagesizes import letter, A4
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class ReportService:
    """
    Service for generating analysis reports in PDF and JSON formats
    """
    
    def __init__(self):
        self.reports_dir = Path(settings.UPLOAD_DIR).parent / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    async def generate_report(self, db: Session, video_id: int, force: bool = False) -> Optional[ReportResponse]:
        """
        Generate a comprehensive analysis report for a video and enable download
        
        Args:
            db: Database session
            video_id: Video ID
            force: Force regeneration even if report exists
            
        Returns:
            Report response with file paths for download or None if failed
        """
        try:
            # Check if report already exists
            existing_report = await self.get_report_by_video_id(db, video_id)
            if existing_report and not force:
                return existing_report
            
            # Mock analysis jobs for now
            analysis_jobs = []
            
            if not analysis_jobs:
                logger.warning(f"No completed analysis jobs found for video {video_id}")
                return None
            
            # Aggregate analysis results
            analysis_results = await self._aggregate_analysis_results(analysis_jobs)
            
            # Generate report content
            report_content = await self._generate_report_content(video_id, analysis_results)
            
            # Create report record
            report = await self._create_report_record(db, video_id, report_content)
            
            # Generate PDF
            pdf_path = ""
            if REPORTLAB_AVAILABLE:
                pdf_path = await self._generate_pdf_report(report.id, report_content)

            # Generate JSON
            json_path = await self._generate_json_report(report.id, report_content)

            # Add file paths to report
            report.files = {
                'pdf': pdf_path,
                'json': json_path
            }
            
            logger.info(f"Report generated successfully for video {video_id}")
            return report
            
        except Exception as e:
            logger.error(f"Report generation failed for video {video_id}: {e}")
            return None
    
    async def get_report_by_video_id(self, db: Session, video_id: int) -> Optional[ReportResponse]:
        """
        Get report by video ID
        
        Args:
            db: Database session
            video_id: Video ID
            
        Returns:
            Report response or None if not found
        """
        try:
            # This would query the database for the report
            # For now, we'll return a mock report
            return ReportResponse(
                id=1,
                video_id=video_id,
                user_id="default_user",
                title=f"Analysis Report - Video {video_id}",
                summary="Comprehensive analysis of video content including transcription, tone, emotion, and body language analysis.",
                detailed_analysis={
                    "transcription": {"text": "Sample transcription", "confidence": 0.92},
                    "tone": {"label": "positive", "score": 0.75},
                    "emotion": {"dominant_emotion": "happy", "confidence": 0.85},
                    "body_language": {"assessment": "confident", "confidence": 0.78}
                },
                recommendations={
                    "improvements": ["Speak more clearly", "Use more gestures"],
                    "strengths": ["Good tone", "Clear articulation"]
                },
                overall_score=0.80,
                tone_score=0.75,
                clarity_score=0.85,
                engagement_score=0.78,
                body_language_score=0.78,
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Failed to get report by video ID: {e}")
            return None
    
    async def get_reports_by_user_id(self, db: Session, user_id: str) -> List[ReportResponse]:
        """
        Get all reports for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of report responses
        """
        try:
            # This would query the database for user reports
            # For now, we'll return a mock list
            return [
                ReportResponse(
                    id=1,
                    video_id=1,
                    user_id=user_id,
                    title="Analysis Report - Video 1",
                    summary="Sample report",
                    overall_score=0.80,
                    created_at=datetime.utcnow()
                )
            ]
            
        except Exception as e:
            logger.error(f"Failed to get reports by user ID: {e}")
            return []
    
    async def delete_report(self, db: Session, report_id: int) -> bool:
        """
        Delete a report
        
        Args:
            db: Database session
            report_id: Report ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete report files
            pdf_path = self.reports_dir / f"report_{report_id}.pdf"
            json_path = self.reports_dir / f"report_{report_id}.json"
            
            if pdf_path.exists():
                pdf_path.unlink()
            if json_path.exists():
                json_path.unlink()
            
            # Delete from database
            # This would delete the database record
            
            logger.info(f"Deleted report {report_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete report: {e}")
            return False
    
    async def get_analysis_summary(self, db: Session, video_id: int) -> Optional[Dict[str, Any]]:
        """
        Get analysis summary for a video
        
        Args:
            db: Database session
            video_id: Video ID
            
        Returns:
            Analysis summary or None if not found
        """
        try:
            # Mock analysis jobs for now
            analysis_jobs = []
            
            if not analysis_jobs:
                return None
            
            # Create summary
            summary = {
                'video_id': video_id,
                'total_jobs': len(analysis_jobs),
                'completed_jobs': len([j for j in analysis_jobs if j.status == "completed"]),
                'failed_jobs': len([j for j in analysis_jobs if j.status == "failed"]),
                'in_progress_jobs': len([j for j in analysis_jobs if j.status == "in_progress"]),
                'overall_progress': sum([j.progress for j in analysis_jobs]) / len(analysis_jobs) if analysis_jobs else 0,
                'job_types': [j.job_type for j in analysis_jobs],
                'last_updated': max([j.updated_at for j in analysis_jobs if j.updated_at]) if analysis_jobs else None
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get analysis summary: {e}")
            return None
    
    async def _aggregate_analysis_results(self, analysis_jobs: List) -> Dict[str, Any]:
        """
        Aggregate results from all analysis jobs
        
        Args:
            analysis_jobs: List of completed analysis jobs
            
        Returns:
            Aggregated analysis results
        """
        try:
            results = {}
            
            for job in analysis_jobs:
                if job.results:
                    results[job.job_type] = job.results
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to aggregate analysis results: {e}")
            return {}
    
    async def _generate_report_content(self, video_id: int, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive report content
        
        Args:
            video_id: Video ID
            analysis_results: Aggregated analysis results
            
        Returns:
            Report content dictionary
        """
        try:
            # Calculate overall scores
            scores = {}
            recommendations = []
            
            # Process transcription results
            if 'transcription' in analysis_results:
                transcription_data = analysis_results['transcription']
                scores['transcription_confidence'] = transcription_data.get('confidence_score', 0.0)
            
            # Process tone analysis
            if 'tone' in analysis_results:
                tone_data = analysis_results['tone']
                scores['tone_score'] = tone_data.get('confidence_score', 0.0)
                
                # Add tone recommendations
                if tone_data.get('tone_analysis', {}).get('label') == 'negative':
                    recommendations.append("Consider using more positive language")
            
            # Process emotion analysis
            if 'emotion' in analysis_results:
                emotion_data = analysis_results['emotion']
                scores['emotion_score'] = emotion_data.get('confidence_score', 0.0)
                
                # Add emotion recommendations
                dominant_emotion = emotion_data.get('emotion_analysis', {}).get('dominant_emotion')
                if dominant_emotion == 'serious':
                    recommendations.append("Try to appear more approachable and friendly")
            
            # Process body language analysis
            if 'body_language' in analysis_results:
                body_language_data = analysis_results['body_language']
                scores['body_language_score'] = body_language_data.get('confidence_score', 0.0)
                
                # Add body language recommendations
                assessment = body_language_data.get('body_language_analysis', {}).get('assessment')
                if assessment == 'reserved':
                    recommendations.append("Use more open body language and gestures")
            
            # Process clarity analysis
            if 'clarity' in analysis_results:
                clarity_data = analysis_results['clarity']
                scores['clarity_score'] = clarity_data.get('confidence_score', 0.0)
            
            # Calculate overall score
            overall_score = sum(scores.values()) / len(scores) if scores else 0.0
            
            # Generate strengths
            strengths = []
            if scores.get('tone_score', 0) > 0.7:
                strengths.append("Excellent tone and delivery")
            if scores.get('emotion_score', 0) > 0.7:
                strengths.append("Good emotional expression")
            if scores.get('body_language_score', 0) > 0.7:
                strengths.append("Confident body language")
            if scores.get('clarity_score', 0) > 0.7:
                strengths.append("Clear and articulate speech")
            
            report_content = {
                'video_id': video_id,
                'generated_at': datetime.utcnow().isoformat(),
                'overall_score': overall_score,
                'individual_scores': scores,
                'analysis_results': analysis_results,
                'recommendations': recommendations,
                'strengths': strengths,
                'summary': self._generate_summary(overall_score, analysis_results)
            }
            
            return report_content
            
        except Exception as e:
            logger.error(f"Failed to generate report content: {e}")
            return {}
    
    async def _create_report_record(self, db: Session, video_id: int, report_content: Dict[str, Any]) -> ReportResponse:
        """
        Create a report record in the database
        
        Args:
            db: Database session
            video_id: Video ID
            report_content: Report content
            
        Returns:
            Report response
        """
        try:
            # This would create a record in the database
            # For now, we'll return a mock report
            return ReportResponse(
                id=1,
                video_id=video_id,
                user_id="default_user",
                title=f"Analysis Report - Video {video_id}",
                summary=report_content.get('summary', 'Analysis report'),
                detailed_analysis=report_content.get('analysis_results', {}),
                recommendations={
                    'improvements': report_content.get('recommendations', []),
                    'strengths': report_content.get('strengths', [])
                },
                overall_score=report_content.get('overall_score', 0.0),
                tone_score=report_content.get('individual_scores', {}).get('tone_score', 0.0),
                clarity_score=report_content.get('individual_scores', {}).get('clarity_score', 0.0),
                engagement_score=report_content.get('individual_scores', {}).get('emotion_score', 0.0),
                body_language_score=report_content.get('individual_scores', {}).get('body_language_score', 0.0),
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Failed to create report record: {e}")
            raise
    
    async def _generate_pdf_report(self, report_id: int, report_content: Dict[str, Any]) -> str:
        """
        Generate PDF report
        
        Args:
            report_id: Report ID
            report_content: Report content
            
        Returns:
            Path to generated PDF
        """
        try:
            if not REPORTLAB_AVAILABLE:
                logger.warning("ReportLab not available, skipping PDF generation")
                return ""
            
            pdf_path = self.reports_dir / f"report_{report_id}.pdf"
            
            # Create PDF document
            doc = SimpleDocTemplate(str(pdf_path), pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1  # Center alignment
            )
            story.append(Paragraph(f"Video Analysis Report", title_style))
            story.append(Spacer(1, 20))
            
            # Summary
            story.append(Paragraph("Executive Summary", styles['Heading2']))
            summary_text = report_content.get('summary', 'No summary available')
            story.append(Paragraph(summary_text, styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Overall Score
            story.append(Paragraph("Overall Performance", styles['Heading2']))
            overall_score = report_content.get('overall_score', 0.0)
            story.append(Paragraph(f"Overall Score: {overall_score:.1%}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Individual Scores
            story.append(Paragraph("Detailed Scores", styles['Heading2']))
            scores = report_content.get('individual_scores', {})
            
            score_data = [['Metric', 'Score']]
            for metric, score in scores.items():
                score_data.append([metric.replace('_', ' ').title(), f"{score:.1%}"])
            
            score_table = Table(score_data)
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(score_table)
            story.append(Spacer(1, 20))
            
            # Recommendations
            recommendations = report_content.get('recommendations', [])
            if recommendations:
                story.append(Paragraph("Recommendations for Improvement", styles['Heading2']))
                for rec in recommendations:
                    story.append(Paragraph(f"• {rec}", styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Strengths
            strengths = report_content.get('strengths', [])
            if strengths:
                story.append(Paragraph("Identified Strengths", styles['Heading2']))
                for strength in strengths:
                    story.append(Paragraph(f"• {strength}", styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Footer
            story.append(Spacer(1, 30))
            footer_text = f"Report generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
            story.append(Paragraph(footer_text, styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"PDF report generated: {pdf_path}")
            return str(pdf_path)
            
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}")
            return ""
    
    async def _generate_json_report(self, report_id: int, report_content: Dict[str, Any]) -> str:
        """
        Generate JSON report
        
        Args:
            report_id: Report ID
            report_content: Report content
            
        Returns:
            Path to generated JSON
        """
        try:
            json_path = self.reports_dir / f"report_{report_id}.json"
            
            # Add metadata
            json_content = {
                'metadata': {
                    'report_id': report_id,
                    'generated_at': datetime.utcnow().isoformat(),
                    'version': '1.0'
                },
                'content': report_content
            }
            
            # Write JSON file
            with open(json_path, 'w') as f:
                json.dump(json_content, f, indent=2, default=str)
            
            logger.info(f"JSON report generated: {json_path}")
            return str(json_path)
            
        except Exception as e:
            logger.error(f"Failed to generate JSON report: {e}")
            return ""
    
    def _generate_summary(self, overall_score: float, analysis_results: Dict[str, Any]) -> str:
        """
        Generate a summary based on analysis results
        
        Args:
            overall_score: Overall performance score
            analysis_results: Analysis results
            
        Returns:
            Summary text
        """
        try:
            if overall_score >= 0.8:
                performance = "excellent"
            elif overall_score >= 0.6:
                performance = "good"
            elif overall_score >= 0.4:
                performance = "fair"
            else:
                performance = "needs improvement"
            
            summary = f"The video analysis shows {performance} overall performance with a score of {overall_score:.1%}. "
            
            # Add specific insights
            if 'transcription' in analysis_results:
                summary += "The speech was clearly transcribed. "
            
            if 'tone' in analysis_results:
                tone_data = analysis_results['tone'].get('tone_analysis', {})
                tone_label = tone_data.get('label', 'neutral')
                summary += f"The tone was predominantly {tone_label}. "
            
            if 'emotion' in analysis_results:
                emotion_data = analysis_results['emotion'].get('emotion_analysis', {})
                emotion = emotion_data.get('dominant_emotion', 'neutral')
                summary += f"The speaker appeared {emotion} throughout the video. "
            
            if 'body_language' in analysis_results:
                body_data = analysis_results['body_language'].get('body_language_analysis', {})
                assessment = body_data.get('assessment', 'neutral')
                summary += f"Body language was {assessment}. "
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            return "Analysis completed with mixed results."
    
    async def generate_comprehensive_report(
        self,
        transcription_data: Dict[str, Any],
        analysis_results: Dict[str, Any],
        video_metadata: Dict[str, Any] = None,
        user_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive interview analysis report
        
        Args:
            transcription_data: Results from transcription service
            analysis_results: Results from Gemini analysis
            video_metadata: Video file metadata
            user_info: User information
            
        Returns:
            Dictionary with report information and file paths
        """
        try:
            # Generate report ID
            report_id = f"interview_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Collect all data for the report
            report_data = await self._compile_comprehensive_report_data(
                transcription_data, analysis_results, video_metadata, user_info
            )
            
            # Generate different report formats
            report_files = {}
            
            # Generate JSON report
            json_file = await self._generate_comprehensive_json_report(report_id, report_data)
            report_files['json'] = json_file
            
            # Generate PDF report
            pdf_file = await self._generate_comprehensive_pdf_report(report_id, report_data)
            report_files['pdf'] = pdf_file
            
            # Generate summary report
            summary_file = await self._generate_comprehensive_summary_report(report_id, report_data)
            report_files['summary'] = summary_file
            
            logger.info(f"Generated comprehensive report: {report_id}")
            
            return {
                'report_id': report_id,
                'files': report_files,
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'report_type': 'comprehensive_interview_analysis',
                    'total_files': len(report_files)
                },
                'summary': report_data.get('executive_summary', {})
            }
            
        except Exception as e:
            logger.error(f"Comprehensive report generation failed: {e}")
            raise
    
    async def _compile_comprehensive_report_data(
        self,
        transcription_data: Dict[str, Any],
        analysis_results: Dict[str, Any],
        video_metadata: Dict[str, Any] = None,
        user_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Compile all data needed for the comprehensive report"""
        
        # Calculate derived metrics
        speaking_duration = transcription_data.get('duration', 0)
        word_count = transcription_data.get('word_count', 0)
        speaking_rate = (word_count / (speaking_duration / 60)) if speaking_duration > 0 else 0
        
        # Create executive summary
        executive_summary = {
            'overall_score': analysis_results.get('overall_assessment', {}).get('overall_score', 0),
            'key_strengths': analysis_results.get('communication_strengths', [])[:3],
            'key_improvements': analysis_results.get('areas_for_improvement', [])[:3],
            'readiness_level': analysis_results.get('interview_readiness', {}).get('level', 'intermediate'),
            'recommendation': self._get_primary_recommendation(analysis_results)
        }
        
        report_data = {
            'header': {
                'title': 'Interview Performance Analysis Report',
                'generated_at': datetime.now().isoformat(),
                'report_version': '1.0',
                'user_info': user_info or {}
            },
            'executive_summary': executive_summary,
            'transcription_analysis': {
                'service_used': transcription_data.get('service', 'unknown'),
                'duration_seconds': speaking_duration,
                'word_count': word_count,
                'speaking_rate_wpm': round(speaking_rate, 1),
                'confidence_score': transcription_data.get('confidence', 0),
                'segments_count': len(transcription_data.get('segments', [])),
                'full_transcript': transcription_data.get('text', '')
            },
            'speech_analysis': analysis_results,
            'detailed_metrics': {
                'filler_word_analysis': await gemini_service.analyze_filler_words(transcription_data.get('text', '')),
                'confidence_analysis': await gemini_service.analyze_speech_confidence(transcription_data.get('text', '')),
                'speech_patterns': await self._analyze_speech_patterns(transcription_data)
            },
            'recommendations': {
                'immediate_actions': analysis_results.get('recommendations', [])[:3],
                'long_term_goals': analysis_results.get('recommendations', [])[3:] if len(analysis_results.get('recommendations', [])) > 3 else [],
                'practice_suggestions': await self._generate_practice_suggestions(analysis_results)
            },
            'video_metadata': video_metadata or {},
            'appendix': {
                'methodology': self._get_methodology_description(),
                'scoring_criteria': self._get_scoring_criteria(),
                'resources': self._get_additional_resources()
            }
        }
        
        return report_data
    
    def _get_primary_recommendation(self, analysis_results: Dict[str, Any]) -> str:
        """Get the primary recommendation based on analysis"""
        overall_score = analysis_results.get('overall_assessment', {}).get('overall_score', 0)
        
        if overall_score >= 85:
            return "Excellent performance! Focus on maintaining consistency and continue refining advanced techniques."
        elif overall_score >= 70:
            return "Good performance with room for improvement. Focus on reducing filler words and increasing confidence."
        elif overall_score >= 55:
            return "Moderate performance. Practice structured responses and work on clarity of communication."
        else:
            return "Significant improvement needed. Focus on basic communication skills and practice regularly."
    
    async def _analyze_speech_patterns(self, transcription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze speech patterns from transcription"""
        segments = transcription_data.get('segments', [])
        
        if not segments:
            return {}
        
        # Analyze segment lengths
        segment_lengths = [seg['end_time'] - seg['start_time'] for seg in segments]
        avg_segment_length = sum(segment_lengths) / len(segment_lengths) if segment_lengths else 0
        
        # Analyze pauses (gaps between segments)
        pauses = []
        for i in range(len(segments) - 1):
            pause_length = segments[i+1]['start_time'] - segments[i]['end_time']
            pauses.append(pause_length)
        
        avg_pause_length = sum(pauses) / len(pauses) if pauses else 0
        
        return {
            'average_segment_length': round(avg_segment_length, 2),
            'average_pause_length': round(avg_pause_length, 2),
            'total_segments': len(segments),
            'speech_consistency': 'consistent' if avg_segment_length > 3 else 'choppy',
            'pause_patterns': 'natural' if 0.5 <= avg_pause_length <= 2.0 else 'unnatural'
        }
    
    async def _generate_practice_suggestions(self, analysis_results: Dict[str, Any]) -> List[str]:
        """Generate practice suggestions based on analysis"""
        suggestions = []
        
        # Filler word suggestions
        filler_severity = analysis_results.get('filler_words', {}).get('severity', 'low')
        if filler_severity in ['medium', 'high']:
            suggestions.append("Practice the 'pause and breathe' technique instead of using filler words")
        
        # Confidence suggestions
        confidence_score = analysis_results.get('overall_assessment', {}).get('confidence_score', 0)
        if confidence_score < 70:
            suggestions.append("Record yourself answering common interview questions daily")
        
        # General suggestions
        readiness_level = analysis_results.get('interview_readiness', {}).get('level', 'intermediate')
        if readiness_level in ['beginner', 'intermediate']:
            suggestions.extend([
                "Practice with mock interviews using common behavioral questions",
                "Prepare STAR method responses for key experiences",
                "Work on maintaining eye contact and confident body language"
            ])
        
        return suggestions
    
    async def _generate_comprehensive_json_report(self, report_id: str, report_data: Dict[str, Any]) -> str:
        """Generate JSON format comprehensive report"""
        json_file = self.reports_dir / f"{report_id}.json"
        
        with open(json_file, 'w') as f:
            json.dump(report_data, f, indent=2, default=str)
        
        return str(json_file)
    
    async def _generate_comprehensive_pdf_report(self, report_id: str, report_data: Dict[str, Any]) -> str:
        """Generate PDF format comprehensive report"""
        pdf_file = self.reports_dir / f"{report_id}.pdf"
        
        # Create PDF document
        doc = SimpleDocTemplate(str(pdf_file), pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#2E86AB'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#A23B72'),
            spaceAfter=12
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6
        )
        
        # Build PDF content
        content = []
        
        # Title
        content.append(Paragraph(report_data['header']['title'], title_style))
        content.append(Spacer(1, 20))
        
        # Executive Summary
        content.append(Paragraph("Executive Summary", heading_style))
        exec_summary = report_data['executive_summary']
        content.append(Paragraph(f"<b>Overall Score:</b> {exec_summary['overall_score']}/100", body_style))
        content.append(Paragraph(f"<b>Readiness Level:</b> {exec_summary['readiness_level'].title()}", body_style))
        content.append(Paragraph(f"<b>Primary Recommendation:</b> {exec_summary['recommendation']}", body_style))
        content.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(content)
        
        return str(pdf_file)
    
    async def _generate_comprehensive_summary_report(self, report_id: str, report_data: Dict[str, Any]) -> str:
        """Generate a comprehensive summary report"""
        summary_file = self.reports_dir / f"{report_id}_summary.txt"
        
        exec_summary = report_data['executive_summary']
        speech_analysis = report_data['speech_analysis']
        
        summary_content = f"""
INTERVIEW PERFORMANCE ANALYSIS SUMMARY
=====================================

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

OVERALL ASSESSMENT
------------------
Overall Score: {exec_summary['overall_score']}/100
Readiness Level: {exec_summary['readiness_level'].title()}

PRIMARY RECOMMENDATION
---------------------
{exec_summary['recommendation']}
"""
        
        with open(summary_file, 'w') as f:
            f.write(summary_content)
        
        return str(summary_file)
    
    def _get_methodology_description(self) -> str:
        """Get description of analysis methodology"""
        return """
        This analysis uses advanced AI techniques including:
        - Deepgram for high-accuracy speech-to-text transcription
        - Google Gemini for comprehensive text analysis
        - Natural language processing for filler word detection
        - Confidence scoring based on linguistic patterns
        - Professional communication assessment
        """
    
    def _get_scoring_criteria(self) -> Dict[str, str]:
        """Get scoring criteria explanation"""
        return {
            'confidence_score': 'Based on use of confident language, decisive statements, and absence of uncertainty markers',
            'clarity_score': 'Measures articulation, coherence, and ease of understanding',
            'professionalism_score': 'Evaluates appropriate language, structure, and interview readiness',
            'overall_score': 'Weighted average of all individual scores with emphasis on communication effectiveness'
        }
    
    def _get_additional_resources(self) -> List[str]:
        """Get list of additional resources for improvement"""
        return [
            "Practice with mock interview platforms",
            "Join public speaking groups like Toastmasters",
            "Record daily practice sessions",
            "Work with a communication coach",
            "Study successful interview examples online"
        ]


# Global report service instance
report_service = ReportService()
