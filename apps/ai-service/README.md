# 0Unveiled AI Service

FastAPI-based AI microservice for text generation, summarization, and analysis.

## Features

- **Text Generation**: Generate text using OpenAI GPT models
- **Text Summarization**: Extractive summarization using TF-IDF
- **Text Analysis**: Sentiment analysis, keyword extraction, entity recognition, readability analysis
- **Modern Python**: Built with FastAPI, Pydantic, and async/await
- **Production Ready**: Includes logging, error handling, and health checks

## Requirements

- Python 3.11+
- OpenAI API key (for text generation)

## Installation

1. Install dependencies:
```bash
pip install -e .
```

2. For development:
```bash
pip install -e ".[dev]"
```

3. Copy environment file and configure:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Usage

### Development Server

```bash
# Run with uvicorn directly
uvicorn ai_service.main:app --reload --port 8000

# Or use Python module
python -m ai_service.main
```

### Production Server

```bash
uvicorn ai_service.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check
```
GET /health
```

### Text Generation
```
POST /api/ai/generate
{
  "prompt": "Write a story about...",
  "max_tokens": 500,
  "temperature": 0.7,
  "model": "gpt-3.5-turbo"
}
```

### Text Summarization
```
POST /api/ai/summarize
{
  "text": "Long text to summarize...",
  "max_length": 150,
  "min_length": 30
}
```

### Text Analysis
```
POST /api/ai/analyze
{
  "text": "Text to analyze...",
  "analysis_type": "sentiment"  # sentiment, keywords, entities, readability
}
```

## Configuration

Configure the service using environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_ORGANIZATION`: Your OpenAI organization ID (optional)
- `PORT`: Service port (default: 8000)
- `CORS_ORIGINS`: Allowed CORS origins
- `MAX_TOKENS_LIMIT`: Maximum tokens per request

## Development

### Code Quality

```bash
# Format code
black src/

# Lint code
ruff check src/

# Type check
mypy src/
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=ai_service
```

## Docker

```bash
# Build image
docker build -t 0unveiled-ai-service .

# Run container
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key 0unveiled-ai-service
``` 