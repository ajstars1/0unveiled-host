#!/bin/bash

# 0Unveiled - Backend Services Startup Script
# Starts both the Express API and FastAPI GitHub Analyzer services using the monorepo structure

set -e  # Exit on any error

echo "Starting 0Unveiled Backend Services via Monorepo..."
echo "=================================================="

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Warning: Port $1 is already in use. Attempting to continue..."
        echo "   You can find the process with: lsof -i :$1"
        echo "   And kill it with: kill -9 $(lsof -ti :$1)"
        echo ""
    fi
}

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    # Kill all background jobs started by this script
    jobs -p | xargs -r kill 2>/dev/null || true
    echo "Cleanup complete!"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Check if required commands are available
echo "Checking prerequisites..."
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed. Please install Bun first."
    echo "Run: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "Prerequisites check passed"
echo ""

# Check port availability (warn but don't exit)
echo "Checking port availability..."
check_port 3001  # Express API
check_port 8080  # FastAPI Analyzer

# Install dependencies if needed
echo "Installing dependencies..."
bun install

# Setup Python environment for analyzer if needed
if [ ! -d "apps/github-analyzer-service/venv" ]; then
    echo "Setting up Python environment for GitHub Analyzer..."
    bun run setup:analyzer
fi

echo ""
echo "Starting backend services using Turbo..."

# Start backend services using the monorepo scripts
bun run dev:backend

echo ""
echo "Backend services startup complete!"
echo ""
echo "Service Information:"
echo "   • Express API:       http://localhost:3001"
echo "   • GitHub Analyzer:   http://localhost:8080"
echo "   • API Health:        http://localhost:3001/health"
echo "   • Analyzer Health:   http://localhost:8080/health"
echo ""
echo "To start the full application:"
echo "   bun run dev          # Starts frontend only"
echo "   bun run dev:all      # Starts both backend and frontend"
echo ""
echo "Press Ctrl+C to stop all services..."

# Keep the script running
wait