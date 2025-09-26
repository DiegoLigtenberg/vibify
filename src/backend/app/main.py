"""
Vibify Backend - FastAPI Application
Main entry point for the Vibify music streaming API
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Now import everything else
from .api import songs, upload
from .config.logging_global import get_logger
from .config.simple_config import Config
from .utils.b2_client import B2Client


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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(songs.router)
app.include_router(upload.router)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Warm up B2 client for faster first requests
        b2_client = B2Client()
        b2_client.warm_up()
        logger.info("B2 client warmed up successfully")
    except Exception as e:
        logger.error(f"Failed to warm up B2 client: {e}")

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
