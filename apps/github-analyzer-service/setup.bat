@echo off
REM Cross-platform setup script for the GitHub analyzer service (Windows)

echo 🚀 Setting up GitHub Analyzer Service for Windows...

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo 🐍 Using Python: 
python --version

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv --system-site-packages
if %errorlevel% neq 0 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment and install dependencies
echo 📥 Installing dependencies...
call venv\Scripts\activate.bat
pip install --no-build-isolation fastapi uvicorn pydantic pydantic-settings httpx requests loguru python-dotenv google-generativeai python-multipart
if %errorlevel% neq 0 (
    echo ❌ Failed to install main dependencies
    pause
    exit /b 1
)

echo 🔧 Installing analysis tools...
pip install --no-build-isolation astunparse radon lizard gitpython pygments chardet
if %errorlevel% neq 0 (
    echo ⚠️ Some analysis tools skipped due to compatibility issues
)

echo ✅ Setup complete! You can now run:
echo    npm run dev     # Start development server
echo    npm run start   # Start production server  
echo    npm run health  # Check service health
pause
