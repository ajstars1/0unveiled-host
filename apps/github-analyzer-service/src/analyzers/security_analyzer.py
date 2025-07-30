"""Security analysis for repositories."""

from typing import List
from loguru import logger

from ..models.repository import FileInfo, RepositoryStructure
from ..models.metrics import SecurityMetrics


class SecurityAnalyzer:
    """Analyzer for security-related metrics and vulnerabilities."""
    
    def __init__(self):
        self.security_patterns = {
            'hardcoded_secrets': [
                r'password\s*=\s*["\'][^"\']+["\']',
                r'api_key\s*=\s*["\'][^"\']+["\']',
                r'secret\s*=\s*["\'][^"\']+["\']',
                r'token\s*=\s*["\'][^"\']+["\']'
            ],
            'sql_injection': [
                r'execute\s*\(\s*["\'].*%.*["\']',
                r'query\s*\(\s*["\'].*\+.*["\']',
                r'SELECT.*\+.*FROM'
            ],
            'xss_risks': [
                r'innerHTML\s*=',
                r'document\.write\s*\(',
                r'eval\s*\('
            ]
        }
        
        logger.info("Security analyzer initialized")
    
    async def analyze_security(
        self, 
        files: List[FileInfo], 
        structure: RepositoryStructure
    ) -> SecurityMetrics:
        """Analyze security aspects of the repository."""
        logger.info(f"Analyzing security for {len(files)} files")
        
        # Initialize counters
        security_hotspots = 0
        hardcoded_secrets = 0
        sql_injection_risks = 0
        xss_risks = 0
        unsafe_operations = 0
        
        # Analyze each file for security issues
        for file_info in files:
            if not self._is_security_relevant_file(file_info):
                continue
            
            if file_info.content:
                file_issues = await self._analyze_file_security(file_info)
                
                security_hotspots += file_issues['hotspots']
                hardcoded_secrets += file_issues['secrets']
                sql_injection_risks += file_issues['sql_injection']
                xss_risks += file_issues['xss']
                unsafe_operations += file_issues['unsafe_ops']
        
        # Check for security best practices
        has_security_policy = self._check_security_policy(files, structure)
        has_dependency_updates = self._check_dependency_updates(files, structure)
        
        # Calculate overall security score
        security_score = self._calculate_security_score(
            security_hotspots, hardcoded_secrets, sql_injection_risks, 
            xss_risks, has_security_policy, has_dependency_updates
        )
        
        # Categorize issues by severity
        critical_issues = hardcoded_secrets + sql_injection_risks
        high_issues = xss_risks + unsafe_operations
        medium_issues = security_hotspots - critical_issues - high_issues
        
        return SecurityMetrics(
            security_hotspots=security_hotspots,
            potential_vulnerabilities=critical_issues + high_issues + medium_issues,
            critical_issues=max(0, critical_issues),
            high_issues=max(0, high_issues),
            medium_issues=max(0, medium_issues),
            low_issues=0,  # Placeholder
            has_security_policy=has_security_policy,
            uses_secrets_scanning=False,  # Would check for GitHub Actions or similar
            has_dependency_updates=has_dependency_updates,
            hardcoded_secrets=hardcoded_secrets,
            sql_injection_risks=sql_injection_risks,
            xss_risks=xss_risks,
            unsafe_operations=unsafe_operations,
            vulnerable_dependencies=0,  # Would need dependency scanning
            outdated_dependencies=0,
            dependency_security_score=80.0,  # Placeholder
            security_score=security_score
        )
    
    def _is_security_relevant_file(self, file_info: FileInfo) -> bool:
        """Check if file is relevant for security analysis."""
        # Analyze code files and configuration files
        code_extensions = {
            'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'cs', 
            'go', 'rs', 'php', 'rb', 'sql', 'html', 'jsp'
        }
        
        config_extensions = {'yml', 'yaml', 'json', 'xml', 'ini', 'conf', 'config'}
        
        ext = file_info.extension.lower()
        return ext in code_extensions or ext in config_extensions
    
    async def _analyze_file_security(self, file_info: FileInfo) -> dict:
        """Analyze a single file for security issues."""
        import re
        
        content = file_info.content or ""
        issues = {
            'hotspots': 0,
            'secrets': 0,
            'sql_injection': 0,
            'xss': 0,
            'unsafe_ops': 0
        }
        
        try:
            # Check for hardcoded secrets
            for pattern in self.security_patterns['hardcoded_secrets']:
                matches = re.findall(pattern, content, re.IGNORECASE)
                issues['secrets'] += len(matches)
                issues['hotspots'] += len(matches)
            
            # Check for SQL injection risks
            for pattern in self.security_patterns['sql_injection']:
                matches = re.findall(pattern, content, re.IGNORECASE)
                issues['sql_injection'] += len(matches)
                issues['hotspots'] += len(matches)
            
            # Check for XSS risks
            for pattern in self.security_patterns['xss_risks']:
                matches = re.findall(pattern, content, re.IGNORECASE)
                issues['xss'] += len(matches)
                issues['hotspots'] += len(matches)
            
            # Check for other unsafe operations
            unsafe_patterns = [
                r'system\s*\(',
                r'exec\s*\(',
                r'shell_exec\s*\(',
                r'passthru\s*\(',
                r'eval\s*\('
            ]
            
            for pattern in unsafe_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                issues['unsafe_ops'] += len(matches)
                issues['hotspots'] += len(matches)
                
        except Exception as e:
            logger.warning(f"Failed to analyze security for {file_info.path}: {e}")
        
        return issues
    
    def _check_security_policy(self, files: List[FileInfo], structure: RepositoryStructure) -> bool:
        """Check if repository has a security policy."""
        security_files = [
            'SECURITY.md', 'security.md', 'Security.md',
            'SECURITY.txt', 'security.txt',
            '.github/SECURITY.md'
        ]
        
        for file_info in files:
            if file_info.name in security_files or file_info.path in security_files:
                return True
        
        return False
    
    def _check_dependency_updates(self, files: List[FileInfo], structure: RepositoryStructure) -> bool:
        """Check if repository has automated dependency updates."""
        # Check for Dependabot, Renovate, or similar
        automation_files = [
            '.github/dependabot.yml',
            '.github/renovate.json',
            'renovate.json',
            '.dependabot/config.yml'
        ]
        
        for file_info in files:
            if file_info.path in automation_files:
                return True
        
        return False
    
    def _calculate_security_score(
        self,
        security_hotspots: int,
        hardcoded_secrets: int,
        sql_injection_risks: int,
        xss_risks: int,
        has_security_policy: bool,
        has_dependency_updates: bool
    ) -> float:
        """Calculate overall security score (0-100)."""
        score = 100.0
        
        # Deduct points for security issues
        score -= hardcoded_secrets * 20  # Critical
        score -= sql_injection_risks * 15  # High
        score -= xss_risks * 10  # Medium
        score -= max(0, security_hotspots - hardcoded_secrets - sql_injection_risks - xss_risks) * 5  # Low
        
        # Add points for good practices
        if has_security_policy:
            score += 10
        
        if has_dependency_updates:
            score += 10
        
        return max(0.0, min(100.0, score))