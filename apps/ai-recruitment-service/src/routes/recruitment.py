"""API routes for recruitment functionality."""

import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from loguru import logger

from ..models.recruitment import (
    CandidateSearchRequest,
    CandidateSearchResponse,
    MatchResult,
    JobPosting,
    CandidateProfile,
    EmploymentType,
    JobStatus
)
from ..services.ai_matcher import AIRecruiterService
from ..database import db_service


router = APIRouter()


# Dependency to get AI recruiter service
async def get_ai_recruiter() -> AIRecruiterService:
    """Get AI recruiter service instance."""
    from ..main import ai_recruiter
    if not ai_recruiter or not ai_recruiter.is_ready():
        raise HTTPException(status_code=503, detail="AI Recruiter service is not available")
    return ai_recruiter


@router.post("/search-candidates", response_model=CandidateSearchResponse)
async def search_candidates(
    request: CandidateSearchRequest,
    ai_recruiter: AIRecruiterService = Depends(get_ai_recruiter)
) -> CandidateSearchResponse:
    """Search for candidates using AI matching."""
    
    start_time = time.time()
    
    try:
        logger.info(f"Searching candidates for job {request.job_posting_id}")
        
        # Fetch job posting from database
        job_data = await db_service.get_job_posting(request.job_posting_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job posting not found")
            
        job_posting = JobPosting(
            id=job_data["id"],
            company_id=job_data["companyId"],
            recruiter_id=job_data["recruiterId"],
            title=job_data["title"],
            description=job_data["description"],
            employment_type=EmploymentType(job_data["employmentType"]),
            status=JobStatus(job_data["status"]),
            requirements=job_data.get("requirements", {}),
            location=job_data.get("location"),
            salary_range=job_data.get("salaryRange"),
            ai_matching_criteria=job_data.get("aiMatchingCriteria", {}),
            created_at=job_data["createdAt"],
            updated_at=job_data["updatedAt"],
            expires_at=job_data.get("expiresAt")
        )
        
        # Find candidates using AI
        matches = await ai_recruiter.find_candidates(
            job_posting=job_posting,
            max_candidates=request.max_candidates
        )
        
        # Filter by minimum match score
        filtered_matches = [
            match for match in matches 
            if match.ai_match_score >= request.min_match_score
        ]
        
        search_time_ms = int((time.time() - start_time) * 1000)
        
        return CandidateSearchResponse(
            job_posting_id=request.job_posting_id,
            total_candidates=len(filtered_matches),
            matches=filtered_matches,
            search_time_ms=search_time_ms
        )
        
    except Exception as e:
        logger.error(f"Error searching candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/candidates/{candidate_id}/profile", response_model=CandidateProfile)
async def get_candidate_profile(candidate_id: str) -> CandidateProfile:
    """Get detailed candidate profile."""
    
    try:
        # Fetch candidate profile from database
        profile = await db_service.get_candidate_profile(candidate_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")
            
        return profile
        
    except Exception as e:
        logger.error(f"Error fetching candidate profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")


@router.post("/matches/{match_id}/rate")
async def rate_candidate_match(
    match_id: str,
    rating: int = Query(..., ge=1, le=5),
    notes: Optional[str] = None
):
    """Rate a candidate match."""
    
    try:
        # TODO: Update match rating in database
        logger.info(f"Rating match {match_id} with {rating} stars")
        
        return {
            "match_id": match_id,
            "rating": rating,
            "notes": notes,
            "updated_at": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error rating match: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to rate match: {str(e)}")


@router.post("/matches/{match_id}/status")
async def update_match_status(
    match_id: str,
    status: str,
    notes: Optional[str] = None
):
    """Update candidate match status."""
    
    try:
        # TODO: Update match status in database
        logger.info(f"Updating match {match_id} status to {status}")
        
        return {
            "match_id": match_id,
            "status": status,
            "notes": notes,
            "updated_at": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error updating match status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


@router.get("/analytics/match-performance")
async def get_match_performance_analytics(
    recruiter_id: Optional[str] = None,
    job_posting_id: Optional[str] = None,
    days: int = Query(30, ge=1, le=365)
):
    """Get analytics on matching performance."""
    
    try:
        # TODO: Calculate real analytics from database
        mock_analytics = {
            "total_matches": 1247,
            "average_match_score": 76.3,
            "response_rate": 23.5,
            "hire_rate": 8.2,
            "top_skills_in_demand": [
                {"skill": "Python", "demand_score": 95},
                {"skill": "React", "demand_score": 89},
                {"skill": "AWS", "demand_score": 78}
            ],
            "match_score_distribution": {
                "90-100": 8,
                "80-89": 15,
                "70-79": 32,
                "60-69": 45
            }
        }
        
        return mock_analytics
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.post("/job-postings/{job_id}/auto-match")
async def trigger_auto_matching(
    job_id: str,
    ai_recruiter: AIRecruiterService = Depends(get_ai_recruiter)
):
    """Trigger automatic candidate matching for a job posting."""
    
    try:
        # TODO: Fetch job posting from database and trigger background matching
        logger.info(f"Triggering auto-matching for job {job_id}")
        
        # In a real implementation, this would:
        # 1. Fetch the job posting
        # 2. Queue a background task for candidate matching
        # 3. Return immediately with a task ID
        
        return {
            "job_id": job_id,
            "status": "matching_started",
            "estimated_completion": "5-10 minutes",
            "task_id": f"match_{job_id}_{int(time.time())}"
        }
        
    except Exception as e:
        logger.error(f"Error triggering auto-match: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger matching: {str(e)}")


@router.get("/matching-status/{task_id}")
async def get_matching_status(task_id: str):
    """Get the status of a background matching task."""
    
    try:
        # TODO: Check actual task status from background job queue
        mock_status = {
            "task_id": task_id,
            "status": "completed",
            "progress": 100,
            "candidates_found": 23,
            "matches_created": 15,
            "started_at": time.time() - 300,
            "completed_at": time.time() - 30
        }
        
        return mock_status
        
    except Exception as e:
        logger.error(f"Error fetching matching status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch status: {str(e)}")