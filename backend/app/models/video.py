"""
Database models for video analysis system
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum as PyEnum

from app.core.database import Base


class VideoStatus(PyEnum):
    """Video processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class AnalysisStatus(PyEnum):
    """Analysis processing status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Video(Base):
    """Video model"""
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    duration = Column(Float, nullable=True)
    mime_type = Column(String, nullable=False)
    status = Column(String, default=VideoStatus.UPLOADED.value)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    analysis_jobs = relationship("AnalysisJob", back_populates="video", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="video", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Video(id={self.id}, filename={self.filename}, status={self.status})>"


class AnalysisJob(Base):
    """Analysis job model"""
    __tablename__ = "analysis_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    job_type = Column(String, nullable=False)  # transcription, tone, emotion, body_language
    status = Column(String, default=AnalysisStatus.PENDING.value)
    
    # Job details
    celery_task_id = Column(String, nullable=True)
    progress = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    
    # Analysis results
    results = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    video = relationship("Video", back_populates="analysis_jobs")
    
    def __repr__(self):
        return f"<AnalysisJob(id={self.id}, type={self.job_type}, status={self.status})>"


class Report(Base):
    """Report model"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id = Column(String, index=True, nullable=False)
    
    # Report content
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    detailed_analysis = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # Scores and metrics
    overall_score = Column(Float, nullable=True)
    tone_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    engagement_score = Column(Float, nullable=True)
    body_language_score = Column(Float, nullable=True)
    
    # File paths
    pdf_path = Column(String, nullable=True)
    json_path = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    video = relationship("Video", back_populates="reports")
    
    def __repr__(self):
        return f"<Report(id={self.id}, title={self.title}, video_id={self.video_id})>"


class TranscriptionSegment(Base):
    """Transcription segment model"""
    __tablename__ = "transcription_segments"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    
    # Segment details
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)
    
    # Analysis results
    sentiment = Column(String, nullable=True)
    emotion = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    filler_words = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<TranscriptionSegment(id={self.id}, start={self.start_time}, end={self.end_time})>"
