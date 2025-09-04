"""Data models for recruitment functionality."""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class EmploymentType(str, Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    FREELANCE = "FREELANCE"
    INTERNSHIP = "INTERNSHIP"


class JobStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"
    EXPIRED = "EXPIRED"


class CandidateMatchStatus(str, Enum):
    SUGGESTED = "SUGGESTED"
    CONTACTED = "CONTACTED"
    RESPONDED = "RESPONDED"
    INTERVIEWED = "INTERVIEWED"
    HIRED = "HIRED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class SalaryRange(BaseModel):
    """Salary range model."""
    min: int
    max: int
    currency: str = "USD"


class JobPosting(BaseModel):
    """Job posting model."""
    id: str
    company_id: str
    recruiter_id: str
    title: str
    description: str
    requirements: Dict[str, Any] = Field(default_factory=dict)
    location: Optional[str] = None
    salary_range: Optional[SalaryRange] = None
    employment_type: EmploymentType
    ai_matching_criteria: Dict[str, Any] = Field(default_factory=dict)
    status: JobStatus = JobStatus.DRAFT
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None


class CandidateProfile(BaseModel):
    """Candidate profile model for matching."""
    id: str
    first_name: str
    last_name: str
    email: str
    skills: List[str] = Field(default_factory=list)
    experience_years: int = 0
    cruism_score: float = 0.0
    primary_domain: str = "general"
    location: Optional[str] = None
    remote_preference: bool = False
    preferred_company_size: str = "medium"
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_items: List[Dict[str, Any]] = Field(default_factory=list)


class MatchReasoning(BaseModel):
    """AI reasoning for candidate match."""
    overall_score: float
    strengths: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    summary: str
    skills_match_score: float = 0.0
    experience_match_score: float = 0.0
    code_quality_score: float = 0.0


class MatchResult(BaseModel):
    """Result of candidate matching."""
    job_posting_id: str
    candidate_id: str
    ai_match_score: float
    match_reasoning: MatchReasoning
    candidate_profile: CandidateProfile
    recruiter_rating: Optional[int] = None
    status: CandidateMatchStatus = CandidateMatchStatus.SUGGESTED
    created_at: datetime = Field(default_factory=datetime.now)


class CandidateSearchRequest(BaseModel):
    """Request model for candidate search."""
    job_posting_id: str
    max_candidates: int = Field(default=50, le=100)
    min_match_score: float = Field(default=60.0, ge=0.0, le=100.0)
    filters: Dict[str, Any] = Field(default_factory=dict)


class CandidateSearchResponse(BaseModel):
    """Response model for candidate search."""
    job_posting_id: str
    total_candidates: int
    matches: List[MatchResult]
    search_time_ms: int


class Company(BaseModel):
    """Company model."""
    id: str
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    size_range: Optional[str] = None
    logo_url: Optional[str] = None
    verified: bool = False


class MessageTemplate(BaseModel):
    """Message template model."""
    id: str
    recruiter_id: str
    company_id: str
    name: str
    subject: Optional[str] = None
    content: str
    variables: Dict[str, Any] = Field(default_factory=dict)
    type: str = "INITIAL"  # INITIAL, FOLLOW_UP, INTERVIEW_INVITE
    is_active: bool = True


class OutreachCampaign(BaseModel):
    """Outreach campaign model."""
    id: str
    recruiter_id: str
    job_posting_id: str
    name: str
    template_id: Optional[str] = None
    status: str = "DRAFT"  # DRAFT, ACTIVE, PAUSED, COMPLETED
    total_candidates: int = 0
    messages_sent: int = 0
    responses_received: int = 0


class OutreachActivity(BaseModel):
    """Individual outreach activity model."""
    id: str
    campaign_id: str
    candidate_id: str
    message_template_id: str
    subject: Optional[str] = None
    content: str
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    status: str = "PENDING"
    response_text: Optional[str] = None