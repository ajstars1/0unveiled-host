"""Database connection and query utilities."""

import asyncio
import asyncpg
from typing import List, Dict, Any, Optional
from loguru import logger

from .config import settings
from .models.recruitment import CandidateProfile


class DatabaseService:
    """Database service for recruitment queries."""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        
    async def initialize(self):
        """Initialize database connection pool."""
        try:
            self.pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=1,
                max_size=10,
                command_timeout=30
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
            
    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def search_candidates(
        self, 
        requirements: Dict[str, Any], 
        limit: int = 50
    ) -> List[CandidateProfile]:
        """Search for candidates based on requirements."""
        if not self.pool:
            logger.error("Database pool not initialized")
            return []
            
        try:
            async with self.pool.acquire() as conn:
                # Query users with their skills and showcased items
                query = """
                SELECT DISTINCT
                    u.id,
                    u."firstName",
                    u."lastName", 
                    u.email,
                    u.location,
                    u."yearsOfExperience",
                    u."cruismScore",
                    u."primaryDomain",
                    u."remoteWorkPreference",
                    u."preferredCompanySize",
                    u."githubUrl",
                    u."linkedinUrl",
                    COALESCE(
                        array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), 
                        ARRAY[]::text[]
                    ) as skills,
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'id', si.id,
                                'title', si.title,
                                'description', si.description,
                                'type', si.type,
                                'url', si.url,
                                'techStack', si."techStack"
                            )
                        ) FILTER (WHERE si.id IS NOT NULL), 
                        '[]'::json
                    ) as portfolio_items
                FROM "User" u
                LEFT JOIN "UserSkill" us ON u.id = us."userId"
                LEFT JOIN "Skill" s ON us."skillId" = s.id
                LEFT JOIN "ShowcasedItem" si ON u.id = si."userId"
                WHERE u."isPublic" = true
                    AND u."firstName" IS NOT NULL
                    AND u."lastName" IS NOT NULL
                GROUP BY u.id, u."firstName", u."lastName", u.email, u.location,
                         u."yearsOfExperience", u."cruismScore", u."primaryDomain",
                         u."remoteWorkPreference", u."preferredCompanySize",
                         u."githubUrl", u."linkedinUrl"
                ORDER BY u."cruismScore" DESC NULLS LAST
                LIMIT $1
                """
                
                rows = await conn.fetch(query, limit)
                
                candidates = []
                for row in rows:
                    try:
                        candidate = CandidateProfile(
                            id=row['id'],
                            first_name=row['firstName'] or "",
                            last_name=row['lastName'] or "",
                            email=row['email'],
                            skills=row['skills'] or [],
                            experience_years=row['yearsOfExperience'] or 0,
                            cruism_score=float(row['cruismScore'] or 0),
                            primary_domain=row['primaryDomain'] or "general",
                            location=row['location'],
                            remote_preference=row['remoteWorkPreference'] or False,
                            preferred_company_size=row['preferredCompanySize'] or "medium",
                            github_url=row['githubUrl'],
                            linkedin_url=row['linkedinUrl'],
                            portfolio_items=row['portfolio_items'] or []
                        )
                        candidates.append(candidate)
                        
                    except Exception as e:
                        logger.warning(f"Failed to parse candidate {row.get('id')}: {e}")
                        continue
                        
                logger.info(f"Found {len(candidates)} candidates")
                return candidates
                
        except Exception as e:
            logger.error(f"Database query failed: {e}")
            return []
    
    async def get_job_posting(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job posting by ID."""
        if not self.pool:
            logger.error("Database pool not initialized")
            return None
            
        try:
            async with self.pool.acquire() as conn:
                query = """
                SELECT jp.*, c.name as company_name
                FROM "JobPosting" jp
                LEFT JOIN "Company" c ON jp."companyId" = c.id
                WHERE jp.id = $1
                """
                
                row = await conn.fetchrow(query, job_id)
                if row:
                    return dict(row)
                return None
                
        except Exception as e:
            logger.error(f"Failed to get job posting {job_id}: {e}")
            return None
    
    async def save_candidate_match(
        self,
        job_posting_id: str,
        candidate_id: str,
        ai_match_score: float,
        match_reasoning: Dict[str, Any]
    ) -> Optional[str]:
        """Save candidate match result to database."""
        if not self.pool:
            logger.error("Database pool not initialized")
            return None
            
        try:
            async with self.pool.acquire() as conn:
                query = """
                INSERT INTO "CandidateMatch" (
                    id, "jobPostingId", "candidateId", "aiMatchScore", 
                    "matchReasoning", status, "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text, $1, $2, $3::integer, $4::json, 
                    'SUGGESTED', NOW(), NOW()
                )
                RETURNING id
                """
                
                # Convert float score to integer (0-100)
                score_int = int(round(ai_match_score))
                
                row = await conn.fetchrow(
                    query, 
                    job_posting_id, 
                    candidate_id, 
                    score_int,
                    match_reasoning
                )
                
                if row:
                    logger.info(f"Saved candidate match {row['id']}")
                    return row['id']
                    
        except Exception as e:
            logger.error(f"Failed to save candidate match: {e}")
            return None
    
    async def get_candidate_profile(self, candidate_id: str) -> Optional[CandidateProfile]:
        """Get a single candidate profile by ID."""
        if not self.pool:
            logger.error("Database pool not initialized")
            return None
            
        try:
            async with self.pool.acquire() as conn:
                query = """
                SELECT 
                    u.id,
                    u."firstName",
                    u."lastName", 
                    u.email,
                    u.location,
                    u."yearsOfExperience",
                    u."cruismScore",
                    u."primaryDomain",
                    u."remoteWorkPreference",
                    u."preferredCompanySize",
                    u."githubUrl",
                    u."linkedinUrl",
                    COALESCE(
                        array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), 
                        ARRAY[]::text[]
                    ) as skills,
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'id', si.id,
                                'title', si.title,
                                'description', si.description,
                                'type', si.type,
                                'url', si.url,
                                'techStack', si."techStack"
                            )
                        ) FILTER (WHERE si.id IS NOT NULL), 
                        '[]'::json
                    ) as portfolio_items
                FROM "User" u
                LEFT JOIN "UserSkill" us ON u.id = us."userId"
                LEFT JOIN "Skill" s ON us."skillId" = s.id
                LEFT JOIN "ShowcasedItem" si ON u.id = si."userId"
                WHERE u.id = $1
                GROUP BY u.id, u."firstName", u."lastName", u.email, u.location,
                         u."yearsOfExperience", u."cruismScore", u."primaryDomain",
                         u."remoteWorkPreference", u."preferredCompanySize",
                         u."githubUrl", u."linkedinUrl"
                """
                
                row = await conn.fetchrow(query, candidate_id)
                
                if row:
                    return CandidateProfile(
                        id=row['id'],
                        first_name=row['firstName'] or "",
                        last_name=row['lastName'] or "",
                        email=row['email'],
                        skills=row['skills'] or [],
                        experience_years=row['yearsOfExperience'] or 0,
                        cruism_score=float(row['cruismScore'] or 0),
                        primary_domain=row['primaryDomain'] or "general",
                        location=row['location'],
                        remote_preference=row['remoteWorkPreference'] or False,
                        preferred_company_size=row['preferredCompanySize'] or "medium",
                        github_url=row['githubUrl'],
                        linkedin_url=row['linkedinUrl'],
                        portfolio_items=row['portfolio_items'] or []
                    )
                    
                return None
                
        except Exception as e:
            logger.error(f"Failed to get candidate profile {candidate_id}: {e}")
            return None

    async def health_check(self) -> bool:
        """Check database connection health."""
        if not self.pool:
            return False
            
        try:
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False


# Global database service instance
db_service = DatabaseService()