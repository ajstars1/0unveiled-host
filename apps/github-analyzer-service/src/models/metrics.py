"""Code metrics models."""

from typing import Dict, List, Optional, Any
from datetime import datetime

from pydantic import BaseModel, Field


class CodeMetrics(BaseModel):
    """Code complexity and size metrics."""
    
    # Lines of code
    total_lines: int = 0
    lines_of_code: int = 0  # Excluding comments and blank lines
    comment_lines: int = 0
    blank_lines: int = 0
    
    # Complexity metrics
    cyclomatic_complexity: float = 0.0
    cognitive_complexity: float = 0.0
    halstead_complexity: Optional[Dict[str, float]] = None
    
    # Maintainability
    maintainability_index: float = 0.0
    technical_debt_ratio: float = 0.0
    
    # File-level metrics
    total_files: int = 0
    average_file_size: float = 0.0
    largest_file_size: int = 0
    
    # Function/method metrics
    total_functions: int = 0
    average_function_length: float = 0.0
    max_function_complexity: float = 0.0


class QualityMetrics(BaseModel):
    """Code quality assessment metrics."""
    
    # Documentation
    docstring_coverage: float = 0.0  # Percentage
    comment_density: float = 0.0  # Comments per line of code
    readme_quality_score: float = 0.0  # 0-100
    
    # Testing
    test_coverage: Optional[float] = None  # Percentage if available
    test_files_count: int = 0
    test_to_code_ratio: float = 0.0
    
    # Code style and standards
    style_violations: int = 0
    naming_consistency: float = 0.0  # 0-100
    code_duplication: float = 0.0  # Percentage
    
    # Best practices
    has_type_hints: bool = False
    follows_conventions: bool = False
    has_error_handling: bool = False
    
    # Architecture
    dependency_count: int = 0
    circular_dependencies: int = 0
    architecture_score: float = 0.0  # 0-100


class SecurityMetrics(BaseModel):
    """Security-related metrics."""
    
    # Vulnerability analysis
    security_hotspots: int = 0
    potential_vulnerabilities: int = 0
    critical_issues: int = 0
    high_issues: int = 0
    medium_issues: int = 0
    low_issues: int = 0
    
    # Security practices
    has_security_policy: bool = False
    uses_secrets_scanning: bool = False
    has_dependency_updates: bool = False
    has_security_workflow: bool = False
    
    # Code patterns
    hardcoded_secrets: int = 0
    sql_injection_risks: int = 0
    xss_risks: int = 0
    unsafe_operations: int = 0
    insecure_deserialization: int = 0
    insecure_file_operations: int = 0
    command_injection: int = 0
    sensitive_files: int = 0
    
    # Issue locations for better reporting
    issue_locations: Dict[str, List[str]] = Field(default_factory=lambda: {
        'hardcoded_secrets': [],
        'sql_injection': [],
        'xss_risks': [],
        'command_injection': [],
        'insecure_deserialization': [],
        'insecure_file_operations': [],
        'sensitive_files': []
    })
    
    # Dependencies
    vulnerable_dependencies: int = 0
    outdated_dependencies: int = 0
    dependency_security_score: float = 0.0  # 0-100
    
    # Overall security score
    security_score: float = 0.0  # 0-100


class PerformanceMetrics(BaseModel):
    """Performance-related metrics."""
    
    # Code efficiency
    big_o_complexity: Optional[str] = None
    memory_usage_patterns: List[str] = Field(default_factory=list)
    cpu_intensive_operations: int = 0
    
    # Database queries
    n_plus_one_queries: int = 0
    inefficient_queries: int = 0
    
    # Caching
    cache_usage: bool = False
    cache_hit_potential: float = 0.0
    
    # Resource management
    resource_leaks: int = 0
    connection_management: bool = False


class ContributorMetrics(BaseModel):
    """Metrics about contributors and collaboration."""
    
    # Contributors
    total_contributors: int = 0
    active_contributors: int = 0  # Last 90 days
    core_contributors: int = 0  # Top 80% of commits
    
    # Contribution patterns
    commit_frequency: float = 0.0  # Commits per day
    average_commit_size: float = 0.0  # Lines per commit
    
    # Collaboration
    pull_requests_total: int = 0
    pull_requests_merged: int = 0
    code_review_participation: float = 0.0  # Percentage
    
    # Activity
    last_commit_date: Optional[datetime] = None
    development_activity: str = "inactive"  # inactive, low, moderate, high
    
    # Bus factor
    bus_factor: int = 1  # Number of people who know the codebase


class ComplianceMetrics(BaseModel):
    """Compliance and standards metrics."""
    
    # Licensing
    license_compliance: bool = False
    license_type: Optional[str] = None
    license_conflicts: int = 0
    
    # Standards
    coding_standards_compliance: float = 0.0  # Percentage
    accessibility_compliance: Optional[float] = None
    
    # Documentation
    api_documentation_coverage: float = 0.0
    user_documentation_quality: float = 0.0
    
    # Process compliance
    has_ci_cd: bool = False
    automated_testing: bool = False
    code_review_required: bool = False