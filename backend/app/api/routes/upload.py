"""
Video upload API routes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
from typing import Optional

from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    user_id: str = "default_user"
):
    """
    Upload a video file for processing
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Only video files are allowed")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename or 'video.mp4')[1] if file.filename else '.mp4'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save file to local storage with streaming
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        file_size = 0
        
        with open(file_path, "wb") as f:
            while chunk := await file.read(8192):  # Read in 8KB chunks
                file_size += len(chunk)
                if file_size > settings.MAX_FILE_SIZE:
                    # Delete partial file and raise error
                    os.unlink(file_path)
                    raise HTTPException(
                        status_code=400, 
                        detail=f"File size exceeds maximum limit ({settings.MAX_FILE_SIZE} bytes)"
                    )
                f.write(chunk)
        
        logger.info(f"Video uploaded successfully: {unique_filename} ({file_size} bytes)")
        
        return {
            "message": "Video uploaded successfully",
            "filename": unique_filename,
            "file_size": file_size,
            "status": "uploaded",
            "upload_time": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.get("/files")
async def list_uploaded_files():
    """
    List all uploaded files
    """
    try:
        files = os.listdir(settings.UPLOAD_DIR)
        return {
            "files": files,
            "count": len(files)
        }
    except Exception as e:
        logger.error(f"Failed to list files: {e}")
        raise HTTPException(status_code=500, detail="Failed to list files")
