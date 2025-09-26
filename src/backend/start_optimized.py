#!/usr/bin/env python3
"""
Optimized server startup script for Vibify
Uses httptools parser and optimized settings for maximum performance
"""

import subprocess
import sys
import os

def start_optimized_server():
    """Start the server with optimized settings"""
    
    # Change to backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Optimized uvicorn command
    cmd = [
        "uv", "run", "uvicorn", 
        "app.main:app",
        "--host", "127.0.0.1",  # Use 127.0.0.1 instead of localhost for Windows
        "--port", "8000",
        "--http", "httptools",   # Use httptools parser instead of h11
        "--no-access-log",       # Disable access logs for performance
        "--workers", "2"         # Multiple workers for better concurrency
    ]
    
    print("🚀 Starting Vibify with optimized settings...")
    print(f"Command: {' '.join(cmd)}")
    print("✅ Using httptools parser (10x faster than h11)")
    print("✅ Using 127.0.0.1 (Windows networking optimization)")
    print("✅ Multiple workers enabled")
    print("✅ Access logs disabled for performance")
    print("\n" + "="*50)
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_optimized_server()
