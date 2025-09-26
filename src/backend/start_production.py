#!/usr/bin/env python3
"""
Vibify Backend Server
Unified startup script for both local development and production deployment.
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Start the Vibify backend server."""
    
    # Add the backend directory to Python path
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))
    
    # Import the app
    from app.main import app
    
    # Configuration based on environment
    is_production = os.environ.get("RAILWAY_ENVIRONMENT") is not None
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0" if is_production else "127.0.0.1"
    
    # Performance optimizations
    # For I/O-bound apps: (CPU cores * 2) is optimal
    # Local: i7-12700 has 24 logical processors, so 48 workers max, but we test on prod
    # Railway: typically 1-2 cores, but we can go for 4-8 workers
    workers = 4 if is_production else 4
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
        http="httptools",
        workers=workers,
        access_log=not is_production
    )

if __name__ == "__main__":
    main()