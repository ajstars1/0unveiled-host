"""Configuration settings for the AI recruitment service."""

import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8002  # Different from existing analyzer service on 8080
    environment: str = os.getenv("NODE_ENV", "development")
    
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # AI/ML settings
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Environment variables that may be passed but aren't used directly
    node_env: str = os.getenv("NODE_ENV", "development")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # CORS settings
    cors_origins: List[str] = [
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3001",
        "https://0unveiled.com",
        "https://*.0unveiled.com",
    ]
    
    # Recruitment settings
    max_candidates_per_job: int = 100
    min_match_score: float = 60.0
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Verification settings
    auto_approval_threshold: float = 85.0
    manual_review_threshold: float = 70.0
    
    class Config:
        env_file = ".env"


settings = Settings()