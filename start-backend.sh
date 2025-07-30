#!/bin/bash

# 0Unveiled - Backend Services Startup Script
# Starts both the Express API and FastAPI GitHub Analyzer services

set -e  # Exit on any error

echo "Starting 0Unveiled Backend Services..."
echo "========================================"

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Error: Port $1 is already in use. Please stop the process using this port and try again."
        echo "   You can find the process with: lsof -i :$1"
        echo "   And kill it with: kill -9 $(lsof -ti :$1)"
        exit 1
    fi
}

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
        echo "   Express API stopped"
    fi
    if [ ! -z "$ANALYZER_PID" ]; then
        kill $ANALYZER_PID 2>/dev/null || true
        echo "   GitHub Analyzer stopped"
    fi
    echo "Cleanup complete!"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Check if required ports are available
echo "Checking port availability..."
check_port 3001  # Express API
check_port 8002  # FastAPI Analyzer

# Check if Node.js and Python are installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "Warning: Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

echo "Prerequisites check passed"
echo ""

# Start Express API Service
echo "Starting Express API Service (Port 3001)..."
cd apps/api

# Install Node.js dependencies
echo "   Installing Node.js dependencies..."
bun install


# Start API service in background
echo "   Starting Express API server..."
bun run dev &
API_PID=$!

cd ../..

# Wait a moment for API to start
sleep 3

# Start GitHub Analyzer Service
echo "Starting GitHub Analyzer Service (Port 8002)..."
cd apps/github-analyzer-service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment with system packages..."
    python3 -m venv venv --system-site-packages
fi

# Activate virtual environment
echo "   Activating virtual environment..."
source venv/bin/activate

# Set environment variable to avoid setuptools issues
export SETUPTOOLS_USE_DISTUTILS=stdlib

# Install Python dependencies
echo "   Installing core dependencies without build isolation..."
pip install --no-build-isolation fastapi uvicorn pydantic pydantic-settings httpx requests loguru python-dotenv google-generativeai python-multipart

echo "   Installing additional tools (optional)..."
pip install --no-build-isolation astunparse radon lizard gitpython pygments chardet || echo "   Some analysis tools skipped due to compatibility issues"


# Start analyzer service in background
echo "   Starting GitHub Analyzer server..."
python -m uvicorn src.main:app --host 0.0.0.0 --port 8002 --reload &
ANALYZER_PID=$!

cd ../..

# Wait for services to start
echo ""
echo "Waiting for services to start..."
sleep 5

# Check if services are running
echo ""
echo "Health Check..."

# Check Express API
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   Express API: http://localhost:3001 - RUNNING"
else
    echo "   Express API: http://localhost:3001 - FAILED"
fi

# Check GitHub Analyzer
if curl -s http://localhost:8002/health > /dev/null 2>&1; then
    echo "   GitHub Analyzer: http://localhost:8002 - RUNNING"
else
    echo "   GitHub Analyzer: http://localhost:8002 - FAILED"
fi

echo ""
echo "Backend services are running!"
echo ""
echo "Service Information:"
echo "   • Express API:       http://localhost:3001"
echo "   • GitHub Analyzer:   http://localhost:8002"
echo "   • API Health:        http://localhost:3001/health"
echo "   • Analyzer Health:   http://localhost:8002/health"
echo ""
echo "Next Steps:"
echo "   1. Run './start-frontend.sh' to start the frontend"
echo "   2. Access the application at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services..."

# Keep the script running and wait for interrupt
wait