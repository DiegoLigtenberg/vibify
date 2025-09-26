"""
Simple configuration for Vibify backend
This is a cleaner approach without Pydantic complexity
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Simple configuration class with environment-based settings"""
    
    # Get environment
    PYTHON_ENV = os.getenv("PYTHON_ENV", "development")
    IS_DEVELOPMENT = PYTHON_ENV.lower() == "development"
    IS_PRODUCTION = PYTHON_ENV.lower() == "production"
    
    # External Service Credentials (from .env)
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Backblaze B2 Credentials (from .env)
    B2_KEY_ID = os.getenv("B2_APPLICATION_KEY_ID", "")
    B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY", "")
    B2_BUCKET_NAME = os.getenv("B2_BUCKET_NAME", "")
    B2_ENDPOINT_URL = os.getenv("B2_ENDPOINT_URL", "")
    B2_API_URL = os.getenv("B2_API_URL")
    B2_AUDIO_FOLDER = os.getenv("B2_AUDIO_FOLDER", "audio")
    B2_THUMBNAIL_FOLDER = os.getenv("B2_THUMBNAIL_FOLDER", "thumbnails")
    
    # CORS Origins (from .env)
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001").split(",")
    CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]
    
    # Ensure 127.0.0.1:3000 is always included for local development
    if "http://127.0.0.1:3000" not in CORS_ORIGINS:
        CORS_ORIGINS.append("http://127.0.0.1:3000")
    
    # Application Configuration (auto-set based on environment)
    if IS_DEVELOPMENT:
        # Development settings
        BACKEND_HOST = "0.0.0.0"
        BACKEND_PORT = 8000
        BACKEND_DEBUG = True
        LOG_LEVEL = "DEBUG"
        LOG_FILE = "logs/vibify.log"
        
        # Development file paths
        JSON_METADATA_FOLDER = Path("./test_upload")
        AUDIO_FOLDER = Path("./test_upload")
        THUMBNAIL_FOLDER = Path("./test_upload")
        
    else:  # Production
        # Production settings
        BACKEND_HOST = "0.0.0.0"
        BACKEND_PORT = int(os.getenv("PORT", "8000"))  # Railway provides PORT
        BACKEND_DEBUG = False
        LOG_LEVEL = "WARNING"
        LOG_FILE = "logs/vibify.log"
        
        # Production file paths (these would be set by Railway/deployment)
        JSON_METADATA_FOLDER = Path(os.getenv("JSON_METADATA_FOLDER", "/app/data/metadata"))
        AUDIO_FOLDER = Path(os.getenv("AUDIO_FOLDER", "/app/data/audio"))
        THUMBNAIL_FOLDER = Path(os.getenv("THUMBNAIL_FOLDER", "/app/data/thumbnails"))
    
    # Development Test User
    TEST_USER_USERNAME = "test_user"
    
    # Upload Limits (same for all environments)
    MAX_UPLOAD_FILES = 10000
    MAX_FILE_SIZE_MB = 50
    ALLOWED_AUDIO_FORMATS = ["mp3", "wav", "flac", "m4a", "aac"]
    ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"]
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        required_vars = [
            "SUPABASE_URL", "SUPABASE_KEY", "B2_KEY_ID", "B2_APPLICATION_KEY",
            "B2_BUCKET_NAME", "B2_ENDPOINT_URL", "B2_API_URL"
        ]
        
        missing = []
        for var in required_vars:
            if not getattr(cls, var):
                missing.append(var)
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        # Only validate paths in development (they might not exist yet in production)
        if cls.IS_DEVELOPMENT:
            # Create directories if they don't exist in development
            cls.JSON_METADATA_FOLDER.mkdir(parents=True, exist_ok=True)
            cls.AUDIO_FOLDER.mkdir(parents=True, exist_ok=True)
            cls.THUMBNAIL_FOLDER.mkdir(parents=True, exist_ok=True)
    


