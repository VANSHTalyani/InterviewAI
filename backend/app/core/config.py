"""
Application configuration using Pydantic settings
"""
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings
import os
from pathlib import Path


class Settings(BaseSettings):
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://username:password@localhost/video_analysis_db"
    TEST_DATABASE_URL: Optional[str] = None
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Storage Configuration
    STORAGE_TYPE: str = "local"  # Options: local, firebase, supabase
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 500000000  # 500MB
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "video-uploads"
    
    # AI Service API Keys
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    ASSEMBLYAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    DEEPGRAM_API_KEY: Optional[str] = None
    
    # Video Processing Configuration
    FFMPEG_PATH: str = "/usr/bin/ffmpeg"
    FRAME_EXTRACTION_INTERVAL: int = 5  # seconds
    AUDIO_SAMPLE_RATE: int = 16000
    VIDEO_MAX_DURATION: int = 1800  # 30 minutes
    
    # Analysis Configuration
    ENABLE_TRANSCRIPTION: bool = True
    ENABLE_TONE_ANALYSIS: bool = True
    ENABLE_BODY_LANGUAGE: bool = True
    ENABLE_EMOTION_DETECTION: bool = True
    ENABLE_CLARITY_ANALYSIS: bool = True
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    SENTRY_DSN: Optional[str] = None
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080", "http://localhost:3173"]
    
    @field_validator("UPLOAD_DIR")
    @classmethod
    def create_upload_dir(cls, v):
        """Create upload directory if it doesn't exist"""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v
    
    @field_validator("LOG_FILE")
    @classmethod
    def create_log_dir(cls, v):
        """Create log directory if it doesn't exist"""
        Path(v).parent.mkdir(parents=True, exist_ok=True)
        return v
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }


# Global settings instance
settings = Settings()
