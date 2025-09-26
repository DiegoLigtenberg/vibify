"""
Songs API endpoints for Vibify
"""

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
import requests
from ..services.song_service import SongService
from ..models.song import Song, SongResponse, SongSearchParams
from ..utils.b2_client import B2Client
from ..config.logging_global import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/songs", tags=["songs"])

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {"message": "Songs API is working!", "status": "ok"}

@router.get("/debug")
async def debug_endpoint():
    """Debug endpoint to check what's happening"""
    try:
        from ..services.song_service import SongService
        service = SongService()
        return {
            "message": "Service loaded successfully",
            "service_type": str(type(service)),
            "status": "ok"
        }
    except Exception as e:
        return {
            "message": f"Service failed to load: {str(e)}",
            "status": "error",
            "error": str(e)
        }

@router.get("/discover/test")
async def discover_test():
    """Test discover endpoint without complex logic"""
    return {
        "message": "Discover endpoint is working!",
        "songs": [],
        "next_cursor": 0,
        "has_more": False,
        "seed": 0,
        "total": 0
    }

@router.get("/", response_model=SongResponse)
async def get_songs(
    limit: int = Query(20, ge=1, le=100, description="Number of songs to return"),
    offset: int = Query(0, ge=0, description="Number of songs to skip")
):
    """Get songs from database with generated URLs"""
    try:
        song_service = SongService()
        songs = song_service.get_songs_from_db(limit=limit, offset=offset)
        
        return SongResponse(
            songs=songs,
            total=len(songs),
            page=(offset // limit) + 1,
            limit=limit,
            has_more=len(songs) == limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching songs: {str(e)}")

@router.get("/random", response_model=List[Song])
async def get_random_songs(
    limit: int = Query(10, ge=1, le=50, description="Number of random songs to return")
):
    """Get random songs from database"""
    try:
        song_service = SongService()
        songs = song_service.get_random_songs(limit=limit)
        
        # Debug logging
        if songs:
            song = songs[0]
            logger.info(f"DEBUG: Song {song.title} - Storage URL: {song.storage_url}")
            logger.info(f"DEBUG: Song {song.title} - Thumbnail URL: {song.thumbnail_url}")
            logger.info(f"DEBUG: Storage URL has auth token: {'Authorization=' in song.storage_url}")
            logger.info(f"DEBUG: Thumbnail URL has auth token: {'Authorization=' in song.thumbnail_url}")
        
        return songs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching random songs: {str(e)}")

@router.get("/popular", response_model=List[Song])
async def get_popular_songs(
    limit: int = Query(10, ge=1, le=50, description="Number of popular songs to return")
):
    """Get popular songs ordered by streams count"""
    try:
        song_service = SongService()
        songs = song_service.get_popular_songs(limit=limit)
        return songs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching popular songs: {str(e)}")

@router.get("/discover")
async def discover_songs(
    limit: int = Query(20, ge=1, le=100, description="Number of songs to return per page"),
    cursor: int = Query(0, ge=0, description="Feed cursor position"),
    seed: int = Query(0, description="Deterministic seed for traversal")
):
    """Cursor-based discover feed for infinite scrolling."""
    try:
        logger.debug(f"Discover API called: limit={limit}, cursor={cursor}, seed={seed}")
        song_service = SongService()
        result = song_service.get_discover_feed(limit=limit, cursor=cursor, seed=seed)
        logger.debug(f"Discover API returning: {len(result.get('songs', []))} songs")
        return result
    except Exception as e:
        logger.error(f"Discover API error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching discover feed: {str(e)}")

@router.get("/discover/genre")
async def discover_songs_by_genre(
    genres: str = Query(..., description="Comma-separated list of genres to filter by"),
    limit: int = Query(20, ge=1, le=100, description="Number of songs to return per page"),
    cursor: int = Query(0, ge=0, description="Feed cursor position"),
    seed: int = Query(0, description="Deterministic seed for traversal")
):
    """Cursor-based discover feed filtered by genres for infinite scrolling."""
    try:
        # Parse comma-separated genres
        genre_list = [genre.strip() for genre in genres.split(',') if genre.strip()]
        if not genre_list:
            raise HTTPException(status_code=400, detail="At least one genre must be specified")
        if len(genre_list) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 genres allowed")
        
        song_service = SongService()
        result = song_service.get_discover_feed_by_genres(
            genres=genre_list, 
            limit=limit, 
            cursor=cursor, 
            seed=seed
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching genre-filtered discover feed: {str(e)}")

@router.post("/{song_id}/stream")
async def record_song_stream(
    song_id: str,
    user_id: Optional[str] = None,
    listen_duration: Optional[float] = None
):
    """Record a song stream and increment the streams count"""
    try:
        song_service = SongService()
        success = song_service.record_song_stream(song_id, user_id, listen_duration)
        if success:
            return {"message": "Stream recorded successfully", "song_id": song_id}
        else:
            raise HTTPException(status_code=400, detail="Failed to record stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording stream: {str(e)}")

@router.get("/search", response_model=List[Song])
async def search_songs(
    query: str = Query(..., min_length=1, description="Search query for songs"),
    limit: int = Query(10, ge=1, le=50, description="Number of search results to return"),
    genres: Optional[List[str]] = Query(None, description="Filter by specific genres"),
    sort_by: str = Query("relevance", description="Sort by: relevance, streams, created_at, title"),
    sort_order: str = Query("desc", description="Sort order: asc, desc")
):
    """Advanced search for songs with genre filtering and sorting"""
    try:
        song_service = SongService()
        songs = song_service.advanced_search(
            query=query, 
            limit=limit, 
            genres=genres, 
            sort_by=sort_by, 
            sort_order=sort_order
        )
        return songs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching songs: {str(e)}")

@router.get("/genres", response_model=List[Dict[str, Any]])
async def get_genres(
    limit: int = Query(50, ge=1, le=3000, description="Number of genres to return"),
    min_songs: int = Query(1, ge=1, description="Minimum number of songs per genre")
):
    """Get list of genres with song counts"""
    try:
        song_service = SongService()
        genres = song_service.get_genres(limit=limit, min_songs=min_songs)
        return genres
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching genres: {str(e)}")

@router.get("/genres/{genre_name}/songs", response_model=List[Song])
async def get_songs_by_genre(
    genre_name: str,
    limit: int = Query(20, ge=1, le=50, description="Number of songs to return"),
    offset: int = Query(0, ge=0, description="Number of songs to skip"),
    sort_by: str = Query("streams", description="Sort by: streams, created_at, title, like_count")
):
    """Get songs by genre with pagination"""
    try:
        song_service = SongService()
        songs = song_service.get_songs_by_genre(
            genre=genre_name, 
            limit=limit, 
            offset=offset, 
            sort_by=sort_by
        )
        return songs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching songs by genre: {str(e)}")

@router.get("/liked", response_model=List[Song])
async def get_liked_songs(request: Request):
    """Get all liked songs for the authenticated user"""
    try:
        # Get user_id from request headers
        user_id = request.headers.get("X-User-ID")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        song_service = SongService()
        song_service.set_current_user(user_id)
        
        # Verify the user ID was set correctly
        if not hasattr(song_service, '_current_user_id') or song_service._current_user_id != user_id:
            logger.error(f"Failed to set user ID in service context. Expected: {user_id}, Got: {getattr(song_service, '_current_user_id', None)}")
            raise HTTPException(status_code=500, detail="Failed to set user context")
        
        songs = song_service.get_liked_songs()
        return songs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching liked songs: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching liked songs: {str(e)}")

@router.get("/{song_id}/urls")
async def get_song_urls(song_id: str):
    """Get URLs for a specific song"""
    song_service = SongService()
    urls = song_service.generate_song_urls(song_id)
    
    return {
        "song_id": song_id,
        "urls": urls
    }

@router.get("/{song_id}/validate")
async def validate_song_files(song_id: str):
    """Validate if song files exist in B2"""
    song_service = SongService()
    audio_exists = song_service.validate_file_exists(song_id, "audio")
    thumbnail_exists = song_service.validate_file_exists(song_id, "thumbnail")
    
    return {
        "song_id": song_id,
        "audio_exists": audio_exists,
        "thumbnail_exists": thumbnail_exists,
        "all_files_exist": audio_exists and thumbnail_exists
    }

@router.get("/{song_id}/details", response_model=Song)
async def get_song_details(song_id: str):
    """Get detailed song information including genres"""
    try:
        song_service = SongService()
        song = song_service.get_song_details(song_id)
        if not song:
            raise HTTPException(status_code=404, detail="Song not found")
        return song
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching song details: {str(e)}")

@router.post("/{song_id}/like")
async def like_song(song_id: str, request: Request):
    """Like a song"""
    try:
        # Get user_id from request headers
        user_id = request.headers.get("X-User-ID")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        song_service = SongService()
        song_service.set_current_user(user_id)
        
        # Verify the user ID was set correctly
        if not hasattr(song_service, '_current_user_id') or song_service._current_user_id != user_id:
            logger.error(f"Failed to set user ID in service context for like. Expected: {user_id}, Got: {getattr(song_service, '_current_user_id', None)}")
            raise HTTPException(status_code=500, detail="Failed to set user context")
        
        result = song_service.like_song(song_id)
        return {"success": True, "liked": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking song: {e}")
        raise HTTPException(status_code=500, detail=f"Error liking song: {str(e)}")

@router.delete("/{song_id}/like")
async def unlike_song(song_id: str, request: Request):
    """Unlike a song"""
    try:
        # Get user_id from request headers
        user_id = request.headers.get("X-User-ID")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        song_service = SongService()
        song_service.set_current_user(user_id)
        
        # Verify the user ID was set correctly
        if not hasattr(song_service, '_current_user_id') or song_service._current_user_id != user_id:
            logger.error(f"Failed to set user ID in service context for unlike. Expected: {user_id}, Got: {getattr(song_service, '_current_user_id', None)}")
            raise HTTPException(status_code=500, detail="Failed to set user context")
        
        result = song_service.unlike_song(song_id)
        return {"success": True, "unliked": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unliking song: {e}")
        raise HTTPException(status_code=500, detail=f"Error unliking song: {str(e)}")

@router.get("/{song_id}/like-status")
async def get_like_status(song_id: str):
    """Get like status for a song"""
    try:
        song_service = SongService()
        is_liked = song_service.is_song_liked(song_id)
        return {"liked": is_liked}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting like status: {str(e)}")

@router.get("/{song_id}/download")
async def download_song(song_id: str):
    """Download a song file"""
    try:
        song_service = SongService()
        # Get song details to get the storage URL
        song_details = song_service.get_song_details(song_id)
        if not song_details:
            raise HTTPException(status_code=404, detail="Song not found")
        
        # Get the storage URL
        storage_url = song_details.storage_url
        if not storage_url:
            raise HTTPException(status_code=404, detail="Song file not found")
        
        # Use httpx to fetch the file from Backblaze B2
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(storage_url)
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Song file not accessible")
        
        # Return the file with proper headers for download
        from fastapi.responses import Response
        filename = f"{song_details.artist} - {song_details.title}.mp3"
        return Response(
            content=response.content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Content-Type": "audio/mpeg"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading song: {str(e)}")

@router.get("/{song_id}/audio")
async def get_song_audio(song_id: str):
    """Proxy endpoint to serve audio files from private B2 bucket"""
    try:
        song_service = SongService()
        
        # Get song from database to get the B2 URL
        song_data = song_service.supabase.table('songs').select('storage_url').eq('id', song_id).execute()
        
        if not song_data.data:
            raise HTTPException(status_code=404, detail="Song not found")
        
        b2_url = song_data.data[0]['storage_url']
        
        # Get B2 auth token
        b2_client = B2Client()
        b2_client._ensure_authenticated()
        
        # Proxy request to B2 with auth headers
        headers = {'Authorization': b2_client._auth_token}
        response = requests.get(b2_url, headers=headers, stream=True)
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Return streaming response
        return StreamingResponse(
            iter(lambda: response.raw.read(8192), b''),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename={song_id}.mp3",
                "Accept-Ranges": "bytes"
            }
        )
        
    except Exception as e:
        logger.error(f"Error serving audio for song {song_id}: {e}")
        raise HTTPException(status_code=500, detail="Error serving audio file")


@router.get("/{song_id}/thumbnail")
async def get_song_thumbnail(song_id: str):
    """Proxy endpoint to serve thumbnail images from private B2 bucket"""
    try:
        song_service = SongService()
        
        # Get song from database to get the B2 URL
        song_data = song_service.supabase.table('songs').select('thumbnail_url').eq('id', song_id).execute()
        
        if not song_data.data:
            raise HTTPException(status_code=404, detail="Song not found")
        
        b2_url = song_data.data[0]['thumbnail_url']
        
        # Get B2 auth token
        b2_client = B2Client()
        b2_client._ensure_authenticated()
        
        # Proxy request to B2 with auth headers
        headers = {'Authorization': b2_client._auth_token}
        response = requests.get(b2_url, headers=headers, stream=True)
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Thumbnail not found")
        
        # Return streaming response
        return StreamingResponse(
            iter(lambda: response.raw.read(8192), b''),
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename={song_id}.png",
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except Exception as e:
        logger.error(f"Error serving thumbnail for song {song_id}: {e}")
        raise HTTPException(status_code=500, detail="Error serving thumbnail")

# IMPORTANT: Keep this route LAST to avoid conflicts with specific routes above
@router.get("/{song_id}")
async def get_song(song_id: str):
    """Get single song with generated URLs"""
    song_service = SongService()
    # Mock data for testing - replace with actual database query
    mock_song = {
        "id": song_id,
        "title": f"Song {song_id}",
        "artist": "Sample Artist",
        "album": "Sample Album",
        "duration": 180.5,
        "audio_filename": f"{song_id}.mp3",
        "thumbnail_filename": f"{song_id}.png"
    }
    
    # Add generated URLs
    song_with_urls = song_service.get_song_with_urls(mock_song)
    
    return song_with_urls
