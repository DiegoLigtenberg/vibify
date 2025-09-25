"""
Configuration constants for Vibify backend
This file contains all the constant values used across the application
"""

# ===========================================
# UPLOAD & PROCESSING CONSTANTS
# ===========================================
BATCH_SIZE = 50
MAXIMUM_RETRIES = 3
RETRY_DELAY = 5  # seconds
INDEX_FILE = "supabase_upload_index.json"

# ===========================================
# FILE EXTENSIONS & PATHS
# ===========================================
AUDIO_EXTENSION = "mp3"
THUMBNAIL_EXTENSION_LOCAL_DIR = "webp"
THUMBNAIL_EXTENSION = "png"
AUDIO_FOLDER_NAME = "audio"
THUMBNAIL_FOLDER_NAME = "thumbnails"

# ===========================================
# DATABASE CONSTANTS
# ===========================================
VALID_COLUMNS = {
    "id", "title", "artist", "album", "duration", "release_date", 
    "view_count", "like_count", "streams", "description", "youtube_url", 
    "youtube_id", "storage_url", "thumbnail_url", "created_at", 
    "updated_at", "tags"
}

# ===========================================
# METADATA FIELD MAPPING
# ===========================================
FIELD_MAPPING = {
    # General field mappings
    "file_path": "storage_path",
    "thumbnail_path": "thumbnail_path",
    
    # The database uses storage_url and thumbnail_url columns
    "audio_url": "storage_url",
    "thumbnail_url": "thumbnail_url",
    
    # Map source_url to youtube_url
    "source_url": "youtube_url",
}

# ===========================================
# VERSIONING CONSTANTS
# ===========================================
METADATA_FIELDS = [
    "title", "artist", "album", "description", "youtube_url", 
    "storage_url", "thumbnail_url"
]

# ===========================================
# API CONSTANTS
# ===========================================
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ===========================================
# LOGGING CONSTANTS
# ===========================================
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DEFAULT_LOG_LEVEL = "INFO"
