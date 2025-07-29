"""
Pydantic schemas for API request/response models
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


class VideoStatusEnum(str, Enum):
    """Video processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class AnalysisStatusEnum(str, Enum):
    """Analysis processing status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class JobTypeEnum(str, Enum):
    """Analysis job types"""
    TRANSCRIPTION = "transcription"
    TONE = "tone"
    EMOTION = "emotion"
    BODY_LANGUAGE = "body_language"
    CLARITY = "clarity"


# Base schemas
class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Video schemas
class VideoBase(BaseSchema):
    """Base video schema"""
    user_id: str = Field(..., description="User ID who uploaded the video")
    original_filename: str = Field(..., description="Original filename")


class VideoCreate(VideoBase):
    """Schema for creating a video"""
    pass


class VideoResponse(VideoBase):
    """Schema for video response"""
    id: int
    filename: str
    file_size: int
    duration: Optional[float] = None
    mime_type: str
    status: VideoStatusEnum
    created_at: datetime
    updated_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None


class VideoUpdate(BaseSchema):
    """Schema for updating a video"""
    status: Optional[VideoStatusEnum] = None
    duration: Optional[float] = None


# Analysis job schemas
class AnalysisJobBase(BaseSchema):
    """Base analysis job schema"""
    job_type: JobTypeEnum
    video_id: int


class AnalysisJobCreate(AnalysisJobBase):
    """Schema for creating an analysis job"""
    pass


class AnalysisJobResponse(AnalysisJobBase):
    """Schema for analysis job response"""
    id: int
    status: AnalysisStatusEnum
    progress: float = 0.0
    error_message: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AnalysisJobUpdate(BaseSchema):
    """Schema for updating an analysis job"""
    status: Optional[AnalysisStatusEnum] = None
    progress: Optional[float] = None
    error_message: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None


# Report schemas
class ReportBase(BaseSchema):
    """Base report schema"""
    video_id: int
    user_id: str
    title: str
    summary: Optional[str] = None


class ReportCreate(ReportBase):
    """Schema for creating a report"""
    detailed_analysis: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None


class ReportResponse(ReportBase):
    """Schema for report response"""
    id: int
    detailed_analysis: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    overall_score: Optional[float] = None
    tone_score: Optional[float] = None
    clarity_score: Optional[float] = None
    engagement_score: Optional[float] = None
    body_language_score: Optional[float] = None
    pdf_path: Optional[str] = None
    json_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Transcription schemas
class TranscriptionSegmentBase(BaseSchema):
    """Base transcription segment schema"""
    video_id: int
    start_time: float
    end_time: float
    text: str
    confidence: Optional[float] = None


class TranscriptionSegmentCreate(TranscriptionSegmentBase):
    """Schema for creating a transcription segment"""
    pass


class TranscriptionSegmentResponse(TranscriptionSegmentBase):
    """Schema for transcription segment response"""
    id: int
    sentiment: Optional[str] = None
    emotion: Optional[str] = None
    tone: Optional[str] = None
    filler_words: Optional[Dict[str, Any]] = None
    created_at: datetime


# Upload schemas
class UploadResponse(BaseSchema):
    """Schema for upload response"""
    message: str
    video_id: int
    filename: str
    file_size: int
    status: str
    upload_time: datetime


# Analysis request schemas
class AnalysisRequest(BaseSchema):
    """Schema for analysis request"""
    video_id: int
    job_types: List[JobTypeEnum] = Field(
        default=[JobTypeEnum.TRANSCRIPTION, JobTypeEnum.TONE, JobTypeEnum.EMOTION, JobTypeEnum.BODY_LANGUAGE],
        description="List of analysis types to perform"
    )


class AnalysisResponse(BaseSchema):
    """Schema for analysis response"""
    message: str
    video_id: int
    job_ids: List[int]
    estimated_time: Optional[int] = None  # in seconds


# Status schemas
class JobStatus(BaseSchema):
    """Schema for job status"""
    job_id: int
    status: AnalysisStatusEnum
    progress: float
    error_message: Optional[str] = None
    estimated_remaining_time: Optional[int] = None  # in seconds


class VideoStatusResponse(BaseSchema):
    """Schema for video status response"""
    video_id: int
    status: VideoStatusEnum
    jobs: List[JobStatus]
    overall_progress: float


# Error schemas
class ErrorResponse(BaseSchema):
    """Schema for error responses"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None


# Health check schemas
class HealthResponse(BaseSchema):
    """Schema for health check response"""
    status: str
    timestamp: datetime
    version: str
    database: str
    redis: str
    storage: str
    services: Dict[str, str]


# Validation schemas
class FileValidation(BaseSchema):
    """Schema for file validation"""
    is_valid: bool
    file_type: str
    duration: Optional[float] = None
    size: int
    errors: List[str] = []
    warnings: List[str] = []


# Batch processing schemas
class BatchAnalysisRequest(BaseSchema):
    """Schema for batch analysis request"""
    video_ids: List[int]
    job_types: List[JobTypeEnum]
    priority: Optional[int] = Field(default=0, ge=0, le=10)


class BatchAnalysisResponse(BaseSchema):
    """Schema for batch analysis response"""
    batch_id: str
    total_videos: int
    jobs_created: int
    estimated_time: Optional[int] = None
