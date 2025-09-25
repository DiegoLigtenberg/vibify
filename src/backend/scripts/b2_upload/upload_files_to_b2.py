"""
Upload audio and thumbnail files to Backblaze B2
Improved version with better structure and error handling
"""

import os
import json
from pathlib import Path
import b2sdk.v2 as b2
from tqdm import tqdm
from dotenv import load_dotenv
import sys
from PIL import Image
import io
import tempfile
from typing import Dict, List, Tuple, Optional
import logging

# Load environment variables
script_dir = Path(__file__).parent
env_path = script_dir.parent.parent.parent / '.env'  # Go up to project root
load_dotenv(env_path)

# Add parent directory to path for imports
import sys
sys.path.append(str(script_dir.parent.parent))

# Import centralized logging
from app.config.logging_global import get_logger

logger = get_logger(__name__)

class B2Uploader:
    def __init__(self):
        from app.config.simple_config import Config
        
        self.key_id = Config.B2_KEY_ID
        self.application_key = Config.B2_APPLICATION_KEY
        self.bucket_name = Config.B2_BUCKET_NAME
        self.audio_dir = Path(Config.AUDIO_FOLDER)
        self.thumbnail_dir = Path(Config.THUMBNAIL_FOLDER)
        
        if not all([self.key_id, self.application_key, self.bucket_name]):
            raise ValueError("Missing required B2 environment variables")
    
    def test_authentication(self) -> bool:
        """Test B2 authentication"""
        try:
            logger.info("Testing B2 authentication...")
            info = b2.InMemoryAccountInfo()
            b2_api = b2.B2Api(info)
            b2_api.authorize_account("production", self.key_id, self.application_key)
            logger.info("✓ B2 authentication successful!")
            return True
        except b2.exception.B2Error as e:
            logger.error(f"✗ B2 authentication failed: {str(e)}")
            return False
    
    def get_bucket(self):
        """Get B2 bucket instance"""
        info = b2.InMemoryAccountInfo()
        b2_api = b2.B2Api(info)
        b2_api.authorize_account("production", self.key_id, self.application_key)
        return b2_api.get_bucket_by_name(self.bucket_name)
    
    def list_existing_files(self, bucket) -> Tuple[Dict[str, str], int]:
        """List existing files in B2 and find highest file number"""
        logger.info("Listing existing files in B2 bucket...")
        existing_files = {}
        highest_number = -1
        
        try:
            for folder in ["audio/", "thumbnails/"]:
                for file_info, _ in bucket.ls(folder_to_list=folder, recursive=True):
                    existing_files[file_info.file_name] = file_info.id_
                    
                    # Extract file number
                    try:
                        filename = file_info.file_name.split('/')[-1].split('.')[0]
                        file_number = int(filename)
                        highest_number = max(highest_number, file_number)
                    except (ValueError, IndexError):
                        continue
            
            logger.info(f"Found {len(existing_files)} existing files, highest number: {highest_number}")
            return existing_files, highest_number
            
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return {}, -1
    
    def convert_webp_to_png(self, webp_path: Path) -> bytes:
        """Convert WebP to PNG format"""
        try:
            img = Image.open(webp_path)
            png_data = io.BytesIO()
            img.save(png_data, format='PNG')
            return png_data.getvalue()
        except Exception as e:
            logger.error(f"Error converting {webp_path}: {e}")
            raise
    
    def upload_audio_files(self, bucket, file_pairs: List[Tuple[Path, str]], 
                          existing_files: Dict[str, str], stats: Dict[str, int]) -> None:
        """Upload audio files to B2"""
        logger.info(f"Uploading {len(file_pairs)} audio files...")
        
        for mp3_file, b2_path in tqdm(file_pairs, desc="Uploading audio"):
            try:
                if b2_path in existing_files:
                    stats["already_exists"] += 1
                    continue
                
                bucket.upload_local_file(
                    local_file=str(mp3_file),
                    file_name=b2_path,
                    content_type="audio/mpeg"
                )
                stats["uploaded"] += 1
                
            except Exception as e:
                logger.error(f"Error uploading {mp3_file.name}: {e}")
                stats["failed"] += 1
    
    def upload_thumbnail_files(self, bucket, file_pairs: List[Tuple[Path, str]], 
                              existing_files: Dict[str, str], stats: Dict[str, int]) -> None:
        """Upload thumbnail files to B2 (converting WebP to PNG)"""
        logger.info(f"Uploading {len(file_pairs)} thumbnail files...")
        
        for thumb_file, b2_path in tqdm(file_pairs, desc="Uploading thumbnails"):
            try:
                if b2_path in existing_files:
                    stats["already_exists"] += 1
                    continue
                
                # Convert WebP to PNG
                png_data = self.convert_webp_to_png(thumb_file)
                stats["converted"] += 1
                
                # Upload PNG data
                bucket.upload_bytes(
                    data_bytes=png_data,
                    file_name=b2_path,
                    content_type="image/png"
                )
                stats["uploaded"] += 1
                
            except Exception as e:
                logger.error(f"Error processing {thumb_file.name}: {e}")
                stats["failed"] += 1
    
    def get_matching_file_pairs(self, max_pairs: int = 10000) -> Tuple[List[Tuple[Path, str]], List[Tuple[Path, str]]]:
        """Get matching audio-thumbnail file pairs"""
        # Get all files and sort by number
        mp3_files = sorted(list(self.audio_dir.glob("*.mp3")), key=lambda x: int(x.stem))
        thumbnail_files = sorted(list(self.thumbnail_dir.glob("*.webp")), key=lambda x: int(x.stem))
        
        # Create lookup dictionaries
        mp3_dict = {int(f.stem): f for f in mp3_files}
        thumbnail_dict = {int(f.stem): f for f in thumbnail_files}
        
        # Find matching pairs
        matching_numbers = sorted(set(mp3_dict.keys()) & set(thumbnail_dict.keys()))
        matching_numbers = matching_numbers[:max_pairs]
        
        # Create file pairs
        audio_pairs = [(mp3_dict[num], f"audio/{str(num).zfill(6)}.mp3") for num in matching_numbers]
        thumbnail_pairs = [(thumbnail_dict[num], f"thumbnails/{str(num).zfill(6)}.png") for num in matching_numbers]
        
        return audio_pairs, thumbnail_pairs
    
    def upload_all_files(self, check_existing: bool = True, max_pairs: int = 10000) -> None:
        """Upload all files to B2"""
        if not self.test_authentication():
            logger.error("Authentication failed, aborting upload")
            return
        
        try:
            bucket = self.get_bucket()
            logger.info(f"Connected to bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Error accessing bucket: {e}")
            return
        
        # Get existing files
        existing_files = {}
        if check_existing:
            existing_files, _ = self.list_existing_files(bucket)
        
        # Get file pairs
        audio_pairs, thumbnail_pairs = self.get_matching_file_pairs(max_pairs)
        
        if not audio_pairs:
            logger.info("No files to upload")
            return
        
        logger.info(f"Found {len(audio_pairs)} matching file pairs to upload")
        
        # Initialize stats
        stats = {
            "uploaded": 0,
            "already_exists": 0,
            "failed": 0,
            "converted": 0
        }
        
        # Upload files
        self.upload_audio_files(bucket, audio_pairs, existing_files, stats)
        self.upload_thumbnail_files(bucket, thumbnail_pairs, existing_files, stats)
        
        # Print summary
        logger.info("\nUpload Summary:")
        logger.info(f"- Files uploaded: {stats['uploaded']}")
        logger.info(f"- Thumbnails converted: {stats['converted']}")
        logger.info(f"- Files already exist: {stats['already_exists']}")
        logger.info(f"- Files failed: {stats['failed']}")

def main():
    """Main function"""
    try:
        uploader = B2Uploader()
        
        # Parse command line arguments
        check_existing = "--force" not in sys.argv
        max_pairs = 10000
        
        for arg in sys.argv:
            if arg.startswith("--max="):
                max_pairs = int(arg.split("=")[1])
        
        uploader.upload_all_files(check_existing=check_existing, max_pairs=max_pairs)
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
