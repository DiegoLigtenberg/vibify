#!/usr/bin/env python3
"""
Vibify Backend Server Startup Script
This script properly starts the FastAPI server with correct module resolution
"""

import sys
import os
from pathlib import Path


# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Set environment variables
os.environ.setdefault('PYTHONPATH', str(current_dir))

if __name__ == "__main__":
    import uvicorn
    from app.main import app
    
    print("🚀 Starting Vibify Backend Server...")
    print(f"📁 Working directory: {current_dir}")
    print(f"🐍 Python path: {sys.path[0]}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(current_dir)]
    )
