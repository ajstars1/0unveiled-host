"""Code analysis for metrics calculation.

This module computes lightweight, language-aware repository metrics fast and safely:
- Robust file filtering (skip non-code, generated, binary, or huge files)
- Per-language heuristics (Python AST; JS/TS regex; generic fallback)
- Maintainability and complexity estimates per file with aggregation
- Quality metrics: docstrings, tests, style, duplication, and basic architecture

No third-party dependencies are required; the design favors deterministic
heuristics that work well across heterogeneous monorepos.
"""

import ast
import re
from typing import List, Dict, Optional, Any, Tuple
from pathlib import Path

from loguru import logger

from ..models.repository import FileInfo, RepositoryStructure
from ..models.metrics import CodeMetrics, QualityMetrics


class CodeAnalyzer:
    """Analyzer for code metrics and quality assessment."""
    
    def __init__(self):
        self.supported_extensions = {
            '.py': self._analyze_python_file,
            '.js': self._analyze_javascript_file,
            '.jsx': self._analyze_javascript_file,
            '.ts': self._analyze_typescript_file,
            '.tsx': self._analyze_typescript_file,
            '.java': self._analyze_generic_file,
            '.cpp': self._analyze_generic_file,
            '.c': self._analyze_generic_file,
            '.cs': self._analyze_generic_file,
            '.go': self._analyze_generic_file,
            '.rs': self._analyze_generic_file,
            '.php': self._analyze_generic_file,
            '.rb': self._analyze_generic_file,
            '.kt': self._analyze_generic_file,
            '.swift': self._analyze_generic_file,
        }
        
        # Skip very large files or obvious generated/minified files
        self.max_file_bytes = 750_000  # ~0.75 MB per file
        self.minified_length_threshold = 120  # long single lines typical of minified code
        
        # Directories we ignore (common vendor/build outputs)
        self.ignored_dirs = (
            '/node_modules/', '/dist/', '/build/', '/.next/', '/.turbo/', '/.git/',
            '/.venv/', '/venv/', '/site-packages/', '/target/', '/bin/', '/obj/',
            '/.idea/', '/.vscode/', '/.pnpm/', '/.cache/', '/coverage/', '/out/'
        )
        
        logger.info("Code analyzer initialized")
    
    async def analyze_code_metrics(self, files: List[FileInfo]) -> CodeMetrics:
        """Analyze code metrics across all files."""
        logger.info(f"Analyzing code metrics for {len(files)} files")
        
        total_lines = 0
        lines_of_code = 0
        comment_lines = 0
        blank_lines = 0
        total_files = 0
        file_sizes = []
        
        complexity_scores = []
        maintainability_scores = []
        function_complexities = []
        function_lengths = []
        
        for file_info in files:
            if not self._is_code_file(file_info):
                logger.debug(f"Skipping non-code file: {file_info.path} (ext: {file_info.extension})")
                continue
            if self._should_ignore_file(file_info):
                logger.debug(f"Skipping ignored/large/minified file: {file_info.path}")
                continue
            
            logger.info(f"Processing code file: {file_info.path} (ext: {file_info.extension}, size: {file_info.size})")
            
            try:
                # Get file metrics
                file_metrics = await self._analyze_file_metrics(file_info)
                
                total_lines += file_metrics.get('total_lines', 0)
                lines_of_code += file_metrics.get('lines_of_code', 0)
                comment_lines += file_metrics.get('comment_lines', 0)
                blank_lines += file_metrics.get('blank_lines', 0)
                total_files += 1
                file_sizes.append(file_metrics.get('file_size', 0))
                
                if file_metrics.get('complexity'):
                    complexity_scores.append(file_metrics['complexity'])
                
                if file_metrics.get('maintainability'):
                    maintainability_scores.append(file_metrics['maintainability'])
                
                function_complexities.extend(file_metrics.get('function_complexities', []))
                function_lengths.extend(file_metrics.get('function_lengths', []))
                
            except Exception as e:
                logger.warning(f"Failed to analyze file {file_info.path}: {e}")
                continue
        
        # Calculate aggregate metrics
        avg_complexity = sum(complexity_scores) / len(complexity_scores) if complexity_scores else 0.0
        avg_maintainability = sum(maintainability_scores) / len(maintainability_scores) if maintainability_scores else 0.0
        avg_file_size = sum(file_sizes) / len(file_sizes) if file_sizes else 0.0
        max_file_size = max(file_sizes) if file_sizes else 0
        
        avg_function_length = sum(function_lengths) / len(function_lengths) if function_lengths else 0.0
        max_function_complexity = max(function_complexities) if function_complexities else 0.0
        
        # Calculate technical debt ratio (simplified)
        technical_debt_ratio = min(1.0, avg_complexity / 10.0) if avg_complexity > 0 else 0.0
        
        return CodeMetrics(
            total_lines=total_lines,
            lines_of_code=lines_of_code,
            comment_lines=comment_lines,
            blank_lines=blank_lines,
            cyclomatic_complexity=avg_complexity,
            cognitive_complexity=avg_complexity * 1.15,  # Slight adjustment
            maintainability_index=avg_maintainability,
            technical_debt_ratio=technical_debt_ratio,
            total_files=total_files,
            average_file_size=avg_file_size,
            largest_file_size=max_file_size,
            total_functions=len(function_lengths),
            average_function_length=avg_function_length,
            max_function_complexity=max_function_complexity
        )
    
    async def analyze_quality_metrics(
        self, 
        files: List[FileInfo], 
        structure: RepositoryStructure
    ) -> QualityMetrics:
        """Analyze code quality metrics."""
        logger.info("Analyzing quality metrics")
        
        # Documentation metrics
        docstring_coverage = await self._calculate_docstring_coverage(files)
        comment_density = await self._calculate_comment_density(files)
        readme_quality = self._assess_readme_quality(structure)
        
        # Testing metrics
        test_metrics = self._analyze_test_metrics(files, structure)
        
        # Code style metrics
        style_metrics = await self._analyze_style_metrics(files)
        
        # Architecture metrics
        architecture_score = self._assess_architecture(structure, files)

        return QualityMetrics(
            docstring_coverage=docstring_coverage,
            comment_density=comment_density,
            readme_quality_score=readme_quality,
            test_coverage=test_metrics.get('coverage'),
            test_files_count=test_metrics.get('test_files', 0),
            test_to_code_ratio=test_metrics.get('ratio', 0.0),
            style_violations=style_metrics.get('violations', 0),
            naming_consistency=style_metrics.get('naming_consistency', 0.0),
            code_duplication=style_metrics.get('duplication', 0.0),
            has_type_hints=style_metrics.get('has_type_hints', False),
            follows_conventions=style_metrics.get('follows_conventions', False),
            has_error_handling=style_metrics.get('has_error_handling', False),
            dependency_count=len(structure.package_managers),
            circular_dependencies=0,  # Would need dependency graph analysis
            architecture_score=architecture_score
        )
    
    def _is_code_file(self, file_info: FileInfo) -> bool:
        """Check if file is a code file that should be analyzed."""
        code_extensions = {
            'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'cs', 
            'go', 'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'r'
        }
        ext = file_info.extension.lower()
        if ext not in code_extensions or file_info.size <= 0:
            return False
        # skip files in ignored directories
        path_lower = f"/{file_info.path.lower()}"  # leading slash to simplify contains checks
        if any(d in path_lower for d in self.ignored_dirs):
            return False
        return True

    def _should_ignore_file(self, file_info: FileInfo) -> bool:
        """Ignore binary, huge, or obviously minified/generated files."""
        if file_info.size > self.max_file_bytes:
            return True
        content = file_info.content or ""
        if not content:
            return True
        # Null byte indicates binary
        if "\x00" in content:
            return True
        # Many extremely long lines => minified
        long_lines = sum(1 for ln in content.split('\n') if len(ln) > self.minified_length_threshold)
        total_lines = max(1, content.count('\n') + 1)
        if long_lines / total_lines > 0.6 and total_lines > 100:
            return True
        return False
    
    async def _analyze_file_metrics(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze metrics for a single file."""
        extension = f".{file_info.extension.lower()}"
        
        if extension in self.supported_extensions:
            handler = self.supported_extensions[extension]
            return await handler(file_info)
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_python_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze Python file metrics."""
        logger.info(f"Analyzing Python file: {file_info.path}, content length: {len(file_info.content) if file_info.content else 0}")
        
        if not file_info.content:
            logger.warning(f"No content for file {file_info.path}")
            return self._default_metrics()
        
        try:
            # Parse AST
            tree = ast.parse(file_info.content)
            
            # Count lines
            lines = file_info.content.split('\n')
            total_lines = len(lines)
            blank_lines = sum(1 for line in lines if not line.strip())
            comment_lines = sum(1 for line in lines if line.strip().startswith('#'))
            lines_of_code = total_lines - blank_lines - comment_lines
            
            # Analyze functions and classes
            functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
            classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            
            # Calculate complexity (simplified McCabe)
            complexity = self._calculate_python_complexity(tree)
            
            # Calculate maintainability (light MI variant)
            maintainability = self._maintainability_index_simple(lines_of_code, complexity, comment_lines)
            
            function_complexities = []
            function_lengths = []
            
            for func in functions:
                func_complexity = self._calculate_python_complexity(func)
                func_lines = len(file_info.content[func.lineno:func.end_lineno].split('\n')) if hasattr(func, 'end_lineno') else 10
                
                function_complexities.append(func_complexity)
                function_lengths.append(func_lines)
            
            return {
                'total_lines': total_lines,
                'lines_of_code': lines_of_code,
                'comment_lines': comment_lines,
                'blank_lines': blank_lines,
                'file_size': len(file_info.content),
                'complexity': complexity,
                'maintainability': maintainability,
                'function_count': len(functions),
                'class_count': len(classes),
                'function_complexities': function_complexities,
                'function_lengths': function_lengths
            }
            
        except Exception as e:
            logger.warning(f"Failed to parse Python file {file_info.path}: {e}")
            return self._default_metrics()
    
    def _calculate_python_complexity(self, node) -> float:
        """Calculate cyclomatic complexity for Python AST node."""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor, ast.With, ast.AsyncWith)):
                complexity += 1
            elif isinstance(child, ast.ExceptHandler):
                complexity += 1
            elif isinstance(child, (ast.And, ast.Or)):
                complexity += 1
        
        return float(complexity)
    
    async def _analyze_javascript_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze JavaScript file metrics (regex-based heuristic)."""
        return await self._analyze_js_like_file(file_info, language='js')
    
    async def _analyze_typescript_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze TypeScript/TSX file metrics (regex-based heuristic)."""
        return await self._analyze_js_like_file(file_info, language='ts')
    
    async def _analyze_java_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze Java file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_cpp_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze C++ file metrics.""" 
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_c_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze C file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_csharp_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze C# file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_go_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze Go file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_rust_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze Rust file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_php_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze PHP file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_ruby_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze Ruby file metrics."""
        return await self._analyze_generic_file(file_info)

    async def _analyze_js_like_file(self, file_info: FileInfo, language: str) -> Dict[str, Any]:
        """Heuristic analyzer for JS/TS/JSX/TSX.

        Counts LOC, comments, simple cyclomatic complexity via control keywords,
        and approximates function lengths.
        """
        content = file_info.content or ""
        if not content:
            return self._default_metrics()

        lines = content.split('\n')
        total_lines = len(lines)
        # Comments: // and /* */ lines
        comment_lines = 0
        in_block_comment = False
        for ln in lines:
            s = ln.strip()
            if in_block_comment:
                comment_lines += 1
                if '*/' in s:
                    in_block_comment = False
                continue
            if s.startswith('//'):
                comment_lines += 1
                continue
            if s.startswith('/*'):
                comment_lines += 1
                if '*/' not in s:
                    in_block_comment = True
                continue
        blank_lines = sum(1 for ln in lines if not ln.strip())
        lines_of_code = max(0, total_lines - blank_lines - comment_lines)

        # Complexity by keywords
        code_lower = content.lower()
        keywords = [' if', ' else', ' while', ' for', ' switch', ' case', ' try', ' catch', ' finally', '&&', '||', '?']
        complexity = 1.0 + sum(code_lower.count(k) for k in keywords) * 0.5

        # Functions estimation by regex
        func_patterns = [
            r"function\s+[a-zA-Z0-9_]+\s*\(",  # function foo(
            r"=>\s*\{",                          # arrow functions with block
            r"\)\s*=>\s*[^\{]",                # concise arrow
            r"class\s+[A-Za-z0-9_]+"             # class
        ]
        import re as _re
        func_matches = sum(len(_re.findall(p, content)) for p in func_patterns)
        avg_func_length = float(lines_of_code / max(1, func_matches)) if func_matches else float(min(200, lines_of_code))

        maintainability = self._maintainability_index_simple(lines_of_code, complexity, comment_lines)

        return {
            'total_lines': total_lines,
            'lines_of_code': lines_of_code,
            'comment_lines': comment_lines,
            'blank_lines': blank_lines,
            'file_size': len(content),
            'complexity': float(max(1.0, complexity)),
            'maintainability': float(maintainability),
            'function_complexities': [float(max(1.0, complexity))],
            'function_lengths': [float(avg_func_length)],
        }
    
    async def _analyze_generic_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Generic file analysis for unsupported languages."""
        logger.info(f"Analyzing generic file: {file_info.path}, extension: {file_info.extension}, content length: {len(file_info.content) if file_info.content else 0}")
        
        if not file_info.content:
            logger.warning(f"No content for generic file {file_info.path}")
            return self._default_metrics()
        
        lines = file_info.content.split('\n')
        total_lines = len(lines)
        blank_lines = sum(1 for line in lines if not line.strip())
        
        # Estimate comment lines (simple heuristic)
        comment_patterns = ['//', '#', '/*', '*', '--', '"""', "'''"]
        comment_lines = 0
        for line in lines:
            stripped = line.strip()
            if any(stripped.startswith(pattern) for pattern in comment_patterns):
                comment_lines += 1
        
        lines_of_code = total_lines - blank_lines - comment_lines
        
        # Estimate complexity based on control flow keywords
        complexity_keywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'try', 'catch', 'except']
        complexity = sum(file_info.content.lower().count(keyword) for keyword in complexity_keywords)
        complexity = max(1.0, float(complexity))
        maintainability = self._maintainability_index_simple(lines_of_code, complexity, comment_lines)
        
        return {
            'total_lines': total_lines,
            'lines_of_code': lines_of_code,
            'comment_lines': comment_lines,
            'blank_lines': blank_lines,
            'file_size': len(file_info.content),
            'complexity': complexity,
            'maintainability': maintainability,
            'function_complexities': [complexity],
            'function_lengths': [total_lines]
        }
    
    def _default_metrics(self) -> Dict[str, Any]:
        """Return default metrics for files that can't be analyzed."""
        return {
            'total_lines': 0,
            'lines_of_code': 0,
            'comment_lines': 0,
            'blank_lines': 0,
            'file_size': 0,
            'complexity': 1.0,
            'maintainability': 50.0,
            'function_complexities': [],
            'function_lengths': []
        }
    
    async def _calculate_docstring_coverage(self, files: List[FileInfo]) -> float:
        """Calculate documentation coverage."""
        python_files = [f for f in files if f.extension.lower() == 'py']
        
        if not python_files:
            return 0.0
        
        total_items = 0
        documented_items = 0
        
        for file_info in python_files:
            if not file_info.content:
                continue
            
            try:
                tree = ast.parse(file_info.content)
                # module-level
                total_items += 1
                if (getattr(tree, 'body', []) and isinstance(tree.body[0], ast.Expr) and
                    isinstance(getattr(tree.body[0], 'value', None), ast.Constant) and
                    isinstance(tree.body[0].value.value, str)):
                    documented_items += 1

                # functions and classes
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                        total_items += 1
                        if (node.body and isinstance(node.body[0], ast.Expr) and
                            isinstance(getattr(node.body[0], 'value', None), ast.Constant) and
                            isinstance(node.body[0].value.value, str)):
                            documented_items += 1
                        
            except Exception:
                continue
        
        return (documented_items / total_items * 100.0) if total_items > 0 else 0.0
    
    async def _calculate_comment_density(self, files: List[FileInfo]) -> float:
        """Calculate comment density (comments per line of code)."""
        total_lines = 0
        total_comments = 0
        
        for file_info in files:
            if not self._is_code_file(file_info) or not file_info.content:
                continue
            
            lines = file_info.content.split('\n')
            total_lines += len(lines)
            
            # Count comment lines (simplified)
            for line in lines:
                stripped = line.strip()
                if (stripped.startswith('//') or stripped.startswith('#') or 
                    stripped.startswith('/*') or stripped.startswith('*')):
                    total_comments += 1
        
        return (total_comments / total_lines) if total_lines > 0 else 0.0
    
    def _assess_readme_quality(self, structure: RepositoryStructure) -> float:
        """Assess README quality."""
        if not structure.has_readme:
            return 0.0
        
        # Simple scoring based on presence
        score = 50.0  # Base score for having README
        
        # Bonus for other documentation indicators
        if structure.has_docs:
            score += 20.0
        
        if structure.has_license:
            score += 15.0
        
        if structure.has_ci_config:
            score += 15.0
        
        return min(100.0, score)
    
    def _analyze_test_metrics(self, files: List[FileInfo], structure: RepositoryStructure) -> Dict[str, Any]:
        """Analyze testing metrics using broader patterns across languages."""
        test_like = []
        code_like = []
        for f in files:
            name_lower = f.name.lower()
            path_lower = f.path.lower()
            is_test = (
                'test' in name_lower or 'spec' in name_lower or
                '/tests/' in path_lower or '/__tests__/' in path_lower or
                name_lower.startswith('test_') or name_lower.endswith('_test.py')
            )
            if is_test and self._is_code_file(f):
                test_like.append(f)
            elif self._is_code_file(f) and 'test' not in name_lower:
                code_like.append(f)

        test_count = len(test_like)
        code_count = len(code_like)
        ratio = (test_count / code_count) if code_count > 0 else 0.0
        
        return {
            'test_files': test_count,
            'ratio': ratio,
            'coverage': None  # Would need test execution to get real coverage
        }
    
    async def _analyze_style_metrics(self, files: List[FileInfo]) -> Dict[str, Any]:
        """Analyze code style metrics."""
        violations = 0
        has_type_hints = False
        has_error_handling = False
        snake_case_identifiers = 0
        camel_case_identifiers = 0
        total_identifiers = 0
        
        for file_info in files:
            if not self._is_code_file(file_info) or not file_info.content:
                continue
            
            # Check for type hints (Python)
            if file_info.extension.lower() == 'py':
                try:
                    tree = ast.parse(file_info.content)
                    # If any function arguments or returns have annotations, mark True
                    for node in ast.walk(tree):
                        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            if any(arg.annotation is not None for arg in node.args.args) or node.returns is not None:
                                has_type_hints = True
                                break
                except Exception:
                    # Fallback heuristic
                    if ':' in file_info.content and '->' in file_info.content:
                        has_type_hints = True
            
            # Check for error handling
            error_keywords = ['try', 'catch', 'except', 'error', 'throw']
            if any(keyword in file_info.content.lower() for keyword in error_keywords):
                has_error_handling = True
            
            # Simple style violation detection (long lines)
            lines = file_info.content.split('\n')
            violations += sum(1 for line in lines if len(line) > 120)

            # Naming consistency (very rough): count snake_case vs camelCase identifiers
            # Avoid heavy parsing for non-Python by using regex tokens
            import re as _re
            tokens = _re.findall(r"[A-Za-z_][A-Za-z0-9_]*", file_info.content)
            for t in tokens:
                if '_' in t and t.lower() == t and not t.startswith('_'):
                    snake_case_identifiers += 1
                    total_identifiers += 1
                elif _re.match(r"[a-z]+[A-Z][A-Za-z0-9]*", t):
                    camel_case_identifiers += 1
                    total_identifiers += 1
        
        # Naming consistency score (prefer consistency, not one style)
        naming_score = 0.0
        if total_identifiers > 20:  # need enough tokens
            dominant = max(snake_case_identifiers, camel_case_identifiers)
            ratio = dominant / max(1, snake_case_identifiers + camel_case_identifiers)
            naming_score = round(50 + (ratio - 0.5) * 100, 1)  # 0..100 centered around 50
            naming_score = max(0.0, min(100.0, naming_score))

        # Duplication: rough ratio of repeated normalized lines (ignore short lines)
        duplication_ratio = 0.0
        try:
            normalized: Dict[str, int] = {}
            for file_info in files:
                if not self._is_code_file(file_info) or not file_info.content:
                    continue
                for ln in file_info.content.split('\n'):
                    s = ln.strip()
                    if len(s) < 20:
                        continue
                    normalized[s] = normalized.get(s, 0) + 1
            repeated = sum(cnt for cnt in normalized.values() if cnt > 1)
            total_considered = sum(normalized.values())
            duplication_ratio = float(repeated / total_considered) if total_considered else 0.0
        except Exception:
            duplication_ratio = 0.0

        return {
            'violations': violations,
            'naming_consistency': naming_score,
            'duplication': round(duplication_ratio * 100.0, 1),
            'has_type_hints': has_type_hints,
            'follows_conventions': violations < 10,
            'has_error_handling': has_error_handling
        }
    
    def _assess_architecture(self, structure: RepositoryStructure, files: List[FileInfo]) -> float:
        """Assess overall architecture quality with simple, explainable heuristics."""
        score = 50.0  # Base score

        try:
            if getattr(structure, 'has_tests', False):
                score += 15.0
            if getattr(structure, 'has_docs', False):
                score += 10.0
            if getattr(structure, 'has_ci_config', False):
                score += 10.0
            if len(getattr(structure, 'package_managers', []) or []) > 0:
                score += 10.0
            if len(getattr(structure, 'file_types', []) or []) > 10:
                score -= 5.0

            # Path-based indicators
            lower_paths = [f.path.lower() for f in files]
            if any('/src/' in p for p in lower_paths):
                score += 5.0
            if any('/api/' in p or '/routes/' in p for p in lower_paths):
                score += 5.0
            if any('/services/' in p for p in lower_paths):
                score += 5.0
            if any('/migrations/' in p or '/drizzle/' in p for p in lower_paths):
                score += 3.0
        except Exception:
            pass

        return float(min(100.0, max(0.0, score)))

    # -----------------
    # Helper utilities
    # -----------------

    def _maintainability_index_simple(self, loc: int, complexity: float, comments: int) -> float:
        """Lightweight maintainability index approximation (0-100).

        Uses LOC, cyclomatic complexity, and comment lines to produce a
        bounded score. Not the official MI formula but stable and monotonic.
        """
        if loc <= 0:
            return 50.0
        comp_factor = min(10.0, max(1.0, float(complexity)))
        comment_ratio = max(0.0, min(1.0, comments / (loc + comments)))
        base = 100.0 - (comp_factor * 6.0) - (loc ** 0.5)
        boost = comment_ratio * 15.0
        return float(max(0.0, min(100.0, base + boost)))

    def _estimate_block_length(self, lines: List[str], start_lineno: int, end_lineno: Optional[int]) -> int:
        """Estimate block length for a function when end_lineno isn't set.

        If end_lineno missing, we walk forward from start to next unindented
        block or until EOF. This is a heuristic, but good enough for stats.
        """
        if end_lineno is not None and end_lineno >= start_lineno:
            return int(end_lineno - start_lineno + 1)
        idx = max(1, start_lineno) - 1
        if idx >= len(lines):
            return 0
        indent = len(lines[idx]) - len(lines[idx].lstrip())
        i = idx + 1
        while i < len(lines):
            line = lines[i]
            if line.strip() == '':
                i += 1
                continue
            current_indent = len(line) - len(line.lstrip())
            if current_indent <= indent:
                break
            i += 1
        return int(i - idx)