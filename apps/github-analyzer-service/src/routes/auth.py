"""Authentication routes for GitHub OAuth integration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from ..services.analyzer_service import AnalyzerService


router = APIRouter(prefix="/auth", tags=["authentication"])


class AnalysisRequest(BaseModel):
    """Request model for repository analysis with user token."""
    access_token: str
    owner: str
    repo: str
    max_files: Optional[int] = 50


@router.post("/analyze-repository")
async def analyze_repository_with_user_token(request: AnalysisRequest):
    """Analyze a repository using the user's GitHub token."""
    try:
        logger.info(f"Analyzing {request.owner}/{request.repo} with user token")
        
        # Initialize analyzer service
        analyzer = AnalyzerService()
        
        # Perform analysis with user's token
        result = await analyzer.analyze_repository_simple(
            owner=request.owner,
            repo=request.repo,
            access_token=request.access_token,
            max_files=request.max_files
        )
        
        return {
            "success": True,
            "repository": {
                "full_name": result.repository.full_name,
                "description": result.repository.description,
                "stars": result.repository.stargazers_count,
                "forks": result.repository.forks_count,
                "language": result.repository.language,
                "size": result.repository.size,
            },
            "metrics": {
                "lines_of_code": result.code_metrics.lines_of_code,
                "total_lines": result.code_metrics.total_lines,
                "complexity": result.code_metrics.cyclomatic_complexity,
                "maintainability": result.code_metrics.maintainability_index,
                "technical_debt": result.code_metrics.technical_debt_ratio,
                "files_analyzed": result.code_metrics.total_files,
            },
            "quality": {
                "documentation_coverage": result.quality_metrics.docstring_coverage,
                "architecture_score": result.quality_metrics.architecture_score,
                "test_files": result.quality_metrics.test_files_count,
            },
            "security": {
                "security_score": result.security_metrics.security_score,
                "critical_issues": result.security_metrics.critical_issues,
                "security_hotspots": result.security_metrics.security_hotspots,
            },
            "ai_insights": {
                "overall_score": result.ai_insights.overall_quality_score if result.ai_insights else 0,
                "code_assessment": result.ai_insights.code_style_assessment if result.ai_insights else "No AI insights available",
                "architecture_assessment": result.ai_insights.architecture_assessment if result.ai_insights else "No AI insights available",
                "strengths": result.ai_insights.strengths if result.ai_insights else [],
                "project_maturity": result.ai_insights.project_maturity if result.ai_insights else "unknown",
            },
            "project_overview": {
                "raw_ai_analysis": result.ai_insights.code_style_assessment if result.ai_insights else "No detailed analysis available",
                "detailed_insights": result.ai_insights.architecture_assessment if result.ai_insights else "No architectural insights available",
                "gemini_recommendations": result.ai_insights.maintainability_assessment if result.ai_insights else "No maintainability insights available",
            },
            "overall_score": result.overall_score,
            "project_summary": result.ai_insights.project_summary if result.ai_insights else "No project summary available",
            "analysis_duration": result.analysis_duration,
            "files_discovered": result.files_discovered,
        }
        
    except Exception as e:
        logger.error(f"Repository analysis failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Analysis failed: {str(e)}"
        )
