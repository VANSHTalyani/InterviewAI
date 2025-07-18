"""
Video processing API routes
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import os

from app.core.config import settings
from app.core.logging import logger
from app.services.video_processor import video_processor

router = APIRouter()


@router.post("/process/{filename}")
async def process_video_file(filename: str, background_tasks: BackgroundTasks):
    """
    Process a video file: extract audio and frames
    """
    try:
        # Check if file exists
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Validate video file
        validation = await video_processor.validate_video_file(file_path)
        if not validation['is_valid']:
            raise HTTPException(status_code=400, detail=f"Invalid video file: {validation['errors']}")
        
        # Start background processing
        background_tasks.add_task(
            video_processor.process_video,
            1,  # mock video_id
            file_path,
            filename
        )
        
        return {
            "message": "Video processing started",
            "filename": filename,
            "validation": validation,
            "processing_status": "started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video processing failed: {e}")
        raise HTTPException(status_code=500, detail="Video processing failed")


@router.get("/process/status/{filename}")
async def get_processing_status(filename: str):
    """
    Get processing status for a video file
    """
    try:
        base_name = os.path.splitext(filename)[0]
        
        # Check if audio file exists
        audio_path = await video_processor.get_video_audio_path(filename)
        audio_exists = audio_path is not None
        
        # Check if frames exist
        frames_path = await video_processor.get_video_frames_path(filename)
        frames_exist = frames_path is not None
        
        # Count frames if they exist
        frame_count = 0
        if frames_exist:
            frame_files = [f for f in os.listdir(frames_path) if f.endswith('.jpg')]
            frame_count = len(frame_files)
        
        processing_complete = audio_exists and frames_exist
        
        return {
            "filename": filename,
            "audio_extracted": audio_exists,
            "frames_extracted": frames_exist,
            "frame_count": frame_count,
            "processing_complete": processing_complete,
            "audio_path": audio_path,
            "frames_path": frames_path
        }
        
    except Exception as e:
        logger.error(f"Failed to get processing status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get processing status")


@router.get("/extract/audio/{filename}")
async def extract_audio_only(filename: str):
    """
    Extract audio from a video file
    """
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Extract audio
        audio_path = await video_processor._extract_audio(file_path, filename)
        
        return {
            "message": "Audio extracted successfully",
            "filename": filename,
            "audio_path": audio_path
        }
        
    except Exception as e:
        logger.error(f"Audio extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Audio extraction failed")


@router.get("/extract/frames/{filename}")
async def extract_frames_only(filename: str):
    """
    Extract frames from a video file
    """
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Extract frames
        frames_path = await video_processor._extract_frames(file_path, filename)
        
        # Count frames
        frame_files = [f for f in os.listdir(frames_path) if f.endswith('.jpg')]
        frame_count = len(frame_files)
        
        return {
            "message": "Frames extracted successfully",
            "filename": filename,
            "frames_path": frames_path,
            "frame_count": frame_count
        }
        
    except Exception as e:
        logger.error(f"Frame extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Frame extraction failed")


@router.get("/metadata/{filename}")
async def get_video_metadata(filename: str):
    """
    Get video metadata
    """
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        # Get metadata
        metadata = await video_processor._get_video_metadata(file_path)
        
        return {
            "filename": filename,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Failed to get metadata: {e}")
        raise HTTPException(status_code=500, detail="Failed to get metadata")
