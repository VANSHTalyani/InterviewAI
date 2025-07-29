"""
Health check API routes
"""
from fastapi import APIRouter
from datetime import datetime

from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


@router.get("/")
async def health_check():
    """
    Health check endpoint to verify all services are running
    """
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow(),
            "version": "1.0.0",
            "message": "Video Analysis Backend is running"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow(),
            "error": str(e)
        }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint for Kubernetes/container orchestration
    """
    return {"status": "ready", "timestamp": datetime.utcnow()}


@router.get("/live")
async def liveness_check():
    """
    Liveness check endpoint for Kubernetes/container orchestration
    """
    return {"status": "alive", "timestamp": datetime.utcnow()}
