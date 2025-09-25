#!/usr/bin/env python3
"""
Production startup script for Railway deployment
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Also add the app directory to Python path
app_dir = backend_dir / "app"
sys.path.insert(0, str(app_dir))

print(f"Python path: {sys.path}")
print(f"Current working directory: {os.getcwd()}")
print(f"Backend directory: {backend_dir}")
print(f"App directory: {app_dir}")

if __name__ == "__main__":
    try:
        import uvicorn
        print("✅ Uvicorn imported successfully")
        
        from app.main import app
        print("✅ App imported successfully")
        
        print(f"✅ App routes: {[route.path for route in app.routes if hasattr(route, 'path')]}")
    except Exception as e:
        print(f"❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Get port from Railway environment variable
    port = int(os.environ.get("PORT", 8000))
    
    # Run the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
