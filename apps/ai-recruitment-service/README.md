# AI Recruitment Service

Advanced AI-powered recruitment and verification service for 0Unveiled platform.

## Features

- **AI-Powered Candidate Matching**: Uses Gemini AI and semantic embeddings to find the best candidates
- **Automated Verification**: Smart verification system for badges and achievements  
- **Multi-Factor Scoring**: Considers skills, experience, code quality, and cultural fit
- **Real-time Analysis**: Fast candidate ranking with detailed reasoning

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   Required environment variables (already available in main .env):
   - `DATABASE_URL`: PostgreSQL connection string
   - `GEMINI_API_KEY`: Google Gemini API key
   - `FRONTEND_URL`: Frontend application URL

3. **Run the Service**:
   ```bash
   cd src
   python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
   ```

4. **Docker Run**:
   ```bash
   docker build -t ai-recruitment-service .
   docker run -p 8002:8002 --env-file ../.env ai-recruitment-service
   ```

## API Endpoints

### Recruitment
- `POST /api/recruitment/search-candidates` - Find candidates for a job
- `GET /api/recruitment/candidates/{id}/profile` - Get candidate profile
- `POST /api/recruitment/matches/{id}/rate` - Rate a candidate match

### Verification  
- `POST /api/verification/submit` - Submit verification request
- `GET /api/verification/status/{id}` - Check verification status
- `GET /api/verification/badges/user/{id}` - Get user badges

### Health
- `GET /health` - Service health check

## Architecture

- **FastAPI**: High-performance Python web framework
- **Gemini AI**: Advanced language model for requirement extraction
- **Sentence Transformers**: Semantic embeddings for candidate search
- **PostgreSQL**: Database for storing recruitment data
- **scikit-learn**: Machine learning utilities for scoring

## Service Port

Runs on port **8002** (different from the existing GitHub analyzer service on 8080)