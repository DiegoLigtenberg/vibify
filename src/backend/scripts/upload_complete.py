"""
Complete upload script for Vibify
Handles both B2 file uploads and Supabase metadata uploads
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

# Import centralized logging
from app.config.logging_global import get_logger

logger = get_logger(__name__)

# Import our modules
import sys
sys.path.append(str(Path(__file__).parent.parent))

from app.config.simple_config import Config
from b2_upload.upload_files_to_b2 import B2Uploader
from upload_from_json import process_song_data, process_genres, upload_song_to_supabase

# Load environment variables
# load_dotenv()

class CompleteUploader:
    def __init__(self):
        self.b2_uploader = B2Uploader()
        self.supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        self.json_folder = Path(Config.JSON_METADATA_FOLDER)
        self.audio_dir = Path(Config.AUDIO_FOLDER)
        self.thumbnail_dir = Path(Config.THUMBNAIL_FOLDER)
    
    def process_json_files(self) -> List[Dict[str, Any]]:
        """Process all JSON metadata files"""
        if not self.json_folder.exists():
            raise FileNotFoundError(f"JSON folder not found: {self.json_folder}")
        
        json_files = list(self.json_folder.glob("*.json"))
        processed_songs = []
        
        for json_file in tqdm(json_files, desc="Processing JSON files"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Process song data
                song_data = process_song_data(data)
                genres = data.get("tags", [])
                
                processed_songs.append({
                    "song_data": song_data,
                    "genres": genres,
                    "file_path": json_file
                })
                
            except Exception as e:
                logger.error(f"Error processing {json_file}: {e}")
                continue
        
        return processed_songs
    
    def update_song_urls(self, song_id: str, audio_filename: str, thumbnail_filename: str) -> bool:
        """Update song URLs after B2 upload"""
        try:
            # Generate B2 URLs
            audio_url = f"https://f003.backblazeb2.com/file/bucket-vibify/audio/{audio_filename}"
            thumbnail_url = f"https://f003.backblazeb2.com/file/bucket-vibify/thumbnails/{thumbnail_filename}"
            
            # Update in Supabase
            self.supabase.table("songs").update({
                "storage_url": audio_url,
                "thumbnail_url": thumbnail_url
            }).eq("id", song_id).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating URLs for {song_id}: {e}")
            return False
    
    def upload_complete(self, max_songs: int = 10000) -> None:
        """Complete upload process: JSON → Supabase → B2 → Update URLs"""
        
        logger.info("Starting complete Vibify upload process...")
        
        # Step 1: Process JSON files
        logger.info("Step 1: Processing JSON metadata files...")
        processed_songs = self.process_json_files()
        
        if not processed_songs:
            logger.warning("No songs to process")
            return
        
        # Limit songs
        max_songs = min(max_songs, settings.max_upload_files)
        processed_songs = processed_songs[:max_songs]
        logger.info(f"Processing {len(processed_songs)} songs")
        
        # Step 2: Upload metadata to Supabase
        logger.info("Step 2: Uploading metadata to Supabase...")
        success_count = 0
        for song_info in tqdm(processed_songs, desc="Uploading to Supabase"):
            if upload_song_to_supabase(song_info["song_data"], song_info["genres"]):
                success_count += 1
        
        logger.info(f"Successfully uploaded {success_count}/{len(processed_songs)} songs to Supabase")
        
        # Step 3: Upload files to B2
        logger.info("Step 3: Uploading files to B2...")
        self.b2_uploader.upload_all_files(check_existing=True, max_pairs=max_songs)
        
        # Step 4: Update URLs in Supabase
        logger.info("Step 4: Updating URLs in Supabase...")
        url_update_count = 0
        for song_info in tqdm(processed_songs, desc="Updating URLs"):
            song_id = song_info["song_data"]["id"]
            audio_filename = f"{song_id}.mp3"
            thumbnail_filename = f"{song_id}.png"
            
            if self.update_song_urls(song_id, audio_filename, thumbnail_filename):
                url_update_count += 1
        
        logger.info(f"Updated URLs for {url_update_count}/{len(processed_songs)} songs")
        
        # Final summary
        logger.info("Upload process complete!")
        logger.info(f"- Songs processed: {len(processed_songs)}")
        logger.info(f"- Metadata uploaded: {success_count}")
        logger.info(f"- URLs updated: {url_update_count}")

def main():
    """Main function"""
    try:
        uploader = CompleteUploader()
        
        # Parse command line arguments
        max_songs = 10000
        for arg in sys.argv:
            if arg.startswith("--max="):
                max_songs = int(arg.split("=")[1])
        
        uploader.upload_complete(max_songs=max_songs)
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    main()
