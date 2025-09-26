"""
Song Service for Vibify
Handles song-related business logic and URL generation
"""

from typing import List, Optional, Dict, Any
from ..utils.b2_client import B2Client
from ..database.connection import SupabaseClient
from ..models.song import Song, SongResponse, SongSearchParams
from ..config.logging_global import get_logger
from ..config.simple_config import Config
import os

logger = get_logger(__name__)

class SongService:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SongService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.b2_client = B2Client()
        try:
            supabase_client = SupabaseClient()
            self.supabase = supabase_client.get_client()
        except Exception as e:
            logger.error(f"Error initializing Supabase connection: {e}")
            self.supabase = None
        
        self._initialized = True
    
    def generate_song_urls(self, song_id: str, audio_filename: str = None, thumbnail_filename: str = None) -> Dict[str, str]:
        """
        Generate URLs for song audio and thumbnail (DEPRECATED - use batch method instead)
        
        Args:
            song_id: Song ID (e.g., "0000000")
            audio_filename: Audio filename (e.g., "0000000.mp3")
            thumbnail_filename: Thumbnail filename (e.g., "0000000.png")
        
        Returns:
            Dict with storage_url and thumbnail_url
        """
        # Generate filenames if not provided
        if not audio_filename:
            audio_filename = f"{song_id}.mp3"
        if not thumbnail_filename:
            thumbnail_filename = f"{song_id}.png"
        
        # Generate URLs
        storage_url = self.b2_client.get_audio_url(audio_filename)
        thumbnail_url = self.b2_client.get_thumbnail_url(thumbnail_filename)
        
        return {
            "storage_url": storage_url,
            "thumbnail_url": thumbnail_url
        }
    
    def process_song_data(self, song_data: dict) -> Song:
        """
        Process a single song data dict into a Song object with optimized URL handling
        
        Args:
            song_data: Raw song data from database
            
        Returns:
            Song object with URLs
        """
        # Always generate fresh B2 URLs with authorization tokens for private buckets
        # The URLs in the database are public URLs that don't work with private buckets
        song_id = song_data['id']
        
        # Generate authenticated URLs using B2 client
        storage_url = self.b2_client.get_audio_url(f"{song_id}.mp3")
        thumbnail_url = self.b2_client.get_thumbnail_url(f"{song_id}.png")
        
        # Create Song object
        song_kwargs = {
            'id': song_data['id'],
            'title': song_data['title'],
            'artist': song_data['artist'],
            'album': song_data['album'],
            'duration': song_data['duration'],
            'storage_url': storage_url,
            'thumbnail_url': thumbnail_url,
            'release_date': song_data.get('release_date'),
            'description': song_data.get('description'),
            'genres': song_data.get('tags', []),
            'view_count': song_data.get('view_count') or 0,
            'like_count': song_data.get('like_count') or 0,
            'streams': song_data.get('streams') or 0,
            'is_public': song_data.get('is_public', True),
            'uploaded_by': song_data.get('uploaded_by')
        }
        
        # Only add datetime fields if they exist and are not None
        if song_data.get('created_at') is not None:
            song_kwargs['created_at'] = song_data['created_at']
        if song_data.get('updated_at') is not None:
            song_kwargs['updated_at'] = song_data['updated_at']
        
        return Song(**song_kwargs)
    
    def extract_filename_from_b2_url(self, b2_url: str, folder: str) -> str:
        """
        Extract filename from B2 URL
        
        Args:
            b2_url: Full B2 URL like "https://f003.backblazeb2.com/file/bucket-vibify/audio/0010466.mp3"
            folder: Folder name like "audio" or "thumbnails"
        
        Returns:
            Filename like "0010466.mp3"
        """
        if not b2_url:
            return ""
        
        # Extract filename from URL path
        # URL format: https://f003.backblazeb2.com/file/bucket-vibify/audio/0010466.mp3
        try:
            parts = b2_url.split(f"/{folder}/")
            if len(parts) > 1:
                return parts[1]
        except:
            pass
        
        return ""
    
    def get_song_with_urls(self, song_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add generated URLs to song data
        
        Args:
            song_data: Song data from database
        
        Returns:
            Song data with generated URLs
        """
        song_id = song_data.get("id", "")
        
        # Generate URLs
        urls = self.generate_song_urls(
            song_id=song_id,
            audio_filename=song_data.get("audio_filename"),
            thumbnail_filename=song_data.get("thumbnail_filename")
        )
        
        # Add URLs to song data
        song_data.update(urls)
        
        return song_data
    
    def get_songs_with_urls(self, songs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Add generated URLs to multiple songs
        
        Args:
            songs: List of song data from database
        
        Returns:
            List of songs with generated URLs
        """
        return [self.get_song_with_urls(song) for song in songs]
    
    def validate_file_exists(self, song_id: str, file_type: str = "audio") -> bool:
        """
        Check if audio or thumbnail file exists in B2
        
        Args:
            song_id: Song ID
            file_type: "audio" or "thumbnail"
        
        Returns:
            True if file exists, False otherwise
        """
        if file_type == "audio":
            filename = f"{song_id}.mp3"
            folder = self.b2_client.audio_folder
        elif file_type == "thumbnail":
            filename = f"{song_id}.png"
            folder = self.b2_client.thumbnail_folder
        else:
            return False
        
        return self.b2_client.file_exists(folder, filename)
    
    def get_songs_from_db(self, limit: int = 20, offset: int = 0) -> List[Song]:
        """
        Get songs from database with generated URLs
        
        Args:
            limit: Number of songs to return
            offset: Number of songs to skip
        
        Returns:
            List of Song objects with URLs
        """
        try:
            # Query database for songs
            response = self.supabase.table('songs').select('*').eq('is_public', True).range(offset, offset + limit - 1).execute()
            
            if not response.data:
                return []
            
            # Convert to Song objects and add URLs
            songs = []
            for song_data in response.data:
                # Use optimized processing
                song = self.process_song_data(song_data)
                songs.append(song)
            
            return songs
            
        except Exception as e:
            logger.error(f"Error fetching songs from database: {e}")
            return []
    
    def get_random_songs(self, limit: int = 10) -> List[Song]:
        """
        Get random songs from database
        
        Args:
            limit: Number of random songs to return
        
        Returns:
            List of random Song objects
        """
        try:
            # Get total count first
            count_response = self.supabase.table('songs').select('*', count='exact').eq('is_public', True).execute()
            total_count = count_response.count if count_response.count else 0
            
            if total_count == 0:
                return []
            
            # Generate random offset
            import random
            max_offset = max(0, total_count - limit)
            random_offset = random.randint(0, max_offset)
            
            # Get random songs
            # Supabase range is exclusive on the end, so we need to adjust
            end_offset = random_offset + limit
            response = self.supabase.table('songs').select('*').eq('is_public', True).range(random_offset, end_offset).execute()
            
            if not response.data:
                return []
            
            # Convert to Song objects using optimized processing
            songs = [self.process_song_data(song_data) for song_data in response.data]
            
            return songs
            
        except Exception as e:
            logger.error(f"Error fetching random songs from database: {e}")
            logger.error(f"Full error details: {type(e).__name__}: {str(e)}")
            return []
    
    def get_popular_songs(self, limit: int = 10) -> List[Song]:
        """
        Get popular songs ordered by play count
        
        Args:
            limit: Number of popular songs to return
        
        Returns:
            List of popular Song objects
        """
        try:
            # Query database for popular songs
            response = self.supabase.table('songs').select('*').eq('is_public', True).order('streams', desc=True).limit(limit).execute()
            
            if not response.data:
                return []
            
            # Convert to Song objects and add URLs
            songs = []
            for song_data in response.data:
                # Use optimized processing
                song = self.process_song_data(song_data)
                songs.append(song)
            
            return songs
            
        except Exception as e:
            logger.error(f"Error fetching popular songs from database: {e}")
            return []
    
    def increment_streams(self, song_id: str) -> bool:
        """
        Increment the streams count for a song
        
        Args:
            song_id: ID of the song to increment streams for
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Use the Supabase function to increment streams
            result = self.supabase.rpc('increment_song_streams', {'song_id_param': song_id}).execute()
            return True
        except Exception as e:
            logger.error(f"Error incrementing streams for song {song_id}: {e}")
            return False
    
    def record_song_stream(self, song_id: str, user_id: Optional[str] = None, listen_duration: Optional[float] = None) -> bool:
        """
        Record a song stream and increment the streams count
        
        Args:
            song_id: ID of the song that was streamed
            user_id: Optional user ID who streamed the song
            listen_duration: Duration listened in seconds (for quality tracking)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Only count as a "stream" if listened for at least 30 seconds or 50% of song
            should_count = True
            
            if listen_duration is not None:
                # Get song duration to calculate percentage
                song_data = self.supabase.table('songs').select('duration').eq('id', song_id).single().execute()
                if song_data.data:
                    song_duration = song_data.data.get('duration', 0)
                    # Count as stream if listened for 30+ seconds OR 50%+ of song
                    should_count = listen_duration >= 30 or (song_duration > 0 and listen_duration >= song_duration * 0.5)
            
            if should_count:
                # Increment the global streams count
                success = self.increment_streams(song_id)
            else:
                # Still record the event but don't count as a "stream"
                success = True
            
            # Record individual stream events for analytics (optional)
            if user_id:
                # You could create a separate table for individual stream events
                # For now, we'll just increment the global count
                pass
            
            return success
        except Exception as e:
            logger.error(f"Error recording song stream for {song_id}: {e}")
            return False

    def get_song_details(self, song_id: str) -> Optional[Song]:
        """
        Get detailed song information including genres
        """
        try:
            # Get song data
            song_result = self.supabase.table("songs").select("*").eq("id", song_id).single().execute()
            
            if not song_result.data:
                return None
            
            song_data = song_result.data
            
            # Get genres for this song
            genres_result = self.supabase.table("song_genres").select("genres(name)").eq("song_id", song_id).execute()
            genres = []
            if genres_result.data:
                genres = [genre["genres"]["name"] for genre in genres_result.data if genre.get("genres")]
            
            # Generate URLs for this song
            urls = self.generate_song_urls(song_id=song_data['id'])
            
                # Create song object with genres
            song = Song(
                id=song_data['id'],
                title=song_data['title'],
                artist=song_data['artist'],
                album=song_data['album'],
                duration=song_data['duration'],
                release_date=str(song_data['release_date']) if song_data['release_date'] else None,
                view_count=song_data.get('view_count') or 0,
                like_count=song_data.get('like_count') or 0,
                streams=song_data.get('streams') or 0,
                description=song_data.get('description'),
                storage_url=urls['storage_url'],
                thumbnail_url=urls['thumbnail_url'],
                is_public=song_data.get('is_public', True),
                uploaded_by=song_data.get('uploaded_by'),
                created_at=song_data['created_at'],
                updated_at=song_data['updated_at'],
                genres=genres
            )
            
            return song
        except Exception as e:
            logger.error(f"Error fetching song details: {e}")
            return None
    
    def like_song(self, song_id: str) -> bool:
        """
        Like a song (toggle like status)
        
        Args:
            song_id: ID of the song to like
            
        Returns:
            True if liked, False if unliked
        """
        try:
            # For now, we'll use a simple approach with a user_likes table
            # In a real app, you'd have user authentication
            user_id = "default_user"  # TODO: Get from authentication
            
            # Check if already liked
            existing = self.supabase.table("user_likes").select("*").eq("user_id", user_id).eq("song_id", song_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Unlike the song
                self.supabase.table("user_likes").delete().eq("user_id", user_id).eq("song_id", song_id).execute()
                # Decrement like count using direct update
                self.supabase.table('songs').update({
                    'like_count': self.supabase.table('songs').select('like_count').eq('id', song_id).execute().data[0]['like_count'] - 1
                }).eq('id', song_id).execute()
                return False
            else:
                # Like the song
                self.supabase.table("user_likes").insert({"user_id": user_id, "song_id": song_id}).execute()
                # Increment like count using direct update
                current_count = self.supabase.table('songs').select('like_count').eq('id', song_id).execute().data[0]['like_count']
                self.supabase.table('songs').update({
                    'like_count': current_count + 1
                }).eq('id', song_id).execute()
                return True
                
        except Exception as e:
            logger.error(f"Error liking song: {e}")
            return False
    
    def unlike_song(self, song_id: str) -> bool:
        """
        Unlike a song
        
        Args:
            song_id: ID of the song to unlike
            
        Returns:
            False (unliked)
        """
        try:
            user_id = "default_user"  # TODO: Get from authentication
            
            # Remove like
            self.supabase.table("user_likes").delete().eq("user_id", user_id).eq("song_id", song_id).execute()
            # Decrement like count using direct update
            current_count = self.supabase.table('songs').select('like_count').eq('id', song_id).execute().data[0]['like_count']
            self.supabase.table('songs').update({
                'like_count': max(current_count - 1, 0)
            }).eq('id', song_id).execute()
            return False
            
        except Exception as e:
            logger.error(f"Error unliking song: {e}")
            return False
    
    def is_song_liked(self, song_id: str) -> bool:
        """
        Check if a song is liked by the current user
        
        Args:
            song_id: ID of the song to check
            
        Returns:
            True if liked, False otherwise
        """
        try:
            user_id = "default_user"  # TODO: Get from authentication
            
            result = self.supabase.table("user_likes").select("*").eq("user_id", user_id).eq("song_id", song_id).execute()
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error checking like status: {e}")
            return False
    
    def get_songs_by_ids(self, song_ids: List[str]) -> List[Song]:
        """
        Get songs by their IDs
        
        Args:
            song_ids: List of song IDs to fetch
            
        Returns:
            List of Song objects
        """
        try:
            if not song_ids:
                return []
            
            # Get song details
            songs_result = self.supabase.table("songs").select("*").in_("id", song_ids).execute()
            
            if not songs_result.data:
                return []
            
            songs = []
            for song_data in songs_result.data:
                # Generate URLs
                urls = self.generate_song_urls(song_id=song_data['id'])
                
                song = Song(
                    id=song_data['id'],
                    title=song_data['title'],
                    artist=song_data['artist'],
                    album=song_data['album'],
                    duration=song_data['duration'],
                    release_date=str(song_data['release_date']) if song_data['release_date'] else None,
                    view_count=song_data.get('view_count') or 0,
                    like_count=song_data.get('like_count') or 0,
                    streams=song_data.get('streams') or 0,
                    description=song_data.get('description'),
                    storage_url=urls['storage_url'],
                    thumbnail_url=urls['thumbnail_url'],
                    is_public=song_data.get('is_public', True),
                    uploaded_by=song_data.get('uploaded_by'),
                    created_at=song_data['created_at'],
                    updated_at=song_data['updated_at']
                )
                songs.append(song)
            
            return songs
            
        except Exception as e:
            logger.error(f"Error fetching songs by IDs: {e}")
            return []

    def get_liked_songs(self) -> List[Song]:
        """
        Get all liked songs for the current user
        
        Returns:
            List of liked Song objects
        """
        try:
            if not self.supabase:
                logger.error("Error: Supabase connection not available")
                return []
                
            user_id = "default_user"  # TODO: Get from authentication
            
            # Get liked song IDs
            likes_result = self.supabase.table("user_likes").select("song_id").eq("user_id", user_id).execute()
            
            if not likes_result.data:
                return []
            
            song_ids = [like["song_id"] for like in likes_result.data]
            
            # Use the general method to fetch songs by IDs
            songs = self.get_songs_by_ids(song_ids)
            return songs
            
        except Exception as e:
            logger.error(f"Error fetching liked songs: {e}")
            import traceback
            traceback.print_exc()
            return []

    def search_songs(self, query: str, limit: int = 10) -> List[Song]:
        """
        Search for songs using full-text search on the search_vector column.
        Results are ordered by relevance.
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            List of Song objects matching the search query
        """
        if not query or not query.strip():
            return []
            
        try:
            # Use PostgreSQL full-text search with the search_vector column
            # The search_vector contains preprocessed text for efficient searching
            result = (
                self.supabase
                .table('songs')
                .select('*')
                .text_search('search_vector', query)
                .eq('is_public', True)
                .order('created_at', desc=True)  # Order by newest first as secondary sort
                .limit(limit)
                .execute()
            )
            
            songs = []
            for song_data in result.data:
                urls = self.generate_song_urls(song_id=song_data['id'])
                songs.append(
                    Song(
                        id=song_data['id'],
                        title=song_data['title'],
                        artist=song_data['artist'],
                        album=song_data['album'],
                        duration=song_data['duration'],
                        release_date=str(song_data['release_date']) if song_data['release_date'] else None,
                        view_count=song_data.get('view_count') or 0,
                        like_count=song_data.get('like_count') or 0,
                        streams=song_data.get('streams') or 0,
                        description=song_data.get('description'),
                        storage_url=urls['storage_url'],
                        thumbnail_url=urls['thumbnail_url'],
                        is_public=song_data.get('is_public', True),
                        uploaded_by=song_data.get('uploaded_by'),
                        created_at=song_data['created_at'],
                        updated_at=song_data['updated_at']
                    )
                )
            
            return songs
            
        except Exception as e:
            logger.error(f"Error searching songs: {e}")
            return []

    def advanced_search(self, query: str, limit: int = 10, genres: Optional[List[str]] = None, 
                       sort_by: str = "relevance", sort_order: str = "desc") -> List[Song]:
        """
        Advanced search with tag filtering and custom sorting.
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            genres: List of tags/genres to filter by
            sort_by: Field to sort by (relevance, streams, created_at, title)
            sort_order: Sort order (asc, desc)
            
        Returns:
            List of Song objects matching the search criteria
        """
        if not query or not query.strip():
            return []
            
        try:
            # Start with base query
            if genres and len(genres) > 0:
                # Complex query with genre filtering - use raw SQL for better performance
                genre_filter = ', '.join([f"'{genre.lower()}'" for genre in genres])
                
                sql_query = f"""
                SELECT DISTINCT s.* 
                FROM songs s
                JOIN song_genres sg ON s.id = sg.song_id
                JOIN genres g ON sg.genre_id = g.id
                WHERE s.is_public = true
                  AND s.search_vector @@ plainto_tsquery('{query}')
                  AND LOWER(g.name) IN ({genre_filter})
                """
                
                # Add sorting
                if sort_by == "relevance":
                    sql_query += " ORDER BY ts_rank(s.search_vector, plainto_tsquery(%s)) DESC"
                elif sort_by == "streams":
                    sql_query += f" ORDER BY s.streams {'DESC' if sort_order == 'desc' else 'ASC'}"
                elif sort_by == "created_at":
                    sql_query += f" ORDER BY s.created_at {'DESC' if sort_order == 'desc' else 'ASC'}"
                elif sort_by == "title":
                    sql_query += f" ORDER BY s.title {'DESC' if sort_order == 'desc' else 'ASC'}"
                else:
                    sql_query += " ORDER BY s.created_at DESC"
                
                sql_query += f" LIMIT {limit}"
                
                result = self.supabase.rpc('execute_sql', {
                    'sql': sql_query,
                    'params': [query]
                }).execute()
                
                rows = result.data if result.data else []
                
            else:
                # Simple text search without tag filtering - use REST RPC (working approach)
                import httpx
                from ..config.simple_config import Config
                
                # Map sort_by to database field names
                sort_field_map = {
                    "streams": "streams",
                    "created_at": "created_at", 
                    "title": "title",
                    "relevance": "created_at"  # Default to created_at for relevance
                }
                
                db_sort_field = sort_field_map.get(sort_by, "created_at")
                db_sort_order = "DESC" if sort_order == "desc" else "ASC"
                
                # Direct REST API call to Supabase RPC
                rpc_url = f"{Config.SUPABASE_URL}/rest/v1/rpc/search_songs"
                headers = {
                    "Content-Type": "application/json",
                    "apikey": Config.SUPABASE_KEY,
                    "Authorization": f"Bearer {Config.SUPABASE_KEY}",
                    "Prefer": "return=representation"
                }
                payload = {
                    "search_query": query,
                    "result_limit": limit,
                    "sort_field": db_sort_field,
                    "sort_order": db_sort_order
                }
                
                try:
                    with httpx.Client(timeout=10) as client:
                        resp = client.post(rpc_url, headers=headers, json=payload)
                        resp.raise_for_status()
                        rows = resp.json() or []
                except Exception as e:
                    logger.error(f"REST RPC search_songs failed: {e}")
                    rows = []
            
            # Convert to Song objects
            songs = []
            for song_data in rows:
                urls = self.generate_song_urls(song_id=song_data['id'])
                songs.append(
                    Song(
                        id=song_data['id'],
                        title=song_data['title'],
                        artist=song_data['artist'],
                        album=song_data['album'],
                        duration=song_data['duration'],
                        release_date=str(song_data['release_date']) if song_data['release_date'] else None,
                        view_count=song_data.get('view_count') or 0,
                        like_count=song_data.get('like_count') or 0,
                        streams=song_data.get('streams') or 0,
                        description=song_data.get('description'),
                        storage_url=urls['storage_url'],
                        thumbnail_url=urls['thumbnail_url'],
                        is_public=song_data.get('is_public', True),
                        uploaded_by=song_data.get('uploaded_by'),
                        created_at=song_data['created_at'],
                        updated_at=song_data['updated_at']
                    )
                )
            
            return songs
            
        except Exception as e:
            logger.error(f"Error in advanced search: {e}")
            return []

    def get_genres(self, limit: int = 50, min_songs: int = 1) -> List[Dict[str, Any]]:
        """
        Get list of genres without song counts for fast loading.
        
        Args:
            limit: Maximum number of genres to return
            min_songs: Minimum number of songs per genre (not used for performance)
            
        Returns:
            List of genre dictionaries with name and song_count (default 0)
        """
        try:
            result = (
                self.supabase
                .table('genres')
                .select('name')
                .eq('category', 'genre')
                .limit(limit)
                .execute()
            )
            
            if not result.data:
                return []
            
            # Return genres with default song_count of 0 for fast loading
            genres = []
            for genre in result.data:
                genres.append({
                    'name': genre['name'],
                    'song_count': 0  # Don't count songs for performance
                })
            
            return genres
            
        except Exception as e:
            logger.error(f"Error fetching genres: {e}")
            return []

    def get_songs_by_genre(self, genre: str, limit: int = 20, offset: int = 0, 
                          sort_by: str = "streams") -> List[Song]:
        """
        Get songs filtered by genre with pagination.
        
        Args:
            genre: Genre name to filter by
            limit: Maximum number of songs to return
            offset: Number of songs to skip
            sort_by: Field to sort by (streams, created_at, title, like_count)
            
        Returns:
            List of Song objects in the specified genre
        """
        try:
            # Get songs by genre using JOIN
            query_builder = (
                self.supabase
                .table('songs')
                .select('*')
                .join('song_genres', 'id', 'song_id')
                .join('genres', 'song_genres.genre_id', 'id')
                .eq('genres.name', genre.lower())
                .eq('is_public', True)
                .range(offset, offset + limit - 1)
            )
            
            # Add sorting
            if sort_by == "streams":
                query_builder = query_builder.order('streams', desc=True)
            elif sort_by == "created_at":
                query_builder = query_builder.order('created_at', desc=True)
            elif sort_by == "title":
                query_builder = query_builder.order('title', desc=False)
            elif sort_by == "like_count":
                query_builder = query_builder.order('like_count', desc=True)
            else:
                query_builder = query_builder.order('streams', desc=True)
            
            result = query_builder.execute()
            
            songs = []
            for song_data in result.data:
                urls = self.generate_song_urls(song_id=song_data['id'])
                songs.append(
                    Song(
                        id=song_data['id'],
                        title=song_data['title'],
                        artist=song_data['artist'],
                        album=song_data['album'],
                        duration=song_data['duration'],
                        release_date=str(song_data['release_date']) if song_data['release_date'] else None,
                        view_count=song_data.get('view_count') or 0,
                        like_count=song_data.get('like_count') or 0,
                        streams=song_data.get('streams') or 0,
                        description=song_data.get('description'),
                        storage_url=urls['storage_url'],
                        thumbnail_url=urls['thumbnail_url'],
                        is_public=song_data.get('is_public', True),
                        uploaded_by=song_data.get('uploaded_by'),
                        created_at=song_data['created_at'],
                        updated_at=song_data['updated_at']
                    )
                )
            
            return songs
            
        except Exception as e:
            logger.error(f"Error fetching songs by genre '{genre}': {e}")
            return []

    def get_discover_feed_by_genres(self, genres: List[str], limit: int = 20, cursor: int = 0, seed: int = 0) -> Dict[str, Any]:
        """
        Return a randomized paginated feed of songs filtered by genres using loose matching.
        Songs must have ALL specified genres (case-insensitive partial matching).
        """
        try:
            # First, find all genre IDs that match the provided genre names (loose matching)
            matching_genre_ids = []
            for genre_name in genres:
                # Use ILIKE for case-insensitive partial matching
                genre_result = (
                    self.supabase
                    .table('genres')
                    .select('id')
                    .ilike('name', f'%{genre_name}%')
                    .eq('category', 'genre')
                    .execute()
                )
                
                if genre_result.data:
                    matching_genre_ids.extend([g['id'] for g in genre_result.data])
            
            if not matching_genre_ids:
                return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}
            
            # Get songs that have ALL the matching genres
            # We need to find songs that have at least one genre from each requested genre group
            all_matching_song_ids = set()
            
            # For each requested genre, find songs that have that EXACT genre
            for genre_name in genres:
                # Get the exact genre ID (case-insensitive exact match)
                genre_match = (
                    self.supabase
                    .table('genres')
                    .select('id')
                    .ilike('name', genre_name)  # Exact match, not partial
                    .eq('category', 'genre')
                    .execute()
                )
                
                if not genre_match.data:
                    continue
                
                genre_id = genre_match.data[0]['id']
                
                # Get songs that have this exact genre
                song_genre_result = (
                    self.supabase
                    .table('song_genres')
                    .select('song_id')
                    .eq('genre_id', genre_id)
                    .execute()
                )
                
                if not song_genre_result.data:
                    continue
                
                current_song_ids = {sg['song_id'] for sg in song_genre_result.data}
                
                if not all_matching_song_ids:
                    # First genre - initialize with all matching songs
                    all_matching_song_ids = current_song_ids
                else:
                    # Intersection - songs must have ALL requested genres
                    all_matching_song_ids = all_matching_song_ids.intersection(current_song_ids)
            
            if not all_matching_song_ids:
                return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}
            
            # Filter to only public songs
            public_songs_result = (
                self.supabase
                .table('songs')
                .select('id')
                .in_('id', list(all_matching_song_ids))
                .eq('is_public', True)
                .execute()
            )
            
            if not public_songs_result.data:
                return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}
            
            final_song_ids = [s['id'] for s in public_songs_result.data]
            total_count = len(final_song_ids)
            
            import random
            random.seed(seed)
            
            # Shuffle the matching song IDs
            shuffled_ids = final_song_ids.copy()
            random.shuffle(shuffled_ids)
            
            start_idx = cursor
            end_idx = min(cursor + limit, len(shuffled_ids))
            selected_ids = shuffled_ids[start_idx:end_idx]
            
            if not selected_ids:
                return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": total_count}
            
            # Get full song data for selected IDs
            result = (
                self.supabase
                .table('songs')
                .select('*')
                .in_('id', selected_ids)
                .execute()
            )
            
            rows = result.data or []

            songs: List[Song] = []
            for song_data in rows:
                urls = self.generate_song_urls(song_id=song_data['id'])
                songs.append(
                    Song(
                        id=song_data['id'],
                        title=song_data['title'],
                        artist=song_data['artist'],
                        album=song_data.get('album'),
                        duration=song_data['duration'],
                        release_date=str(song_data['release_date']) if song_data.get('release_date') else None,
                        view_count=song_data.get('view_count') or 0,
                        like_count=song_data.get('like_count') or 0,
                        streams=song_data.get('streams') or 0,
                        description=song_data.get('description'),
                        storage_url=urls['storage_url'],
                        thumbnail_url=urls['thumbnail_url'],
                        is_public=song_data.get('is_public', True),
                        uploaded_by=song_data.get('uploaded_by'),
                        created_at=song_data.get('created_at'),
                        updated_at=song_data.get('updated_at')
                    )
                )

            next_cursor = cursor + len(songs)
            has_more = next_cursor < total_count

            return {
                "songs": songs,
                "next_cursor": next_cursor,
                "has_more": has_more,
                "seed": seed,
                "total": total_count
            }
            
        except Exception as e:
            logger.error(f"Error fetching genre-filtered discover feed: {e}")
            return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}

    def get_discover_feed(self, limit: int = 20, cursor: int = 0, seed: int = 0) -> Dict[str, Any]:
        """
        Return a randomized paginated feed of songs using proper pagination.
        """
        try:
            if not self.supabase:
                logger.error("Error: Supabase connection not available")
                return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}
            
            # Use optimized approach: fetch a larger batch and sample from it
            # This avoids the expensive count query that was causing 200-750ms delays
            batch_size = max(limit * 3, 100)  # Fetch 3x the requested amount
            
            # Get songs with proper pagination
            result = (
                self.supabase
                .table('songs')
                .select('*')
                .eq('is_public', True)
                .order('created_at', desc=True)  # Consistent ordering
                .range(cursor, cursor + batch_size - 1)
                .execute()
            )
            
            rows = result.data or []
            
            if not rows:
                return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}

            # Process songs using optimized method
            songs: List[Song] = []
            for song_data in rows[:limit]:  # Only process the requested limit
                try:
                    song = self.process_song_data(song_data)
                    songs.append(song)
                except Exception as song_error:
                    logger.error(f"Error processing song {song_data.get('id', 'unknown')}: {song_error}")
                    continue

            # Calculate next cursor and has_more
            next_cursor = cursor + len(songs)
            has_more = len(rows) > limit  # If we got more than requested, there might be more

            logger.debug(f"Discover feed: returning {len(songs)} songs, cursor={cursor}, next_cursor={next_cursor}, has_more={has_more}")

            return {
                "songs": songs,
                "next_cursor": next_cursor,
                "has_more": has_more,
                "seed": seed,
                "total": 0  # We don't need total count for performance
            }
        except Exception as e:
            logger.error(f"Error fetching discover feed: {e}")
            import traceback
            traceback.print_exc()
            return {"songs": [], "next_cursor": cursor, "has_more": False, "seed": seed, "total": 0}

# No global instance - create instances as needed
