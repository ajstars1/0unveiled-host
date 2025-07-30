"""Main analyzer service that orchestrates repository analysis."""

from datetime import datetime
from typing import Dict, List, Optional, Any

from loguru import logger

from ..models.repository import Repository, RepositoryStructure, FileInfo
from ..models.analysis import RepositoryAnalysis
from ..models.analysis import TechStack, AIInsights
from ..models.metrics import CodeMetrics, QualityMetrics, SecurityMetrics
from ..analyzers.code_analyzer import CodeAnalyzer
from ..analyzers.tech_stack_analyzer import TechStackAnalyzer
from ..analyzers.security_analyzer import SecurityAnalyzer
from ..analyzers.ai_insights_analyzer import AIInsightsAnalyzer
from .github_client import GitHubClient


class AnalyzerService:
    """Main service for analyzing repositories."""
    
    def __init__(self):
        self.github_client = GitHubClient()
        self.code_analyzer = CodeAnalyzer()
        self.tech_stack_analyzer = TechStackAnalyzer()
        self.security_analyzer = SecurityAnalyzer()
        self.ai_insights_analyzer = AIInsightsAnalyzer()
        
        logger.info("Analyzer service initialized")
    
    async def analyze_repository_simple(
        self, 
        owner: str, 
        repo: str,
        access_token: Optional[str] = None,
        max_files: int = 200
    ) -> RepositoryAnalysis:
        """Simple repository analysis that returns RepositoryAnalysis."""
        start_time = datetime.now()
        
        logger.info(f"Starting simple analysis for {owner}/{repo}")
        
        # Initialize files_discovered to avoid attribute errors
        files_discovered = []
        
        # Set access token if provided
        original_token = self.github_client.token
        if access_token:
            self.github_client.token = access_token
            self.github_client.headers = self.github_client._build_headers()
        
        try:
            
            # Get basic repository information
            repository = await self.github_client.get_repository(owner, repo)
            
            # Get language statistics
            languages = await self.github_client.get_repository_languages(owner, repo)
            
            # Get ALL files using recursive directory traversal
            files = []
            files_discovered = []
            try:
                logger.info(f"Starting complete recursive file discovery for {owner}/{repo}")
                
                # Get all files recursively from the entire repository
                all_files = await self._discover_all_files_recursively(owner, repo, max_files)
                
                logger.info(f"Discovered {len(all_files)} total files, processing analyzable ones...")
                
                file_count = 0
                analyzed_files = []
                
                for file_item in all_files:
                    # Track all discovered files for debugging
                    files_discovered.append({
                        "path": file_item["path"],
                        "name": file_item["name"],
                        "analyzed": False
                    })
                    
                    if file_count >= max_files:
                        continue
                    
                    # Check if file should be analyzed
                    extension = self._get_file_extension(file_item["name"]).lower()
                    
                    if self._should_skip_path(file_item["path"]):
                        continue
                        
                    if self._is_analyzable_file(extension):
                        logger.info(f"Fetching content for {file_item['path']} ({extension})")
                        
                        try:
                            file_content = await self.github_client.get_file_content(owner, repo, file_item["path"])
                            
                            if file_content:
                                file_info = FileInfo(
                                    path=file_item["path"],
                                    name=file_item["name"],
                                    extension=extension,
                                    size=file_item.get("size", 0),
                                    content=file_content,
                                    sha=file_item.get("sha", "")
                                )
                                files.append(file_info)
                                analyzed_files.append(file_item["path"])
                                
                                # Mark this file as analyzed in our discovery list
                                files_discovered[-1]["analyzed"] = True
                                file_count += 1
                            else:
                                logger.warning(f"No content retrieved for {file_item['path']}")
                                
                        except Exception as e:
                            logger.warning(f"Failed to fetch content for {file_item['path']}: {e}")
                            continue
                
                logger.info(f"Successfully fetched content for {len(files)} files from recursive discovery")
                logger.info(f"Analyzed files: {analyzed_files}")
            except Exception as e:
                logger.warning(f"Could not fetch repository contents: {e}")
            
            # Create basic structure
            structure = RepositoryStructure(
                total_files=len(files),
                total_directories=0,  # We're only looking at root files
                directories=[],
                file_types={},
                largest_files=files[:5]
            )
            
            # Run basic analyzers
            code_metrics = await self.code_analyzer.analyze_code_metrics(files)
            
            quality_metrics = QualityMetrics(
                architecture_score=70.0,  # Default score
                docstring_coverage=50.0,
                test_to_code_ratio=0.2
            )
            
            security_metrics = await self.security_analyzer.analyze_security(files, structure)
            
            tech_stack = await self.tech_stack_analyzer.analyze_tech_stack(files, structure, languages)
            
            ai_insights = await self.ai_insights_analyzer.generate_insights(
                repository, code_metrics, quality_metrics, security_metrics, tech_stack, files
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # Restore original token
            self.github_client.token = original_token
            self.github_client.headers = self.github_client._build_headers()
            
            return RepositoryAnalysis(
                repository=repository,
                analysis_timestamp=end_time,
                code_metrics=code_metrics,
                quality_metrics=quality_metrics,
                security_metrics=security_metrics,
                tech_stack=tech_stack,
                ai_insights=ai_insights,
                overall_score=ai_insights.overall_quality_score,
                analysis_duration=duration,
                files_discovered=files_discovered
            )
            
        except Exception as e:
            # Restore original token on error
            self.github_client.token = original_token
            self.github_client.headers = self.github_client._build_headers()
            logger.error(f"Simple analysis failed for {owner}/{repo}: {e}")
            
            # Return a failed analysis result instead of raising exception
            # Import at the top level to avoid local variable issues
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # Create a minimal failed repository object
            failed_repository = Repository(
                id=0,
                name=repo,
                full_name=f"{owner}/{repo}",
                description="Analysis failed",
                url=f"https://github.com/{owner}/{repo}",
                html_url=f"https://github.com/{owner}/{repo}",
                clone_url=f"https://github.com/{owner}/{repo}.git",
                ssh_url=f"git@github.com:{owner}/{repo}.git",
                language=None,
                stargazers_count=0,
                watchers_count=0,
                forks_count=0,
                open_issues_count=0,
                size=0,
                default_branch="main",
                created_at=datetime.now(),
                updated_at=datetime.now(),
                pushed_at=datetime.now(),
                is_private=False,
                is_fork=False,
                is_archived=False,
                is_disabled=False,
                has_issues=False,
                has_projects=False,
                has_wiki=False,
                has_pages=False,
                has_downloads=False,
                topics=[],
                languages={}
            )
            
            return RepositoryAnalysis(
                repository=failed_repository,
                analysis_timestamp=end_time,
                code_metrics=CodeMetrics(),
                quality_metrics=QualityMetrics(),
                security_metrics=SecurityMetrics(),
                tech_stack=TechStack(),
                ai_insights=AIInsights(
                    overall_quality_score=0.0,
                    code_style_assessment=f"Analysis failed: {str(e)}",
                    architecture_assessment="Analysis failed",
                    maintainability_assessment="Analysis failed",
                    project_summary="Analysis failed - unable to generate project summary",
                    best_practices_adherence=0.0,
                    project_maturity="unknown",
                    development_stage="unknown",
                    maintenance_burden="unknown",
                    technology_relevance=0.0,
                    career_impact="unknown"
                ),
                overall_score=0.0,
                analysis_duration=duration,
                files_discovered=files_discovered
            )
    
    def _is_analyzable_file(self, extension: str) -> bool:
        """Check if file extension is worth analyzing for code metrics."""
        analyzable_extensions = {
            # Popular programming languages
            'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'cs', 'go', 
            'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 
            'bash', 'ps1', 'pl', 'lua', 'dart', 'vue', 'svelte',
            
            # Additional languages and file types
            'h', 'hpp', 'cc', 'cxx', 'm', 'mm', 'groovy', 'gradle',
            'clj', 'cljs', 'elm', 'ex', 'exs', 'erl', 'hrl', 'hs',
            'ml', 'mli', 'fs', 'fsx', 'fsi', 'nim', 'nims', 'pas',
            'pp', 'pro', 'vb', 'vbs', 'asm', 's', 'f', 'f90', 'f95',
            'jl', 'd', 'zig', 'odin', 'v', 'vv',
            
            # Web and markup (some have logic)
            'html', 'htm', 'xml', 'xsl', 'xslt', 'svg',
            
            # Configuration files with logic
            'dockerfile', 'makefile', 'cmake', 'yml', 'yaml', 'toml',
            'ini', 'cfg', 'conf', 'properties', 'json', 'tf', 'hcl'
        }
        return extension.lower() in analyzable_extensions
    
    def _should_skip_path(self, path: str) -> bool:
        """Check if we should skip this file path during analysis."""
        skip_patterns = {
            # Build and dependency directories
            'node_modules/', '__pycache__/', '.git/', 'venv/', 'env/',
            'build/', 'dist/', 'target/', 'bin/', 'obj/', '.vscode/',
            '.idea/', '.gradle/', 'vendor/', 'bower_components/',
            
            # Test directories (we'll analyze some but not all)
            'coverage/', '.coverage/', '.pytest_cache/', '.nyc_output/',
            
            # Documentation that's not core code
            'docs/', 'documentation/', 'examples/tutorials/',
            
            # Common non-code directories
            'assets/', 'static/', 'public/', 'images/', 'img/', 
            'fonts/', 'stylesheets/', 'css/', 'scss/', 'sass/',
            
            # Package manager files we don't need to analyze deeply
            '.npm/', '.yarn/', 'yarn.lock', 'package-lock.json',
            
            # Hidden directories
            '.github/', '.gitlab/', '.circleci/', '.travis/'
        }
        
        path_lower = path.lower()
        
        # Check if path starts with any skip pattern
        for pattern in skip_patterns:
            if path_lower.startswith(pattern) or f'/{pattern}' in path_lower:
                return True
                
        # Skip files that are too large (over 100KB) - likely generated
        return False
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension."""
        if "." in filename:
            return filename.split(".")[-1]
        return ""
    
    def _detect_file_language(self, filename: str, extension: str) -> Optional[str]:
        """Detect programming language from file extension."""
        ext_map = {
            "py": "Python",
            "js": "JavaScript", 
            "ts": "TypeScript",
            "jsx": "JavaScript",
            "tsx": "TypeScript",
            "java": "Java",
            "cpp": "C++",
            "cc": "C++",
            "cxx": "C++",
            "c": "C",
            "cs": "C#",
            "go": "Go",
            "rs": "Rust",
            "php": "PHP",
            "rb": "Ruby",
            "swift": "Swift",
            "kt": "Kotlin",
            "scala": "Scala",
            "r": "R",
            "html": "HTML",
            "css": "CSS",
            "scss": "SCSS",
            "less": "Less",
            "sql": "SQL",
            "sh": "Shell",
            "yaml": "YAML",
            "yml": "YAML",
            "json": "JSON",
            "xml": "XML",
            "md": "Markdown"
        }
        
        return ext_map.get(extension.lower())
    
    
    async def _discover_all_files_recursively(self, owner: str, repo: str, max_files: int = 2000) -> List[Dict[str, Any]]:
        """Recursively discover ALL files in the repository structure."""
        all_files = []
        directories_to_explore = [""]  # Start with root directory
        processed_paths = set()
        
        logger.info(f"Starting recursive file discovery for {owner}/{repo}")
        
        while directories_to_explore and len(all_files) < max_files * 3:  # Explore more for filtering
            current_path = directories_to_explore.pop(0)
            
            if current_path in processed_paths:
                continue
            processed_paths.add(current_path)
            
            try:
                logger.debug(f"Exploring directory: '{current_path or 'root'}'")
                
                # Get contents of current directory
                contents = await self.github_client.get_repository_contents(
                    owner, repo, current_path, recursive=False
                )
                
                for item in contents:
                    if item["type"] == "file":
                        # Add file to our list
                        all_files.append(item)
                        
                    elif item["type"] == "dir":
                        # Skip certain directories to avoid infinite loops and irrelevant content
                        if not self._should_skip_directory(item["path"]):
                            directories_to_explore.append(item["path"])
                        else:
                            logger.debug(f"Skipping directory: {item['path']}")
                
                # Sort files by priority (code files first, then by depth)
                all_files.sort(key=lambda f: (
                    0 if self._is_analyzable_file(self._get_file_extension(f["name"]).lower()) else 1,
                    f["path"].count("/"),  # Prefer files in shallower directories
                    f["name"]
                ))
                
            except Exception as e:
                logger.warning(f"Failed to fetch directory '{current_path}': {e}")
                continue
        
        # Limit the number of files returned
        limited_files = all_files[:max_files * 2]  # Get more files for better filtering
        
        logger.info(f"Discovered {len(all_files)} total files, returning top {len(limited_files)} for analysis")
        logger.debug(f"Sample discovered files: {[f['path'] for f in limited_files[:10]]}")
        
        return limited_files
    
    def _should_skip_directory(self, dir_path: str) -> bool:
        """Check if we should skip exploring this directory."""
        skip_dirs = {
            # Version control
            '.git', '.svn', '.hg',
            
            # Dependencies and build outputs
            'node_modules', '__pycache__', '.pytest_cache', 'venv', 'env', 
            'virtualenv', '.venv', '.env', 'build', 'dist', 'target', 'bin', 
            'obj', 'out', '.gradle', 'vendor', 'bower_components', '.npm',
            
            # IDE and editor files
            '.vscode', '.idea', '.vs', '.settings', '.project', '.classpath',
            
            # Documentation and examples (too many files, often not core code)
            'docs', 'documentation', 'examples', 'samples', 'demo', 'demos',
            'test-data', 'testdata', 'fixtures', 'mocks',
            
            # Static assets
            'assets', 'static', 'public', 'images', 'img', 'fonts', 
            'stylesheets', 'css', 'scss', 'sass', 'media',
            
            # Coverage and test outputs
            'coverage', '.coverage', '.nyc_output', 'htmlcov', 'test-results',
            
            # Temporary and cache directories
            'tmp', 'temp', 'cache', '.cache', 'logs', 'log',
            
            # Package manager artifacts
            'yarn.lock', 'package-lock.json', 'Pipfile.lock', 'poetry.lock',
            
            # Hidden directories (except some important ones)
            '.github', '.gitlab', '.circleci', '.travis', '.appveyor'
        }
        
        # Check if any part of the path matches skip patterns
        path_parts = dir_path.lower().split('/')
        
        for part in path_parts:
            if part in skip_dirs:
                return True
            
            # Skip directories that look like build outputs or temp directories
            if part.startswith('.') and len(part) > 1 and part not in {'.github', '.gitlab'}:
                return True
            
            # Skip test directories if they're very deep (likely to be test fixtures)
            if 'test' in part and dir_path.count('/') > 2:
                return True
        
        return False