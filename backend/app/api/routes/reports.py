"""
Reports API routes for generating and retrieving analysis reports
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import ReportResponse, ReportCreate
from app.services.report_service import report_service
from app.services.video_processor import video_processor
from app.core.logging import logger

router = APIRouter()


@router.get("/report/{video_id}", response_model=ReportResponse)
async def get_report(video_id: int, db: Session = Depends(get_db)):
    """
    Get the analysis report for a video
    """
    try:
        # Verify video exists
        video = await video_processor.get_video_by_id(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Get or generate report
        report = await report_service.get_report_by_video_id(db, video_id)
        if not report:
            # Generate report if it doesn't exist
            report = await report_service.generate_report(db, video_id)
            if not report:
                raise HTTPException(status_code=404, detail="Report not available yet")
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Report retrieval failed")


@router.get("/report/{video_id}/download/pdf")
async def download_report_pdf(video_id: int, db: Session = Depends(get_db)):
    """
    Download the PDF report for a video
    """
    try:
        # Get or generate report
        report = await report_service.get_report_by_video_id(db, video_id)
        if not report:
            report = await report_service.generate_report(db, video_id)
            if not report:
                raise HTTPException(status_code=404, detail="Report not available")
        
        # Check if report has files
        pdf_path = getattr(report, 'files', {}).get('pdf', '')
        if not pdf_path:
            raise HTTPException(status_code=404, detail="PDF report not found")
        
        # Read and return PDF file
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        with open(pdf_path, "rb") as pdf_file:
            pdf_content = pdf_file.read()
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=interview_analysis_report_{video_id}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF report download failed: {e}")
        raise HTTPException(status_code=500, detail="PDF report download failed")


@router.get("/report/{video_id}/download/json")
async def download_report_json(video_id: int, db: Session = Depends(get_db)):
    """
    Download the JSON report for a video
    """
    try:
        # Get or generate report
        report = await report_service.get_report_by_video_id(db, video_id)
        if not report:
            report = await report_service.generate_report(db, video_id)
            if not report:
                raise HTTPException(status_code=404, detail="Report not available")
        
        # Check if report has files
        json_path = getattr(report, 'files', {}).get('json', '')
        if not json_path:
            raise HTTPException(status_code=404, detail="JSON report not found")
        
        # Read and return JSON file
        if not os.path.exists(json_path):
            raise HTTPException(status_code=404, detail="JSON file not found")
        
        with open(json_path, "r") as json_file:
            json_content = json_file.read()
        
        return Response(
            content=json_content,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=interview_analysis_report_{video_id}.json"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JSON report download failed: {e}")
        raise HTTPException(status_code=500, detail="JSON report download failed")


@router.post("/report/{video_id}/generate")
async def generate_report(video_id: int, db: Session = Depends(get_db)):
    """
    Force regenerate the analysis report for a video
    """
    try:
        # Verify video exists
        video = await video_processor.get_video_by_id(db, video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Generate new report
        report = await report_service.generate_report(db, video_id, force=True)
        if not report:
            raise HTTPException(status_code=400, detail="Cannot generate report - analysis may not be complete")
        
        return {"message": "Report generated successfully", "report_id": report.id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail="Report generation failed")


@router.get("/user/{user_id}/reports", response_model=List[ReportResponse])
async def get_user_reports(user_id: str, db: Session = Depends(get_db)):
    """
    Get all reports for a specific user
    """
    try:
        reports = await report_service.get_reports_by_user_id(db, user_id)
        return reports
        
    except Exception as e:
        logger.error(f"User reports retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="User reports retrieval failed")


@router.delete("/report/{report_id}")
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific report
    """
    try:
        result = await report_service.delete_report(db, report_id)
        if not result:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {"message": "Report deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Report deletion failed")


@router.get("/report/{video_id}/summary")
async def get_report_summary(video_id: int, db: Session = Depends(get_db)):
    """
    Get a summary of the analysis results
    """
    try:
        summary = await report_service.get_analysis_summary(db, video_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Analysis summary not available")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report summary retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Report summary retrieval failed")
