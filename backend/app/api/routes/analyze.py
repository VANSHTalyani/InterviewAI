"""
Analysis API routes for triggering and monitoring video analysis
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.transcription_service import transcription_service
from app.services.nlp_service import nlp_service
from app.services.vision_service import vision_service
from app.services.video_processor import video_processor

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def trigger_analysis(
    analysis_request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger analysis for a video
    """
    try:
        # Verify video exists
        video = await video_processor.get_video_by_id(db, analysis_request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if video is ready for analysis
        if video.status != "uploaded":
            raise HTTPException(
                status_code=400, 
                detail=f"Video must be uploaded before analysis. Current status: {video.status}"
            )
        
        # Create analysis jobs
        job_ids = []
        for job_type in analysis_request.job_types:
            job_id = await analysis_service.create_analysis_job(
                db, analysis_request.video_id, job_type
            )
            job_ids.append(job_id)
        
        # Estimate processing time
        estimated_time = await analysis_service.estimate_processing_time(
            video.duration, analysis_request.job_types
        )
        
        logger.info(f"Analysis triggered for video {analysis_request.video_id}, jobs: {job_ids}")
        
        return AnalysisResponse(
            message="Analysis jobs created successfully",
            video_id=analysis_request.video_id,
            job_ids=job_ids,
            estimated_time=estimated_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis trigger failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis trigger failed")


@router.get("/status/{video_id}", response_model=VideoStatusResponse)
async def get_video_status(video_id: int, db: Session = Depends(get_db)):
    """
    Get the status of all analysis jobs for a video
    """
    try:
        video = await video_processor.get_video_by_id(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Get all analysis jobs for this video
        jobs = await analysis_service.get_jobs_by_video_id(db, video_id)
        
        job_statuses = []
        for job in jobs:
            job_status = JobStatus(
                job_id=job.id,
                status=job.status,
                progress=job.progress,
                error_message=job.error_message,
                estimated_remaining_time=await analysis_service.estimate_remaining_time(job)
            )
            job_statuses.append(job_status)
        
        # Calculate overall progress
        overall_progress = sum(job.progress for job in job_statuses) / len(job_statuses) if job_statuses else 0
        
        return VideoStatusResponse(
            video_id=video_id,
            status=video.status,
            jobs=job_statuses,
            overall_progress=overall_progress
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="Status check failed")


@router.get("/job/{job_id}", response_model=AnalysisJobResponse)
async def get_job_details(job_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific analysis job
    """
    try:
        job = await analysis_service.get_job_by_id(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return job
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job details fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Job details fetch failed")


@router.post("/batch", response_model=BatchAnalysisResponse)
async def batch_analysis(
    batch_request: BatchAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger batch analysis for multiple videos
    """
    try:
        # Verify all videos exist
        videos = []
        for video_id in batch_request.video_ids:
            video = await video_processor.get_video_by_id(db, video_id)
            if not video:
                raise HTTPException(status_code=404, detail=f"Video {video_id} not found")
            videos.append(video)
        
        # Create batch analysis
        batch_id = await analysis_service.create_batch_analysis(
            db, batch_request.video_ids, batch_request.job_types, batch_request.priority
        )
        
        # Count total jobs created
        jobs_created = len(batch_request.video_ids) * len(batch_request.job_types)
        
        # Estimate total time
        total_duration = sum(video.duration or 0 for video in videos)
        estimated_time = await analysis_service.estimate_processing_time(
            total_duration, batch_request.job_types
        )
        
        return BatchAnalysisResponse(
            batch_id=batch_id,
            total_videos=len(batch_request.video_ids),
            jobs_created=jobs_created,
            estimated_time=estimated_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Batch analysis failed")


@router.post("/cancel/{job_id}")
async def cancel_job(job_id: int, db: Session = Depends(get_db)):
    """
    Cancel a specific analysis job
    """
    try:
        result = await analysis_service.cancel_job(db, job_id)
        if not result:
            raise HTTPException(status_code=404, detail="Job not found or cannot be cancelled")
        
        return {"message": "Job cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job cancellation failed: {e}")
        raise HTTPException(status_code=500, detail="Job cancellation failed")


@router.post("/retry/{job_id}")
async def retry_job(job_id: int, db: Session = Depends(get_db)):
    """
    Retry a failed analysis job
    """
    try:
        result = await analysis_service.retry_job(db, job_id)
        if not result:
            raise HTTPException(status_code=404, detail="Job not found or cannot be retried")
        
        return {"message": "Job retry initiated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job retry failed: {e}")
        raise HTTPException(status_code=500, detail="Job retry failed")
