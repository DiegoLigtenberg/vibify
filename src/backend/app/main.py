"""
Vibify Backend - FastAPI Application
Main entry point for the Vibify music streaming API
"""

import os
import time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Now import everything else
from .api import songs, upload, auth
from .config.logging_global import get_logger
from .config.simple_config import Config
from .utils.b2_client import B2Client
from .services.song_service import SongService


# Setup logging
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Vibify API",
    description="A professional Spotify clone API built with FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Timing middleware for performance monitoring
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
app.include_router(songs.router)
app.include_router(upload.router)
app.include_router(auth.router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Warm up B2 client for faster first requests
        b2_client = B2Client()
        b2_client.warm_up()
        logger.info("B2 client warmed up successfully")
        
        # Warm up SongService for faster first requests
        song_service = SongService()
        # Pre-initialize by doing a small query
        song_service.get_discover_feed(limit=1, cursor=0, seed=0)
        logger.info("SongService warmed up successfully")
    except Exception as e:
        logger.error(f"Failed to warm up services: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Vibify API! 🎵",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "vibify-backend"}

@app.get("/routes")
async def list_routes():
    """List all available routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": getattr(route, 'name', 'unknown')
            })
    return {"routes": routes, "total": len(routes)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
