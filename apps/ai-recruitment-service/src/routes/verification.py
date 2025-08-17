"""API routes for verification and badge system."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from loguru import logger

from ..models.verification import (
    VerificationSubmissionRequest,
    VerificationSubmissionResponse,
    VerificationRequest,
    VerificationStatus,
    VerificationType,
    Badge,
    UserBadge,
    BadgeListResponse,
    VerificationEvidenceRequirements,
    AutomatedVerificationResult
)
from ..services.verification_service import VerificationService


router = APIRouter()


# Dependency to get verification service
async def get_verification_service() -> VerificationService:
    """Get verification service instance."""
    from ..main import verification_service
    if not verification_service:
        raise HTTPException(status_code=503, detail="Verification service is not available")
    return verification_service


@router.post("/submit", response_model=VerificationSubmissionResponse)
async def submit_verification(
    user_id: str,
    request: VerificationSubmissionRequest,
    verification_service: VerificationService = Depends(get_verification_service)
) -> VerificationSubmissionResponse:
    """Submit a verification request."""
    
    try:
        logger.info(f"Submitting verification request for user {user_id}, type: {request.verification_type}")
        
        # Submit verification request
        verification_request = await verification_service.submit_verification_request(
            user_id=user_id,
            verification_type=request.verification_type,
            evidence=request.evidence
        )
        
        # Determine estimated review time
        estimated_time = "24-48 hours"
        if request.verification_type in [VerificationType.SECURITY_EXPERT, VerificationType.AI_SPECIALIST]:
            estimated_time = "3-5 business days"
        
        # Provide next steps
        next_steps = [
            "Your verification request has been submitted successfully",
            "Our automated systems will review your evidence first",
            "You'll receive an email notification when the review is complete"
        ]
        
        if verification_request.status == VerificationStatus.APPROVED:
            next_steps = [
                "Congratulations! Your verification was automatically approved",
                "Your badge has been added to your profile",
                "You can now showcase your verified skills"
            ]
            estimated_time = "Completed"
        
        return VerificationSubmissionResponse(
            request_id=verification_request.id,
            status=verification_request.status,
            estimated_review_time=estimated_time,
            next_steps=next_steps
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting verification: {e}")
        raise HTTPException(status_code=500, detail=f"Verification submission failed: {str(e)}")


@router.get("/status/{request_id}", response_model=VerificationRequest)
async def get_verification_status(
    request_id: str,
    verification_service: VerificationService = Depends(get_verification_service)
) -> VerificationRequest:
    """Get the status of a verification request."""
    
    try:
        verification_request = await verification_service.get_verification_status(request_id)
        
        if not verification_request:
            raise HTTPException(status_code=404, detail="Verification request not found")
        
        return verification_request
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching verification status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch status: {str(e)}")


@router.get("/user/{user_id}/requests", response_model=List[VerificationRequest])
async def list_user_verifications(
    user_id: str,
    status: Optional[VerificationStatus] = None,
    verification_service: VerificationService = Depends(get_verification_service)
) -> List[VerificationRequest]:
    """List all verification requests for a user."""
    
    try:
        requests = await verification_service.list_user_verifications(user_id)
        
        if status:
            requests = [req for req in requests if req.status == status]
        
        return requests
        
    except Exception as e:
        logger.error(f"Error listing user verifications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list verifications: {str(e)}")


@router.get("/badges/user/{user_id}", response_model=BadgeListResponse)
async def get_user_badges(user_id: str) -> BadgeListResponse:
    """Get all badges for a user."""
    
    try:
        # TODO: Fetch from database
        # For now, return mock data
        
        mock_earned_badges = [
            UserBadge(
                id="ub1",
                user_id=user_id,
                badge_id="code_quality_verified",
                awarded_at="2024-01-15T10:00:00Z",
                is_featured=True
            ),
            UserBadge(
                id="ub2",
                user_id=user_id,
                badge_id="high_performer",
                awarded_at="2024-01-20T15:30:00Z",
                is_featured=True
            )
        ]
        
        mock_available_badges = [
            Badge(
                id="security_expert",
                name="Security Expert",
                description="Verified expertise in application security",
                category="SECURITY",
                rarity="RARE",
                points_value=500,
                criteria={
                    "min_security_score": 85,
                    "security_contributions": True,
                    "vulnerability_findings": True
                }
            ),
            Badge(
                id="ai_specialist",
                name="AI/ML Specialist",
                description="Verified expertise in artificial intelligence and machine learning",
                category="TECHNICAL",
                rarity="EPIC",
                points_value=750,
                criteria={
                    "ai_ml_projects": True,
                    "research_contributions": True,
                    "model_deployment": True
                }
            )
        ]
        
        verification_opportunities = [
            {
                "verification_type": "OPEN_SOURCE_CONTRIBUTOR",
                "badge_name": "Open Source Contributor",
                "difficulty": "Medium",
                "estimated_time": "2-3 days",
                "requirements_met": 80
            },
            {
                "verification_type": "SECURITY_EXPERT",
                "badge_name": "Security Expert",
                "difficulty": "Hard",
                "estimated_time": "1-2 weeks",
                "requirements_met": 45
            }
        ]
        
        return BadgeListResponse(
            total_badges=len(mock_available_badges) + len(mock_earned_badges),
            earned_badges=len(mock_earned_badges),
            featured_badges=[badge for badge in mock_earned_badges if badge.is_featured],
            available_badges=mock_available_badges,
            verification_opportunities=verification_opportunities
        )
        
    except Exception as e:
        logger.error(f"Error fetching user badges: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch badges: {str(e)}")


@router.get("/requirements/{verification_type}", response_model=VerificationEvidenceRequirements)
async def get_verification_requirements(
    verification_type: VerificationType,
    verification_service: VerificationService = Depends(get_verification_service)
) -> VerificationEvidenceRequirements:
    """Get evidence requirements for a verification type."""
    
    try:
        # Get requirements from verification service
        rules = verification_service.verification_rules.get(verification_type.value, {})
        
        requirements_map = {
            VerificationType.CODE_QUALITY: VerificationEvidenceRequirements(
                verification_type=verification_type,
                required_evidence=["repository_analysis", "code_metrics"],
                optional_evidence=["peer_reviews", "certifications"],
                criteria={
                    "min_cruism_score": 80.0,
                    "min_repositories": 3,
                    "min_maintainability": 70.0,
                    "max_complexity": 15.0
                },
                examples=[
                    {
                        "title": "Portfolio Analysis",
                        "description": "Showcase your best 3-5 repositories with high code quality",
                        "evidence_type": "repository_analysis"
                    },
                    {
                        "title": "Code Metrics",
                        "description": "Demonstrate consistent high-quality code across projects",
                        "evidence_type": "code_metrics"
                    }
                ]
            ),
            VerificationType.HIGH_PERFORMER: VerificationEvidenceRequirements(
                verification_type=verification_type,
                required_evidence=["leaderboard_position", "portfolio_analysis"],
                optional_evidence=["recommendations", "achievements"],
                criteria={
                    "leaderboard_rank": 100,
                    "min_cruism_score": 85.0,
                    "community_engagement": True
                },
                examples=[
                    {
                        "title": "Top 100 Ranking",
                        "description": "Must be ranked in the top 100 on the general leaderboard",
                        "evidence_type": "leaderboard_position"
                    }
                ]
            ),
            VerificationType.OPEN_SOURCE_CONTRIBUTOR: VerificationEvidenceRequirements(
                verification_type=verification_type,
                required_evidence=["github_contributions", "maintained_projects"],
                optional_evidence=["community_involvement", "mentoring"],
                criteria={
                    "min_contributions": 50,
                    "active_maintenance": True,
                    "code_quality": 75.0
                },
                examples=[
                    {
                        "title": "GitHub Contributions",
                        "description": "Minimum 50 contributions across various repositories",
                        "evidence_type": "github_contributions"
                    },
                    {
                        "title": "Project Maintenance",
                        "description": "Actively maintain at least one open source project",
                        "evidence_type": "maintained_projects"
                    }
                ]
            )
        }
        
        return requirements_map.get(verification_type, VerificationEvidenceRequirements(
            verification_type=verification_type,
            required_evidence=rules.get("evidence_required", []),
            optional_evidence=[],
            criteria=rules.get("criteria", {})
        ))
        
    except Exception as e:
        logger.error(f"Error fetching verification requirements: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch requirements: {str(e)}")


@router.post("/dry-run/{verification_type}", response_model=AutomatedVerificationResult)
async def dry_run_verification(
    verification_type: VerificationType,
    user_id: str,
    evidence: dict,
    verification_service: VerificationService = Depends(get_verification_service)
) -> AutomatedVerificationResult:
    """Perform a dry run of verification to show what the result would be."""
    
    try:
        # Create a temporary verification request for scoring
        temp_request = VerificationRequest(
            user_id=user_id,
            verification_type=verification_type,
            evidence=evidence
        )
        
        # Calculate score
        score = await verification_service._calculate_verification_score(temp_request)
        
        # Check criteria
        rules = verification_service.verification_rules.get(verification_type.value, {})
        criteria = rules.get("criteria", {})
        auto_threshold = rules.get("auto_approval_threshold")
        
        criteria_met = {}
        recommendations = []
        next_steps = []
        
        # Evaluate specific criteria based on verification type
        if verification_type == VerificationType.CODE_QUALITY:
            code_metrics = evidence.get("code_metrics", {})
            repo_analysis = evidence.get("repository_analysis", {})
            
            cruism_score = code_metrics.get("average_cruism_score", 0)
            criteria_met["min_cruism_score"] = cruism_score >= criteria.get("min_cruism_score", 80)
            
            repo_count = len(repo_analysis.get("repositories", []))
            criteria_met["min_repositories"] = repo_count >= criteria.get("min_repositories", 3)
            
            if not criteria_met["min_cruism_score"]:
                recommendations.append(f"Improve code quality to reach {criteria.get('min_cruism_score', 80)}+ CRUISM score")
            
            if not criteria_met["min_repositories"]:
                recommendations.append(f"Showcase at least {criteria.get('min_repositories', 3)} high-quality repositories")
        
        # Determine if verification would pass
        passed = score >= (auto_threshold or 70)
        
        if passed:
            next_steps.append("Your verification would be automatically approved!")
            next_steps.append("Submit your verification request to receive your badge")
        else:
            next_steps.append("Continue improving your profile to meet verification criteria")
            if recommendations:
                next_steps.extend(recommendations)
        
        return AutomatedVerificationResult(
            score=score,
            passed=passed,
            criteria_met=criteria_met,
            recommendations=recommendations,
            next_steps=next_steps
        )
        
    except Exception as e:
        logger.error(f"Error performing dry run verification: {e}")
        raise HTTPException(status_code=500, detail=f"Dry run failed: {str(e)}")


@router.get("/badges/featured", response_model=List[UserBadge])
async def get_featured_badges(limit: int = Query(10, ge=1, le=50)) -> List[UserBadge]:
    """Get recently awarded featured badges across the platform."""
    
    try:
        # TODO: Fetch from database
        # For now, return mock data
        
        mock_featured = [
            UserBadge(
                id="fb1",
                user_id="user123",
                badge_id="security_expert",
                awarded_at="2024-01-25T14:30:00Z",
                is_featured=True
            ),
            UserBadge(
                id="fb2",
                user_id="user456",
                badge_id="ai_specialist",
                awarded_at="2024-01-24T09:15:00Z",
                is_featured=True
            )
        ]
        
        return mock_featured[:limit]
        
    except Exception as e:
        logger.error(f"Error fetching featured badges: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch featured badges: {str(e)}")