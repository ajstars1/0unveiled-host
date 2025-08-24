"""Technology stack analysis focused on recruiter-friendly, industry-standard outputs."""

from typing import Dict, List, Optional, Tuple
from loguru import logger
import json
import re

try:  # Python 3.11+
    import tomllib  # type: ignore
except Exception:  # pragma: no cover
    tomllib = None  # type: ignore

from ..models.repository import FileInfo, RepositoryStructure
from ..models.analysis import TechStack, TechnologyItem, TechStackCategory


class TechStackAnalyzer:
    """Analyzer for detecting and analyzing technology stacks.

    Goals:
    - Parse manifests to extract real dependencies and versions.
    - Detect modern, industry-standard technologies recruiters expect to see.
    - Populate categories: languages, frameworks, libraries, databases, tools, platforms,
      testing_frameworks, build_tools, deployment_tools.
    - Provide confidence scoring based on multiple signals (manifests, config files, code patterns).
    - Compute modernness and complexity using curated heuristics.
    """

    def __init__(self):
        logger.info("Tech stack analyzer initialized")

    async def analyze_tech_stack(
        self,
        files: List[FileInfo],
        structure: RepositoryStructure,
        languages: Dict[str, int],
    ) -> TechStack:
        """Analyze the technology stack of a repository."""
        logger.info(f"Analyzing tech stack for {len(files)} files")

        # Languages from GitHub's language breakdown (lines of code)
        detected_languages: List[TechnologyItem] = []
        for lang, count in (languages or {}).items():
            if not lang:
                continue
            detected_languages.append(
                TechnologyItem(
                    name=lang,
                    category=TechStackCategory.LANGUAGE,
                    confidence=min(1.0, max(0.2, count / 50_000)),
                    line_count=count,
                )
            )

        # Manifests and config-driven detection
        manifests = self._collect_manifests(files)
        ctx = self._build_detection_context(files, manifests)

        frameworks = self._detect_frameworks(ctx)
        libraries = self._detect_libraries(ctx)
        databases = self._detect_databases(ctx)
        tools = self._detect_tools(ctx)
        testing_frameworks = self._detect_testing(ctx)
        build_tools = self._detect_build_tools(ctx)
        deployment_tools = self._detect_deployment(ctx)
        platforms = self._detect_platforms(ctx)

        # Determine primary language from lines_of_code or presence of tsconfig/go.mod/etc.
        primary_language = self._determine_primary_language(detected_languages, ctx)

        # Compute summary scores
        complexity_score = self._calculate_complexity_score(
            detected_languages, frameworks, libraries, databases, tools
        )
        modernness_score = self._calculate_modernness_score(
            detected_languages, frameworks, libraries, tools, testing_frameworks, build_tools
        )

        total_technologies = (
            len(detected_languages)
            + len(frameworks)
            + len(libraries)
            + len(databases)
            + len(tools)
            + len(testing_frameworks)
            + len(build_tools)
            + len(deployment_tools)
            + len(platforms)
        )

        return TechStack(
            primary_language=primary_language,
            languages=detected_languages,
            frameworks=frameworks,
            libraries=libraries,
            databases=databases,
            tools=tools,
            platforms=platforms,
            testing_frameworks=testing_frameworks,
            build_tools=build_tools,
            deployment_tools=deployment_tools,
            total_technologies=total_technologies,
            complexity_score=complexity_score,
            modernness_score=modernness_score,
        )

    # ---------------------------
    # Manifests and context
    # ---------------------------
    def _collect_manifests(self, files: List[FileInfo]) -> Dict[str, List[FileInfo]]:
        """Group key manifests/config files by filename for quick access."""
        key_names = {
            "package.json",
            "pnpm-lock.yaml",
            "yarn.lock",
            "bun.lockb",
            "tsconfig.json",
            "pyproject.toml",
            "requirements.txt",
            "requirements-dev.txt",
            "Pipfile",
            "Pipfile.lock",
            "poetry.lock",
            "go.mod",
            "pom.xml",
            "build.gradle",
            "settings.gradle",
            "Gemfile",
            "Gemfile.lock",
            "composer.json",
            "Cargo.toml",
            "Dockerfile",
            "docker-compose.yml",
            "docker-compose.yaml",
            "serverless.yml",
            "terraform.tf",
            "main.tf",
            "README.md",
            "Makefile",
        }
        manifests: Dict[str, List[FileInfo]] = {}
        for f in files:
            if f.name in key_names or f.name.lower().endswith((".tf", ".yaml", ".yml")) or \
               ".github/workflows/" in f.path:
                manifests.setdefault(f.name, []).append(f)
        return manifests

    class _Ctx(Dict[str, object]):
        pass

    def _build_detection_context(self, files: List[FileInfo], manifests: Dict[str, List[FileInfo]]) -> "TechStackAnalyzer._Ctx":
        ctx: TechStackAnalyzer._Ctx = TechStackAnalyzer._Ctx()
        ctx["files"] = files
        ctx["manifests"] = manifests
        ctx["package_json"] = self._parse_package_json(manifests.get("package.json", []))
        ctx["tsconfig"] = True if any(f.name == "tsconfig.json" for f in files) else False
        ctx["pyproject"] = self._parse_toml(manifests.get("pyproject.toml", []))
        ctx["requirements"] = self._parse_requirements(manifests)
        ctx["docker"] = any(f.name == "Dockerfile" for f in files)
        ctx["compose"] = any(f.name.lower().startswith("docker-compose") for f in files)
        ctx["gha"] = any(".github/workflows/" in f.path for f in files)
        ctx["terraform"] = any(f.name.endswith(".tf") for f in files)
        ctx["serverless"] = any(f.name in {"serverless.yml", "serverless.yaml"} for f in files)
        # Quick path signals for ecosystems
        ctx["has_prisma_schema"] = any("schema.prisma" in f.name or "/prisma/" in f.path for f in files)
        ctx["has_drizzle"] = any("drizzle" in f.path.lower() for f in files)
        ctx["has_k8s"] = any("k8s/" in f.path or "kubernetes" in f.path.lower() for f in files)
        return ctx

    def _parse_package_json(self, files: List[FileInfo]) -> Dict[str, Dict[str, str]]:
        for f in files:
            if not f.content:
                continue
            try:
                data = json.loads(f.content)
                return {
                    "dependencies": data.get("dependencies", {}) or {},
                    "devDependencies": data.get("devDependencies", {}) or {},
                    "scripts": data.get("scripts", {}) or {},
                    "engines": data.get("engines", {}) or {},
                }
            except Exception:
                continue
        return {"dependencies": {}, "devDependencies": {}, "scripts": {}, "engines": {}}

    def _parse_toml(self, files: List[FileInfo]) -> Dict[str, object]:
        if not tomllib:
            return {}
        for f in files:
            if not f.content:
                continue
            try:
                return tomllib.loads(f.content.encode().decode())  # handle str input
            except Exception:
                try:
                    # tomllib expects bytes in some environments
                    return tomllib.loads(f.content.encode("utf-8"))  # type: ignore
                except Exception:
                    continue
        return {}

    def _parse_requirements(self, manifests: Dict[str, List[FileInfo]]) -> Dict[str, str]:
        reqs: Dict[str, str] = {}
        for name, files in manifests.items():
            if not name.lower().startswith("requirements"):
                continue
            for f in files:
                content = f.content or ""
                for line in content.splitlines():
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    # simple pkg[extra]==ver or pkg==ver or pkg>=ver etc.
                    m = re.match(r"([A-Za-z0-9_\-\.]+)(\[.*\])?\s*([<>=!~]=?\s*[^#\s]+)?", line)
                    if m:
                        pkg = m.group(1)
                        ver = (m.group(3) or "").strip()
                        reqs[pkg.lower()] = ver
        return reqs

    # ---------------------------
    # Detection helpers
    # ---------------------------
    def _determine_primary_language(self, langs: List[TechnologyItem], ctx: "TechStackAnalyzer._Ctx") -> Optional[str]:
        if not langs:
            # Heuristics from manifests
            pkg = ctx.get("package_json") or {}
            if pkg and (ctx.get("tsconfig") or "typescript" in (pkg.get("devDependencies", {}) or {})):
                return "TypeScript"
            if pkg:
                return "JavaScript"
            if (ctx.get("pyproject") or ctx.get("requirements")):
                return "Python"
            return None
        # choose top by line_count
        return max(langs, key=lambda t: (t.line_count or 0)).name

    def _add_item(self, items: Dict[str, TechnologyItem], name: str, category: TechStackCategory, 
                  confidence: float, version: Optional[str] = None, file_count: int = 0) -> None:
        key = name.lower()
        existing = items.get(key)
        if existing:
            # Merge: boost confidence and update version if known
            existing.confidence = min(1.0, max(existing.confidence, confidence) + 0.1)
            if version and not existing.version:
                existing.version = version
            existing.file_count = max(existing.file_count, file_count)
        else:
            items[key] = TechnologyItem(
                name=name,
                category=category,
                version=version,
                confidence=min(1.0, confidence),
                file_count=file_count,
            )

    def _detect_frameworks(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}
        files: List[FileInfo] = ctx.get("files")  # type: ignore

        # Frontend frameworks
        framework_signals: List[Tuple[str, TechStackCategory, str]] = [
            ("Next.js", TechStackCategory.FRAMEWORK, "next"),
            ("React", TechStackCategory.FRAMEWORK, "react"),
            ("Vue", TechStackCategory.FRAMEWORK, "vue"),
            ("Nuxt", TechStackCategory.FRAMEWORK, "nuxt"),
            ("Svelte", TechStackCategory.FRAMEWORK, "svelte"),
            ("Angular", TechStackCategory.FRAMEWORK, "@angular/core"),
        ]

        # Backend frameworks
        framework_signals += [
            ("Express", TechStackCategory.FRAMEWORK, "express"),
            ("NestJS", TechStackCategory.FRAMEWORK, "@nestjs/core"),
            ("Fastify", TechStackCategory.FRAMEWORK, "fastify"),
            ("Koa", TechStackCategory.FRAMEWORK, "koa"),
            ("Hapi", TechStackCategory.FRAMEWORK, "@hapi/hapi"),
            ("Django", TechStackCategory.FRAMEWORK, "django"),
            ("Flask", TechStackCategory.FRAMEWORK, "flask"),
            ("FastAPI", TechStackCategory.FRAMEWORK, "fastapi"),
            ("Spring Boot", TechStackCategory.FRAMEWORK, "spring-boot"),
            ("Rails", TechStackCategory.FRAMEWORK, "rails"),
        ]

        for label, cat, needle in framework_signals:
            ver = None
            conf = 0.0
            # JS ecosystem
            if needle in deps:
                ver = str(deps.get(needle))
                conf = 0.9
            # Python ecosystem via requirements/pyproject
            pyreqs = ctx.get("requirements") or {}
            if needle.lower() in pyreqs:
                ver = ver or str(pyreqs.get(needle.lower()))
                conf = max(conf, 0.8)
            # File pattern hints
            for f in files or []:
                nlow = f.name.lower()
                plow = f.path.lower()
                if any(s in nlow or s in plow for s in [needle.replace("@", "").split("/")[-1]]):
                    conf = max(conf, 0.5)
            if conf > 0:
                self._add_item(items, label, cat, conf, version=ver)

        # Special detection for Next.js via next.config, pages/app directory
        if any("next.config" in f.name for f in files or []):
            self._add_item(items, "Next.js", TechStackCategory.FRAMEWORK, 0.9, version=str(deps.get("next", "")))
        if any("/pages/" in f.path or "/app/" in f.path for f in files or []):
            if "next" in deps:
                self._add_item(items, "Next.js", TechStackCategory.FRAMEWORK, 0.8, version=str(deps.get("next", "")))

        return list(items.values())

    def _detect_libraries(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}
        pyreqs = ctx.get("requirements") or {}
        files: List[FileInfo] = ctx.get("files")  # type: ignore

        # JS/TS popular libraries
        common_js_libs = [
            ("TypeScript", "typescript"),
            ("Axios", "axios"),
            ("Lodash", "lodash"),
            ("Redux Toolkit", "@reduxjs/toolkit"),
            ("React Query", "@tanstack/react-query"),
            ("Zustand", "zustand"),
            ("Tailwind CSS", "tailwindcss"),
            ("Prisma", "prisma"),
            ("Drizzle ORM", "drizzle-orm"),
            ("TypeORM", "typeorm"),
            ("Sequelize", "sequelize"),
            ("Mongoose", "mongoose"),
            ("RxJS", "rxjs"),
        ]

        for label, needle in common_js_libs:
            if needle in deps:
                self._add_item(items, label, TechStackCategory.LIBRARY, 0.8, version=str(deps[needle]))

        # Python popular libraries
        common_py_libs = [
            ("Requests", "requests"),
            ("NumPy", "numpy"),
            ("Pandas", "pandas"),
            ("SQLAlchemy", "sqlalchemy"),
            ("Django REST Framework", "djangorestframework"),
            ("Pydantic", "pydantic"),
            ("FastAPI", "fastapi"),
        ]
        for label, needle in common_py_libs:
            if needle in pyreqs:
                self._add_item(items, label, TechStackCategory.LIBRARY, 0.75, version=str(pyreqs[needle]))

        # Tailwind config hint
        if any(f.name in {"tailwind.config.js", "tailwind.config.ts"} for f in files or []):
            self._add_item(items, "Tailwind CSS", TechStackCategory.LIBRARY, 0.8, version=str(deps.get("tailwindcss", "")))

        return list(items.values())

    def _detect_databases(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}
        pyreqs = ctx.get("requirements") or {}
        files: List[FileInfo] = ctx.get("files")  # type: ignore

        db_signals = [
            ("PostgreSQL", ["pg", "psycopg2", "asyncpg", "postgres"], 0.85),
            ("MySQL", ["mysql", "mysql2", "aiomysql"], 0.75),
            ("SQLite", ["sqlite3", "better-sqlite3"], 0.6),
            ("MongoDB", ["mongodb", "mongoose", "pymongo"], 0.8),
            ("Redis", ["redis"], 0.7),
            ("Elasticsearch", ["@elastic/elasticsearch", "elasticsearch"], 0.6),
        ]

        for label, needles, base_conf in db_signals:
            found = False
            ver: Optional[str] = None
            for n in needles:
                if n in deps:
                    ver = str(deps[n])
                    found = True
                if n.lower() in pyreqs:
                    ver = ver or str(pyreqs[n.lower()])
                    found = True
            if found:
                self._add_item(items, label, TechStackCategory.DATABASE, base_conf, version=ver)

        # ORM config hints
        if ctx.get("has_prisma_schema"):
            self._add_item(items, "PostgreSQL", TechStackCategory.DATABASE, 0.6)  # default guess with Prisma
        if ctx.get("has_drizzle"):
            self._add_item(items, "PostgreSQL", TechStackCategory.DATABASE, 0.55)

        # File extension hints
        for f in files or []:
            nlow = f.name.lower()
            plow = f.path.lower()
            if any(ext in nlow for ext in [".sql", ".psql"]):
                self._add_item(items, "PostgreSQL", TechStackCategory.DATABASE, 0.4)
            if ".sqlite" in nlow or nlow.endswith(".db"):
                self._add_item(items, "SQLite", TechStackCategory.DATABASE, 0.6)

        return list(items.values())

    def _detect_tools(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}
        pyreqs = ctx.get("requirements") or {}
        files: List[FileInfo] = ctx.get("files")  # type: ignore

        tool_defs = [
            ("ESLint", ["eslint"], 0.9),
            ("Prettier", ["prettier"], 0.9),
            ("Husky", ["husky"], 0.7),
            ("lint-staged", ["lint-staged"], 0.7),
            ("Commitlint", ["@commitlint/cli"], 0.6),
            ("Turborepo", ["turbo"], 0.7),
            ("Bun", ["bun"], 0.6),
            ("pnpm", ["pnpm"], 0.6),
            ("Yarn", ["yarn"], 0.5),
            ("Poetry", [], 0.6),
            ("Black", [], 0.7),
            ("Ruff", [], 0.7),
            ("mypy", [], 0.6),
            ("Docker", [], 0.9),
            ("GitHub Actions", [], 0.8),
        ]

        for label, needles, base_conf in tool_defs:
            found = False
            ver: Optional[str] = None
            for n in needles:
                if n in deps:
                    ver = str(deps[n])
                    found = True
            if label in {"Black", "Ruff", "mypy"}:
                if any((f.name == "pyproject.toml" and (f.content or "")) for f in files or []):
                    content = next((f.content or "" for f in files or [] if f.name == "pyproject.toml"), "")
                    if re.search(r"\b(black|ruff|mypy)\b", content):
                        found = True
            if label == "Poetry" and any("poetry" in (f.content or "") for f in files or [] if f.name == "pyproject.toml"):
                found = True
            if label == "Docker" and (ctx.get("docker") or ctx.get("compose")):
                found = True
            if label == "GitHub Actions" and ctx.get("gha"):
                found = True
            if found:
                self._add_item(items, label, TechStackCategory.TOOL, base_conf, version=ver)

        return list(items.values())

    def _detect_testing(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}
        pyreqs = ctx.get("requirements") or {}
        files: List[FileInfo] = ctx.get("files")  # type: ignore

        test_signals = [
            ("Jest", ["jest"], 0.85),
            ("Vitest", ["vitest"], 0.85),
            ("Testing Library", ["@testing-library/react"], 0.7),
            ("Cypress", ["cypress"], 0.8),
            ("Playwright", ["@playwright/test", "playwright"], 0.85),
            ("Mocha", ["mocha"], 0.6),
            ("Chai", ["chai"], 0.5),
            ("Pytest", [], 0.85),
        ]
        for label, needles, base_conf in test_signals:
            found = False
            ver: Optional[str] = None
            for n in needles:
                if n in deps:
                    ver = str(deps[n])
                    found = True
            if label == "Pytest":
                if "pytest" in pyreqs or any(f.name == "pytest.ini" for f in files or []):
                    ver = str(pyreqs.get("pytest", "")) if "pytest" in pyreqs else None
                    found = True
            if found:
                self._add_item(items, label, TechStackCategory.TESTING, base_conf, version=ver)
        return list(items.values())

    def _detect_build_tools(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}
        files: List[FileInfo] = ctx.get("files")  # type: ignore

        build_signals = [
            ("Vite", ["vite"], 0.9),
            ("Webpack", ["webpack"], 0.7),
            ("Rollup", ["rollup"], 0.6),
            ("Parcel", ["parcel"], 0.5),
            ("SWC", ["@swc/core"], 0.6),
            ("Babel", ["@babel/core", "babel"], 0.6),
            ("ts-node", ["ts-node"], 0.6),
            ("TSC", ["typescript"], 0.7),
        ]
        for label, needles, base_conf in build_signals:
            for n in needles:
                if n in deps:
                    self._add_item(items, label, TechStackCategory.BUILD, base_conf, version=str(deps[n]))
        # Makefile hint
        if any(f.name == "Makefile" for f in files or []):
            self._add_item(items, "Make", TechStackCategory.BUILD, 0.5)
        return list(items.values())

    def _detect_deployment(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        files: List[FileInfo] = ctx.get("files")  # type: ignore
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}

        # Docker/K8s
        if ctx.get("docker"):
            self._add_item(items, "Docker", TechStackCategory.DEPLOYMENT, 0.9)
        if ctx.get("compose"):
            self._add_item(items, "Docker Compose", TechStackCategory.DEPLOYMENT, 0.8)
        if ctx.get("has_k8s"):
            self._add_item(items, "Kubernetes", TechStackCategory.DEPLOYMENT, 0.7)

        # Serverless/Vercel/Netlify/PM2
        if ctx.get("serverless") or "serverless" in deps:
            self._add_item(items, "Serverless", TechStackCategory.DEPLOYMENT, 0.6)
        if any("vercel" in (f.content or "").lower() or "vercel" in f.name.lower() for f in files or []):
            self._add_item(items, "Vercel", TechStackCategory.DEPLOYMENT, 0.7)
        if any("netlify" in (f.content or "").lower() or "netlify" in f.name.lower() for f in files or []):
            self._add_item(items, "Netlify", TechStackCategory.DEPLOYMENT, 0.6)
        if "pm2" in deps:
            self._add_item(items, "PM2", TechStackCategory.DEPLOYMENT, 0.5)

        # CI
        if ctx.get("gha"):
            self._add_item(items, "GitHub Actions", TechStackCategory.DEPLOYMENT, 0.7)

        # Cloud from IaC
        cloud_items = self._detect_cloud(files)
        for it in cloud_items:
            items[it.name.lower()] = it
        return list(items.values())

    def _detect_platforms(self, ctx: "TechStackAnalyzer._Ctx") -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        pkg = ctx.get("package_json") or {}
        deps = {**(pkg.get("dependencies", {}) or {}), **(pkg.get("devDependencies", {}) or {})}

        if ctx.get("tsconfig") or "typescript" in deps:
            self._add_item(items, "TypeScript", TechStackCategory.PLATFORM, 0.9, version=str(deps.get("typescript", "")))
        if deps:
            self._add_item(items, "Node.js", TechStackCategory.PLATFORM, 0.8)
        if ctx.get("requirements"):
            self._add_item(items, "Python", TechStackCategory.PLATFORM, 0.8)
        return list(items.values())

    def _detect_cloud(self, files: List[FileInfo]) -> List[TechnologyItem]:
        items: Dict[str, TechnologyItem] = {}
        # Terraform/serverless hints
        for f in files or []:
            content = (f.content or "").lower()
            name = f.name.lower()
            path = f.path.lower()
            if name.endswith(".tf") or "terraform" in content:
                if "provider \"aws\"" in content:
                    self._add_item(items, "AWS", TechStackCategory.CLOUD, 0.8)
                if "provider \"google\"" in content or "google_cloud" in content:
                    self._add_item(items, "GCP", TechStackCategory.CLOUD, 0.7)
                if "provider \"azurerm\"" in content or "azure" in content:
                    self._add_item(items, "Azure", TechStackCategory.CLOUD, 0.7)
            if "serverless" in name or "serverless" in path:
                if "provider: aws" in content:
                    self._add_item(items, "AWS", TechStackCategory.CLOUD, 0.7)
            # SDK imports (rough)
            if "@aws-sdk" in content or "boto3" in content:
                self._add_item(items, "AWS", TechStackCategory.CLOUD, 0.6)
            if "@google-cloud" in content:
                self._add_item(items, "GCP", TechStackCategory.CLOUD, 0.6)
            if re.search(r"\bazure[\w\-]*\b", content):
                self._add_item(items, "Azure", TechStackCategory.CLOUD, 0.6)
        return list(items.values())

    # ---------------------------
    # Scoring
    # ---------------------------
    def _calculate_complexity_score(
        self,
        languages: List[TechnologyItem],
        frameworks: List[TechnologyItem],
        libraries: List[TechnologyItem],
        databases: List[TechnologyItem],
        tools: List[TechnologyItem],
    ) -> float:
        total = len(languages) + len(frameworks) + len(libraries) + len(databases) + len(tools)
        if total == 0:
            return 0.0
        # Weighted: frameworks and databases add more complexity
        complexity = (
            len(frameworks) * 12
            + len(databases) * 10
            + len(libraries) * 5
            + len(tools) * 4
            + len(languages) * 6
        )
        if len(languages) > 1:
            complexity += 10
        return float(min(100.0, complexity))

    def _calculate_modernness_score(
        self,
        languages: List[TechnologyItem],
        frameworks: List[TechnologyItem],
        libraries: List[TechnologyItem],
        tools: List[TechnologyItem],
        testing: List[TechnologyItem],
        build_tools: List[TechnologyItem],
    ) -> float:
        modern_set = {
            # Languages/platforms
            "typescript",
            "rust",
            "go",
            # Frontend
            "react",
            "next.js",
            "nextjs",
            "vue",
            "nuxt",
            "svelte",
            # Backend
            "fastapi",
            "nestjs",
            "express",
            # Data access
            "prisma",
            "drizzle orm",
            # Tooling
            "vite",
            "eslint",
            "prettier",
            "vitest",
            "playwright",
            "turborepo",
            "github actions",
            "docker",
        }
        score = 40.0
        all_items = languages + frameworks + libraries + tools + testing + build_tools
        for it in all_items:
            if it.name.lower() in modern_set:
                score += 8.0
        # Cap and floor
        return float(max(0.0, min(100.0, score)))