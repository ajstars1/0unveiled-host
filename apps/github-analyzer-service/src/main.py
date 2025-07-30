"""Main FastAPI application for GitHub repository analysis."""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel

from .config import settings
from .routes import auth
from .services.github_client import GitHubClient
from .services.analyzer_service import AnalyzerService


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str
    version: str
    environment: str
    services: dict


# Global services
github_client: GitHubClient | None = None
analyzer_service: AnalyzerService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan events."""
    global github_client, analyzer_service
    
    logger.info("🚀 Starting GitHub Analyzer Service...")
    
    # Initialize services
    github_client = GitHubClient()
    analyzer_service = AnalyzerService()
    
    # Verify services
    services_status = {
        "github_client": github_client.is_configured(),
        "analyzer_service": True,
    }
    
    logger.info(f"✅ Services initialized: {services_status}")
    
    yield
    
    logger.info("🛑 Shutting down GitHub Analyzer Service...")


# Create FastAPI app
app = FastAPI(
    title="0Unveiled GitHub Analyzer",
    description="Repository analysis service for developer profiling and code quality assessment",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    services_status = {
        "github_client": github_client.is_configured() if github_client else False,
        "analyzer_service": analyzer_service is not None,
    }
    
    return HealthResponse(
        status="healthy" if all(services_status.values()) else "degraded",
        version="0.1.0",
        environment=settings.environment,
        services=services_status,
    )


# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level="info",
    )