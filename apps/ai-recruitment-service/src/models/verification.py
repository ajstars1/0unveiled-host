"""Data models for verification and badge system."""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class VerificationType(str, Enum):
    CODE_QUALITY = "CODE_QUALITY"
    SECURITY_EXPERT = "SECURITY_EXPERT"
    AI_SPECIALIST = "AI_SPECIALIST"
    HIGH_PERFORMER = "HIGH_PERFORMER"
    COMMUNITY_LEADER = "COMMUNITY_LEADER"
    OPEN_SOURCE_CONTRIBUTOR = "OPEN_SOURCE_CONTRIBUTOR"
    TECHNICAL_WRITER = "TECHNICAL_WRITER"
    MENTOR = "MENTOR"


class BadgeRarity(str, Enum):
    COMMON = "COMMON"
    RARE = "RARE"
    EPIC = "EPIC"
    LEGENDARY = "LEGENDARY"


class BadgeCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    QUALITY = "QUALITY"
    SECURITY = "SECURITY"
    LEADERSHIP = "LEADERSHIP"
    COMMUNITY = "COMMUNITY"
    ACHIEVEMENT = "ACHIEVEMENT"


class Badge(BaseModel):
    """Badge model."""
    id: str
    name: str
    description: str
    icon_url: Optional[str] = None
    criteria: Dict[str, Any] = Field(default_factory=dict)
    category: BadgeCategory
    rarity: BadgeRarity
    points_value: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class UserBadge(BaseModel):
    """User badge model."""
    id: str
    user_id: str
    badge_id: str
    verification_request_id: Optional[str] = None
    awarded_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    is_featured: bool = False
    evidence_url: Optional[str] = None


class VerificationRequest(BaseModel):
    """Verification request model."""
    id: str = Field(default_factory=lambda: f"vr_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    user_id: str
    verification_type: VerificationType
    status: VerificationStatus = VerificationStatus.PENDING
    evidence: Dict[str, Any] = Field(default_factory=dict)
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    submitted_at: datetime = Field(default_factory=datetime.now)
    reviewed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class Achievement(BaseModel):
    """Achievement model."""
    id: str
    user_id: str
    achievement_type: str
    achievement_data: Dict[str, Any] = Field(default_factory=dict)
    points_awarded: int = 0
    earned_at: datetime = Field(default_factory=datetime.now)


class VerificationSubmissionRequest(BaseModel):
    """Request model for verification submission."""
    verification_type: VerificationType
    evidence: Dict[str, Any]
    additional_notes: Optional[str] = None


class VerificationSubmissionResponse(BaseModel):
    """Response model for verification submission."""
    request_id: str
    status: VerificationStatus
    estimated_review_time: Optional[str] = None
    next_steps: List[str] = Field(default_factory=list)


class BadgeListResponse(BaseModel):
    """Response model for badge listing."""
    total_badges: int
    earned_badges: int
    featured_badges: List[UserBadge]
    available_badges: List[Badge]
    verification_opportunities: List[Dict[str, Any]]


class VerificationEvidenceRequirements(BaseModel):
    """Model for verification evidence requirements."""
    verification_type: VerificationType
    required_evidence: List[str]
    optional_evidence: List[str]
    criteria: Dict[str, Any]
    examples: List[Dict[str, Any]] = Field(default_factory=list)


class AutomatedVerificationResult(BaseModel):
    """Result of automated verification."""
    score: float
    passed: bool
    criteria_met: Dict[str, bool]
    recommendations: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)