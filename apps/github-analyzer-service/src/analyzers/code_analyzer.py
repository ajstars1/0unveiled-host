"""Code analysis for metrics calculation."""

import ast
import re
from typing import List, Dict, Optional, Any
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
            '.ts': self._analyze_typescript_file,
            '.java': self._analyze_java_file,
            '.cpp': self._analyze_cpp_file,
            '.c': self._analyze_c_file,
            '.cs': self._analyze_csharp_file,
            '.go': self._analyze_go_file,
            '.rs': self._analyze_rust_file,
            '.php': self._analyze_php_file,
            '.rb': self._analyze_ruby_file,
        }
        
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
            cognitive_complexity=avg_complexity * 1.2,  # Approximation
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
        architecture_score = self._assess_architecture(structure)
        
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
        
        # Remove the extra dot - file_info.extension already doesn't have the dot
        return file_info.extension.lower() in code_extensions and file_info.size > 0
    
    async def _analyze_file_metrics(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze metrics for a single file."""
        extension = f".{file_info.extension.lower()}"
        
        if extension in self.supported_extensions:
            return await self.supported_extensions[extension](file_info)
        else:
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
            functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
            classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            
            # Calculate complexity (simplified McCabe)
            complexity = self._calculate_python_complexity(tree)
            
            # Calculate maintainability (simplified)
            maintainability = max(0, 100 - complexity * 2)
            
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
        """Analyze JavaScript file metrics."""
        return await self._analyze_generic_file(file_info)
    
    async def _analyze_typescript_file(self, file_info: FileInfo) -> Dict[str, Any]:
        """Analyze TypeScript file metrics."""
        return await self._analyze_generic_file(file_info)
    
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
        
        return {
            'total_lines': total_lines,
            'lines_of_code': lines_of_code,
            'comment_lines': comment_lines,
            'blank_lines': blank_lines,
            'file_size': len(file_info.content),
            'complexity': complexity,
            'maintainability': max(0, 100 - complexity),
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
        
        total_functions = 0
        documented_functions = 0
        
        for file_info in python_files:
            if not file_info.content:
                continue
            
            try:
                tree = ast.parse(file_info.content)
                functions = [node for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
                
                for func in functions:
                    total_functions += 1
                    
                    # Check if function has docstring
                    if (func.body and 
                        isinstance(func.body[0], ast.Expr) and 
                        isinstance(func.body[0].value, ast.Constant) and
                        isinstance(func.body[0].value.value, str)):
                        documented_functions += 1
                        
            except Exception:
                continue
        
        return (documented_functions / total_functions * 100) if total_functions > 0 else 0.0
    
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
        """Analyze testing metrics."""
        test_files = [f for f in files if 'test' in f.name.lower() or 'spec' in f.name.lower()]
        code_files = [f for f in files if self._is_code_file(f) and 'test' not in f.name.lower()]
        
        test_count = len(test_files)
        code_count = len(code_files)
        
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
        
        for file_info in files:
            if not self._is_code_file(file_info) or not file_info.content:
                continue
            
            # Check for type hints (Python)
            if file_info.extension.lower() == 'py':
                if ':' in file_info.content and '->' in file_info.content:
                    has_type_hints = True
            
            # Check for error handling
            error_keywords = ['try', 'catch', 'except', 'error', 'throw']
            if any(keyword in file_info.content.lower() for keyword in error_keywords):
                has_error_handling = True
            
            # Simple style violation detection (long lines)
            lines = file_info.content.split('\n')
            violations += sum(1 for line in lines if len(line) > 120)
        
        return {
            'violations': violations,
            'naming_consistency': 80.0,  # Placeholder
            'duplication': 5.0,  # Placeholder
            'has_type_hints': has_type_hints,
            'follows_conventions': violations < 10,
            'has_error_handling': has_error_handling
        }
    
    def _assess_architecture(self, structure: RepositoryStructure) -> float:
        """Assess overall architecture quality."""
        score = 50.0  # Base score
        
        # Bonus for good structure
        if structure.has_tests:
            score += 15.0
        
        if structure.has_docs:
            score += 10.0
        
        if structure.has_ci_config:
            score += 10.0
        
        if len(structure.package_managers) > 0:
            score += 10.0
        
        # Penalty for too many file types (might indicate lack of focus)
        if len(structure.file_types) > 10:
            score -= 5.0
        
        return min(100.0, max(0.0, score))