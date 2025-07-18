"""
Report service for generating PDF and JSON reports
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import ReportResponse, ReportCreate
from app.services.analysis_service import analysis_service

# Optional imports for report generation
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class ReportService:
    """
    Service for generating analysis reports in PDF and JSON formats
    """
    
    def __init__(self):
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
    
    async def generate_report(self, db: Session, video_id: int, force: bool = False) -> Optional[ReportResponse]:
        """
        Generate a comprehensive analysis report for a video
        
        Args:
            db: Database session
            video_id: Video ID
            force: Force regeneration even if report exists
            
        Returns:
            Report response or None if failed
        """
        try:
            # Check if report already exists
            existing_report = await self.get_report_by_video_id(db, video_id)
            if existing_report and not force:
                return existing_report
            
            # Get all completed analysis jobs for this video
            analysis_jobs = await analysis_service.get_jobs_by_video_id(db, video_id)
            completed_jobs = [job for job in analysis_jobs if job.status == "completed"]
            
            if not completed_jobs:
                logger.warning(f"No completed analysis jobs found for video {video_id}")
                return None
            
            # Aggregate analysis results
            analysis_results = await self._aggregate_analysis_results(completed_jobs)
            
            # Generate report content
            report_content = await self._generate_report_content(video_id, analysis_results)
            
            # Create report record
            report = await self._create_report_record(db, video_id, report_content)
            
            # Generate PDF
            if REPORTLAB_AVAILABLE:
                pdf_path = await self._generate_pdf_report(report.id, report_content)
                # Update report with PDF path
                # report.pdf_path = pdf_path
            
            # Generate JSON
            json_path = await self._generate_json_report(report.id, report_content)
            # Update report with JSON path
            # report.json_path = json_path
            
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
            # Get analysis jobs
            analysis_jobs = await analysis_service.get_jobs_by_video_id(db, video_id)
            
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


# Global report service instance
report_service = ReportService()
