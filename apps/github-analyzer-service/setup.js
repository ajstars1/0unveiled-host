#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up GitHub Analyzer Service...');

// Detect platform
const isWindows = process.platform === 'win32';
const pythonCmd = isWindows ? 'python' : 'python3';

// Check if Python is available
try {
  execSync(`${pythonCmd} --version`, { stdio: 'pipe' });
  console.log(`🐍 Using Python: ${pythonCmd}`);
} catch (error) {
  console.error('❌ Python is not installed or not in PATH');
  console.error('Please install Python 3.8+ from https://python.org');
  process.exit(1);
}

try {
  // Create virtual environment
  console.log('📦 Creating virtual environment...');
  execSync(`${pythonCmd} -m venv venv --system-site-packages`, { stdio: 'inherit' });

  // Install main dependencies
  console.log('📥 Installing dependencies...');
  const activateCmd = isWindows 
    ? 'venv\\Scripts\\activate.bat &&' 
    : '. venv/bin/activate &&';
  
  const installCmd = `${activateCmd} pip install --no-build-isolation fastapi uvicorn pydantic pydantic-settings httpx requests loguru python-dotenv google-generativeai python-multipart`;
  
  const shellOptions = isWindows 
    ? { stdio: 'inherit', shell: true }
    : { stdio: 'inherit', shell: '/bin/bash' };
  
  execSync(installCmd, shellOptions);

  // Install analysis tools
  console.log('🔧 Installing analysis tools...');
  const toolsCmd = `${activateCmd} pip install --no-build-isolation astunparse radon lizard gitpython pygments chardet`;
  
  try {
    execSync(toolsCmd, shellOptions);
  } catch (error) {
    console.log('⚠️ Some analysis tools skipped due to compatibility issues');
  }

  console.log('✅ Setup complete! You can now run:');
  console.log('   npm run dev     # Start development server');
  console.log('   npm run start   # Start production server');
  console.log('   npm run health  # Check service health');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
