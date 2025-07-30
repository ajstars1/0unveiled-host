"""Configuration settings for the GitHub analyzer service."""

import os
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8002, alias="PORT")
    
    # CORS
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000", 
            "http://localhost:3001", 
            "http://localhost:8080",
            "https://0unveiled.com",
            "https://www.0unveiled.com"
        ],
        alias="CORS_ORIGINS"
    )
    
    # GitHub Integration
    github_token: str = Field(default="", alias="GITHUB_TOKEN")
    github_tokens_str: str = Field(default="", alias="GITHUB_TOKENS")
    github_token_rotation: bool = Field(default=True, alias="GITHUB_TOKEN_ROTATION")
    github_api_url: str = Field(default="https://api.github.com", alias="GITHUB_API_URL")
    
    @property
    def github_tokens(self) -> List[str]:
        """Parse comma-separated GitHub tokens."""
        if self.github_tokens_str:
            return [token.strip() for token in self.github_tokens_str.split(',') if token.strip()]
        return []
    
    # Database
    database_url: str = Field(default="", alias="DATABASE_URL")
    
    # Gemini AI
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    
    # Analysis settings
    max_file_size: int = Field(default=1024*1024, alias="MAX_FILE_SIZE")  # 1MB
    max_files_per_repo: int = Field(default=1000, alias="MAX_FILES_PER_REPO")
    supported_languages: List[str] = Field(
        default=[
            "python", "javascript", "typescript", "java", "cpp", "csharp", 
            "go", "rust", "php", "ruby", "swift", "kotlin", "scala", "r",
            "html", "css", "scss", "less", "sql", "shell", "yaml", "json"
        ],
        alias="SUPPORTED_LANGUAGES"
    )
    
    # Cache settings
    cache_ttl: int = Field(default=3600, alias="CACHE_TTL")  # 1 hour
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, alias="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=3600, alias="RATE_LIMIT_WINDOW")  # seconds
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()