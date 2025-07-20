"""OpenAI service for text generation."""

from typing import Optional

import openai
from loguru import logger

from ..config import settings


class OpenAIService:
    """Service for OpenAI API interactions."""
    
    def __init__(self) -> None:
        """Initialize the OpenAI service."""
        if not settings.openai_api_key:
            logger.warning("OpenAI API key not provided. Text generation will not work.")
            self.client = None
        else:
            self.client = openai.AsyncOpenAI(
                api_key=settings.openai_api_key,
                organization=settings.openai_organization if settings.openai_organization else None,
            )
            logger.info("OpenAI service initialized")
    
    async def generate_text(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        model: str = "gpt-3.5-turbo",
    ) -> str:
        """Generate text using OpenAI API."""
        if not self.client:
            raise RuntimeError("OpenAI client not initialized. Please provide API key.")
        
        # Validate inputs
        if max_tokens > settings.max_tokens_limit:
            max_tokens = settings.max_tokens_limit
        
        if not prompt.strip():
            raise ValueError("Prompt cannot be empty")
        
        try:
            logger.info(f"Generating text with model: {model}")
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            
            result = response.choices[0].message.content
            if not result:
                raise RuntimeError("Empty response from OpenAI API")
            
            logger.info(f"Text generation successful. Length: {len(result)}")
            return result.strip()
            
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise RuntimeError("Rate limit exceeded. Please try again later.")
        
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            raise RuntimeError("Authentication failed. Please check your API key.")
        
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            raise RuntimeError(f"Text generation failed: {str(e)}")
    
    async def is_available(self) -> bool:
        """Check if the OpenAI service is available."""
        if not self.client:
            return False
        
        try:
            # Try a simple API call to check connectivity
            await self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI service availability check failed: {e}")
            return False 