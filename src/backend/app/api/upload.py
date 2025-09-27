"""
Upload API endpoints for Vibify
Handles music file uploads to B2 and metadata to Supabase
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import Optional
import os
import uuid
import tempfile
from pathlib import Path
import mimetypes
from mutagen import File as MutagenFile
from io import BytesIO

from ..config.simple_config import Config
from ..utils.b2_client import B2Client
from ..services.song_service import SongService
from ..config.logging_global import get_logger

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = get_logger(__name__)

def extract_audio_duration(audio_content: bytes) -> int:
    """Extract duration from audio file content using mutagen"""
    try:
        # Create a BytesIO object from the content
        audio_buffer = BytesIO(audio_content)
        
        # Use mutagen to read the audio file
        audio_file = MutagenFile(audio_buffer)
        
        if audio_file is not None and hasattr(audio_file, 'info'):
            duration = int(audio_file.info.length)
            logger.info(f"Extracted audio duration: {duration} seconds")
            return duration
        else:
            logger.warning("Could not extract duration from audio file")
            return 0
    except Exception as e:
        logger.error(f"Error extracting audio duration: {e}")
        return 0

@router.post("/song")
async def upload_song(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    artist: str = Form(...),
    album: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    release_date: Optional[str] = Form(None),
    youtube_url: Optional[str] = Form(None),
    is_public: bool = Form(True),
    thumbnail: Optional[UploadFile] = File(None)
):
    """
    Upload a single song file to B2 and save metadata to Supabase
    """
    try:
        # Get user ID from headers
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Validate that user_id is a valid UUID format
        import uuid
        try:
            uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Validate file size (50MB max)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        await file.seek(0)  # Reset file pointer
        
        if file_size > Config.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File size exceeds {Config.MAX_FILE_SIZE_MB}MB limit")
        
        # Extract audio duration
        duration = extract_audio_duration(content)
        
        # Get next song ID based on current count in database
        from ..services.song_service import SongService
        song_service = SongService()
        song_count = song_service.get_song_count()
        next_song_number = song_count + 1
        song_id = f"{next_song_number:07d}"  # Format as 0000001, 0000002, etc.
        
        # Generate thumbnail ID
        thumbnail_id = f"{song_id}_thumb" if thumbnail else None
        
        # Initialize services
        b2_client = B2Client()
        song_service.set_current_user(user_id)
        
        # Upload audio file to B2 with proper naming (user uploads go to user_audio folder)
        audio_filename = f"{song_id}-{title.replace(' ', '-').lower()}.mp3"
        audio_url = await b2_client.upload_file(
            content=content,
            filename=audio_filename,
            folder=Config.B2_USER_AUDIO_FOLDER,
            content_type="audio/mpeg"
        )
        
        # Upload thumbnail if provided
        thumbnail_url = None
        if thumbnail and thumbnail.content_type and thumbnail.content_type.startswith('image/'):
            thumbnail_content = await thumbnail.read()
            # Determine file extension from content type
            if thumbnail.content_type == 'image/jpeg':
                thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.jpg"
            elif thumbnail.content_type == 'image/png':
                thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.png"
            elif thumbnail.content_type == 'image/webp':
                thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.webp"
            else:
                thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.png"  # Default to PNG
            
            thumbnail_url = await b2_client.upload_file(
                content=thumbnail_content,
                filename=thumbnail_filename,
                folder=Config.B2_USER_THUMBNAIL_FOLDER,
                content_type=thumbnail.content_type
            )
        
        # Save metadata to Supabase
        song_data = {
            "id": song_id,
            "title": title.strip(),
            "artist": artist.strip(),
            "album": album.strip() if album else None,
            "description": description.strip() if description else None,
            "release_date": release_date if release_date else None,
            "youtube_url": youtube_url.strip() if youtube_url else None,
            "storage_url": audio_url,
            "thumbnail_url": thumbnail_url,
            "is_public": False,  # User uploads start as private until verified
            "uploaded_by": user_id,  # Use uploaded_by field instead of user_id
            "duration": duration,
            "view_count": 0,
            "like_count": 0,
            "streams": 0
        }
        
        # Insert into database
        result = song_service.supabase.table('songs').insert(song_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save song metadata")
        
        logger.info(f"Successfully uploaded song {song_id} for user {user_id}")
        
        return {
            "success": True,
            "song_id": song_id,
            "message": "Song uploaded successfully",
            "audio_url": audio_url,
            "thumbnail_url": thumbnail_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading song: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/bulk")
async def upload_bulk_songs(
    files: list[UploadFile] = File(...)
):
    """
    Upload multiple song files at once
    """
    # TODO: Implement bulk upload logic
    return {"message": "Bulk upload endpoint - TODO: Implement"}

@router.get("/status/{upload_id}")
async def get_upload_status(upload_id: str):
    """
    Get upload status and progress
    """
    # TODO: Implement upload status tracking
    return {"message": "Upload status endpoint - TODO: Implement"}

@router.delete("/cancel/{upload_id}")
async def cancel_upload(upload_id: str):
    """
    Cancel an ongoing upload
    """
    # TODO: Implement upload cancellation
    return {"message": "Cancel upload endpoint - TODO: Implement"}
