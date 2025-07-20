"""Main FastAPI application for AI service."""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel

from .config import settings
from .services.openai_service import OpenAIService
from .services.text_service import TextService


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str
    version: str
    environment: str


class GenerateRequest(BaseModel):
    """Request model for text generation."""
    
    prompt: str
    max_tokens: int = 500
    temperature: float = 0.7
    model: str = "gpt-3.5-turbo"


class SummarizeRequest(BaseModel):
    """Request model for text summarization."""
    
    text: str
    max_length: int = 150
    min_length: int = 30


class AnalyzeRequest(BaseModel):
    """Request model for text analysis."""
    
    text: str
    analysis_type: str = "sentiment"  # sentiment, entities, keywords


class AIResponse(BaseModel):
    """Generic AI response model."""
    
    result: str
    metadata: dict = {}


# Global services
openai_service: OpenAIService | None = None
text_service: TextService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan events."""
    global openai_service, text_service
    
    logger.info("🚀 Starting AI Service...")
    
    # Initialize services
    openai_service = OpenAIService()
    text_service = TextService()
    
    logger.info("✅ AI Service started successfully")
    
    yield
    
    logger.info("🛑 Shutting down AI Service...")


# Create FastAPI app
app = FastAPI(
    title="0Unveiled AI Service",
    description="AI microservice for text generation, summarization, and analysis",
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
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        environment=settings.environment,
    )


@app.post("/api/ai/generate", response_model=AIResponse)
async def generate_text(request: GenerateRequest) -> AIResponse:
    """Generate text using AI models."""
    if not openai_service:
        raise HTTPException(status_code=503, detail="AI service not initialized")
    
    try:
        result = await openai_service.generate_text(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            model=request.model,
        )
        
        return AIResponse(
            result=result,
            metadata={
                "model": request.model,
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
            },
        )
    except Exception as e:
        logger.error(f"Text generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/summarize", response_model=AIResponse)
async def summarize_text(request: SummarizeRequest) -> AIResponse:
    """Summarize text content."""
    if not text_service:
        raise HTTPException(status_code=503, detail="Text service not initialized")
    
    try:
        result = await text_service.summarize(
            text=request.text,
            max_length=request.max_length,
            min_length=request.min_length,
        )
        
        return AIResponse(
            result=result,
            metadata={
                "original_length": len(request.text),
                "summary_length": len(result),
                "compression_ratio": len(result) / len(request.text),
            },
        )
    except Exception as e:
        logger.error(f"Text summarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze", response_model=AIResponse)
async def analyze_text(request: AnalyzeRequest) -> AIResponse:
    """Analyze text for sentiment, entities, or keywords."""
    if not text_service:
        raise HTTPException(status_code=503, detail="Text service not initialized")
    
    try:
        result = await text_service.analyze(
            text=request.text,
            analysis_type=request.analysis_type,
        )
        
        return AIResponse(
            result=str(result),
            metadata={
                "analysis_type": request.analysis_type,
                "text_length": len(request.text),
            },
        )
    except Exception as e:
        logger.error(f"Text analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "ai_service.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    ) 