"""
Upload service for handling song metadata uploads to Supabase.
This service provides both batch and single song upload functionality.
"""

import os
import json
import hashlib
import logging
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from supabase import create_client, Client
from tqdm import tqdm

from app.config.simple_config import Config
from app.config.constants import *
from app.config.logging_global import get_logger

logger = get_logger(__name__)


class SongUploadService:
    """Service for uploading song metadata to Supabase."""
    
    def __init__(self):
        """Initialize the upload service with Supabase client."""
        self.supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        self.stats = {
            "total_files": 0,
            "processed_files": 0,
            "new_songs": 0,
            "updated_songs": 0,
            "skipped_unchanged": 0,
            "empty_files": 0,
            "json_decode_errors": 0,
            "api_errors": 0,
            "batch_count": 0,
        }
    
    def format_timestamp(self, dt: Optional[datetime] = None) -> str:
        """Format timestamp in PostgreSQL-compatible ISO format."""
        if dt is None:
            dt = datetime.utcnow()
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    
    def get_b2_url(self, file_id: str, file_type: str) -> str:
        """Generate a URL for a file in the B2 bucket."""
        if file_type == "audio":
            extension = AUDIO_EXTENSION
            folder = Config.B2_AUDIO_FOLDER
        else:
            extension = THUMBNAIL_EXTENSION_LOCAL_DIR
            folder = Config.B2_THUMBNAIL_FOLDER
        
        return f"{Config.B2_BASE_URL}/{folder}/{file_id}.{extension}"
    
    def _check_local_files_exist(self, file_id: str) -> bool:
        """
        Check if both audio and thumbnail files exist locally.
        
        Args:
            file_id: The song ID to check
            
        Returns:
            True if both files exist locally, False otherwise
        """
        try:
            # Check if audio file exists locally
            audio_path = Config.AUDIO_FOLDER / f"{file_id}.{AUDIO_EXTENSION}"
            audio_exists = audio_path.exists()
            
            # Check if thumbnail file exists locally  
            thumbnail_path = Config.THUMBNAIL_FOLDER / f"{file_id}.{THUMBNAIL_EXTENSION_LOCAL_DIR}"
            thumbnail_exists = thumbnail_path.exists()
            
            if not audio_exists:
                logger.debug(f"Audio file missing: {audio_path}")
            if not thumbnail_exists:
                logger.debug(f"Thumbnail file missing: {thumbnail_path}")
                
            return audio_exists and thumbnail_exists
            
        except Exception as e:
            logger.debug(f"Error checking local files for {file_id}: {e}")
            return False
    
    def format_date(self, date_str: str) -> str:
        """Convert YYYYMMDD string to YYYY-MM-DD format for PostgreSQL."""
        if not date_str or len(date_str) != 8:
            return None
        
        try:
            year = date_str[0:4]
            month = date_str[4:6]
            day = date_str[6:8]
            return f"{year}-{month}-{day}"
        except (IndexError, ValueError):
            logger.warning(f"Invalid date format: {date_str}")
            return None
    
    def sanitize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean up data before inserting into database."""
        # Convert metadata fields to DB column names
        mapped_data = {}
        for key, value in data.items():
            db_key = FIELD_MAPPING.get(key, key)
            if value is not None:
                mapped_data[db_key] = value
        
        # Convert release_date from YYYYMMDD to YYYY-MM-DD
        if "release_date" in mapped_data and mapped_data["release_date"]:
            mapped_data["release_date"] = self.format_date(mapped_data["release_date"])
        
        # Get file ID
        file_id = data.get("id") or mapped_data.get("id")
        if not file_id and "file_path" in data:
            file_path = data["file_path"]
            file_id = Path(file_path).stem
        
        # Generate URLs based on file ID
        if file_id:
            # Check if both audio and thumbnail files exist locally
            if self._check_local_files_exist(file_id):
                mapped_data["storage_url"] = self.get_b2_url(file_id, "audio")
                mapped_data["thumbnail_url"] = self.get_b2_url(file_id, "thumbnail")
            else:
                logger.warning(f"Missing local files for song {file_id}, skipping upload")
                return None  # Skip this song entirely
        
        # Remove any fields that don't exist in the schema
        sanitized = {k: v for k, v in mapped_data.items() if k in VALID_COLUMNS}
        
        # Ensure we have timestamp for updated_at
        if "updated_at" not in sanitized:
            sanitized["updated_at"] = self.format_timestamp()
        
        return sanitized
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate MD5 hash of a file."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def insert_genres(self, song_id: str, genres: List[str]) -> None:
        """Insert genres for a song."""
        if not genres:
            return
        
        # First, make sure all genres exist in the genres table
        genre_objects = []
        for genre_name in genres:
            genre_name = genre_name.strip().lower()
            if not genre_name:
                continue
            genre_objects.append({"name": genre_name})
        
        if genre_objects:
            # Upsert genres to ensure they exist
            self.supabase.table("genres").upsert(
                genre_objects, 
                on_conflict="name"
            ).execute()
            
            # Get genre IDs for the inserted genre names
            genre_results = self.supabase.table("genres").select("id, name").in_("name", [obj["name"] for obj in genre_objects]).execute()
            
            # Create song_genres relationships
            song_genre_objects = []
            for genre_record in genre_results.data:
                song_genre_objects.append({
                    "song_id": song_id,
                    "genre_id": genre_record["id"]
                })
            
            if song_genre_objects:
                # First delete existing relationships
                self.supabase.table("song_genres").delete().eq("song_id", song_id).execute()
                
                # Then insert new relationships
                self.supabase.table("song_genres").insert(song_genre_objects).execute()
    
    def upload_single_song(self, metadata: Dict[str, Any], file_path: Optional[str] = None) -> bool:
        """
        Upload a single song to Supabase.
        
        Args:
            metadata: Song metadata dictionary
            file_path: Optional path to the metadata file (for hash calculation)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Sanitize the data
            record_data = self.sanitize_data(metadata)
            
            # Extract genres before inserting
            genres = record_data.pop("tags", [])  # Still reading from "tags" field in JSON
            
            # Insert the song record
            result = self.supabase.table("songs").upsert(
                record_data,
                on_conflict="id"
            ).execute()
            
            # Insert genres if any
            if genres:
                self.insert_genres(record_data["id"], genres)
            
            logger.info(f"✅ Successfully uploaded song: {record_data.get('title', 'Unknown')}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error uploading song: {e}")
            self.stats["api_errors"] += 1
            return False
    
    def upload_batch_songs(self, metadata_files: List[Path], batch_size: int = 50, show_progress: bool = True, skip_older: bool = False) -> Dict[str, int]:
        """
        Upload multiple songs in batches with progress tracking.
        
        Args:
            metadata_files: List of Path objects to JSON metadata files
            batch_size: Number of records to batch in a single request
            show_progress: Whether to show progress bar
            skip_older: Skip files that are older than existing database records
            
        Returns:
            Statistics about the upload process
        """
        # Reset stats
        self.stats = {
            "total_files": len(metadata_files),
            "processed_files": 0,
            "new_songs": 0,
            "updated_songs": 0,
            "skipped_unchanged": 0,
            "skipped_older": 0,
            "empty_files": 0,
            "json_decode_errors": 0,
            "api_errors": 0,
            "batch_count": 0,
        }
        
        # Process files in batches
        batch_data = []
        batch_file_info = []
        
        # Create progress bar
        if show_progress:
            progress_bar = tqdm(total=len(metadata_files), desc="Uploading songs", unit="songs")
        
        try:
            for idx, json_file in enumerate(metadata_files):
                try:
                    # Check if file is empty
                    if json_file.stat().st_size == 0:
                        logger.warning(f"Empty file: {json_file}")
                        self.stats["empty_files"] += 1
                        if show_progress:
                            progress_bar.update(1)
                        continue
                    
                    # Read and parse the JSON file
                    with open(json_file, "r", encoding="utf-8") as f:
                        metadata = json.load(f)
                    
                    # Sanitize the data
                    record_data = self.sanitize_data(metadata)
                    
                    # Skip if sanitize_data returned None (missing local files)
                    if record_data is None:
                        logger.info(f"Skipping {json_file.name} - missing local files")
                        self.stats["skipped_unchanged"] += 1  # Use this counter for missing files
                        if show_progress:
                            progress_bar.update(1)
                        continue
                    
                    # Check if we should skip this file based on age
                    if skip_older and record_data.get("id"):
                        if self._should_skip_older_file(json_file, record_data["id"]):
                            logger.info(f"Skipping older file: {json_file.name}")
                            self.stats["skipped_older"] += 1
                            if show_progress:
                                progress_bar.update(1)
                            continue
                    
                    # Extract genres before adding to batch
                    genres = record_data.pop("tags", [])  # Still reading from "tags" field in JSON
                    
                    # Add to the current batch
                    batch_data.append(record_data)
                    batch_file_info.append((json_file, genres))
                    
                    # Process the batch if it reaches the batch size
                    if len(batch_data) >= batch_size:
                        success = self._process_batch(batch_data, batch_file_info)
                        
                        if show_progress:
                            progress_bar.set_postfix(
                                batch=self.stats["batch_count"],
                                processed=self.stats["processed_files"],
                                errors=self.stats["api_errors"]
                            )
                        
                        batch_data = []
                        batch_file_info = []
                    
                    self.stats["processed_files"] += 1
                    if show_progress:
                        progress_bar.update(1)
                    
                except json.JSONDecodeError:
                    logger.warning(f"Error decoding JSON: {json_file}")
                    self.stats["json_decode_errors"] += 1
                    if show_progress:
                        progress_bar.update(1)
                except Exception as e:
                    logger.error(f"Error processing {json_file}: {e}")
                    self.stats["api_errors"] += 1
                    if show_progress:
                        progress_bar.update(1)
            
            # Process any remaining records in the last batch
            if batch_data:
                self._process_batch(batch_data, batch_file_info)
        
        finally:
            if show_progress:
                progress_bar.close()
        
        return self.stats
    
    def _process_batch(self, batch_data: List[Dict[str, Any]], batch_file_info: List[Tuple]) -> bool:
        """Process a batch of records."""
        if not batch_data:
            return True
        
        try:
            # Check for existing songs before upsert
            song_ids = [record.get("id") for record in batch_data if record.get("id")]
            existing_songs = set()
            
            if song_ids:
                try:
                    result = self.supabase.table("songs").select("id").in_("id", song_ids).execute()
                    existing_songs = {song["id"] for song in result.data} if result.data else set()
                    
                    if existing_songs:
                        logger.info(f"Found {len(existing_songs)} existing songs that will be updated: {list(existing_songs)[:5]}{'...' if len(existing_songs) > 5 else ''}")
                except Exception as e:
                    logger.warning(f"Could not check for existing songs: {e}")
            
            # Clean up batch data for Supabase
            all_keys = set()
            for record in batch_data:
                all_keys.update(record.keys())
            
            # Normalize all records to have the same keys
            for record in batch_data:
                for key in all_keys:
                    if key not in record:
                        record[key] = None
            
            # Perform upsert operation
            result = self.supabase.table("songs").upsert(
                batch_data,
                on_conflict="id"
            ).execute()
            
            # Log the results and update statistics
            new_songs = len(song_ids) - len(existing_songs)
            updated_songs = len(existing_songs)
            
            self.stats["new_songs"] += new_songs
            self.stats["updated_songs"] += updated_songs
            
            if new_songs > 0:
                logger.info(f"Added {new_songs} new songs")
            if updated_songs > 0:
                logger.info(f"Updated {updated_songs} existing songs")
            
            # Process genres for each record
            for i, record in enumerate(batch_data):
                if i < len(batch_file_info):
                    song_id = record.get("id")
                    if song_id:
                        _, genres = batch_file_info[i]
                        if genres:
                            try:
                                self.insert_genres(song_id, genres)
                            except Exception as e:
                                logger.error(f"Error inserting genres for song {song_id}: {e}")
            
            self.stats["batch_count"] += 1
            logger.debug(f"Processed batch {self.stats['batch_count']} with {len(batch_data)} records")
            return True
            
        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            self.stats["api_errors"] += 1
            return False
    
    def _should_skip_older_file(self, file_path: Path, song_id: str) -> bool:
        """
        Check if a file should be skipped because it's older than the database record.
        
        Args:
            file_path: Path to the metadata file
            song_id: Song ID to check in database
            
        Returns:
            True if file should be skipped (older than database), False otherwise
        """
        try:
            # Get file modification time
            file_mtime = file_path.stat().st_mtime
            
            # Get database record's updated_at timestamp
            result = self.supabase.table("songs").select("updated_at").eq("id", song_id).single().execute()
            
            if not result.data:
                # No existing record, don't skip
                return False
            
            # Convert database timestamp to Unix timestamp
            db_updated_at = result.data.get("updated_at")
            if not db_updated_at:
                # No timestamp in database, don't skip
                return False
            
            # Parse database timestamp (ISO format)
            from datetime import datetime
            db_timestamp = datetime.fromisoformat(db_updated_at.replace('Z', '+00:00'))
            db_mtime = db_timestamp.timestamp()
            
            # Skip if file is older than database record
            should_skip = file_mtime <= db_mtime
            
            if should_skip:
                logger.debug(f"File {file_path.name} is older than database record (file: {file_mtime}, db: {db_mtime})")
            
            return should_skip
            
        except Exception as e:
            # Check if it's the "no rows" error (expected when database is empty)
            if "PGRST116" in str(e) or "0 rows" in str(e):
                # No existing record, don't skip (this is expected for new uploads)
                return False
            else:
                # Log other errors as warnings
                logger.warning(f"Error checking file age for {song_id}: {e}")
                # If we can't determine age, don't skip
                return False

    def get_upload_stats(self) -> Dict[str, int]:
        """Get current upload statistics."""
        return self.stats.copy()
    
    def print_stats(self):
        """Print upload statistics."""
        logger.info("\n" + "="*50)
        logger.info("UPLOAD STATISTICS")
        logger.info("="*50)
        logger.info(f"Total files processed: {self.stats['total_files']}")
        logger.info(f"Successfully processed: {self.stats['processed_files']}")
        logger.info(f"New songs added: {self.stats['new_songs']}")
        logger.info(f"Existing songs updated: {self.stats['updated_songs']}")
        logger.info(f"Skipped older files: {self.stats['skipped_older']}")
        logger.info(f"Skipped missing files: {self.stats['skipped_unchanged']}")
        logger.info(f"Empty files: {self.stats['empty_files']}")
        logger.info(f"JSON decode errors: {self.stats['json_decode_errors']}")
        logger.info(f"API errors: {self.stats['api_errors']}")
        logger.info(f"Batch count: {self.stats['batch_count']}")
        logger.info("="*50)

