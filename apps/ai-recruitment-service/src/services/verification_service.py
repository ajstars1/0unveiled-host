"""Verification service for badges and achievements."""

import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger

from ..config import settings
from ..models.verification import VerificationRequest, VerificationStatus, VerificationType, Badge


class VerificationService:
    """Service for handling verification requests and badge awards."""
    
    def __init__(self):
        self.verification_rules = self._initialize_verification_rules()
    
    def _initialize_verification_rules(self) -> Dict[str, Dict]:
        """Initialize verification rules for different badge types."""
        return {
            "CODE_QUALITY": {
                "auto_approval_threshold": 85.0,
                "criteria": {
                    "min_cruism_score": 80.0,
                    "min_repositories": 3,
                    "min_maintainability": 70.0,
                    "max_complexity": 15.0
                },
                "evidence_required": ["repository_analysis", "code_metrics"]
            },
            "SECURITY_EXPERT": {
                "auto_approval_threshold": None,  # Always requires manual review
                "criteria": {
                    "min_security_score": 85.0,
                    "security_contributions": True,
                    "vulnerability_findings": True
                },
                "evidence_required": ["security_analysis", "contributions", "certifications"]
            },
            "AI_SPECIALIST": {
                "auto_approval_threshold": None,
                "criteria": {
                    "ai_ml_projects": True,
                    "research_contributions": True,
                    "model_deployment": True
                },
                "evidence_required": ["ai_projects", "publications", "deployed_models"]
            },
            "HIGH_PERFORMER": {
                "auto_approval_threshold": 90.0,
                "criteria": {
                    "leaderboard_rank": 100,  # Top 100
                    "min_cruism_score": 85.0,
                    "community_engagement": True
                },
                "evidence_required": ["leaderboard_position", "portfolio_analysis"]
            },
            "COMMUNITY_LEADER": {
                "auto_approval_threshold": None,
                "criteria": {
                    "open_source_contributions": True,
                    "mentoring_activity": True,
                    "community_involvement": True
                },
                "evidence_required": ["contributions", "mentoring_proof", "community_activity"]
            },
            "OPEN_SOURCE_CONTRIBUTOR": {
                "auto_approval_threshold": 80.0,
                "criteria": {
                    "min_contributions": 50,
                    "active_maintenance": True,
                    "code_quality": 75.0
                },
                "evidence_required": ["github_contributions", "maintained_projects"]
            }
        }
    
    async def submit_verification_request(
        self, 
        user_id: str, 
        verification_type: VerificationType, 
        evidence: Dict[str, Any]
    ) -> VerificationRequest:
        """Submit a verification request."""
        
        logger.info(f"Processing verification request for user {user_id}, type: {verification_type}")
        
        # Validate evidence
        is_valid = await self._validate_evidence(verification_type, evidence)
        if not is_valid:
            raise ValueError("Insufficient or invalid evidence provided")
        
        # Create verification request
        request = VerificationRequest(
            user_id=user_id,
            verification_type=verification_type,
            evidence=evidence,
            status=VerificationStatus.PENDING
        )
        
        # TODO: Save to database
        # await self.db.verification_requests.create(request)
        
        # Run automated verification
        await self._run_automated_verification(request)
        
        return request
    
    async def _validate_evidence(self, verification_type: VerificationType, evidence: Dict[str, Any]) -> bool:
        """Validate that provided evidence meets requirements."""
        
        rules = self.verification_rules.get(verification_type.value, {})
        required_evidence = rules.get("evidence_required", [])
        
        # Check that all required evidence types are provided
        for evidence_type in required_evidence:
            if evidence_type not in evidence:
                logger.warning(f"Missing required evidence: {evidence_type}")
                return False
        
        # Type-specific validation
        if verification_type == VerificationType.CODE_QUALITY:
            return await self._validate_code_quality_evidence(evidence)
        elif verification_type == VerificationType.HIGH_PERFORMER:
            return await self._validate_high_performer_evidence(evidence)
        elif verification_type == VerificationType.OPEN_SOURCE_CONTRIBUTOR:
            return await self._validate_open_source_evidence(evidence)
        
        return True
    
    async def _validate_code_quality_evidence(self, evidence: Dict[str, Any]) -> bool:
        """Validate code quality verification evidence."""
        
        repo_analysis = evidence.get("repository_analysis", {})
        code_metrics = evidence.get("code_metrics", {})
        
        # Check minimum requirements
        if not repo_analysis or not code_metrics:
            return False
        
        # Validate repository count
        repositories = repo_analysis.get("repositories", [])
        if len(repositories) < 3:
            logger.warning("Code quality verification requires at least 3 repositories")
            return False
        
        # Validate code metrics
        avg_cruism_score = code_metrics.get("average_cruism_score", 0)
        if avg_cruism_score < 70:
            logger.warning("Code quality verification requires CRUISM score >= 70")
            return False
        
        return True
    
    async def _validate_high_performer_evidence(self, evidence: Dict[str, Any]) -> bool:
        """Validate high performer verification evidence."""
        
        leaderboard = evidence.get("leaderboard_position", {})
        portfolio = evidence.get("portfolio_analysis", {})
        
        # Check leaderboard position
        rank = leaderboard.get("general_rank")
        if not rank or rank > 100:
            logger.warning("High performer verification requires top 100 ranking")
            return False
        
        # Check portfolio quality
        cruism_score = portfolio.get("average_cruism_score", 0)
        if cruism_score < 80:
            logger.warning("High performer verification requires CRUISM score >= 80")
            return False
        
        return True
    
    async def _validate_open_source_evidence(self, evidence: Dict[str, Any]) -> bool:
        """Validate open source contributor evidence."""
        
        contributions = evidence.get("github_contributions", {})
        projects = evidence.get("maintained_projects", [])
        
        # Check contribution count
        total_contributions = contributions.get("total_contributions", 0)
        if total_contributions < 50:
            logger.warning("Open source verification requires 50+ contributions")
            return False
        
        # Check for maintained projects
        active_projects = [p for p in projects if p.get("is_active", False)]
        if len(active_projects) < 1:
            logger.warning("Open source verification requires at least 1 active maintained project")
            return False
        
        return True
    
    async def _run_automated_verification(self, request: VerificationRequest):
        """Run automated verification checks."""
        
        verification_type = request.verification_type
        rules = self.verification_rules.get(verification_type.value, {})
        
        # Check if auto-approval is possible
        auto_threshold = rules.get("auto_approval_threshold")
        if auto_threshold is None:
            # Requires manual review
            logger.info(f"Verification {request.id} requires manual review")
            await self._notify_human_reviewers(request)
            return
        
        # Calculate verification score
        score = await self._calculate_verification_score(request)
        
        if score >= auto_threshold:
            logger.info(f"Auto-approving verification {request.id} (score: {score})")
            await self._approve_verification(request, "automated_system")
        elif score >= settings.manual_review_threshold:
            logger.info(f"Verification {request.id} requires manual review (score: {score})")
            await self._notify_human_reviewers(request)
        else:
            logger.info(f"Auto-rejecting verification {request.id} (score: {score})")
            await self._reject_verification(request, "automated_system", "Does not meet minimum criteria")
    
    async def _calculate_verification_score(self, request: VerificationRequest) -> float:
        """Calculate verification score based on evidence and criteria."""
        
        verification_type = request.verification_type
        evidence = request.evidence
        
        if verification_type == VerificationType.CODE_QUALITY:
            return await self._score_code_quality(evidence)
        elif verification_type == VerificationType.HIGH_PERFORMER:
            return await self._score_high_performer(evidence)
        elif verification_type == VerificationType.OPEN_SOURCE_CONTRIBUTOR:
            return await self._score_open_source(evidence)
        
        return 50.0  # Default neutral score
    
    async def _score_code_quality(self, evidence: Dict[str, Any]) -> float:
        """Score code quality verification."""
        
        code_metrics = evidence.get("code_metrics", {})
        repo_analysis = evidence.get("repository_analysis", {})
        
        score = 0.0
        
        # CRUISM score component (40 points)
        cruism_score = code_metrics.get("average_cruism_score", 0)
        score += min(40, cruism_score * 0.4)
        
        # Repository quality (30 points)
        repositories = repo_analysis.get("repositories", [])
        quality_repos = [r for r in repositories if r.get("quality_score", 0) > 70]
        repo_score = min(30, len(quality_repos) * 7.5)
        score += repo_score
        
        # Code metrics (30 points)
        maintainability = code_metrics.get("average_maintainability", 0)
        complexity = code_metrics.get("average_complexity", 20)  # Lower is better
        
        metrics_score = (maintainability * 0.2) + max(0, (20 - complexity) * 1.5)
        score += min(30, metrics_score)
        
        return score
    
    async def _score_high_performer(self, evidence: Dict[str, Any]) -> float:
        """Score high performer verification."""
        
        leaderboard = evidence.get("leaderboard_position", {})
        portfolio = evidence.get("portfolio_analysis", {})
        
        score = 0.0
        
        # Leaderboard ranking (50 points)
        rank = leaderboard.get("general_rank", 1000)
        if rank <= 10:
            score += 50
        elif rank <= 25:
            score += 45
        elif rank <= 50:
            score += 40
        elif rank <= 100:
            score += 35
        else:
            score += max(0, 30 - (rank - 100) * 0.1)
        
        # Portfolio quality (50 points)
        cruism_score = portfolio.get("average_cruism_score", 0)
        project_count = portfolio.get("quality_projects", 0)
        
        score += min(40, cruism_score * 0.4)
        score += min(10, project_count * 2)
        
        return score
    
    async def _score_open_source(self, evidence: Dict[str, Any]) -> float:
        """Score open source contributor verification."""
        
        contributions = evidence.get("github_contributions", {})
        projects = evidence.get("maintained_projects", [])
        
        score = 0.0
        
        # Contribution quantity (40 points)
        total_contributions = contributions.get("total_contributions", 0)
        score += min(40, total_contributions * 0.4)
        
        # Project maintenance (35 points)
        active_projects = [p for p in projects if p.get("is_active", False)]
        stars = sum(p.get("stars", 0) for p in active_projects)
        
        score += min(25, len(active_projects) * 8)
        score += min(10, stars * 0.1)
        
        # Contribution quality (25 points)
        recent_activity = contributions.get("recent_activity_months", 0)
        score += min(15, recent_activity * 1.5)
        
        pr_acceptance_rate = contributions.get("pr_acceptance_rate", 0)
        score += min(10, pr_acceptance_rate * 10)
        
        return score
    
    async def _approve_verification(self, request: VerificationRequest, reviewer: str):
        """Approve a verification request and award badge."""
        
        request.status = VerificationStatus.APPROVED
        request.reviewer_id = reviewer
        
        # TODO: Update database
        # await self.db.verification_requests.update(request)
        
        # Award badge
        await self._award_badge(request.user_id, request.verification_type, request.id)
        
        logger.info(f"Verification {request.id} approved by {reviewer}")
    
    async def _reject_verification(self, request: VerificationRequest, reviewer: str, reason: str):
        """Reject a verification request."""
        
        request.status = VerificationStatus.REJECTED
        request.reviewer_id = reviewer
        request.review_notes = reason
        
        # TODO: Update database
        # await self.db.verification_requests.update(request)
        
        logger.info(f"Verification {request.id} rejected by {reviewer}: {reason}")
    
    async def _award_badge(self, user_id: str, verification_type: VerificationType, verification_request_id: str):
        """Award a badge for successful verification."""
        
        # Map verification types to badge IDs
        badge_mapping = {
            VerificationType.CODE_QUALITY: "code_quality_verified",
            VerificationType.SECURITY_EXPERT: "security_expert",
            VerificationType.AI_SPECIALIST: "ai_specialist",
            VerificationType.HIGH_PERFORMER: "high_performer",
            VerificationType.COMMUNITY_LEADER: "community_leader",
            VerificationType.OPEN_SOURCE_CONTRIBUTOR: "open_source_contributor",
        }
        
        badge_id = badge_mapping.get(verification_type)
        if not badge_id:
            logger.warning(f"No badge mapping for verification type: {verification_type}")
            return
        
        # TODO: Create user badge record in database
        # user_badge = {
        #     "user_id": user_id,
        #     "badge_id": badge_id,
        #     "verification_request_id": verification_request_id,
        #     "awarded_at": datetime.now(),
        #     "is_featured": True
        # }
        # await self.db.user_badges.create(user_badge)
        
        logger.info(f"Badge {badge_id} awarded to user {user_id}")
    
    async def _notify_human_reviewers(self, request: VerificationRequest):
        """Notify human reviewers about verification requests needing manual review."""
        
        # TODO: Implement notification system
        # - Send email to admin reviewers
        # - Create admin dashboard notification
        # - Log for review queue
        
        logger.info(f"Human review required for verification {request.id}")
    
    async def get_verification_status(self, request_id: str) -> Optional[VerificationRequest]:
        """Get the status of a verification request."""
        
        # TODO: Fetch from database
        # return await self.db.verification_requests.get(request_id)
        
        return None
    
    async def list_user_verifications(self, user_id: str) -> List[VerificationRequest]:
        """List all verification requests for a user."""
        
        # TODO: Fetch from database
        # return await self.db.verification_requests.filter(user_id=user_id)
        
        return []