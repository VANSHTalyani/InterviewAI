"""
Analysis service for handling AI analysis tasks
"""
import os
import asyncio
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import JobTypeEnum, AnalysisStatusEnum, AnalysisJobResponse
from app.services.video_processor import video_processor
from app.services.transcription_service import transcription_service
from app.services.nlp_service import nlp_service
from app.services.vision_service import vision_service


class AnalysisService:
    """
    Service for managing and executing AI analysis tasks
    """
    
    def __init__(self):
        self.processing_jobs = {}  # In-memory job tracking
    
    async def create_analysis_job(
        self,
        db: Session,
        video_id: int,
        job_type: JobTypeEnum
    ) -> int:
        """
        Create a new analysis job
        
        Args:
            db: Database session
            video_id: Video ID
            job_type: Type of analysis job
            
        Returns:
            Job ID
        """
        try:
            # This would create a job record in the database
            job_id = len(self.processing_jobs) + 1  # Simulate job creation
            
            job_data = {
                'id': job_id,
                'video_id': video_id,
                'job_type': job_type,
                'status': AnalysisStatusEnum.PENDING,
                'progress': 0.0,
                'created_at': datetime.utcnow(),
                'results': None,
                'error_message': None
            }
            
            self.processing_jobs[job_id] = job_data
            
            # Start processing in background
            asyncio.create_task(self._process_analysis_job(job_id, job_data))
            
            logger.info(f"Created analysis job {job_id} for video {video_id}, type: {job_type}")
            return job_id
            
        except Exception as e:
            logger.error(f"Failed to create analysis job: {e}")
            raise
    
    async def get_job_by_id(self, db: Session, job_id: int) -> Optional[AnalysisJobResponse]:
        """
        Get analysis job details by ID
        
        Args:
            db: Database session
            job_id: Job ID
            
        Returns:
            Job details or None if not found
        """
        try:
            job_data = self.processing_jobs.get(job_id)
            if not job_data:
                return None
            
            return AnalysisJobResponse(
                id=job_data['id'],
                video_id=job_data['video_id'],
                job_type=job_data['job_type'],
                status=job_data['status'],
                progress=job_data['progress'],
                results=job_data['results'],
                error_message=job_data['error_message'],
                created_at=job_data['created_at'],
                updated_at=job_data.get('updated_at'),
                started_at=job_data.get('started_at'),
                completed_at=job_data.get('completed_at'),
                confidence_score=job_data.get('confidence_score')
            )
            
        except Exception as e:
            logger.error(f"Failed to get job by ID: {e}")
            return None
    
    async def get_jobs_by_video_id(self, db: Session, video_id: int) -> List[AnalysisJobResponse]:
        """
        Get all analysis jobs for a video
        
        Args:
            db: Database session
            video_id: Video ID
            
        Returns:
            List of job details
        """
        try:
            jobs = []
            for job_data in self.processing_jobs.values():
                if job_data['video_id'] == video_id:
                    job = await self.get_job_by_id(db, job_data['id'])
                    if job:
                        jobs.append(job)
            
            return jobs
            
        except Exception as e:
            logger.error(f"Failed to get jobs by video ID: {e}")
            return []
    
    async def estimate_processing_time(self, duration: Optional[float], job_types: List[JobTypeEnum]) -> int:
        """
        Estimate processing time for analysis jobs
        
        Args:
            duration: Video duration in seconds
            job_types: List of job types to process
            
        Returns:
            Estimated time in seconds
        """
        if not duration:
            duration = 60  # Default estimation
        
        # Base time estimates per job type (seconds per minute of video)
        time_estimates = {
            JobTypeEnum.TRANSCRIPTION: 0.5,
            JobTypeEnum.TONE: 0.2,
            JobTypeEnum.EMOTION: 0.3,
            JobTypeEnum.BODY_LANGUAGE: 0.8,
            JobTypeEnum.CLARITY: 0.1
        }
        
        total_time = 0
        video_minutes = duration / 60
        
        for job_type in job_types:
            if job_type in time_estimates:
                total_time += time_estimates[job_type] * video_minutes
        
        return int(total_time)
    
    async def estimate_remaining_time(self, job: AnalysisJobResponse) -> Optional[int]:
        """
        Estimate remaining time for a job
        
        Args:
            job: Job details
            
        Returns:
            Estimated remaining time in seconds
        """
        if job.status == AnalysisStatusEnum.COMPLETED:
            return 0
        
        if job.status == AnalysisStatusEnum.FAILED:
            return None
        
        if job.progress >= 1.0:
            return 0
        
        # Simple estimation based on progress
        if job.progress > 0:
            elapsed = 60  # Assume 1 minute elapsed (would be calculated from timestamps)
            total_estimated = elapsed / job.progress
            remaining = total_estimated - elapsed
            return max(0, int(remaining))
        
        return None
    
    async def create_batch_analysis(
        self,
        db: Session,
        video_ids: List[int],
        job_types: List[JobTypeEnum],
        priority: int = 0
    ) -> str:
        """
        Create batch analysis for multiple videos
        
        Args:
            db: Database session
            video_ids: List of video IDs
            job_types: List of job types
            priority: Priority level (0-10)
            
        Returns:
            Batch ID
        """
        try:
            batch_id = str(uuid.uuid4())
            
            # Create jobs for each video
            for video_id in video_ids:
                for job_type in job_types:
                    await self.create_analysis_job(db, video_id, job_type)
            
            logger.info(f"Created batch analysis {batch_id} for {len(video_ids)} videos")
            return batch_id
            
        except Exception as e:
            logger.error(f"Failed to create batch analysis: {e}")
            raise
    
    async def cancel_job(self, db: Session, job_id: int) -> bool:
        """
        Cancel an analysis job
        
        Args:
            db: Database session
            job_id: Job ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            job_data = self.processing_jobs.get(job_id)
            if not job_data:
                return False
            
            if job_data['status'] in [AnalysisStatusEnum.COMPLETED, AnalysisStatusEnum.FAILED]:
                return False  # Cannot cancel completed or failed jobs
            
            job_data['status'] = AnalysisStatusEnum.FAILED
            job_data['error_message'] = "Job cancelled by user"
            job_data['updated_at'] = datetime.utcnow()
            
            logger.info(f"Cancelled job {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel job: {e}")
            return False
    
    async def retry_job(self, db: Session, job_id: int) -> bool:
        """
        Retry a failed analysis job
        
        Args:
            db: Database session
            job_id: Job ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            job_data = self.processing_jobs.get(job_id)
            if not job_data:
                return False
            
            if job_data['status'] != AnalysisStatusEnum.FAILED:
                return False  # Can only retry failed jobs
            
            # Reset job status
            job_data['status'] = AnalysisStatusEnum.PENDING
            job_data['progress'] = 0.0
            job_data['error_message'] = None
            job_data['updated_at'] = datetime.utcnow()
            
            # Start processing again
            asyncio.create_task(self._process_analysis_job(job_id, job_data))
            
            logger.info(f"Retrying job {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to retry job: {e}")
            return False
    
    async def _process_analysis_job(self, job_id: int, job_data: Dict[str, Any]):
        """
        Process an analysis job in the background
        
        Args:
            job_id: Job ID
            job_data: Job data dictionary
        """
        try:
            # Update job status
            job_data['status'] = AnalysisStatusEnum.IN_PROGRESS
            job_data['started_at'] = datetime.utcnow()
            job_data['progress'] = 0.1
            
            logger.info(f"Starting analysis job {job_id}, type: {job_data['job_type']}")
            
            # Get video information
            video = await video_processor.get_video_by_id(None, job_data['video_id'])
            if not video:
                raise ValueError("Video not found")
            
            # Process based on job type
            if job_data['job_type'] == JobTypeEnum.TRANSCRIPTION:
                results = await self._process_transcription(video, job_data)
            elif job_data['job_type'] == JobTypeEnum.TONE:
                results = await self._process_tone_analysis(video, job_data)
            elif job_data['job_type'] == JobTypeEnum.EMOTION:
                results = await self._process_emotion_analysis(video, job_data)
            elif job_data['job_type'] == JobTypeEnum.BODY_LANGUAGE:
                results = await self._process_body_language(video, job_data)
            elif job_data['job_type'] == JobTypeEnum.CLARITY:
                results = await self._process_clarity_analysis(video, job_data)
            else:
                raise ValueError(f"Unknown job type: {job_data['job_type']}")
            
            # Update job completion
            job_data['status'] = AnalysisStatusEnum.COMPLETED
            job_data['progress'] = 1.0
            job_data['results'] = results
            job_data['completed_at'] = datetime.utcnow()
            job_data['updated_at'] = datetime.utcnow()
            
            logger.info(f"Completed analysis job {job_id}")
            
        except Exception as e:
            logger.error(f"Analysis job {job_id} failed: {e}")
            job_data['status'] = AnalysisStatusEnum.FAILED
            job_data['error_message'] = str(e)
            job_data['updated_at'] = datetime.utcnow()
    
    async def _process_transcription(self, video, job_data):
        """Process transcription analysis"""
        job_data['progress'] = 0.3
        
        # Get audio file path
        audio_path = await video_processor.get_video_audio_path(video.filename)
        if not audio_path:
            raise ValueError("Audio file not found")
        
        job_data['progress'] = 0.5
        
        # Perform transcription
        transcription_result = await transcription_service.transcribe_audio(audio_path)
        
        job_data['progress'] = 0.9
        
        return {
            'transcription': transcription_result,
            'confidence_score': transcription_result.get('confidence', 0.0)
        }
    
    async def _process_tone_analysis(self, video, job_data):
        """Process tone analysis"""
        job_data['progress'] = 0.3
        
        # Get transcription first (this would come from database in real implementation)
        transcription = "This is a sample transcription for tone analysis."
        
        job_data['progress'] = 0.5
        
        # Perform tone analysis
        tone_result = await nlp_service.analyze_tone(transcription)
        
        job_data['progress'] = 0.9
        
        return {
            'tone_analysis': tone_result,
            'confidence_score': tone_result.get('confidence', 0.0)
        }
    
    async def _process_emotion_analysis(self, video, job_data):
        """Process emotion analysis"""
        job_data['progress'] = 0.3
        
        # Get frames path
        frames_path = await video_processor.get_video_frames_path(video.filename)
        if not frames_path:
            raise ValueError("Frames not found")
        
        job_data['progress'] = 0.5
        
        # Perform emotion analysis
        emotion_result = await vision_service.analyze_emotions(frames_path)
        
        job_data['progress'] = 0.9
        
        return {
            'emotion_analysis': emotion_result,
            'confidence_score': emotion_result.get('confidence', 0.0)
        }
    
    async def _process_body_language(self, video, job_data):
        """Process body language analysis"""
        job_data['progress'] = 0.3
        
        # Get frames path
        frames_path = await video_processor.get_video_frames_path(video.filename)
        if not frames_path:
            raise ValueError("Frames not found")
        
        job_data['progress'] = 0.5
        
        # Perform body language analysis
        body_language_result = await vision_service.analyze_body_language(frames_path)
        
        job_data['progress'] = 0.9
        
        return {
            'body_language_analysis': body_language_result,
            'confidence_score': body_language_result.get('confidence', 0.0)
        }
    
    async def _process_clarity_analysis(self, video, job_data):
        """Process clarity analysis"""
        job_data['progress'] = 0.3
        
        # Get transcription first (this would come from database in real implementation)
        transcription = "This is a sample transcription for clarity analysis."
        
        job_data['progress'] = 0.5
        
        # Perform clarity analysis
        clarity_result = await nlp_service.analyze_clarity(transcription)
        
        job_data['progress'] = 0.9
        
        return {
            'clarity_analysis': clarity_result,
            'confidence_score': clarity_result.get('confidence', 0.0)
        }


# Global analysis service instance
analysis_service = AnalysisService()
