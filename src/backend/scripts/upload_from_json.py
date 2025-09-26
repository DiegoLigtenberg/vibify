"""
Upload songs from JSON metadata files to Supabase and B2
Modified to work with our current database schema
"""

import os
import json
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

# Import centralized logging and config
import sys
sys.path.append(str(Path(__file__).parent.parent))
from app.config.logging_global import get_logger
from app.config.simple_config import Config

logger = get_logger(__name__)

# Supabase configuration
supabase: Client = create_client(
    Config.SUPABASE_URL,
    Config.SUPABASE_KEY
)

def convert_release_date(date_str: str) -> Optional[str]:
    """Convert YYYYMMDD format to YYYY-MM-DD"""
    if not date_str or len(date_str) != 8:
        return None
    try:
        year = date_str[:4]
        month = date_str[4:6]
        day = date_str[6:8]
        return f"{year}-{month}-{day}"
    except:
        return None

def process_genres(genres: List[str]) -> List[int]:
    """Process genres and return genre IDs"""
    genre_ids = []
    
    for genre_name in genres:
        # Check if genre exists
        existing_genre = supabase.table("genres").select("id").eq("name", genre_name).execute()
        
        if existing_genre.data:
            genre_ids.append(existing_genre.data[0]["id"])
        else:
            # Create new genre
            new_genre = supabase.table("genres").insert({
                "name": genre_name,
                "category": "genre"
            }).execute()
            genre_ids.append(new_genre.data[0]["id"])
    
    return genre_ids

def process_song_data(json_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process JSON data to match our database schema"""
    
    # Convert release date
    release_date = convert_release_date(json_data.get("release_date", ""))
    
    # Process song data
    song_data = {
        "id": json_data["id"],
        "title": json_data["title"],
        "artist": json_data["artist"],
        "album": json_data.get("album"),
        "duration": float(json_data["duration"]),
        "release_date": release_date,
        "view_count": json_data.get("view_count", 0),
        "like_count": json_data.get("like_count", 0),
        "description": json_data.get("description"),
        "youtube_url": json_data.get("source_url"),
        "storage_url": json_data.get("audio_url"),  # Will be updated with B2 URL
        "thumbnail_url": json_data.get("thumbnail_url"),  # Will be updated with B2 URL
        "is_public": True,
        "created_at": json_data.get("created_at", datetime.now().isoformat())
    }
    
    return song_data

def upload_song_to_supabase(song_data: Dict[str, Any], genres: List[str]) -> bool:
    """Upload song data to Supabase"""
    try:
        # Insert song
        song_result = supabase.table("songs").insert(song_data).execute()
        
        if not song_result.data:
            logger.error(f"Failed to insert song {song_data['id']}")
            return False
        
        # Process and link genres
        if genres:
            genre_ids = process_genres(genres)
            
            # Create song-genre relationships
            song_genres = [{"song_id": song_data["id"], "genre_id": genre_id} for genre_id in genre_ids]
            supabase.table("song_genres").insert(song_genres).execute()
        
        return True
        
    except Exception as e:
        logger.error(f"Error uploading song {song_data['id']}: {e}")
        return False

def process_json_files(json_folder: str) -> List[Dict[str, Any]]:
    """Process all JSON files in the folder"""
    json_path = Path(json_folder)
    json_files = list(json_path.glob("*.json"))
    
    processed_songs = []
    
    for json_file in tqdm(json_files, desc="Processing JSON files"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Process song data
            song_data = process_song_data(data)
            genres = data.get("tags", [])  # Keep reading from "tags" field but rename variable
            
            processed_songs.append({
                "song_data": song_data,
                "genres": genres,
                "file_path": json_file
            })
            
        except Exception as e:
            logger.error(f"Error processing {json_file}: {e}")
            continue
    
    return processed_songs

def main():
    """Main upload function"""
    json_folder = r"G:\Github\audio-foundation\database\dataset_mp3_metadata_llm\new_files"
    
    if not os.path.exists(json_folder):
        logger.error(f"JSON folder not found: {json_folder}")
        return
    
    logger.info(f"Processing JSON files from: {json_folder}")
    
    # Process all JSON files
    processed_songs = process_json_files(json_folder)
    
    logger.info(f"Found {len(processed_songs)} songs to upload")
    
    # Upload to Supabase
    success_count = 0
    for song_info in tqdm(processed_songs, desc="Uploading to Supabase"):
        if upload_song_to_supabase(song_info["song_data"], song_info["genres"]):
            success_count += 1
    
    logger.info(f"Successfully uploaded {success_count}/{len(processed_songs)} songs")
    
    # TODO: Upload files to B2 and update URLs
    logger.info("TODO: Upload files to B2 and update storage URLs")

if __name__ == "__main__":
    main()
