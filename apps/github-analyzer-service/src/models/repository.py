"""Repository models for analysis."""

from datetime import datetime
from typing import Dict, List, Optional, Any

from pydantic import BaseModel, Field


class Repository(BaseModel):
    """Repository information model."""
    
    id: int
    name: str
    full_name: str
    description: Optional[str] = None
    private: bool = False
    fork: bool = False
    html_url: str
    clone_url: str
    default_branch: str = "main"
    
    # Language information
    language: Optional[str] = None
    languages: Dict[str, int] = Field(default_factory=dict)
    
    # Statistics
    size: int = 0  # Repository size in KB
    stargazers_count: int = 0
    watchers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    pushed_at: Optional[datetime] = None
    
    # Additional metadata
    topics: List[str] = Field(default_factory=list)
    license: Optional[str] = None
    has_issues: bool = True
    has_projects: bool = True
    has_wiki: bool = True
    has_downloads: bool = True
    archived: bool = False
    disabled: bool = False
    
    # Analysis metadata
    analyzed_at: Optional[datetime] = None
    analysis_version: Optional[str] = None


class FileInfo(BaseModel):
    """Information about a file in the repository."""
    
    path: str
    name: str
    extension: str
    size: int
    language: Optional[str] = None
    content: Optional[str] = None  # Only for analysis
    sha: str
    
    # Analysis results
    lines_of_code: Optional[int] = None
    complexity: Optional[float] = None
    maintainability_index: Optional[float] = None


class RepositoryStructure(BaseModel):
    """Repository structure analysis."""
    
    total_files: int
    total_directories: int
    file_types: Dict[str, int] = Field(default_factory=dict)
    languages_detected: Dict[str, int] = Field(default_factory=dict)
    
    # Important files
    has_readme: bool = False
    has_license: bool = False
    has_dockerfile: bool = False
    has_ci_config: bool = False
    has_tests: bool = False
    has_docs: bool = False
    
    # Package managers and configs
    package_managers: List[str] = Field(default_factory=list)
    config_files: List[str] = Field(default_factory=list)
    
    # Directory structure
    max_depth: int = 0
    directories: List[str] = Field(default_factory=list)


class RepositoryAnalysis(BaseModel):
    """Complete repository analysis result."""
    
    repository: Repository
    structure: RepositoryStructure
    files: List[FileInfo] = Field(default_factory=list)
    
    # Analysis metadata
    analysis_id: str
    analyzed_at: datetime
    analysis_duration: float  # seconds
    status: str = "completed"  # pending, in_progress, completed, failed
    error_message: Optional[str] = None
    
    # Analysis scope
    files_analyzed: int = 0
    files_skipped: int = 0
    total_lines_analyzed: int = 0