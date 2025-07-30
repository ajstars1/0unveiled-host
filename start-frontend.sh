#!/bin/bash

# 0Unveiled - Frontend Startup Script
# Starts the Next.js web application

set -e  # Exit on any error

echo "Starting 0Unveiled Frontend..."
echo "=============================="

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Error: Port $1 is already in use. Please stop the process using this port and try again."
        echo "   You can find the process with: lsof -i :$1"
        echo "   And kill it with: kill -9 $(lsof -ti :$1)"
        exit 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down frontend..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "   Next.js application stopped"
    fi
    echo "Cleanup complete!"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Check if required port is available
echo "Checking port availability..."
check_port 3000  # Next.js Frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "Warning: Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

echo "Prerequisites check passed"
echo ""

# Start Next.js Frontend
echo "Starting Next.js Frontend (Port 3000)..."
cd apps/web

# Install dependencies
echo "   Installing Node.js dependencies..."
bun install


# Check if backend services are running
echo "   Checking backend services..."
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   Warning: Express API (port 3001) is not running"
    echo "   Please run './start-backend.sh' first to start backend services"
fi

if ! curl -s http://localhost:8002/health > /dev/null 2>&1; then
    echo "   Warning: GitHub Analyzer (port 8002) is not running"
    echo "   Please run './start-backend.sh' first to start backend services"
fi

# Start the Next.js development server
echo "   Starting Next.js development server..."
bun run dev &
FRONTEND_PID=$!

cd ../..

# Wait for frontend to start
echo ""
echo "Waiting for frontend to start..."
sleep 5

# Check if frontend is running
echo ""
echo "Health Check..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   Next.js Frontend: http://localhost:3000 - RUNNING"
else
    echo "   Next.js Frontend: http://localhost:3000 - FAILED"
fi

echo ""
echo "Frontend is running!"
echo ""
echo "Service Information:"
echo "   • Frontend:          http://localhost:3000"
echo "   • Analyze Page:      http://localhost:3000/analyze"
echo ""
echo "Backend Services (should be running):"
echo "   • Express API:       http://localhost:3001"
echo "   • GitHub Analyzer:   http://localhost:8002"
echo ""
echo "Next Steps:"
echo "   1. Make sure backend services are running ('./start-backend.sh')"
echo "   2. Set up GitHub OAuth in Supabase Dashboard"
echo "   3. Access the application at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the frontend..."

# Keep the script running and wait for interrupt
wait