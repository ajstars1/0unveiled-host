"""AI-powered insights generation using Gemini."""

from typing import Dict, List
from datetime import datetime

from loguru import logger

from ..models.repository import Repository
from ..models.metrics import CodeMetrics, QualityMetrics, SecurityMetrics
from ..models.analysis import TechStack, AIInsights
from ..config import settings


class AIInsightsAnalyzer:
    """Analyzer for generating AI-powered insights about repositories."""
    
    def __init__(self):
        self.gemini_available = bool(settings.gemini_api_key)
        
        if self.gemini_available:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini AI model initialized")
            except ImportError:
                logger.warning("Gemini AI not available - install google-generativeai")
                self.gemini_available = False
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
                self.gemini_available = False
        else:
            logger.info("Gemini API key not provided - using rule-based insights")
        
        logger.info("AI insights analyzer initialized")
    
    async def generate_insights(
        self,
        repository: Repository,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack,
        files: List = None
    ) -> AIInsights:
        """Generate AI-powered insights about the repository."""
        logger.info(f"Generating insights for {repository.full_name}")
        
        if self.gemini_available:
            return await self._generate_ai_insights(
                repository, code_metrics, quality_metrics, security_metrics, tech_stack, files
            )
        else:
            return await self._generate_rule_based_insights(
                repository, code_metrics, quality_metrics, security_metrics, tech_stack
            )
    
    async def _generate_ai_insights(
        self,
        repository: Repository,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack,
        files: List = None
    ) -> AIInsights:
        """Generate insights using Gemini AI."""
        try:
            # Prepare context for AI with actual code samples
            context = self._prepare_context_with_code(
                repository, code_metrics, quality_metrics, security_metrics, tech_stack, files or []
            )
            
            # Generate different types of insights
            project_summary = await self._get_ai_project_summary(context)
            quality_assessment = await self._get_ai_quality_assessment(context)
            architecture_assessment = await self._get_ai_architecture_assessment(context)
            maintainability_assessment = await self._get_ai_maintainability_assessment(context)
            
            strengths = await self._get_ai_strengths(context)
            weaknesses = await self._get_ai_weaknesses(context)
            improvements = await self._get_ai_improvements(context)
            
            skill_indicators = await self._get_ai_skill_indicators(context)
            coding_patterns = await self._get_ai_coding_patterns(context)
            
            project_maturity = await self._get_ai_project_maturity(context)
            development_stage = await self._get_ai_development_stage(context)
            
            return AIInsights(
                overall_quality_score=self._calculate_overall_quality_score(
                    code_metrics, quality_metrics, security_metrics
                ),
                code_style_assessment=quality_assessment,
                architecture_assessment=architecture_assessment,
                maintainability_assessment=maintainability_assessment,
                project_summary=project_summary,
                strengths=strengths,
                weaknesses=weaknesses,
                improvement_suggestions=improvements,
                skill_level_indicators=skill_indicators,
                coding_patterns=coding_patterns,
                best_practices_adherence=quality_metrics.architecture_score,
                project_maturity=project_maturity,
                development_stage=development_stage,
                maintenance_burden=self._assess_maintenance_burden(code_metrics, security_metrics),
                technology_relevance=tech_stack.modernness_score,
                industry_alignment=self._get_industry_alignment(tech_stack),
                career_impact=self._assess_career_impact(tech_stack, quality_metrics)
            )
            
        except Exception as e:
            logger.error(f"AI insights generation failed: {e}")
            # Fallback to rule-based insights
            return await self._generate_rule_based_insights(
                repository, code_metrics, quality_metrics, security_metrics, tech_stack
            )
    
    async def _generate_rule_based_insights(
        self,
        repository: Repository,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack
    ) -> AIInsights:
        """Generate insights using rule-based logic."""
        
        # Quality assessments
        quality_assessment = self._rule_based_quality_assessment(code_metrics, quality_metrics)
        architecture_assessment = self._rule_based_architecture_assessment(quality_metrics, tech_stack)
        maintainability_assessment = self._rule_based_maintainability_assessment(code_metrics)
        
        # Strengths and weaknesses
        strengths = self._identify_strengths(code_metrics, quality_metrics, security_metrics, tech_stack)
        weaknesses = self._identify_weaknesses(code_metrics, quality_metrics, security_metrics)
        improvements = self._suggest_improvements(weaknesses, quality_metrics)
        
        # Developer profiling
        skill_indicators = self._assess_skill_indicators(code_metrics, quality_metrics, tech_stack)
        coding_patterns = self._identify_coding_patterns(code_metrics, tech_stack)
        
        # Project assessment
        project_maturity = self._assess_project_maturity(repository, quality_metrics)
        development_stage = self._assess_development_stage(repository, code_metrics)
        
        return AIInsights(
            overall_quality_score=self._calculate_overall_quality_score(
                code_metrics, quality_metrics, security_metrics
            ),
            code_style_assessment=quality_assessment,
            architecture_assessment=architecture_assessment,
            maintainability_assessment=maintainability_assessment,
            project_summary="Rule-based analysis - project summary not available",
            strengths=strengths,
            weaknesses=weaknesses,
            improvement_suggestions=improvements,
            skill_level_indicators=skill_indicators,
            coding_patterns=coding_patterns,
            best_practices_adherence=quality_metrics.architecture_score,
            project_maturity=project_maturity,
            development_stage=development_stage,
            maintenance_burden=self._assess_maintenance_burden(code_metrics, security_metrics),
            technology_relevance=tech_stack.modernness_score,
            industry_alignment=self._get_industry_alignment(tech_stack),
            career_impact=self._assess_career_impact(tech_stack, quality_metrics)
        )
    
    def _prepare_context(
        self,
        repository: Repository,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack
    ) -> str:
        """Prepare context string for AI analysis."""
        context = f"""
        Repository Analysis Context:
        
        Repository: {repository.full_name}
        Description: {repository.description or "No description"}
        Primary Language: {tech_stack.primary_language or "Multiple"}
        Stars: {repository.stargazers_count}
        Forks: {repository.forks_count}
        
        Code Metrics:
        - Total Lines: {code_metrics.total_lines}
        - Lines of Code: {code_metrics.lines_of_code}
        - Cyclomatic Complexity: {code_metrics.cyclomatic_complexity:.2f}
        - Maintainability Index: {code_metrics.maintainability_index:.2f}
        - Technical Debt Ratio: {code_metrics.technical_debt_ratio:.2f}
        
        Quality Metrics:
        - Documentation Coverage: {quality_metrics.docstring_coverage:.1f}%
        - Test Coverage: {quality_metrics.test_coverage or "Unknown"}
        - Architecture Score: {quality_metrics.architecture_score:.1f}
        
        Security Metrics:
        - Security Score: {security_metrics.security_score:.1f}
        - Critical Issues: {security_metrics.critical_issues}
        - Security Hotspots: {security_metrics.security_hotspots}
        
        Technology Stack:
        - Languages: {len(tech_stack.languages)}
        - Frameworks: {len(tech_stack.frameworks)}  
        - Total Technologies: {tech_stack.total_technologies}
        - Modernness Score: {tech_stack.modernness_score:.1f}
        """
        
        return context
    
    def _prepare_context_with_code(
        self,
        repository: Repository,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack,
        files: List
    ) -> str:
        """Prepare enhanced context with actual code samples for AI analysis."""
        # Start with basic metrics context
        context = self._prepare_context(repository, code_metrics, quality_metrics, security_metrics, tech_stack)
        
        # Add code samples section
        context += "\n\nCode Samples for Analysis:\n"
        
        # Select representative files for AI analysis
        sample_files = self._select_representative_files(files)
        
        for i, file_info in enumerate(sample_files[:5]):  # Limit to 5 files to stay within token limits
            if file_info.content and len(file_info.content) > 0:
                # Truncate very long files to fit within token limits
                content_preview = file_info.content[:2000] if len(file_info.content) > 2000 else file_info.content
                
                context += f"""
File {i+1}: {file_info.path}
Language: {file_info.extension}
Size: {len(file_info.content)} characters

Code Content:
```{file_info.extension}
{content_preview}
```
{'...(truncated)' if len(file_info.content) > 2000 else ''}

"""
        
        return context
    
    def _select_representative_files(self, files: List) -> List:
        """Select the most representative files for AI analysis."""
        if not files:
            return []
        
        # Priority order for file selection - prioritize business logic files
        priority_patterns = [
            # Core business logic and services (highest priority)
            ('service', 'controller', 'handler', 'manager', 'business', 'logic', 'core'),
            # API and routes that show functionality
            ('api/', 'routes/', 'endpoints/', 'router'),
            # Models and data structures that show what data is handled
            ('model', 'schema', 'entity', 'dto', 'types'),
            # Main application entry points
            ('main.py', 'index.js', 'app.py', 'server.js', 'main.ts', 'index.ts', 'app.ts'),
            # Pages and views that show user functionality
            ('page', 'view', 'screen', 'component'),
            # Utils and helpers with actual logic
            ('util', 'helper', 'function', 'processor'),
        ]
        
        selected_files = []
        used_files = set()
        
        # First, try to get high-priority files
        for patterns in priority_patterns:
            for file_info in files:
                if len(selected_files) >= 8:  # Limit total files
                    break
                
                if file_info.path in used_files:
                    continue
                
                # Check if file matches any pattern
                file_path_lower = file_info.path.lower()
                if any(pattern in file_path_lower for pattern in patterns):
                    selected_files.append(file_info)
                    used_files.add(file_info.path)
                    break
        
        # Fill remaining slots with other interesting files that contain business logic
        for file_info in files:
            if len(selected_files) >= 8:
                break
            
            if file_info.path in used_files:
                continue
            
            # Skip configuration files that don't contain business logic
            if self._is_config_file(file_info.path):
                continue
            
            # Focus on source code files with actual logic
            if (file_info.content and 
                len(file_info.content) > 100 and 
                len(file_info.content) < 10000 and
                file_info.extension in ['py', 'js', 'ts', 'tsx', 'jsx', 'java', 'go', 'rs', 'cpp', 'c', 'cs']):
                selected_files.append(file_info)
                used_files.add(file_info.path)
        
        return selected_files
    
    def _is_config_file(self, file_path: str) -> bool:
        """Check if a file is primarily configuration rather than business logic."""
        config_patterns = [
            'package.json', 'package-lock.json', 'yarn.lock', 'bun.lockb',
            'tsconfig.json', 'jsconfig.json', 'next.config', 'vite.config',
            'webpack.config', 'rollup.config', 'babel.config', 'eslint',
            'prettier', '.env', 'dockerfile', 'docker-compose',
            'tailwind.config', 'postcss.config', 'components.json',
            'requirements.txt', 'pyproject.toml', 'setup.py', 'cargo.toml',
            'go.mod', 'go.sum', 'pom.xml', 'build.gradle',
            '.gitignore', '.gitattributes', 'readme', 'license',
            'makefile', 'cmake', '.github/', '.vscode/', '.idea/',
            'migration', 'seed', 'fixture'
        ]
        
        file_path_lower = file_path.lower()
        return any(pattern in file_path_lower for pattern in config_patterns)
    
    async def _get_ai_project_summary(self, context: str) -> str:
        """Get AI-generated project summary based on actual code."""
        if not self.gemini_available:
            return "Unable to generate project summary - AI not available"
        
        prompt = f"""
        {context}
        
        You are a senior software engineer analyzing this codebase to understand what this project ACTUALLY DOES functionally. Look at the code content, not just file names.

        **CRITICAL**: Read the actual code content shown above and determine what the application's PURPOSE is:

        **Deep Code Analysis Required:**
        - What business logic do you see in the functions/methods?
        - What data is being processed, stored, or manipulated?
        - What APIs or services are being called?
        - What user interactions or workflows are implemented?
        - What specific problems is this code solving?

        **Examples of good summaries:**
        - "An e-commerce platform that processes online payments, manages product inventory, and handles user authentication with shopping cart functionality"
        - "A machine learning model training pipeline that processes image data, applies computer vision algorithms, and generates classification results"
        - "A real-time chat application that handles WebSocket connections, stores messages in a database, and provides user authentication"
        - "A financial analysis tool that fetches stock market data, calculates risk metrics, and generates investment recommendations"

        **Bad examples (too generic):**
        - "A web application with React components"
        - "A TypeScript project with modern development tools"
        - "A full-stack application using popular frameworks"

        **Your task**: Based on the ACTUAL CODE CONTENT you can see (functions, logic, data flow, API calls), write 2-3 sentences explaining what this project functionally accomplishes and what specific problem domain it addresses.

        Focus on WHAT IT DOES, not HOW it's built.
        """
        
        try:
            logger.info(f"Generating project summary with Gemini")
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return "Unable to generate project summary"
        except Exception as e:
            logger.error(f"AI project summary failed: {e}")
            return "Project summary unavailable"
    
    async def _get_ai_quality_assessment(self, context: str) -> str:
        """Get AI assessment of code quality."""
        if not self.gemini_available:
            return "Rule-based quality assessment"
        
        prompt = f"""
        {context}
        
        You are a senior software engineer reviewing this codebase. Analyze the actual code samples provided above and give a detailed assessment covering:

        1. **Code Quality & Patterns**: What specific coding patterns, frameworks, and architectures do you see? Comment on the actual implementation approaches used.

        2. **Language-Specific Observations**: Based on the actual code files shown, what modern language features, libraries, or frameworks are being used effectively or ineffectively?

        3. **Code Structure**: How is the code organized? Comment on the actual file structure, naming conventions, and separation of concerns you observe.

        4. **Specific Improvements**: Based on the actual code you can see, what specific, actionable improvements would you recommend?

        Provide a detailed, technical analysis (4-6 sentences) that shows you've actually read and understood the code samples. Be specific about what you see in the actual implementation.
        """
        
        try:
            logger.info(f"Sending prompt to Gemini (length: {len(prompt)} chars)")
            response = self.model.generate_content(prompt)
            if response and response.text:
                logger.info(f"Received Gemini response: {response.text[:100]}...")
                return response.text.strip()
            else:
                logger.warning("Gemini API returned empty response")
                return "AI assessment unavailable - empty response"
        except Exception as e:
            logger.error(f"AI quality assessment failed: {e}")
            # Fall back to rule-based assessment
            return "Good code organization with modern development practices"
    
    async def _get_ai_architecture_assessment(self, context: str) -> str:
        """Get AI assessment of architecture."""
        if not self.gemini_available:
            return "Well-structured codebase with clear separation of concerns"
        
        prompt = f"""
        {context}
        
        You are a software architect reviewing this codebase. Based on the actual code files and directory structure shown above, provide a detailed architectural analysis:

        1. **Architecture Pattern**: What architectural patterns do you identify from the actual code structure? (MVC, microservices, layered, etc.)

        2. **Technology Stack Assessment**: Based on the actual files you can see, what technology choices were made and how well do they work together?

        3. **Code Organization**: How are the modules, components, and services organized? Comment on the actual directory structure and file organization you observe.

        4. **Scalability & Maintainability**: Based on the actual code patterns you see, how well would this architecture scale and how maintainable is it?

        5. **Design Patterns**: What specific design patterns or architectural decisions do you see implemented in the actual code?

        Provide a comprehensive architectural analysis (5-7 sentences) based on what you can actually observe in the code samples and structure.
        """
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return "Architecture assessment unavailable"
        except Exception as e:
            logger.error(f"AI architecture assessment failed: {e}")
            return "Well-structured codebase with modular design"
    
    async def _get_ai_maintainability_assessment(self, context: str) -> str:
        """Get AI assessment of maintainability."""
        if not self.gemini_available:
            return "Codebase shows good maintainability practices"
        
        prompt = f"""
        {context}
        
        You are a senior developer conducting a maintainability review. Based on the actual code samples and metrics shown above, provide specific maintainability insights:

        1. **Code Readability**: How readable and understandable is the actual code you can see? Comment on variable names, function structure, and documentation.

        2. **Technical Debt**: What specific technical debt or code smells do you identify in the actual code samples?

        3. **Testing & Documentation**: Based on what you can observe, how well is the code tested and documented?

        4. **Refactoring Opportunities**: What specific refactoring opportunities do you see in the actual code?

        5. **Long-term Maintenance**: What challenges would a new developer face when working with this code?

        Provide specific, actionable maintainability recommendations (4-6 sentences) based on the actual code you can observe, not just the metrics.
        """
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return "Maintainability assessment unavailable"
        except Exception as e:
            logger.error(f"AI maintainability assessment failed: {e}")
            return "Codebase shows good maintainability practices"
    
    async def _get_ai_strengths(self, context: str) -> List[str]:
        """Get AI-identified strengths."""
        if not self.gemini_available:
            return ["Good code organization", "Modern technology stack"]
        
        prompt = f"""
        {context}
        
        Based on the repository metrics, identify 2-3 key strengths.
        Return only a simple list, one item per line, without bullets or numbers.
        Focus on technical strengths like code quality, security, architecture, or technology choices.
        """
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                strengths = [s.strip() for s in response.text.strip().split('\n') if s.strip()]
                return strengths[:3]  # Limit to 3 strengths
            else:
                return ["Modern technology stack"]
        except Exception as e:
            logger.error(f"AI strengths assessment failed: {e}")
            return ["Good code organization", "Solid foundation"]
    
    async def _get_ai_weaknesses(self, context: str) -> List[str]:
        """Get AI-identified weaknesses."""
        return ["Could improve test coverage", "Documentation needs work"]  # Placeholder
    
    async def _get_ai_improvements(self, context: str) -> List[str]:
        """Get AI improvement suggestions."""
        return ["Add more unit tests", "Improve code documentation"]  # Placeholder
    
    async def _get_ai_skill_indicators(self, context: str) -> Dict[str, float]:
        """Get AI assessment of developer skill indicators."""
        return {"architecture_design": 75.0, "code_quality": 80.0}  # Placeholder
    
    async def _get_ai_coding_patterns(self, context: str) -> List[str]:
        """Get AI-identified coding patterns."""
        return ["Object-oriented design", "Clean code practices"]  # Placeholder
    
    async def _get_ai_project_maturity(self, context: str) -> str:
        """Get AI assessment of project maturity."""
        return "developing"  # Placeholder
    
    async def _get_ai_development_stage(self, context: str) -> str:
        """Get AI assessment of development stage."""
        return "production"  # Placeholder
    
    # Rule-based methods
    
    def _rule_based_quality_assessment(self, code_metrics: CodeMetrics, quality_metrics: QualityMetrics) -> str:
        """Rule-based quality assessment."""
        if code_metrics.maintainability_index > 80:
            return "High quality codebase with excellent maintainability and clear structure"
        elif code_metrics.maintainability_index > 60:
            return "Good quality codebase with room for improvement in complexity management"
        else:
            return "Codebase needs attention - high complexity and maintainability issues detected"
    
    def _rule_based_architecture_assessment(self, quality_metrics: QualityMetrics, tech_stack: TechStack) -> str:
        """Rule-based architecture assessment."""
        if quality_metrics.architecture_score > 80:
            return "Well-architected project with modern technology choices and good structure"
        elif quality_metrics.architecture_score > 60:
            return "Decent architecture with some areas for improvement"
        else:
            return "Architecture needs refactoring to improve maintainability and scalability"
    
    def _rule_based_maintainability_assessment(self, code_metrics: CodeMetrics) -> str:
        """Rule-based maintainability assessment."""
        if code_metrics.technical_debt_ratio < 0.1:
            return "Low technical debt - codebase is highly maintainable"
        elif code_metrics.technical_debt_ratio < 0.3:
            return "Moderate technical debt - maintainable with some effort"
        else:
            return "High technical debt - significant refactoring needed for maintainability"
    
    def _identify_strengths(
        self, 
        code_metrics: CodeMetrics, 
        quality_metrics: QualityMetrics, 
        security_metrics: SecurityMetrics,
        tech_stack: TechStack
    ) -> List[str]:
        """Identify project strengths."""
        strengths = []
        
        if quality_metrics.docstring_coverage > 70:
            strengths.append("Excellent documentation coverage")
        
        if security_metrics.security_score > 80:
            strengths.append("Strong security practices")
        
        if code_metrics.maintainability_index > 80:
            strengths.append("Highly maintainable codebase")
        
        if tech_stack.modernness_score > 70:
            strengths.append("Modern technology stack")
        
        if quality_metrics.test_to_code_ratio > 0.5:
            strengths.append("Good test coverage")
        
        return strengths or ["Functional codebase with basic structure"]
    
    def _identify_weaknesses(
        self, 
        code_metrics: CodeMetrics, 
        quality_metrics: QualityMetrics, 
        security_metrics: SecurityMetrics
    ) -> List[str]:
        """Identify project weaknesses."""
        weaknesses = []
        
        if quality_metrics.docstring_coverage < 30:
            weaknesses.append("Poor documentation coverage")
        
        if security_metrics.critical_issues > 0:
            weaknesses.append("Critical security issues present")
        
        if code_metrics.cyclomatic_complexity > 10:
            weaknesses.append("High code complexity")
        
        if quality_metrics.test_to_code_ratio < 0.2:
            weaknesses.append("Insufficient test coverage")
        
        if code_metrics.technical_debt_ratio > 0.3:
            weaknesses.append("High technical debt")
        
        return weaknesses
    
    def _suggest_improvements(self, weaknesses: List[str], quality_metrics: QualityMetrics) -> List[str]:
        """Suggest improvements based on weaknesses."""
        improvements = []
        
        for weakness in weaknesses:
            if "documentation" in weakness.lower():
                improvements.append("Add comprehensive documentation and docstrings")
            elif "security" in weakness.lower():
                improvements.append("Address security vulnerabilities and implement security best practices")
            elif "complexity" in weakness.lower():
                improvements.append("Refactor complex functions and reduce cyclomatic complexity")
            elif "test" in weakness.lower():
                improvements.append("Increase test coverage with unit and integration tests")
            elif "debt" in weakness.lower():
                improvements.append("Reduce technical debt through systematic refactoring")
        
        return improvements or ["Continue maintaining current quality standards"]
    
    def _assess_skill_indicators(
        self, 
        code_metrics: CodeMetrics, 
        quality_metrics: QualityMetrics, 
        tech_stack: TechStack
    ) -> Dict[str, float]:
        """Assess developer skill indicators."""
        return {
            "code_quality": min(100.0, code_metrics.maintainability_index),
            "architecture_design": quality_metrics.architecture_score,
            "testing_practices": min(100.0, quality_metrics.test_to_code_ratio * 100),
            "documentation": quality_metrics.docstring_coverage,
            "technology_adoption": tech_stack.modernness_score,
            "security_awareness": min(100.0, max(0.0, 100 - len(tech_stack.languages) * 5))
        }
    
    def _identify_coding_patterns(self, code_metrics: CodeMetrics, tech_stack: TechStack) -> List[str]:
        """Identify coding patterns."""
        patterns = []
        
        if code_metrics.average_function_length < 20:
            patterns.append("Small, focused functions")
        
        if code_metrics.cyclomatic_complexity < 5:
            patterns.append("Low complexity design")
        
        if tech_stack.primary_language:
            patterns.append(f"{tech_stack.primary_language} expertise")
        
        if len(tech_stack.frameworks) > 0:
            patterns.append("Framework-based development")
        
        return patterns or ["Basic coding practices"]
    
    def _assess_project_maturity(self, repository: Repository, quality_metrics: QualityMetrics) -> str:
        """Assess project maturity level."""
        # Calculate age in months
        age_months = (datetime.now() - repository.created_at.replace(tzinfo=None)).days / 30
        
        if age_months < 3:
            return "experimental"
        elif age_months < 12:
            return "developing"
        elif quality_metrics.architecture_score > 70:
            return "mature"
        else:
            return "legacy"
    
    def _assess_development_stage(self, repository: Repository, code_metrics: CodeMetrics) -> str:
        """Assess development stage."""
        if code_metrics.total_lines < 1000:
            return "prototype"
        elif code_metrics.total_lines < 10000:
            return "mvp"
        elif repository.stargazers_count > 100:
            return "production"
        else:
            return "development"
    
    def _assess_maintenance_burden(self, code_metrics: CodeMetrics, security_metrics: SecurityMetrics) -> str:
        """Assess maintenance burden."""
        score = (
            code_metrics.technical_debt_ratio * 40 +
            (security_metrics.critical_issues * 20) +
            (code_metrics.cyclomatic_complexity * 2)
        )
        
        if score < 20:
            return "low"
        elif score < 50:
            return "medium"
        else:
            return "high"
    
    def _get_industry_alignment(self, tech_stack: TechStack) -> List[str]:
        """Get industry alignment based on tech stack."""
        industries = []
        
        languages = [t.name.lower() for t in tech_stack.languages]
        frameworks = [t.name.lower() for t in tech_stack.frameworks]
        
        if any(lang in languages for lang in ['javascript', 'typescript', 'react', 'vue']):
            industries.append("Web Development")
        
        if any(lang in languages for lang in ['python', 'r', 'jupyter']):
            industries.append("Data Science")
        
        if any(lang in languages for lang in ['java', 'spring', 'kotlin']):
            industries.append("Enterprise Software")
        
        if any(lang in languages for lang in ['swift', 'kotlin', 'react native']):
            industries.append("Mobile Development")
        
        return industries or ["General Software Development"]
    
    def _assess_career_impact(self, tech_stack: TechStack, quality_metrics: QualityMetrics) -> str:
        """Assess career impact potential."""
        score = (
            tech_stack.modernness_score * 0.4 +
            quality_metrics.architecture_score * 0.3 +
            min(100, tech_stack.total_technologies * 10) * 0.3
        )
        
        if score > 75:
            return "high"
        elif score > 50:
            return "medium"
        else:
            return "low"
    
    def _calculate_overall_quality_score(
        self,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics
    ) -> float:
        """Calculate overall quality score."""
        return (
            code_metrics.maintainability_index * 0.4 +
            quality_metrics.architecture_score * 0.3 +
            security_metrics.security_score * 0.3
        )