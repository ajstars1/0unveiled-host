"""Analysis result models."""

from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum

from pydantic import BaseModel, Field

from .metrics import CodeMetrics, QualityMetrics, SecurityMetrics, PerformanceMetrics, ContributorMetrics
from .repository import Repository


class TechStackCategory(str, Enum):
    """Technology stack categories."""
    
    LANGUAGE = "language"
    FRAMEWORK = "framework"
    LIBRARY = "library"
    DATABASE = "database"
    TOOL = "tool"
    PLATFORM = "platform"
    CLOUD = "cloud"
    TESTING = "testing"
    BUILD = "build"
    DEPLOYMENT = "deployment"


class TechnologyItem(BaseModel):
    """Individual technology item in the stack."""
    
    name: str
    category: TechStackCategory
    version: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)  # 0-1 confidence score
    usage_patterns: List[str] = Field(default_factory=list)
    file_count: int = 0
    line_count: int = 0


class TechStack(BaseModel):
    """Technology stack analysis."""
    
    # Primary technologies
    primary_language: Optional[str] = None
    languages: List[TechnologyItem] = Field(default_factory=list)
    frameworks: List[TechnologyItem] = Field(default_factory=list)
    libraries: List[TechnologyItem] = Field(default_factory=list)
    
    # Infrastructure and tools
    databases: List[TechnologyItem] = Field(default_factory=list)
    tools: List[TechnologyItem] = Field(default_factory=list)
    platforms: List[TechnologyItem] = Field(default_factory=list)
    
    # Development practices
    testing_frameworks: List[TechnologyItem] = Field(default_factory=list)
    build_tools: List[TechnologyItem] = Field(default_factory=list)
    deployment_tools: List[TechnologyItem] = Field(default_factory=list)
    
    # Summary
    total_technologies: int = 0
    complexity_score: float = 0.0  # Based on number and diversity of technologies
    modernness_score: float = 0.0  # Based on technology recency and adoption


class ContributionStats(BaseModel):
    """Contribution statistics and patterns."""
    
    # Commit statistics
    total_commits: int = 0
    commits_last_30_days: int = 0
    commits_last_90_days: int = 0
    commits_last_year: int = 0
    
    # Authorship
    total_authors: int = 0
    primary_author: Optional[str] = None
    primary_author_percentage: float = 0.0
    
    # Activity patterns
    most_active_day: Optional[str] = None
    most_active_hour: Optional[int] = None
    development_velocity: float = 0.0  # Commits per week
    
    # Code changes
    total_additions: int = 0
    total_deletions: int = 0
    net_lines_changed: int = 0
    average_commit_size: float = 0.0
    
    # File modifications
    most_modified_files: List[str] = Field(default_factory=list)
    files_touched: int = 0
    
    # Collaboration
    pair_programming_evidence: bool = False
    code_review_participation: float = 0.0


class AIInsights(BaseModel):
    """AI-generated insights about the repository."""
    
    # Quality assessment
    overall_quality_score: float = Field(ge=0.0, le=100.0)
    code_style_assessment: str
    architecture_assessment: str
    maintainability_assessment: str
    project_summary: str = ""
    
    # Strengths and weaknesses
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    
    # Developer profiling insights
    skill_level_indicators: Dict[str, float] = Field(default_factory=dict)
    coding_patterns: List[str] = Field(default_factory=list)
    best_practices_adherence: float = Field(ge=0.0, le=100.0)
    
    # Project insights
    project_maturity: str  # "experimental", "developing", "mature", "legacy"
    development_stage: str  # "prototype", "mvp", "production", "enterprise"
    maintenance_burden: str  # "low", "medium", "high"
    
    # Market relevance
    technology_relevance: float = Field(ge=0.0, le=100.0)
    industry_alignment: List[str] = Field(default_factory=list)
    career_impact: str  # "low", "medium", "high"


class AnalysisResult(BaseModel):
    """Complete analysis result for a repository."""
    
    # Basic information
    analysis_id: str
    repository_id: int
    repository_name: str
    analyzed_at: datetime
    analysis_duration: float  # seconds
    
    # Core metrics
    code_metrics: CodeMetrics
    quality_metrics: QualityMetrics
    security_metrics: SecurityMetrics
    performance_metrics: PerformanceMetrics
    contributor_metrics: ContributorMetrics
    
    # Technology analysis
    tech_stack: TechStack
    contribution_stats: ContributionStats
    
    # AI insights
    ai_insights: AIInsights
    
    # Overall scores
    overall_score: float = Field(ge=0.0, le=100.0)
    technical_score: float = Field(ge=0.0, le=100.0)
    quality_score: float = Field(ge=0.0, le=100.0)
    security_score: float = Field(ge=0.0, le=100.0)
    collaboration_score: float = Field(ge=0.0, le=100.0)
    
    # Analysis metadata
    version: str = "1.0"
    analyzer_version: str
    confidence: float = Field(ge=0.0, le=1.0)
    limitations: List[str] = Field(default_factory=list)
    
    # Status
    status: str = "completed"  # pending, processing, completed, failed
    error_messages: List[str] = Field(default_factory=list)


class RepositoryAnalysis(BaseModel):
    """Simplified repository analysis result for API responses."""
    
    # Repository info
    repository: Repository
    analysis_timestamp: datetime
    
    # Core analysis results
    code_metrics: CodeMetrics
    quality_metrics: QualityMetrics
    security_metrics: SecurityMetrics
    tech_stack: TechStack
    ai_insights: AIInsights
    
    # Overall summary
    overall_score: float = Field(ge=0.0, le=100.0)
    analysis_duration: float = 0.0  # seconds
    
    # Debug information
    files_discovered: List[Dict[str, Any]] = Field(default_factory=list)