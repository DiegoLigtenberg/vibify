#!/bin/bash

# VIBIFY Setup Script
echo "🚀 Setting up VIBIFY project..."

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo "❌ UV is not installed. Please install UV first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ UV and Node.js are installed"

# Setup Backend (UV)
echo "🐍 Setting up Python backend with UV..."
cd src/backend
uv sync
echo "✅ Backend dependencies installed"

# Setup Frontend (npm)
echo "⚛️ Setting up Next.js frontend..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

# Go back to root
cd ../..

echo "🎉 VIBIFY setup complete!"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "To start backend only:"
echo "  npm run dev:backend"
echo ""
echo "To start frontend only:"
echo "  npm run dev:frontend"
