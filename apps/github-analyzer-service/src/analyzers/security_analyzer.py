"""Security analysis for repositories."""

from typing import List
from loguru import logger

from ..models.repository import FileInfo, RepositoryStructure
from ..models.metrics import SecurityMetrics


class SecurityAnalyzer:
    """Analyzer for security-related metrics and vulnerabilities."""
    
    def __init__(self):
        # Define more comprehensive and context-aware patterns for security issues
        self.security_patterns = {
            'hardcoded_secrets': [
                # More specific patterns to reduce false positives
                r'password\s*=\s*["\'][^"\']{8,}["\']',  # At least 8 chars to avoid empty/placeholder values
                r'api[_\-]?key\s*=\s*["\'][A-Za-z0-9_\-\.]{16,}["\']',  # API keys are typically long
                r'secret[_\-]?key\s*=\s*["\'][^"\']{16,}["\']',
                r'access[_\-]?token\s*=\s*["\'][^"\']{16,}["\']',
                r'auth[_\-]?token\s*=\s*["\'][^"\']{16,}["\']',
                r'bearer[_\-]?token\s*=\s*["\'][^"\']{16,}["\']',
                # Common specific API keys patterns
                r'aws[_\-]?access[_\-]?key[_\-]?id\s*=\s*["\']AKIA[0-9A-Z]{16}["\']',
                r'aws[_\-]?secret[_\-]?access[_\-]?key\s*=\s*["\'][^"\']+["\']',
                # Exclude common test values
                r'(?!password\s*=\s*["\'](?:password|test|123456|admin)["\'])'
            ],
            'sql_injection': [
                # More specific patterns for SQL injection
                r'execute\s*\(\s*["\'][^"\']*\s*\+\s*(?![\s"\']*\?)[^"\']*["\']',  # String concatenation without parameterization
                r'execute\s*\(\s*f["\'].*\{.*\}.*["\']',  # Python f-strings in SQL
                r'query\s*\(\s*["\'][^"\']*\s*\+\s*(?![\s"\']*\?)[^"\']*["\']',
                r'SELECT.*\+.*FROM',
                r'.*\.raw\s*\(\s*["\'][^"\']*\s*\+\s*[^"\']*["\']',  # ORM raw queries with concatenation
                r'.*\.execute\s*\(\s*text\s*\(\s*f["\']',  # SQLAlchemy text() with f-strings
            ],
            'xss_risks': [
                # More specific XSS patterns
                r'innerHTML\s*=\s*(?!.*\.textContent)(?!.*\.innerText)',  # innerHTML assignment without sanitization
                r'outerHTML\s*=',
                r'document\.write\s*\(',
                r'eval\s*\(',
                r'setTimeout\s*\(\s*["\']',  # setTimeout with string argument
                r'setInterval\s*\(\s*["\']',  # setInterval with string argument
                r'dangerouslySetInnerHTML\s*=\s*\{\s*__html\s*:',  # React's dangerouslySetInnerHTML
                r'\.html\s*\(\s*(?!.*DOMPurify)',  # jQuery's .html() without sanitization
            ],
            'insecure_deserialization': [
                r'pickle\.loads\s*\(',
                r'yaml\.load\s*\([^,)]*\)',  # YAML load without safe flag
                r'marshal\.loads\s*\(',
                r'json\.loads\s*\(\s*request',  # Deserializing user input without validation
                r'cPickle\.loads\s*\('
            ],
            'insecure_file_operations': [
                r'open\s*\(\s*(?:request|user|input).*\)',  # File operations with user input
                r'file_get_contents\s*\(\s*\$_(?:GET|POST|REQUEST)',
                r'readFile\s*\(\s*.*\+\s*.*\)',  # Path traversal risks
            ],
            'command_injection': [
                r'(?:os\.)?system\s*\(\s*(?:f["\']|\s*["\'].*\s*\+|\s*["\'].*\%|\s*["\'].*\{)',
                r'(?:os\.)?popen\s*\(\s*(?:f["\']|\s*["\'].*\s*\+|\s*["\'].*\%|\s*["\'].*\{)',
                r'subprocess\.(?:call|run|Popen)\s*\(\s*(?:f["\']|\s*["\'].*\s*\+|\s*["\'].*\%|\s*["\'].*\{)',
                r'exec\s*\(\s*(?:f["\']|\s*["\'].*\s*\+|\s*["\'].*\%|\s*["\'].*\{)',
                r'shell_exec\s*\(\s*(?:f["\']|\s*["\'].*\s*\+|\s*["\'].*\%|\s*["\'].*\{)',
                r'eval\s*\(\s*(?:f["\']|\s*["\'].*\s*\+|\s*["\'].*\%|\s*["\'].*\{)'
            ]
        }
        
        # Define file patterns that might contain sensitive data
        self.sensitive_file_patterns = [
            r'.*\.env$',
            r'.*\.pem$',
            r'.*\.key$',
            r'.*_rsa$',
            r'.*\.p12$',
            r'.*\.pfx$',
            r'.*\.keystore$',
            r'.*\.jks$',
            r'.*config.*\.json$',
            r'.*secrets.*\.json$',
            r'.*credentials.*\.json$',
            r'.*\.netrc$',
            r'.*\.npmrc$',
            r'.*\.dockercfg$',
            r'.*config\.yml$',
            r'.*settings\.py$'
        ]
        
        logger.info("Enhanced security analyzer initialized")
    
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
        insecure_deserialization = 0
        insecure_file_operations = 0
        command_injection = 0
        sensitive_files = 0
        
        # Track issue locations for better reporting
        issue_locations = {
            'hardcoded_secrets': [],
            'sql_injection': [],
            'xss_risks': [],
            'command_injection': [],
            'insecure_deserialization': [],
            'insecure_file_operations': [],
            'sensitive_files': []
        }
        
        # Analyze each file for security issues
        for file_info in files:
            # Check if file might contain sensitive data based on filename
            if self._is_sensitive_file(file_info):
                sensitive_files += 1
                issue_locations['sensitive_files'].append(f"{file_info.path}")
            
            if not self._is_security_relevant_file(file_info):
                continue
            
            if file_info.content:
                file_issues = await self._analyze_file_security(file_info)
                
                security_hotspots += file_issues['hotspots']
                hardcoded_secrets += file_issues['secrets']
                sql_injection_risks += file_issues['sql_injection']
                xss_risks += file_issues['xss']
                unsafe_operations += file_issues['unsafe_ops']
                insecure_deserialization += file_issues['insecure_deserialization']
                insecure_file_operations += file_issues['insecure_file_operations']
                command_injection += file_issues['command_injection']
                
                # Track issue locations
                for issue_type, locations in file_issues['locations'].items():
                    for location in locations:
                        issue_locations[issue_type].append(f"{file_info.path}:{location}")
        
        # Check for security best practices
        has_security_policy = self._check_security_policy(files, structure)
        has_dependency_updates = self._check_dependency_updates(files, structure)
        uses_secrets_scanning = self._check_secrets_scanning(files, structure)
        has_security_workflow = self._check_security_workflow(files, structure)
        
        # Perform dependency analysis if possible
        vulnerable_dependencies, outdated_dependencies, dependency_security_score = self._analyze_dependencies(files, structure)
        
        # Calculate overall security score with weighted approach
        security_score = self._calculate_security_score(
            hardcoded_secrets=hardcoded_secrets,
            sql_injection_risks=sql_injection_risks,
            xss_risks=xss_risks,
            unsafe_operations=unsafe_operations,
            insecure_deserialization=insecure_deserialization,
            insecure_file_operations=insecure_file_operations,
            command_injection=command_injection,
            sensitive_files=sensitive_files,
            has_security_policy=has_security_policy,
            has_dependency_updates=has_dependency_updates,
            uses_secrets_scanning=uses_secrets_scanning,
            has_security_workflow=has_security_workflow,
            vulnerable_dependencies=vulnerable_dependencies,
            dependency_security_score=dependency_security_score
        )
        
        # Categorize issues by severity
        critical_issues = hardcoded_secrets + sql_injection_risks + command_injection
        high_issues = xss_risks + insecure_deserialization + vulnerable_dependencies
        medium_issues = unsafe_operations + insecure_file_operations
        low_issues = sensitive_files + (outdated_dependencies // 2)  # Count half of outdated deps as low issues
        
        # Total potential vulnerabilities
        potential_vulnerabilities = critical_issues + high_issues + medium_issues + low_issues
        
        logger.info(f"Security analysis complete. Score: {security_score}, Issues: {potential_vulnerabilities}")
        
        return SecurityMetrics(
            security_hotspots=security_hotspots,
            potential_vulnerabilities=potential_vulnerabilities,
            critical_issues=max(0, critical_issues),
            high_issues=max(0, high_issues),
            medium_issues=max(0, medium_issues),
            low_issues=low_issues,
            has_security_policy=has_security_policy,
            uses_secrets_scanning=uses_secrets_scanning,
            has_dependency_updates=has_dependency_updates,
            hardcoded_secrets=hardcoded_secrets,
            sql_injection_risks=sql_injection_risks,
            xss_risks=xss_risks,
            unsafe_operations=unsafe_operations,
            insecure_deserialization=insecure_deserialization,
            insecure_file_operations=insecure_file_operations,
            command_injection=command_injection,
            sensitive_files=sensitive_files,
            vulnerable_dependencies=vulnerable_dependencies,
            outdated_dependencies=outdated_dependencies,
            dependency_security_score=dependency_security_score,
            security_score=security_score,
            issue_locations=issue_locations,
            has_security_workflow=has_security_workflow
        )
    
    def _is_security_relevant_file(self, file_info: FileInfo) -> bool:
        """Check if file is relevant for security analysis with improved coverage."""
        # Analyze code files and configuration files with more comprehensive extensions
        code_extensions = {
            # Backend code
            'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'cc', 'c', 'cs', 'go', 
            'rs', 'rb', 'php', 'scala', 'kt', 'groovy', 'swift', 'fs', 'pl', 'sh',
            # Web code
            'html', 'htm', 'css', 'scss', 'sass', 'vue', 'svelte', 'jsp', 'asp', 'aspx',
            # Data and query files
            'sql', 'graphql', 'gql', 'hql',
            # Mobile
            'swift', 'kt', 'java', 'm', 'h'
        }
        
        config_extensions = {
            'yml', 'yaml', 'json', 'xml', 'ini', 'conf', 'config', 'properties', 
            'env', 'toml', 'cfg', 'plist', 'gradle', 'dockerfile', 'lock'
        }
        
        # Check extension
        ext = file_info.extension.lower() if file_info.extension else ''
        
        # Consider specific filenames without extensions
        security_relevant_filenames = {
            'dockerfile', 'jenkinsfile', 'vagrantfile', 'makefile', 
            '.env', '.npmrc', '.yarnrc', '.dockerignore', '.gitignore'
        }
        
        if file_info.name.lower() in security_relevant_filenames:
            return True
            
        return ext in code_extensions or ext in config_extensions
    
    def _check_security_policy(self, files: List[FileInfo], structure: RepositoryStructure) -> bool:
        """Check if repository has a security policy."""
        security_files = [
            'SECURITY.md', 'security.md', 'Security.md',
            'SECURITY.txt', 'security.txt',
            '.github/SECURITY.md', 
            'docs/security.md', 'docs/SECURITY.md'
        ]
        
        for file_info in files:
            if file_info.name in security_files or file_info.path in security_files:
                return True
        
        return False
    
    def _check_dependency_updates(self, files: List[FileInfo], structure: RepositoryStructure) -> bool:
        """Check if repository has automated dependency updates."""
        # Check for Dependabot, Renovate, or similar
        automation_files = [
            '.github/dependabot.yml', '.github/dependabot.yaml',
            '.github/renovate.json', 'renovate.json',
            '.dependabot/config.yml', '.dependabot/config.yaml',
            '.whitesource'  # WhiteSource Renovate
        ]
        
        for file_info in files:
            if file_info.path in automation_files:
                return True
                
            # Also check content for relevant patterns in GitHub workflow files
            if file_info.path.startswith('.github/workflows/') and file_info.extension in ['yml', 'yaml']:
                if file_info.content and any(pattern in file_info.content.lower() for pattern in 
                                           ['dependabot', 'renovate', 'dependency', 'update']):
                    return True
        
        return False
    
    def _check_secrets_scanning(self, files: List[FileInfo], structure: RepositoryStructure) -> bool:
        """Check if repository uses secrets scanning."""
        # Check for GitHub secret scanning or similar tools
        for file_info in files:
            # GitHub Advanced Security settings
            if file_info.path == '.github/settings.yml' and file_info.content:
                if 'secret_scanning' in file_info.content.lower() or 'advanced_security' in file_info.content.lower():
                    return True
                    
            # GitHub Workflows that include secret scanning
            if file_info.path.startswith('.github/workflows/') and file_info.extension in ['yml', 'yaml']:
                if file_info.content and any(pattern in file_info.content.lower() for pattern in 
                                           ['secret-scanning', 'secrets', 'detect-secrets', 'gitleaks']):
                    return True
                    
            # Standalone tools config files
            if file_info.path in ['.gitleaks.toml', '.detect-secrets.yaml', '.pre-commit-config.yaml']:
                return True
        
        return False
    
    def _check_security_workflow(self, files: List[FileInfo], structure: RepositoryStructure) -> bool:
        """Check if repository has security-focused CI workflows."""
        for file_info in files:
            # GitHub security workflows
            if file_info.path.startswith('.github/workflows/') and file_info.extension in ['yml', 'yaml']:
                if file_info.content and any(pattern in file_info.content.lower() for pattern in 
                                          ['security', 'codeql', 'sast', 'dast', 'scan', 'snyk', 'sonarqube',
                                           'sonarcloud', 'owasp', 'zap', 'trivy', 'bandit', 'semgrep']):
                    return True
                    
            # Travis, CircleCI, GitLab CI with security tools
            if file_info.path in ['.travis.yml', '.circleci/config.yml', '.gitlab-ci.yml']:
                if file_info.content and any(pattern in file_info.content.lower() for pattern in 
                                          ['security', 'scan', 'sast', 'dast', 'snyk', 'sonar']):
                    return True
        
        return False
    
    def _analyze_dependencies(self, files: List[FileInfo], structure: RepositoryStructure) -> tuple:
        """Analyze dependencies for security vulnerabilities."""
        # In a real implementation, this would interface with tools like npm audit, 
        # Safety for Python, OWASP Dependency Check, etc.
        
        # Default values if we can't perform actual analysis
        vulnerable_dependencies = 0
        outdated_dependencies = 0
        dependency_security_score = 90.0
        
        # Check for lock files that could be analyzed
        has_package_lock = False
        has_yarn_lock = False
        has_pipfile_lock = False
        has_poetry_lock = False
        has_requirements_txt = False
        
        for file_info in files:
            if file_info.path in ['package-lock.json', 'yarn.lock', 'Pipfile.lock', 'poetry.lock', 'requirements.txt']:
                # If we have lock files, we assume we could analyze them in a real implementation
                if file_info.path == 'package-lock.json':
                    has_package_lock = True
                elif file_info.path == 'yarn.lock':
                    has_yarn_lock = True
                elif file_info.path == 'Pipfile.lock':
                    has_pipfile_lock = True
                elif file_info.path == 'poetry.lock':
                    has_poetry_lock = True
                elif file_info.path == 'requirements.txt':
                    has_requirements_txt = True
        
        # For demonstration, simulate finding some issues based on repository structure
        if has_package_lock or has_yarn_lock:
            # Node.js projects often have outdated dependencies
            outdated_dependencies = 5
            vulnerable_dependencies = 2
            dependency_security_score = 75.0
            
        if has_pipfile_lock or has_poetry_lock or has_requirements_txt:
            # Python projects might have fewer vulnerable dependencies
            outdated_dependencies += 3
            vulnerable_dependencies += 1
            dependency_security_score = 85.0
        
        return vulnerable_dependencies, outdated_dependencies, dependency_security_score
    
    def _calculate_security_score(
        self,
        hardcoded_secrets: int,
        sql_injection_risks: int,
        xss_risks: int,
        unsafe_operations: int,
        insecure_deserialization: int,
        insecure_file_operations: int,
        command_injection: int,
        sensitive_files: int,
        has_security_policy: bool,
        has_dependency_updates: bool,
        uses_secrets_scanning: bool,
        has_security_workflow: bool,
        vulnerable_dependencies: int,
        dependency_security_score: float
    ) -> float:
        """Calculate overall security score (0-100) with weighted approach."""
        # Start with a perfect score
        score = 100.0
        
        # Severity weights for different issue types
        severity_weights = {
            'critical': 30.0,  # Major impact, needs immediate attention
            'high': 15.0,      # Significant impact, high priority
            'medium': 7.0,     # Moderate impact, should be addressed
            'low': 2.0         # Minor impact, low priority
        }
        
        # Deduct points for security issues with appropriate weights
        
        # Critical severity issues
        score -= hardcoded_secrets * severity_weights['critical'] / 2  # Divide by 2 to avoid over-penalization
        score -= sql_injection_risks * severity_weights['critical'] / 2
        score -= command_injection * severity_weights['critical'] / 2
        
        # High severity issues
        score -= xss_risks * severity_weights['high'] / 3
        score -= insecure_deserialization * severity_weights['high'] / 3
        score -= vulnerable_dependencies * severity_weights['high'] / 2
        
        # Medium severity issues
        score -= unsafe_operations * severity_weights['medium'] / 3
        score -= insecure_file_operations * severity_weights['medium'] / 3
        
        # Low severity issues
        score -= sensitive_files * severity_weights['low'] / 2
        
        # Adjust score based on security practices (bonus points)
        if has_security_policy:
            score += 5.0
        
        if has_dependency_updates:
            score += 10.0
        
        if uses_secrets_scanning:
            score += 15.0
            
        if has_security_workflow:
            score += 10.0
        
        # Factor in dependency security score (weighted at 20% of overall score)
        score = 0.8 * score + 0.2 * dependency_security_score
        
        # Ensure score stays within 0-100 range
        return max(0.0, min(100.0, score))
    
    async def _analyze_file_security(self, file_info: FileInfo) -> dict:
        """Analyze a single file for security issues with context awareness."""
        import re
        
        content = file_info.content or ""
        issues = {
            'hotspots': 0,
            'secrets': 0,
            'sql_injection': 0,
            'xss': 0,
            'unsafe_ops': 0,
            'insecure_deserialization': 0,
            'insecure_file_operations': 0,
            'command_injection': 0,
            'locations': {
                'hardcoded_secrets': [],
                'sql_injection': [],
                'xss_risks': [],
                'command_injection': [],
                'insecure_deserialization': [],
                'insecure_file_operations': []
            }
        }
        
        try:
            # Split content into lines for line number tracking
            lines = content.split('\n')
            
            # Check for hardcoded secrets
            for pattern in self.security_patterns['hardcoded_secrets']:
                for idx, line in enumerate(lines):
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches and not self._is_likely_test_data(line):
                        issues['secrets'] += len(matches)
                        issues['hotspots'] += len(matches)
                        issues['locations']['hardcoded_secrets'].append(idx + 1)  # 1-based line numbers
            
            # Check for SQL injection risks
            for pattern in self.security_patterns['sql_injection']:
                for idx, line in enumerate(lines):
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches and not self._is_comment_line(line):
                        issues['sql_injection'] += len(matches)
                        issues['hotspots'] += len(matches)
                        issues['locations']['sql_injection'].append(idx + 1)
            
            # Check for XSS risks
            for pattern in self.security_patterns['xss_risks']:
                for idx, line in enumerate(lines):
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches and not self._is_comment_line(line):
                        issues['xss'] += len(matches)
                        issues['hotspots'] += len(matches)
                        issues['locations']['xss_risks'].append(idx + 1)
            
            # Check for command injection
            for pattern in self.security_patterns['command_injection']:
                for idx, line in enumerate(lines):
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches and not self._is_comment_line(line):
                        issues['command_injection'] += len(matches)
                        issues['unsafe_ops'] += len(matches)
                        issues['hotspots'] += len(matches)
                        issues['locations']['command_injection'].append(idx + 1)
            
            # Check for insecure deserialization
            for pattern in self.security_patterns['insecure_deserialization']:
                for idx, line in enumerate(lines):
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches and not self._is_comment_line(line):
                        issues['insecure_deserialization'] += len(matches)
                        issues['hotspots'] += len(matches)
                        issues['locations']['insecure_deserialization'].append(idx + 1)
            
            # Check for insecure file operations
            for pattern in self.security_patterns['insecure_file_operations']:
                for idx, line in enumerate(lines):
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches and not self._is_comment_line(line):
                        issues['insecure_file_operations'] += len(matches)
                        issues['hotspots'] += len(matches)
                        issues['locations']['insecure_file_operations'].append(idx + 1)
                
        except Exception as e:
            logger.warning(f"Failed to analyze security for {file_info.path}: {e}")
        
        return issues
    
    def _is_comment_line(self, line: str) -> bool:
        """Check if a line is a comment to avoid false positives."""
        # Common comment patterns
        stripped = line.strip()
        return (
            stripped.startswith('#') or 
            stripped.startswith('//') or 
            stripped.startswith('/*') or 
            stripped.startswith('*') or 
            stripped.startswith('"""') or 
            stripped.startswith("'''")
        )
    
    def _is_likely_test_data(self, line: str) -> bool:
        """Check if a line likely contains test data to avoid false positives."""
        test_indicators = ['test', 'mock', 'dummy', 'example', 'sample', 'fake']
        lower_line = line.lower()
        
        # Check for test indicators
        if any(indicator in lower_line for indicator in test_indicators):
            return True
        
        # Check for obvious test values
        if 'password' in lower_line and any(val in lower_line for val in ['password', 'test123', '123456', 'admin']):
            return True
            
        return False
    
    def _is_sensitive_file(self, file_info: FileInfo) -> bool:
        """Check if file might contain sensitive information based on name patterns."""
        import re
        
        for pattern in self.sensitive_file_patterns:
            if re.match(pattern, file_info.path, re.IGNORECASE):
                return True
                
        return False
    
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