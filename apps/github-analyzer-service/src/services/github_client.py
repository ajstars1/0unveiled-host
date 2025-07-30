"""GitHub API client for repository data fetching."""

import asyncio
import base64
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

import httpx
from loguru import logger

from ..config import settings
from ..models.repository import Repository, FileInfo
from .token_rotator import TokenRotator


class GitHubClient:
    """Client for interacting with GitHub API."""
    
    def __init__(self):
        self.api_url = settings.github_api_url
        self.token = settings.github_token
        
        # Initialize token rotator if multiple tokens are available
        all_tokens = []
        if settings.github_tokens:
            all_tokens.extend(settings.github_tokens)
        if settings.github_token:
            all_tokens.append(settings.github_token)
        
        self.token_rotator = TokenRotator(all_tokens) if settings.github_token_rotation and all_tokens else None
        self.headers = self._build_headers()
        
        # Rate limiting
        self.requests_made = 0
        self.rate_limit_remaining = 5000
        self.rate_limit_reset = None
        
        if self.token_rotator:
            remaining, token_count = self.token_rotator.get_total_capacity()
            logger.info(f"GitHub client initialized with {token_count} tokens ({remaining} total requests)")
        else:
            logger.info("GitHub client initialized with single token")
    
    def _build_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        """Build headers for GitHub API requests."""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "0Unveiled-Analyzer/1.0",
        }
        
        # Use provided token or get from rotator or fall back to default
        auth_token = token or (self.token_rotator.get_next_available_token() if self.token_rotator else None) or self.token
        
        if auth_token:
            # Support both Bearer and token formats for compatibility
            if auth_token.startswith('ghp_') or auth_token.startswith('github_pat_'):
                headers["Authorization"] = f"Bearer {auth_token}"
            else:
                headers["Authorization"] = f"token {auth_token}"
        
        return headers
    
    def is_configured(self) -> bool:
        """Check if GitHub client is properly configured."""
        return bool(self.token)
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict] = None,
        timeout: int = 30,
        retry_count: int = 3
    ) -> Dict[str, Any]:
        """Make an authenticated request to GitHub API with token rotation."""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        for attempt in range(retry_count):
            # Get token for this request
            current_token = None
            if self.token_rotator:
                current_token = self.token_rotator.get_next_available_token()
                if not current_token:
                    logger.warning("No available tokens - all are rate limited")
                    raise Exception("All GitHub tokens are rate limited")
            else:
                current_token = self.token
            
            # Build headers with current token
            headers = self._build_headers(current_token)
            
            async with httpx.AsyncClient(timeout=timeout) as client:
                try:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        params=params or {},
                    )
                    
                    # Extract rate limit info from headers
                    remaining = int(response.headers.get("X-RateLimit-Remaining", 0))
                    reset_timestamp = response.headers.get("X-RateLimit-Reset")
                    reset_ts = int(reset_timestamp) if reset_timestamp else None
                    
                    # Update global rate limit tracking
                    self.rate_limit_remaining = remaining
                    if reset_ts:
                        self.rate_limit_reset = datetime.fromtimestamp(reset_ts)
                    
                    # Update token rotator with usage info
                    if self.token_rotator and current_token:
                        self.token_rotator.update_token_usage(
                            current_token, 
                            remaining_requests=remaining,
                            reset_timestamp=reset_ts,
                            success=True
                        )
                    
                    self.requests_made += 1
                    
                    # Handle rate limiting
                    if response.status_code == 403 and "rate limit" in response.text.lower():
                        logger.warning(f"Rate limit hit for token ending in ...{current_token[-4:] if current_token else 'None'}")
                        
                        if self.token_rotator and current_token:
                            self.token_rotator.update_token_usage(current_token, remaining_requests=0, success=False)
                        
                        if attempt < retry_count - 1:
                            logger.info(f"Retrying with different token (attempt {attempt + 1}/{retry_count})")
                            continue
                        else:
                            raise Exception("GitHub API rate limit exceeded on all tokens")
                    
                    response.raise_for_status()
                    return response.json()
                    
                except httpx.HTTPStatusError as e:
                    logger.error(f"GitHub API error {e.response.status_code}: {e.response.text}")
                    
                    # Update token rotator on failure
                    if self.token_rotator and current_token:
                        self.token_rotator.update_token_usage(current_token, success=False)
                    
                    # Don't retry on non-rate-limit errors
                    if e.response.status_code != 403:
                        raise Exception(f"GitHub API error: {e.response.status_code}")
                    
                    if attempt < retry_count - 1:
                        logger.info(f"Retrying request (attempt {attempt + 1}/{retry_count})")
                        continue
                    else:
                        raise Exception(f"GitHub API error: {e.response.status_code}")
                        
                except Exception as e:
                    logger.error(f"GitHub API request failed: {e}")
                    
                    # Update token rotator on failure
                    if self.token_rotator and current_token:
                        self.token_rotator.update_token_usage(current_token, success=False)
                    
                    if attempt < retry_count - 1:
                        logger.info(f"Retrying request (attempt {attempt + 1}/{retry_count})")
                        continue
                    else:
                        raise
    
    async def get_repository(self, owner: str, repo: str) -> Repository:
        """Get repository information."""
        logger.info(f"Fetching repository info for {owner}/{repo}")
        
        data = await self._make_request("GET", f"repos/{owner}/{repo}")
        
        return Repository(
            id=data["id"],
            name=data["name"],
            full_name=data["full_name"],
            description=data.get("description"),
            private=data["private"],
            fork=data["fork"],
            html_url=data["html_url"],
            clone_url=data["clone_url"],
            default_branch=data["default_branch"],
            language=data.get("language"),
            size=data["size"],
            stargazers_count=data["stargazers_count"],
            watchers_count=data["watchers_count"],
            forks_count=data["forks_count"],
            open_issues_count=data["open_issues_count"],
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")),
            pushed_at=datetime.fromisoformat(data["pushed_at"].replace("Z", "+00:00")) if data.get("pushed_at") else None,
            topics=data.get("topics", []),
            license=data.get("license", {}).get("name") if data.get("license") else None,
            has_issues=data.get("has_issues", True),
            has_projects=data.get("has_projects", True),
            has_wiki=data.get("has_wiki", True),
            has_downloads=data.get("has_downloads", True),
            archived=data.get("archived", False),
            disabled=data.get("disabled", False),
        )
    
    async def get_repository_languages(self, owner: str, repo: str) -> Dict[str, int]:
        """Get repository language breakdown."""
        logger.info(f"Fetching languages for {owner}/{repo}")
        
        data = await self._make_request("GET", f"repos/{owner}/{repo}/languages")
        return data
    
    async def get_repository_contents(
        self, 
        owner: str, 
        repo: str, 
        path: str = "", 
        recursive: bool = False,
        max_files: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get repository contents."""
        logger.info(f"Fetching contents for {owner}/{repo} at path '{path}'")
        
        all_contents = []
        
        try:
            data = await self._make_request("GET", f"repos/{owner}/{repo}/contents/{path}")
            
            if not isinstance(data, list):
                data = [data]
            
            for item in data:
                all_contents.append(item)
                
                # If it's a directory and we want recursive listing
                if recursive and item["type"] == "dir" and len(all_contents) < max_files:
                    try:
                        sub_contents = await self.get_repository_contents(
                            owner, repo, item["path"], recursive=True, 
                            max_files=max_files - len(all_contents)
                        )
                        all_contents.extend(sub_contents)
                    except Exception as e:
                        logger.warning(f"Failed to fetch contents for {item['path']}: {e}")
                        continue
                
                if len(all_contents) >= max_files:
                    logger.warning(f"Reached max files limit ({max_files}) for {owner}/{repo}")
                    break
        
        except Exception as e:
            logger.error(f"Failed to fetch contents for {owner}/{repo}/{path}: {e}")
            raise
        
        return all_contents
    
    async def get_file_content(self, owner: str, repo: str, path: str) -> Optional[str]:
        """Get content of a specific file."""
        try:
            data = await self._make_request("GET", f"repos/{owner}/{repo}/contents/{path}")
            
            if data.get("encoding") == "base64":
                content = base64.b64decode(data["content"]).decode("utf-8")
                return content
            else:
                logger.warning(f"Unsupported encoding for {path}: {data.get('encoding')}")
                return None
                
        except Exception as e:
            logger.warning(f"Failed to fetch file content for {path}: {e}")
            return None
    
    async def get_repository_commits(
        self, 
        owner: str, 
        repo: str,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        per_page: int = 100,
        max_pages: int = 10
    ) -> List[Dict[str, Any]]:
        """Get repository commits."""
        logger.info(f"Fetching commits for {owner}/{repo}")
        
        params = {"per_page": per_page}
        if since:
            params["since"] = since.isoformat()
        if until:
            params["until"] = until.isoformat()
        
        all_commits = []
        page = 1
        
        while page <= max_pages:
            params["page"] = page
            
            try:
                commits = await self._make_request("GET", f"repos/{owner}/{repo}/commits", params)
                
                if not commits:
                    break
                
                all_commits.extend(commits)
                
                if len(commits) < per_page:
                    break
                
                page += 1
                
            except Exception as e:
                logger.warning(f"Failed to fetch commits page {page}: {e}")
                break
        
        logger.info(f"Fetched {len(all_commits)} commits for {owner}/{repo}")
        return all_commits
    
    async def get_repository_contributors(
        self, 
        owner: str, 
        repo: str,
        per_page: int = 100
    ) -> List[Dict[str, Any]]:
        """Get repository contributors."""
        logger.info(f"Fetching contributors for {owner}/{repo}")
        
        try:
            data = await self._make_request(
                "GET", 
                f"repos/{owner}/{repo}/contributors",
                params={"per_page": per_page}
            )
            return data
        except Exception as e:
            logger.warning(f"Failed to fetch contributors for {owner}/{repo}: {e}")
            return []
    
    async def get_repository_issues(
        self, 
        owner: str, 
        repo: str,
        state: str = "all",
        per_page: int = 100,
        max_pages: int = 5
    ) -> List[Dict[str, Any]]:
        """Get repository issues and pull requests."""
        logger.info(f"Fetching issues for {owner}/{repo}")
        
        all_issues = []
        page = 1
        
        while page <= max_pages:
            try:
                issues = await self._make_request(
                    "GET", 
                    f"repos/{owner}/{repo}/issues",
                    params={"state": state, "per_page": per_page, "page": page}
                )
                
                if not issues:
                    break
                
                all_issues.extend(issues)
                
                if len(issues) < per_page:
                    break
                
                page += 1
                
            except Exception as e:
                logger.warning(f"Failed to fetch issues page {page}: {e}")
                break
        
        return all_issues
    
    async def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status."""
        try:
            data = await self._make_request("GET", "rate_limit")
            
            # Add token rotation info if available
            if self.token_rotator:
                remaining_total, active_tokens = self.token_rotator.get_total_capacity()
                data["token_rotation"] = {
                    "active_tokens": active_tokens,
                    "total_remaining": remaining_total,
                    "token_status": self.token_rotator.get_token_status()
                }
            
            return data
        except Exception as e:
            logger.error(f"Failed to get rate limit status: {e}")
            
            # Fallback response
            response = {
                "rate": {
                    "remaining": self.rate_limit_remaining,
                    "reset": self.rate_limit_reset.timestamp() if self.rate_limit_reset else None
                }
            }
            
            if self.token_rotator:
                remaining_total, active_tokens = self.token_rotator.get_total_capacity()
                response["token_rotation"] = {
                    "active_tokens": active_tokens,
                    "total_remaining": remaining_total,
                    "token_status": self.token_rotator.get_token_status()
                }
            
            return response