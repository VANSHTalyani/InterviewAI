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
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Only video files are allowed")
        
        # Check file size
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size ({file_size} bytes) exceeds maximum limit ({settings.MAX_FILE_SIZE} bytes)"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save file to local storage
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Video uploaded successfully: {unique_filename}")
        
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
