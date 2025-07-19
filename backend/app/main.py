"""
Main FastAPI application with middleware and routes
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.core.config import settings
from app.core.logging import logger
from app.api.routes import health, upload, process, comprehensive_analysis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting up Video Analysis Backend...")
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Video Analysis Backend...")
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Video Analysis Backend",
    description="AI-driven video analysis system for transcription, tone, emotion, and body language feedback",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=False,  # Set to False when allowing all origins
    allow_methods=["*"],
    allow_headers=["*"],
)



# Add timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include API routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(process.router, prefix="/api/v1", tags=["process"])
app.include_router(comprehensive_analysis.router, prefix="/api/v1/comprehensive", tags=["comprehensive-analysis"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Video Analysis Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs" if settings.DEBUG else None
    }
