"""GitHub token rotation manager for handling rate limits."""

import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

from loguru import logger


@dataclass
class TokenState:
    """State tracking for a GitHub token."""
    token: str
    remaining_requests: int = 5000
    reset_time: datetime = None
    last_used: datetime = None
    is_blocked: bool = False
    consecutive_failures: int = 0


class TokenRotator:
    """Manages GitHub token rotation to handle rate limits."""
    
    def __init__(self, tokens: List[str]):
        """Initialize with list of GitHub tokens."""
        self.tokens = {
            token: TokenState(token=token, reset_time=datetime.now())
            for token in tokens if token.strip()
        }
        self.current_token_index = 0
        self.last_rotation = datetime.now()
        
        if not self.tokens:
            logger.warning("No GitHub tokens provided - rate limiting will be severe")
        else:
            logger.info(f"Token rotator initialized with {len(self.tokens)} tokens")
    
    def get_next_available_token(self) -> Optional[str]:
        """Get the next available token for API requests."""
        if not self.tokens:
            return None
        
        # Sort tokens by availability (remaining requests, reset time)
        available_tokens = []
        
        for token_id, state in self.tokens.items():
            if not state.is_blocked:
                # Calculate priority score (higher is better)
                now = datetime.now()
                
                # Reset rate limit if enough time has passed
                if state.reset_time and now >= state.reset_time:
                    state.remaining_requests = 5000
                    state.is_blocked = False
                    state.consecutive_failures = 0
                    logger.info(f"Rate limit reset for token ending in ...{token_id[-4:]}")
                
                # Priority based on remaining requests and last usage
                priority = state.remaining_requests
                
                # Bonus for tokens that haven't been used recently
                if state.last_used:
                    minutes_since_use = (now - state.last_used).total_seconds() / 60
                    priority += min(100, minutes_since_use)  # Up to 100 bonus points
                
                available_tokens.append((token_id, priority, state))
        
        if not available_tokens:
            logger.warning("No available tokens - all are rate limited")
            return None
        
        # Sort by priority (highest first)
        available_tokens.sort(key=lambda x: x[1], reverse=True)
        
        # Select the best token
        best_token_id, _, best_state = available_tokens[0]
        best_state.last_used = datetime.now()
        
        logger.debug(f"Selected token ending in ...{best_token_id[-4:]} "
                    f"({best_state.remaining_requests} requests remaining)")
        
        return best_token_id
    
    def update_token_usage(
        self, 
        token: str, 
        remaining_requests: Optional[int] = None,
        reset_timestamp: Optional[int] = None,
        success: bool = True
    ) -> None:
        """Update token state after API request."""
        if token not in self.tokens:
            return
        
        state = self.tokens[token]
        state.last_used = datetime.now()
        
        if success:
            state.consecutive_failures = 0
        else:
            state.consecutive_failures += 1
            
            # Block token if too many failures
            if state.consecutive_failures >= 3:
                state.is_blocked = True
                logger.warning(f"Token ending in ...{token[-4:]} blocked due to repeated failures")
        
        # Update rate limit info from response headers
        if remaining_requests is not None:
            state.remaining_requests = remaining_requests
            
            # Block token if rate limited
            if remaining_requests <= 10:  # Keep small buffer
                state.is_blocked = True
                logger.info(f"Token ending in ...{token[-4:]} rate limited "
                           f"({remaining_requests} requests remaining)")
        
        if reset_timestamp is not None:
            state.reset_time = datetime.fromtimestamp(reset_timestamp)
            logger.debug(f"Rate limit resets at {state.reset_time} for token ...{token[-4:]}")
    
    def get_token_status(self) -> Dict[str, Dict]:
        """Get status of all tokens for monitoring."""
        status = {}
        
        for token_id, state in self.tokens.items():
            masked_token = f"...{token_id[-4:]}"
            status[masked_token] = {
                "remaining_requests": state.remaining_requests,
                "reset_time": state.reset_time.isoformat() if state.reset_time else None,
                "last_used": state.last_used.isoformat() if state.last_used else None,
                "is_blocked": state.is_blocked,
                "consecutive_failures": state.consecutive_failures
            }
        
        return status
    
    def get_total_capacity(self) -> Tuple[int, int]:
        """Get total capacity across all tokens."""
        total_remaining = sum(
            state.remaining_requests 
            for state in self.tokens.values() 
            if not state.is_blocked
        )
        
        total_tokens = len([
            state for state in self.tokens.values() 
            if not state.is_blocked
        ])
        
        return total_remaining, total_tokens
    
    def reset_blocked_tokens(self) -> int:
        """Reset tokens that should no longer be blocked."""
        reset_count = 0
        now = datetime.now()
        
        for state in self.tokens.values():
            if state.is_blocked and state.reset_time and now >= state.reset_time:
                state.is_blocked = False
                state.remaining_requests = 5000
                state.consecutive_failures = 0
                reset_count += 1
                logger.info(f"Unblocked token ending in ...{state.token[-4:]}")
        
        return reset_count