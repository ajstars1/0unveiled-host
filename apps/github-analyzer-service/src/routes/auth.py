"""Authentication routes for GitHub OAuth integration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger

from ..services.analyzer_service import AnalyzerService
from ..services.github_client import GitHubClient


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
        
        # Build languages breakdown from tech stack if available
        languages_breakdown = {}
        try:
            if result.tech_stack and result.tech_stack.languages:
                languages_breakdown = {
                    item.name: item.line_count for item in result.tech_stack.languages if getattr(item, 'line_count', None) is not None
                }
        except Exception as e:
            logger.warning(f"Failed to build languages breakdown: {e}")

        # Build simplified technology stack (arrays of names)
        simple_tech_stack = {
            "frameworks": [t.name for t in (result.tech_stack.frameworks or [])] if result.tech_stack else [],
            "databases": [t.name for t in (result.tech_stack.databases or [])] if result.tech_stack else [],
            "tools": [t.name for t in (result.tech_stack.tools or [])] if result.tech_stack else [],
            "languages": [t.name for t in (result.tech_stack.languages or [])] if result.tech_stack else [],
        }

        # Compute commit analysis (total commits and contributors)
        commit_analysis = {
            "total_commits": 0,
            "contributors": 0,
            "commit_frequency": "unknown",
            "latest_commit": None,
        }
        try:
            gh = GitHubClient()
            if request.access_token:
                gh.token = request.access_token
                gh.headers = gh._build_headers()

            contributors = await gh.get_repository_contributors(request.owner, request.repo)
            commit_analysis["contributors"] = len(contributors) if contributors else 0
            total_commits = 0
            if contributors:
                for c in contributors:
                    total_commits += int(c.get("contributions", 0))
            commit_analysis["total_commits"] = total_commits

            # Get latest commit timestamp (lightweight)
            commits_latest = await gh.get_repository_commits(request.owner, request.repo, per_page=1, max_pages=1)
            if commits_latest:
                commit = commits_latest[0]
                commit_analysis["latest_commit"] = commit.get("commit", {}).get("author", {}).get("date")
        except Exception as e:
            logger.warning(f"Failed to compute commit analysis: {e}")

        return {
            "success": True,
            "repository": {
                "full_name": result.repository.full_name,
                "description": result.repository.description,
                "stars": result.repository.stargazers_count,
                "forks": result.repository.forks_count,
                "language": result.repository.language,
                "size": result.repository.size,
                "languages": languages_breakdown,
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
                "maintainability_assessment": result.ai_insights.maintainability_assessment if result.ai_insights else "No maintainability insights available",
                # Map improvement areas to available fields: improvement_suggestions/weaknesses
                "improvement_areas": ("\n".join(result.ai_insights.improvement_suggestions) if getattr(result.ai_insights, 'improvement_suggestions', None) else None) or 
                                      ("\n".join(result.ai_insights.weaknesses) if getattr(result.ai_insights, 'weaknesses', None) else "No improvement recommendations available"),
                "strengths": result.ai_insights.strengths if result.ai_insights else [],
                "project_maturity": result.ai_insights.project_maturity if result.ai_insights else "unknown",
            },
            "technology_stack": simple_tech_stack,
            "commit_analysis": commit_analysis,
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
