#!/usr/bin/env python3
"""
Modular song upload script for Vibify.
Supports both single song and batch uploads with progress tracking.
"""

import argparse
import sys
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Add the parent directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables from .env file in the backend directory
load_dotenv(Path(__file__).parent.parent / '.env')

from app.services.upload_service import SongUploadService
from app.config.logging_global import get_logger

logger = get_logger(__name__)


def upload_single_song(metadata_file: Path) -> bool:
    """
    Upload a single song from a metadata file.
    
    Args:
        metadata_file: Path to the JSON metadata file
        
    Returns:
        True if successful, False otherwise
    """
    import json
    
    try:
        # Read the metadata file
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Upload the song
        upload_service = SongUploadService()
        success = upload_service.upload_single_song(metadata, str(metadata_file))
        
        if success:
            logger.info(f"✅ Successfully uploaded: {metadata.get('title', 'Unknown')}")
        else:
            logger.error(f"❌ Failed to upload: {metadata.get('title', 'Unknown')}")
        
        return success
        
    except Exception as e:
        logger.error(f"Error uploading single song: {e}")
        return False


def upload_batch_songs(metadata_dir: str, batch_size: int = 50, limit: Optional[int] = None, skip_older: bool = False) -> bool:
    """
    Upload multiple songs from a directory.
    
    Args:
        metadata_dir: Directory containing JSON metadata files
        batch_size: Number of records to batch in a single request
        limit: Maximum number of files to process (None for all)
        skip_older: Skip files that are older than existing database records
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Get list of JSON files
        metadata_path = Path(metadata_dir)
        json_files = list(metadata_path.glob("**/*.json"))
        
        if limit:
            json_files = json_files[:limit]
        
        if not json_files:
            logger.warning(f"No JSON files found in {metadata_dir}")
            return False
        
        logger.info(f"Found {len(json_files)} JSON files to process")
        
        # Upload the songs
        upload_service = SongUploadService()
        stats = upload_service.upload_batch_songs(json_files, batch_size, show_progress=True, skip_older=skip_older)
        
        # Print statistics
        upload_service.print_stats()
        
        return stats["api_errors"] == 0
        
    except Exception as e:
        logger.error(f"Error uploading batch songs: {e}")
        return False


def main():
    """Main entry point for the upload script."""
    parser = argparse.ArgumentParser(
        description="Upload song metadata to Supabase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upload a single song
  python upload_songs.py --single path/to/song.json
  
  # Upload all songs from a directory
  python upload_songs.py --batch path/to/metadata/dir
  
  # Upload first 100 songs from a directory
  python upload_songs.py --batch path/to/metadata/dir --limit 100
  
  # Upload with custom batch size
  python upload_songs.py --batch path/to/metadata/dir --batch-size 25
        """
    )
    
    # Create mutually exclusive group for single vs batch upload
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("--single", type=str, help="Upload a single song from JSON file")
    group.add_argument("--batch", type=str, help="Upload multiple songs from directory")
    
    # Optional arguments
    parser.add_argument("--batch-size", type=int, default=50, 
                       help="Batch size for batch uploads (default: 50)")
    parser.add_argument("--limit", type=int, 
                       help="Limit number of files to process (for batch uploads)")
    parser.add_argument("--skip-older", action="store_true",
                       help="Skip files that are older than existing database records")
    parser.add_argument("--verbose", "-v", action="store_true", 
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        import logging
        logging.getLogger().setLevel(logging.DEBUG)
    
    # If no arguments provided, use default batch upload
    if not args.single and not args.batch:
        from app.config.simple_config import Config as config
        if config.JSON_METADATA_FOLDER and config.JSON_METADATA_FOLDER.exists():
            args.batch = str(config.JSON_METADATA_FOLDER)
            logger.info(f"Using default metadata directory: {args.batch}")
        else:
            parser.error("No upload method specified. Use --single or --batch, or configure JSON_METADATA_FOLDER")
    
    success = False
    
    try:
        if args.single:
            # Single song upload
            metadata_file = Path(args.single)
            if not metadata_file.exists():
                logger.error(f"Metadata file not found: {metadata_file}")
                sys.exit(1)
            
            logger.info(f"Uploading single song from: {metadata_file}")
            success = upload_single_song(metadata_file)
            
        elif args.batch:
            # Batch upload
            metadata_dir = Path(args.batch)
            if not metadata_dir.exists() or not metadata_dir.is_dir():
                logger.error(f"Metadata directory not found: {metadata_dir}")
                sys.exit(1)
            
            logger.info(f"Uploading songs from directory: {metadata_dir}")
            logger.info(f"Batch size: {args.batch_size}")
            if args.limit:
                logger.info(f"Limit: {args.limit} files")
            
            success = upload_batch_songs(str(metadata_dir), args.batch_size, args.limit, args.skip_older)
        
        if success:
            logger.info("Upload completed successfully!")
            sys.exit(0)
        else:
            logger.error("Upload failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("\nUpload cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
