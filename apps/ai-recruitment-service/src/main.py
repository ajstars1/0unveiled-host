"""Main FastAPI application for AI-powered recruitment service."""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel

from .config import settings
from .routes import recruitment, verification
from .services.ai_matcher import AIRecruiterService
from .services.verification_service import VerificationService
from .database import db_service


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str
    version: str
    environment: str
    services: dict


# Global services
ai_recruiter: AIRecruiterService | None = None
verification_service: VerificationService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan events."""
    global ai_recruiter, verification_service
    
    logger.info("Starting AI Recruitment Service...")
    
    # Initialize database
    await db_service.initialize()
    
    # Initialize services
    ai_recruiter = AIRecruiterService()
    verification_service = VerificationService()
    
    # Initialize AI models
    await ai_recruiter.initialize()
    
    # Verify services
    services_status = {
        "ai_recruiter": ai_recruiter.is_ready(),
        "verification_service": True,
        "database": await db_service.health_check(),
    }
    
    logger.info(f"Services initialized: {services_status}")
    
    yield
    
    logger.info("Shutting down AI Recruitment Service...")
    await db_service.close()


# Create FastAPI app
app = FastAPI(
    title="0Unveiled AI Recruitment Service",
    description="AI-powered candidate matching and verification service",
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
        "ai_recruiter": ai_recruiter.is_ready() if ai_recruiter else False,
        "verification_service": verification_service is not None,
        "database": await db_service.health_check(),
    }
    
    return HealthResponse(
        status="healthy" if all(services_status.values()) else "degraded",
        version="0.1.0",
        environment=settings.environment,
        services=services_status,
    )


# Include routers
app.include_router(recruitment.router, prefix="/api/recruitment", tags=["recruitment"])
app.include_router(verification.router, prefix="/api/verification", tags=["verification"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level="info",
    )
