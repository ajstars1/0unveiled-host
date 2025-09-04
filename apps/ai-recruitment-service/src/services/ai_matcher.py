"""AI-powered candidate matching service."""

import asyncio
import json
import numpy as np
from typing import List, Dict, Any, Optional
from loguru import logger
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai

from ..config import settings
from ..models.recruitment import JobPosting, CandidateProfile, MatchResult, MatchReasoning
from ..database import db_service


class AIRecruiterService:
    """AI-powered recruitment and candidate matching service."""
    
    def __init__(self):
        self.embedding_model = None
        self.gemini_model = None
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize AI models and services."""
        logger.info("Initializing AI Recruiter Service...")
        
        try:
            # Initialize sentence transformer for embeddings
            self.embedding_model = SentenceTransformer(settings.embedding_model)
            
            # Initialize Gemini client
            if settings.gemini_api_key:
                genai.configure(api_key=settings.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
            
            self.is_initialized = True
            logger.info("AI Recruiter Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI Recruiter Service: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the service is ready to process requests."""
        return self.is_initialized and self.embedding_model is not None
    
    async def find_candidates(self, job_posting: JobPosting, max_candidates: int = None) -> List[MatchResult]:
        """Find and rank candidates for a job posting using AI."""
        if not self.is_ready():
            raise RuntimeError("AI Recruiter Service is not initialized")
        
        max_candidates = max_candidates or settings.max_candidates_per_job
        
        logger.info(f"Finding candidates for job: {job_posting.title}")
        
        # 1. Parse job requirements using NLP
        requirements = await self._parse_job_requirements(job_posting)
        
        # 2. Query candidate pool with semantic search
        candidates = await self._semantic_candidate_search(requirements, max_candidates * 2)
        
        # 3. Score candidates using multi-factor AI model
        scored_candidates = []
        
        for candidate in candidates:
            try:
                score = await self._calculate_match_score(candidate, requirements)
                reasoning = await self._generate_match_reasoning(candidate, requirements, score)
                
                if score >= settings.min_match_score:
                    match_result = MatchResult(
                        job_posting_id=job_posting.id,
                        candidate_id=candidate.id,
                        ai_match_score=score,
                        match_reasoning=reasoning,
                        candidate_profile=candidate
                    )
                    scored_candidates.append(match_result)
                    
                    # Save to database
                    try:
                        await db_service.save_candidate_match(
                            job_posting.id,
                            candidate.id,
                            score,
                            reasoning.dict()
                        )
                    except Exception as e:
                        logger.warning(f"Failed to save match to database: {e}")
                        # Continue processing even if database save fails
                    
            except Exception as e:
                logger.warning(f"Failed to score candidate {candidate.id}: {e}")
                continue
        
        # Sort by match score and limit results
        scored_candidates.sort(key=lambda x: x.ai_match_score, reverse=True)
        return scored_candidates[:max_candidates]
    
    async def _parse_job_requirements(self, job_posting: JobPosting) -> Dict[str, Any]:
        """Parse job requirements using NLP."""
        logger.info("Parsing job requirements...")
        
        # Combine title and description for analysis
        full_text = f"{job_posting.title}\n\n{job_posting.description}"
        
        # Extract structured requirements using Gemini
        if self.gemini_model:
            requirements = await self._extract_requirements_with_ai(full_text, job_posting.requirements)
        else:
            # Fallback to basic parsing
            requirements = self._extract_requirements_basic(job_posting)
        
        # Generate embedding for semantic search
        requirements['embedding'] = self.embedding_model.encode(full_text)
        
        return requirements
    
    async def _extract_requirements_with_ai(self, job_text: str, existing_requirements: Dict) -> Dict[str, Any]:
        """Extract requirements using Gemini."""
        try:
            prompt = f"""
            Analyze this job posting and extract structured requirements in JSON format:
            
            {job_text}
            
            Extract and categorize:
            1. Required technical skills (array)
            2. Preferred skills (array)
            3. Experience level (junior/mid/senior)
            4. Domain expertise needed (frontend/backend/fullstack/mobile/ai_ml/devops)
            5. Soft skills (array)
            6. Education requirements (string)
            7. Industry background (string)
            
            Return only valid JSON in this format:
            {{
                "required_skills": ["skill1", "skill2"],
                "preferred_skills": ["skill1", "skill2"],
                "experience_level": "senior",
                "domain": "fullstack",
                "soft_skills": ["communication", "teamwork"],
                "education": "Bachelor's degree preferred",
                "industry": "technology"
            }}
            """
            
            response = await asyncio.to_thread(self.gemini_model.generate_content, prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            ai_requirements = json.loads(response_text.strip())
            
            # Merge with existing requirements
            return {**existing_requirements, **ai_requirements}
            
        except Exception as e:
            logger.warning(f"Failed to extract requirements with AI: {e}")
            return self._extract_requirements_basic(existing_requirements)
    
    def _extract_requirements_basic(self, job_posting: JobPosting) -> Dict[str, Any]:
        """Basic requirement extraction fallback."""
        requirements = job_posting.requirements or {}
        
        # Add basic structure if missing
        default_requirements = {
            "required_skills": [],
            "preferred_skills": [],
            "experience_level": "mid",
            "domain": "general",
            "employment_type": job_posting.employment_type,
            "location": job_posting.location,
        }
        
        return {**default_requirements, **requirements}
    
    async def _semantic_candidate_search(self, requirements: Dict, limit: int) -> List[CandidateProfile]:
        """Search for candidates using semantic similarity."""
        logger.info(f"Performing semantic search for {limit} candidates...")
        
        # Get candidates from database
        candidates = await db_service.search_candidates(requirements, limit)
        
        if not candidates:
            logger.warning("No candidates found in database")
            return []
            
        # TODO: Implement vector similarity ranking using embeddings
        # For now, return candidates sorted by CRUISM score
        candidates.sort(key=lambda c: c.cruism_score, reverse=True)
        
        logger.info(f"Found {len(candidates)} candidates")
        return candidates
    
    async def _calculate_match_score(self, candidate: CandidateProfile, requirements: Dict) -> float:
        """Calculate comprehensive match score for a candidate."""
        
        # Multi-factor scoring algorithm
        scores = {
            'skills_match': await self._score_skills_match(candidate.skills, requirements.get('required_skills', [])),
            'experience_match': self._score_experience_match(candidate.experience_years, requirements.get('experience_level')),
            'code_quality': min(100, candidate.cruism_score) / 100,  # Normalize to 0-1
            'domain_expertise': self._score_domain_match(candidate.primary_domain, requirements.get('domain')),
            'cultural_fit': await self._score_cultural_fit(candidate, requirements),
            'location_match': self._score_location_match(candidate.location, requirements.get('location')),
        }
        
        # Weighted scoring
        weights = {
            'skills_match': 0.35,
            'experience_match': 0.20,
            'code_quality': 0.20,
            'domain_expertise': 0.10,
            'cultural_fit': 0.10,
            'location_match': 0.05
        }
        
        final_score = sum(scores[key] * weights[key] for key in scores) * 100
        return min(100, max(0, final_score))
    
    async def _score_skills_match(self, candidate_skills: List[str], required_skills: List[str]) -> float:
        """Score how well candidate skills match job requirements."""
        if not required_skills:
            return 0.8  # Default score if no specific requirements
        
        if not candidate_skills:
            return 0.0
        
        # Convert to lowercase for comparison
        candidate_skills_lower = [skill.lower() for skill in candidate_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        # Direct matches
        direct_matches = sum(1 for skill in required_skills_lower if skill in candidate_skills_lower)
        direct_score = direct_matches / len(required_skills_lower)
        
        # Semantic similarity for partial matches
        if self.embedding_model:
            try:
                candidate_embeddings = self.embedding_model.encode(candidate_skills)
                required_embeddings = self.embedding_model.encode(required_skills)
                
                similarity_matrix = cosine_similarity(required_embeddings, candidate_embeddings)
                semantic_score = np.mean(np.max(similarity_matrix, axis=1))
                
                # Combine direct and semantic scores
                final_score = max(direct_score, semantic_score * 0.8)
                return min(1.0, final_score)
                
            except Exception as e:
                logger.warning(f"Failed to calculate semantic similarity: {e}")
        
        return direct_score
    
    def _score_experience_match(self, candidate_years: int, required_level: str) -> float:
        """Score experience level match."""
        level_requirements = {
            'junior': (0, 2),
            'mid': (2, 5),
            'senior': (5, 15),
            'lead': (8, 20),
            'principal': (10, 25),
        }
        
        if required_level not in level_requirements:
            return 0.8  # Default score for unknown level
        
        min_years, max_years = level_requirements[required_level]
        
        if min_years <= candidate_years <= max_years:
            return 1.0
        elif candidate_years < min_years:
            # Penalty for being under-qualified
            return max(0.0, 0.8 - (min_years - candidate_years) * 0.1)
        else:
            # Smaller penalty for being over-qualified
            return max(0.7, 1.0 - (candidate_years - max_years) * 0.05)
    
    def _score_domain_match(self, candidate_domain: str, required_domain: str) -> float:
        """Score domain expertise match."""
        if not required_domain or required_domain == 'general':
            return 0.8
        
        if candidate_domain == required_domain:
            return 1.0
        
        # Define related domains
        domain_relations = {
            'frontend': ['web', 'ui', 'ux'],
            'backend': ['api', 'server', 'database'],
            'fullstack': ['frontend', 'backend', 'web'],
            'mobile': ['ios', 'android', 'react-native'],
            'ai_ml': ['data_science', 'machine_learning', 'ai'],
            'devops': ['infrastructure', 'cloud', 'deployment'],
        }
        
        candidate_related = domain_relations.get(candidate_domain, [candidate_domain])
        if required_domain in candidate_related:
            return 0.8
        
        return 0.3  # Some credit for general software development skills
    
    async def _score_cultural_fit(self, candidate: CandidateProfile, requirements: Dict) -> float:
        """Score cultural fit based on various factors."""
        # Simplified cultural fit scoring
        # In a real implementation, this would consider:
        # - Company values alignment
        # - Work style preferences
        # - Team dynamics
        # - Remote work preferences
        
        base_score = 0.7
        
        # Adjust based on remote work preference
        if requirements.get('remote_friendly') and candidate.remote_preference:
            base_score += 0.2
        
        # Adjust based on company size preference
        company_size = requirements.get('company_size', 'medium')
        if candidate.preferred_company_size == company_size:
            base_score += 0.1
        
        return min(1.0, base_score)
    
    def _score_location_match(self, candidate_location: str, job_location: str) -> float:
        """Score location compatibility."""
        if not job_location:
            return 1.0  # Remote or location-flexible position
        
        if not candidate_location:
            return 0.8  # Unknown candidate location
        
        # Exact match
        if candidate_location.lower() == job_location.lower():
            return 1.0
        
        # Same city/region (simplified)
        candidate_parts = candidate_location.lower().split(',')
        job_parts = job_location.lower().split(',')
        
        # Check for any common location parts
        if any(part.strip() in job_parts for part in candidate_parts):
            return 0.9
        
        return 0.3  # Different locations
    
    async def _generate_match_reasoning(self, candidate: CandidateProfile, requirements: Dict, score: float) -> MatchReasoning:
        """Generate AI explanation for the match score."""
        
        # Calculate individual component scores for explanation
        skills_score = await self._score_skills_match(candidate.skills, requirements.get('required_skills', []))
        experience_score = self._score_experience_match(candidate.experience_years, requirements.get('experience_level'))
        
        strengths = []
        concerns = []
        
        # Analyze strengths
        if skills_score > 0.8:
            strengths.append(f"Excellent skills match with {len(candidate.skills)} relevant technologies")
        elif skills_score > 0.6:
            strengths.append("Good technical skills alignment")
        
        if experience_score > 0.8:
            strengths.append(f"Perfect experience level for {requirements.get('experience_level', 'this')} role")
        elif experience_score > 0.6:
            strengths.append("Appropriate experience level")
        
        if candidate.cruism_score > 85:
            strengths.append("Outstanding code quality and technical expertise")
        elif candidate.cruism_score > 70:
            strengths.append("Strong technical capabilities")
        
        # Analyze concerns
        if skills_score < 0.6:
            concerns.append("Limited match with required technical skills")
        
        if experience_score < 0.6:
            concerns.append("Experience level may not align with role requirements")
        
        if candidate.cruism_score < 60:
            concerns.append("Code quality metrics below average")
        
        # Generate summary
        if score >= 80:
            summary = "Excellent candidate match with strong technical skills and experience alignment."
        elif score >= 70:
            summary = "Very good candidate with solid qualifications for this role."
        elif score >= 60:
            summary = "Good candidate with potential, may need some additional evaluation."
        else:
            summary = "Moderate match - consider for roles with different requirements."
        
        return MatchReasoning(
            overall_score=score,
            strengths=strengths,
            concerns=concerns,
            summary=summary,
            skills_match_score=skills_score * 100,
            experience_match_score=experience_score * 100,
            code_quality_score=candidate.cruism_score
        )
    
