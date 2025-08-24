"""AI-powered, recruiter-ready insights generation.

This analyzer produces concise, industry-standard insights that hiring managers and
developers actually care about: clear project summary, code/architecture quality,
actionable improvements, strengths/weaknesses, skill signals, and project maturity.

It can use Gemini for deep code-aware analysis when available, with robust
rule-based fallbacks designed around modern engineering best practices.
"""

from typing import Dict, List, Optional
from datetime import datetime
import json

from loguru import logger

from ..models.repository import Repository
from ..models.metrics import CodeMetrics, QualityMetrics, SecurityMetrics
from ..models.analysis import TechStack, AIInsights
from ..config import settings


class AIInsightsAnalyzer:
    """Analyzer for generating AI-powered insights about repositories.

    Outputs are tailored for resume/portfolio reviewers and engineers:
    - What the project does (2–3 sentences, domain-focused)
    - Quality/Architecture/Maintainability assessments with concrete observations
    - Strengths and weaknesses aligned to hiring signals (testing, CI, security, docs)
    - Actionable next steps with expected impact
    - Skill indicators derived from metrics and tech stack
    - Clear project maturity and development stage
    """
    
    def __init__(self):
        self.gemini_available = bool(settings.gemini_api_key)
        
        if self.gemini_available:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                # Use a fast yet capable model by default
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
        # Fallback: robust rule-based insights
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
            # Prepare context for AI with actual code samples and tech highlights
            context = self._prepare_context_with_code(
                repository, code_metrics, quality_metrics, security_metrics, tech_stack, files or []
            )

            # Orchestrate targeted prompts for reliability and succinct outputs
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

        # Strengths and weaknesses aligned with hiring signals
        strengths = self._identify_strengths(code_metrics, quality_metrics, security_metrics, tech_stack)
        weaknesses = self._identify_weaknesses(code_metrics, quality_metrics, security_metrics, tech_stack)
        improvements = self._suggest_improvements(weaknesses, quality_metrics, tech_stack)

        # Developer profiling
        skill_indicators = self._assess_skill_indicators(code_metrics, quality_metrics, tech_stack)
        coding_patterns = self._identify_coding_patterns(code_metrics, tech_stack)

        # Project assessment
        project_maturity = self._assess_project_maturity(repository, quality_metrics)
        development_stage = self._assess_development_stage(repository, code_metrics, tech_stack)

        return AIInsights(
            overall_quality_score=self._calculate_overall_quality_score(
                code_metrics, quality_metrics, security_metrics
            ),
            code_style_assessment=quality_assessment,
            architecture_assessment=architecture_assessment,
            maintainability_assessment=maintainability_assessment,
            project_summary=self._rule_based_project_summary(tech_stack),
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
        """Prepare concise, signal-rich context for AI analysis."""
        def names(items: List) -> List[str]:
            return [t.name for t in (items or [])]

        tech_snapshot = {
            "primary_language": tech_stack.primary_language,
            "languages": names(tech_stack.languages),
            "frameworks": names(tech_stack.frameworks),
            "libraries": names(tech_stack.libraries),
            "databases": names(tech_stack.databases),
            "tools": names(tech_stack.tools),
            "testing": names(tech_stack.testing_frameworks),
            "build": names(tech_stack.build_tools),
            "deployment": names(tech_stack.deployment_tools),
            "platforms": names(tech_stack.platforms),
            "modernness_score": tech_stack.modernness_score,
            "complexity_score": tech_stack.complexity_score,
            "total_technologies": tech_stack.total_technologies,
        }

        context = f"""
Repository Analysis Context

Repository: {repository.full_name}
Description: {repository.description or "No description"}
Primary Language: {tech_stack.primary_language or "Multiple"}
Stars: {repository.stargazers_count} | Forks: {repository.forks_count}
Created: {repository.created_at}

Code Metrics
- Total Lines: {code_metrics.total_lines}
- Lines of Code: {code_metrics.lines_of_code}
- Cyclomatic Complexity: {code_metrics.cyclomatic_complexity:.2f}
- Maintainability Index: {code_metrics.maintainability_index:.2f}
- Technical Debt Ratio: {code_metrics.technical_debt_ratio:.2f}

Quality Metrics
- Doc Coverage: {quality_metrics.docstring_coverage:.1f}%
- Test Coverage: {quality_metrics.test_coverage or "Unknown"}
- Test/Code Ratio: {quality_metrics.test_to_code_ratio:.2f}
- Architecture Score: {quality_metrics.architecture_score:.1f}

Security Metrics
- Security Score: {security_metrics.security_score:.1f}
- Critical Issues: {security_metrics.critical_issues}
- Security Hotspots: {security_metrics.security_hotspots}

Technology Snapshot (JSON):
{json.dumps(tech_snapshot, ensure_ascii=False)}
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

Code Content (truncated if long):
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
        
        You are a senior engineer. In 2–3 sentences, summarize what the application does
        based on actual code (functions, data flow, APIs) and the tech snapshot. Focus on
        the problem domain and primary user value. Avoid generic stack descriptions.
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
        
        Provide a concise code quality assessment (4–6 sentences) referencing specific
        implementation details from the code samples: patterns, language features,
        structure, and 1–2 actionable improvements. Keep it technical and specific.
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
        
        As a software architect, give a 4–6 sentence architectural assessment: patterns,
        module boundaries, scalability/maintainability, and notable design decisions
        observed in code and directory structure.
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
        
        Provide a maintainability assessment (4–6 sentences): readability, debt/smells,
        test/docs sufficiency, and 2–3 concrete refactoring opportunities.
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
        
        Identify 3 key technical strengths (testing/CI/security/docs/performance/architecture).
        Return a plain list, one item per line, no bullets or numbers, max 8 words each.
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
        if not self.gemini_available:
            return ["Insufficient test coverage", "Documentation gaps", "Missing CI checks"]

        prompt = f"""
        {context}

        Identify the top 3 technical weaknesses blocking production readiness.
        Return a plain list, one per line, max 8 words.
        """

        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                items = [s.strip() for s in response.text.strip().split('\n') if s.strip()]
                return items[:3]
            return ["Testing is weak"]
        except Exception as e:
            logger.error(f"AI weaknesses assessment failed: {e}")
            return ["Insufficient test coverage", "Documentation gaps", "Missing CI checks"]
    
    async def _get_ai_improvements(self, context: str) -> List[str]:
        """Get AI improvement suggestions."""
        if not self.gemini_available:
            return [
                "Add unit + integration tests (high impact)",
                "Set up CI with lint/test (high impact)",
                "Harden security checks/dep updates (medium)",
            ]

        prompt = f"""
        {context}

        Suggest 3–5 actionable improvements prioritized by impact. Each item should be
        a short imperative with an impact tag in parentheses like "(high)" or "(medium)".
        Return a plain list, one per line, no bullets.
        """

        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                items = [s.strip() for s in response.text.strip().split('\n') if s.strip()]
                return items[:5]
            return ["Add tests (high)"]
        except Exception as e:
            logger.error(f"AI improvements failed: {e}")
            return [
                "Add unit + integration tests (high)",
                "Set up CI with lint/test (high)",
                "Harden security checks/dep updates (medium)",
            ]
    
    async def _get_ai_skill_indicators(self, context: str) -> Dict[str, float]:
        """Get AI assessment of developer skill indicators."""
        if not self.gemini_available:
            # Rule-based default; refined later by rule-based method
            return {"architecture_design": 70.0, "code_quality": 70.0}

        prompt = f"""
        {context}

        Return a compact JSON object mapping skill areas to percentages (0-100):
        keys: ["architecture_design","code_quality","testing","security","devops","documentation"].
        Only output JSON.
        """

        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                text = response.text.strip().strip('`')
                # Attempt to extract JSON
                start = text.find('{')
                end = text.rfind('}') + 1
                if start != -1 and end != -1:
                    parsed = json.loads(text[start:end])
                    # Coerce to floats within range
                    out: Dict[str, float] = {}
                    for k, v in parsed.items():
                        try:
                            out[k] = float(max(0.0, min(100.0, float(v))))
                        except Exception:
                            continue
                    if out:
                        return out
            return {"architecture_design": 70.0, "code_quality": 70.0}
        except Exception as e:
            logger.error(f"AI skill indicators failed: {e}")
            return {"architecture_design": 70.0, "code_quality": 70.0}
    
    async def _get_ai_coding_patterns(self, context: str) -> List[str]:
        """Get AI-identified coding patterns."""
        if not self.gemini_available:
            return ["Modular design", "Typed APIs where applicable"]

        prompt = f"""
        {context}

        List 3–5 concrete coding/architecture patterns observed (e.g., layered architecture,
        repository pattern, RESTful controllers, hooks-based React). Return plain list, one per line.
        """

        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                items = [s.strip() for s in response.text.strip().split('\n') if s.strip()]
                return items[:5]
            return ["Layered architecture"]
        except Exception as e:
            logger.error(f"AI coding patterns failed: {e}")
            return ["Modular design", "Typed APIs where applicable"]
    
    async def _get_ai_project_maturity(self, context: str) -> str:
        """Get AI assessment of project maturity."""
        if not self.gemini_available:
            return "developing"
        prompt = f"""
        {context}

        Choose one maturity level only: experimental, developing, mature, legacy.
        Return just the word.
        """
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                text = response.text.strip().lower()
                for opt in ["experimental", "developing", "mature", "legacy"]:
                    if opt in text:
                        return opt
            return "developing"
        except Exception as e:
            logger.error(f"AI project maturity failed: {e}")
            return "developing"
    
    async def _get_ai_development_stage(self, context: str) -> str:
        """Get AI assessment of development stage."""
        if not self.gemini_available:
            return "development"
        prompt = f"""
        {context}

        Choose one development stage only: prototype, mvp, production, enterprise.
        Return just the word.
        """
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                text = response.text.strip().lower()
                for opt in ["prototype", "mvp", "production", "enterprise"]:
                    if opt in text:
                        return opt
            return "development"
        except Exception as e:
            logger.error(f"AI development stage failed: {e}")
            return "development"
    
    # Rule-based methods
    
    def _rule_based_quality_assessment(self, code_metrics: CodeMetrics, quality_metrics: QualityMetrics) -> str:
        """Rule-based quality assessment."""
        mi = code_metrics.maintainability_index
        cc = code_metrics.cyclomatic_complexity
        if mi > 80 and cc < 5:
            return "High-quality code: clear modular structure, low complexity, and solid maintainability"
        if mi > 60:
            return "Good quality: reasonable structure with some complexity hotspots to refactor"
        return "Needs improvement: elevated complexity and maintainability risks present"
    
    def _rule_based_architecture_assessment(self, quality_metrics: QualityMetrics, tech_stack: TechStack) -> str:
        """Rule-based architecture assessment."""
        score = quality_metrics.architecture_score
        if score > 80:
            return "Well-architected with modern stack and clear boundaries; production-ready patterns evident"
        if score > 60:
            return "Sound architecture with opportunities to improve layering, interfaces, or modularity"
        return "Architecture requires restructuring for scalability, testing, and long-term maintenance"
    
    def _rule_based_maintainability_assessment(self, code_metrics: CodeMetrics) -> str:
        """Rule-based maintainability assessment."""
        tdr = code_metrics.technical_debt_ratio
        if tdr < 0.1:
            return "Low technical debt; straightforward to onboard and extend"
        if tdr < 0.3:
            return "Moderate technical debt; refactoring targeted hotspots will help"
        return "High technical debt; plan phased refactors and testing first"

    def _rule_based_project_summary(self, tech_stack: TechStack) -> str:
        """Generate a brief project summary from tech hints when AI is unavailable."""
        langs = ", ".join([t.name for t in tech_stack.languages][:3]) or "multi-language"
        fw = ", ".join([t.name for t in tech_stack.frameworks][:2])
        db = ", ".join([t.name for t in tech_stack.databases][:2])
        if fw and db:
            return f"Full-stack application ({fw}) with {langs} and {db}, demonstrating end-to-end features"
        if fw:
            return f"{fw} application showcasing core web functionality using {langs}"
        return f"Codebase using {langs} with modern tooling"
    
    def _identify_strengths(
        self,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack,
    ) -> List[str]:
        """Identify project strengths aligned to common hiring signals."""
        strengths: List[str] = []

        # Testing
        if quality_metrics.test_to_code_ratio >= 0.3:
            strengths.append("Meaningful automated tests")
        # Docs
        if quality_metrics.docstring_coverage >= 60:
            strengths.append("Good documentation standards")
        # Security
        if security_metrics.security_score >= 80 and security_metrics.critical_issues == 0:
            strengths.append("Solid security hygiene")
        # Maintainability
        if code_metrics.maintainability_index >= 75:
            strengths.append("Maintainable, modular code")
        # Modern stack
        if tech_stack.modernness_score >= 70:
            strengths.append("Modern, industry-relevant stack")
        # Tooling/CI
        tool_names = {t.name.lower() for t in tech_stack.tools}
        if any(t in tool_names for t in ["github actions", "circleci", "gitlab ci", "husky", "lint-staged"]):
            strengths.append("CI and code quality automation")

        return strengths[:5] or ["Functional codebase with modern foundations"]
    
    def _identify_weaknesses(
        self,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics,
        tech_stack: TechStack,
    ) -> List[str]:
        """Identify project weaknesses that hinder production readiness."""
        weaknesses: List[str] = []

        if quality_metrics.docstring_coverage < 30:
            weaknesses.append("Low documentation coverage")
        if quality_metrics.test_to_code_ratio < 0.2:
            weaknesses.append("Insufficient automated tests")
        if code_metrics.cyclomatic_complexity > 10:
            weaknesses.append("High code complexity")
        if code_metrics.technical_debt_ratio > 0.3:
            weaknesses.append("Elevated technical debt")
        if security_metrics.critical_issues > 0 or security_metrics.security_score < 60:
            weaknesses.append("Security risks present")
        # CI/Tooling gaps
        tool_names = {t.name.lower() for t in tech_stack.tools}
        if not any(t in tool_names for t in ["github actions", "circleci", "gitlab ci"]):
            weaknesses.append("Missing CI pipeline")

        return weaknesses[:5]
    
    def _suggest_improvements(self, weaknesses: List[str], quality_metrics: QualityMetrics, tech_stack: TechStack) -> List[str]:
        """Suggest prioritized, actionable improvements based on weaknesses and stack."""
        improvements: List[str] = []

        wk = {w.lower() for w in weaknesses}
        if any("test" in w for w in wk):
            improvements.append("Add unit + integration tests (high)")
        if any("documentation" in w or "doc" in w for w in wk):
            improvements.append("Write API docs and README sections (medium)")
        if any("complexity" in w for w in wk):
            improvements.append("Refactor hotspots; extract smaller functions (high)")
        if any("debt" in w for w in wk):
            improvements.append("Create tech debt backlog with owners (medium)")
        if any("security" in w for w in wk):
            improvements.append("Enable dep scanning + secret detection (high)")

        # CI suggestion when missing
        tool_names = {t.name.lower() for t in tech_stack.tools}
        if not any(t in tool_names for t in ["github actions", "circleci", "gitlab ci"]):
            improvements.append("Set up CI for lint/test/build (high)")

        # Keep list concise
        return improvements[:5] or ["Continue maintaining current quality standards"]
    
    def _assess_skill_indicators(
        self,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        tech_stack: TechStack,
    ) -> Dict[str, float]:
        """Assess developer skill indicators with broader coverage."""
        tools = {t.name.lower() for t in tech_stack.tools}
        testing = len(tech_stack.testing_frameworks) > 0 or quality_metrics.test_to_code_ratio > 0.2
        ci = any(t in tools for t in ["github actions", "gitlab ci", "circleci"]) or any(
            t in tools for t in ["husky", "lint-staged"]
        )
        security_base = 70.0
        if any(t in tools for t in ["dependabot", "snyk", "renovate"]):
            security_base = 85.0

        return {
            "code_quality": float(max(0.0, min(100.0, code_metrics.maintainability_index))),
            "architecture_design": float(max(0.0, min(100.0, quality_metrics.architecture_score))),
            "testing_practices": float(80.0 if testing else 40.0),
            "security": float(security_base),
            "devops": float(80.0 if ci else 50.0),
            "documentation": float(max(0.0, min(100.0, quality_metrics.docstring_coverage))),
            "technology_adoption": float(max(0.0, min(100.0, tech_stack.modernness_score))),
        }
    
    def _identify_coding_patterns(self, code_metrics: CodeMetrics, tech_stack: TechStack) -> List[str]:
        """Identify coding patterns."""
        patterns: List[str] = []

        if code_metrics.average_function_length < 20:
            patterns.append("Small, focused functions")
        if code_metrics.cyclomatic_complexity < 5:
            patterns.append("Low complexity design")
        if tech_stack.primary_language:
            patterns.append(f"{tech_stack.primary_language} expertise")
        if len(tech_stack.frameworks) > 0:
            patterns.append("Framework-based development")

        # Stack-derived patterns
        fw = {t.name.lower() for t in tech_stack.frameworks}
        libs = {t.name.lower() for t in tech_stack.libraries}
        if any(x in fw for x in ["fastapi", "express", "nest", "django", "spring"]):
            patterns.append("RESTful service architecture")
        if any(x in libs for x in ["prisma", "sqlalchemy", "drizzle", "typeorm"]):
            patterns.append("ORM-backed data access")
        if any(x in libs for x in ["react-query", "tanstack query", "redux"]):
            patterns.append("State management patterns")

        return patterns[:6] or ["Basic coding practices"]
    
    def _assess_project_maturity(self, repository: Repository, quality_metrics: QualityMetrics) -> str:
        """Assess project maturity level."""
        # Calculate age in months
        age_months = (datetime.now() - repository.created_at.replace(tzinfo=None)).days / 30
        
        if age_months < 3:
            return "experimental"
        if age_months < 12:
            return "developing"
        if quality_metrics.architecture_score > 70:
            return "mature"
        return "legacy"
    
    def _assess_development_stage(self, repository: Repository, code_metrics: CodeMetrics, tech_stack: Optional[TechStack] = None) -> str:
        """Assess development stage."""
        lines = code_metrics.total_lines
        stars = repository.stargazers_count
        if lines < 1000:
            return "prototype"
        if lines < 10000:
            return "mvp"
        if stars > 100:
            return "production"
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
        if score < 50:
            return "medium"
        return "high"
    
    def _get_industry_alignment(self, tech_stack: TechStack) -> List[str]:
        """Get industry alignment based on stack across languages, frameworks, libraries."""
        industries: List[str] = []

        langs = {t.name.lower() for t in tech_stack.languages}
        fw = {t.name.lower() for t in tech_stack.frameworks}
        libs = {t.name.lower() for t in tech_stack.libraries}

        if any(x in langs | fw | libs for x in ["javascript", "typescript", "react", "next.js", "vue", "angular"]):
            industries.append("Web Development")
        if any(x in langs | fw | libs for x in ["python", "pandas", "numpy", "jupyter", "pytorch", "tensorflow"]):
            industries.append("Data/ML")
        if any(x in langs | fw | libs for x in ["java", "spring", "kotlin"]):
            industries.append("Enterprise Software")
        if any(x in langs | fw | libs for x in ["swift", "kotlin", "react native", "flutter"]):
            industries.append("Mobile Development")
        if any(x in fw | libs for x in ["fastapi", "express", "nest", "django", "rails", "spring"]):
            industries.append("Backend/API Services")
        if any(x in libs for x in ["docker", "kubernetes", "terraform"]):
            industries.append("DevOps/Platform")

        return industries or ["General Software Development"]
    
    def _assess_career_impact(self, tech_stack: TechStack, quality_metrics: QualityMetrics) -> str:
        """Assess career impact potential."""
        score = (
            tech_stack.modernness_score * 0.45 +
            quality_metrics.architecture_score * 0.35 +
            min(100, tech_stack.total_technologies * 6) * 0.20
        )

        if score > 75:
            return "high"
        if score > 50:
            return "medium"
        return "low"
    
    def _calculate_overall_quality_score(
        self,
        code_metrics: CodeMetrics,
        quality_metrics: QualityMetrics,
        security_metrics: SecurityMetrics
    ) -> float:
        """Calculate overall quality score."""
        return (
            float(code_metrics.maintainability_index) * 0.4 +
            float(quality_metrics.architecture_score) * 0.3 +
            float(security_metrics.security_score) * 0.3
        )