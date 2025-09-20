# This file serves as the entry point for the Vercel serverless function.
# It imports the FastAPI app instance from the main application file.

# The `app` object is the FastAPI instance that will handle incoming requests.
# Vercel will automatically detect and use this `app` object.
from src.main import app
