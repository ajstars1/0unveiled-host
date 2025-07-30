"""Technology stack analysis."""

from typing import Dict, List
from loguru import logger

from ..models.repository import FileInfo, RepositoryStructure
from ..models.analysis import TechStack, TechnologyItem, TechStackCategory


class TechStackAnalyzer:
    """Analyzer for detecting and analyzing technology stacks."""
    
    def __init__(self):
        logger.info("Tech stack analyzer initialized")
    
    async def analyze_tech_stack(
        self, 
        files: List[FileInfo], 
        structure: RepositoryStructure,
        languages: Dict[str, int]
    ) -> TechStack:
        """Analyze the technology stack of a repository."""
        logger.info(f"Analyzing tech stack for {len(files)} files")
        
        # Detect languages
        detected_languages = []
        for lang, count in languages.items():
            detected_languages.append(TechnologyItem(
                name=lang,
                category=TechStackCategory.LANGUAGE,
                confidence=min(1.0, count / 1000),  # Normalize by size
                line_count=count
            ))
        
        # Detect frameworks and libraries from files
        frameworks = self._detect_frameworks(files, structure)
        libraries = self._detect_libraries(files, structure)
        databases = self._detect_databases(files, structure)
        tools = self._detect_tools(files, structure)
        
        # Determine primary language
        primary_language = max(languages.keys(), key=languages.get) if languages else None
        
        return TechStack(
            primary_language=primary_language,
            languages=detected_languages,
            frameworks=frameworks,
            libraries=libraries,
            databases=databases,
            tools=tools,
            total_technologies=len(detected_languages) + len(frameworks) + len(libraries),
            complexity_score=self._calculate_complexity_score(detected_languages, frameworks, libraries),
            modernness_score=self._calculate_modernness_score(detected_languages, frameworks)
        )
    
    def _detect_frameworks(self, files: List[FileInfo], structure: RepositoryStructure) -> List[TechnologyItem]:
        """Detect frameworks from file patterns and dependencies."""
        frameworks = []
        
        # Check for common framework indicators in file names
        framework_patterns = {
            'react': ['jsx', 'tsx', 'react'],
            'vue': ['vue'],
            'angular': ['component.ts', 'module.ts', 'angular'],
            'django': ['models.py', 'views.py', 'settings.py'],
            'flask': ['app.py', 'flask'],
            'express': ['app.js', 'server.js'],
            'spring': ['Application.java', 'Controller.java'],
            'rails': ['Gemfile', 'app/models', 'app/controllers']
        }
        
        for framework, patterns in framework_patterns.items():
            confidence = 0.0
            file_count = 0
            
            for file_info in files:
                for pattern in patterns:
                    if pattern in file_info.path.lower() or pattern in file_info.name.lower():
                        confidence += 0.2
                        file_count += 1
            
            if confidence > 0:
                frameworks.append(TechnologyItem(
                    name=framework,
                    category=TechStackCategory.FRAMEWORK,
                    confidence=min(1.0, confidence),
                    file_count=file_count
                ))
        
        return frameworks
    
    def _detect_libraries(self, files: List[FileInfo], structure: RepositoryStructure) -> List[TechnologyItem]:
        """Detect libraries from dependency files."""
        libraries = []
        
        # Check package.json for Node.js dependencies
        package_json_files = [f for f in files if f.name == 'package.json']
        if package_json_files:
            # Would parse package.json to extract dependencies
            # Placeholder implementation
            common_js_libs = ['lodash', 'axios', 'moment', 'react', 'vue', 'express']
            for lib in common_js_libs:
                libraries.append(TechnologyItem(
                    name=lib,
                    category=TechStackCategory.LIBRARY,
                    confidence=0.5,
                    file_count=1
                ))
        
        # Check requirements.txt for Python dependencies
        requirements_files = [f for f in files if 'requirements' in f.name.lower()]
        if requirements_files:
            common_py_libs = ['numpy', 'pandas', 'requests', 'flask', 'django']
            for lib in common_py_libs:
                libraries.append(TechnologyItem(
                    name=lib,
                    category=TechStackCategory.LIBRARY,
                    confidence=0.5,
                    file_count=1
                ))
        
        return libraries
    
    def _detect_databases(self, files: List[FileInfo], structure: RepositoryStructure) -> List[TechnologyItem]:
        """Detect database technologies."""
        databases = []
        
        # Look for database-related files and patterns
        db_patterns = {
            'postgresql': ['postgres', 'psql', '.sql'],
            'mysql': ['mysql', '.sql'],
            'mongodb': ['mongo', '.bson'],
            'sqlite': ['sqlite', '.db', '.sqlite3'],
            'redis': ['redis'],
            'elasticsearch': ['elasticsearch', 'elastic']
        }
        
        for db, patterns in db_patterns.items():
            confidence = 0.0
            file_count = 0
            
            for file_info in files:
                for pattern in patterns:
                    if pattern in file_info.path.lower() or pattern in file_info.name.lower():
                        confidence += 0.3
                        file_count += 1
            
            if confidence > 0:
                databases.append(TechnologyItem(
                    name=db,
                    category=TechStackCategory.DATABASE,
                    confidence=min(1.0, confidence),
                    file_count=file_count
                ))
        
        return databases
    
    def _detect_tools(self, files: List[FileInfo], structure: RepositoryStructure) -> List[TechnologyItem]:
        """Detect development tools and build systems."""
        tools = []
        
        # Check for tool configuration files
        tool_files = {
            'docker': ['Dockerfile', 'docker-compose.yml'],
            'webpack': ['webpack.config.js'],
            'babel': ['.babelrc', 'babel.config.js'],
            'eslint': ['.eslintrc', 'eslint.config.js'],
            'pytest': ['pytest.ini', 'pyproject.toml'],
            'jest': ['jest.config.js'],
            'makefile': ['Makefile'],
            'gradle': ['build.gradle'],
            'maven': ['pom.xml']
        }
        
        for tool, config_files in tool_files.items():
            for file_info in files:
                if file_info.name in config_files:
                    tools.append(TechnologyItem(
                        name=tool,
                        category=TechStackCategory.TOOL,
                        confidence=0.9,
                        file_count=1
                    ))
                    break
        
        return tools
    
    def _calculate_complexity_score(
        self, 
        languages: List[TechnologyItem], 
        frameworks: List[TechnologyItem], 
        libraries: List[TechnologyItem]
    ) -> float:
        """Calculate technology stack complexity score."""
        total_techs = len(languages) + len(frameworks) + len(libraries)
        
        if total_techs == 0:
            return 0.0
        
        # More technologies = higher complexity
        complexity = min(100.0, total_techs * 10)
        
        # Multiple languages increase complexity more
        if len(languages) > 2:
            complexity += 20.0
        
        return min(100.0, complexity)
    
    def _calculate_modernness_score(
        self, 
        languages: List[TechnologyItem], 
        frameworks: List[TechnologyItem]
    ) -> float:
        """Calculate how modern the technology stack is."""
        # Simplified scoring based on "modern" technologies
        modern_techs = {
            'typescript', 'rust', 'go', 'kotlin', 'swift',
            'react', 'vue', 'svelte', 'next.js', 'nuxt.js'
        }
        
        score = 50.0  # Base score
        
        for tech in languages + frameworks:
            if tech.name.lower() in modern_techs:
                score += 15.0
        
        return min(100.0, score)