#!/bin/bash
# Cross-platform setup script for the GitHub analyzer service

set -e

echo "🚀 Setting up GitHub Analyzer Service..."

# Detect platform
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    PLATFORM="windows"
    ACTIVATE_CMD="venv\\Scripts\\activate"
    PYTHON_CMD="python"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
    ACTIVATE_CMD="source venv/bin/activate"
    PYTHON_CMD="python3"
else
    PLATFORM="linux"
    ACTIVATE_CMD="source venv/bin/activate"
    PYTHON_CMD="python3"
fi

echo "📱 Detected platform: $PLATFORM"

# Check if Python is available
if ! command -v $PYTHON_CMD &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python is not installed or not in PATH"
        exit 1
    else
        PYTHON_CMD="python"
    fi
fi

echo "🐍 Using Python: $PYTHON_CMD"

# Create virtual environment
echo "📦 Creating virtual environment..."
$PYTHON_CMD -m venv venv --system-site-packages

# Activate virtual environment and install dependencies
echo "📥 Installing dependencies..."
if [[ "$PLATFORM" == "windows" ]]; then
    cmd //c "venv\\Scripts\\activate && pip install --no-build-isolation fastapi uvicorn pydantic pydantic-settings httpx requests loguru python-dotenv google-generativeai python-multipart"
    echo "🔧 Installing analysis tools..."
    cmd //c "venv\\Scripts\\activate && pip install --no-build-isolation astunparse radon lizard gitpython pygments chardet" || echo "⚠️ Some analysis tools skipped due to compatibility issues"
else
    source venv/bin/activate
    pip install --no-build-isolation fastapi uvicorn pydantic pydantic-settings httpx requests loguru python-dotenv google-generativeai python-multipart
    echo "🔧 Installing analysis tools..."
    pip install --no-build-isolation astunparse radon lizard gitpython pygments chardet || echo "⚠️ Some analysis tools skipped due to compatibility issues"
fi

echo "✅ Setup complete! You can now run:"
echo "   npm run dev     # Start development server"
echo "   npm run start   # Start production server"
echo "   npm run health  # Check service health"
