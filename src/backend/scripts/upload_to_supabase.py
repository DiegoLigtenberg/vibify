#!/usr/bin/env python3
"""
Legacy upload script for Vibify - now uses the modular upload service.
This script maintains backward compatibility while using the new SongUploadService.
"""

import argparse
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables from backend .env.local
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

# Import centralized logging, config, and constants
import sys
sys.path.append(str(Path(__file__).parent.parent))
from app.config.logging_global import get_logger
from app.config.simple_config import Config as config
from app.services.upload_service import SongUploadService

logger = get_logger(__name__)


def upload_metadata_to_supabase(
    metadata_dir: str,
    base_dir: Optional[str] = None,
    b2_bucket_name: Optional[str] = None,
    incremental: bool = False,
    force: bool = False,
    batch_size: int = 50,
    enable_versioning: bool = True,
    skip_media_check: bool = False,
    force_url_updates: bool = False
) -> Dict[str, int]:
    """
    Upload metadata to Supabase using the new modular service.
    
    Args:
        metadata_dir: Directory containing metadata JSON files
        base_dir: Base directory for media files (optional, ignored)
        b2_bucket_name: Backblaze B2 bucket name (optional, ignored)
        incremental: Only process new or changed files (ignored for now)
        force: Force processing of all files regardless of history (ignored for now)
        batch_size: Number of records to batch in a single request
        enable_versioning: Whether to save versioned copies (ignored for now)
        skip_media_check: Skip checking if media files exist (ignored for now)
        force_url_updates: Force update of all URLs (ignored for now)
        
    Returns:
        Statistics about the upload process
    """
    logger.info(f"Starting metadata upload process")
    logger.info(f"Metadata directory: {metadata_dir}")
    logger.info(f"Batch size: {batch_size}")
    logger.info(f"Using new modular upload service")
    
    # Get list of JSON files
    metadata_path = Path(metadata_dir)
    json_files = list(metadata_path.glob("**/*.json"))
    
    if not json_files:
        logger.warning(f"No JSON files found in {metadata_dir}")
        return {
            "total_files": 0,
            "processed_files": 0,
            "skipped_unchanged": 0,
            "empty_files": 0,
            "json_decode_errors": 0,
            "api_errors": 0,
            "batch_count": 0,
        }
    
    logger.info(f"Found {len(json_files)} JSON files to process")
    
    # Use the new upload service
    upload_service = SongUploadService()
    stats = upload_service.upload_batch_songs(json_files, batch_size, show_progress=True)
    
    # Print statistics
    upload_service.print_stats()
    
    return stats


def delete_today_uploads(clean_versions: bool = True) -> Dict[str, int]:
    """
    Delete all records uploaded today from the Supabase database.
    This function is kept for backward compatibility.
    """
    logger.warning("Delete functionality not implemented in new service")
    return {
        "songs_deleted": 0,
        "versions_deleted": 0,
        "song_tags_deleted": 0,
        "api_errors": 0
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Upload metadata to Supabase")
    parser.add_argument("--metadata-dir", help="Directory containing metadata JSON files")
    parser.add_argument("--base-dir", help="Base directory for media files (optional)")
    parser.add_argument("--b2-bucket", help="Backblaze B2 bucket name (optional)")
    parser.add_argument("--incremental", action="store_true", help="Only process new or changed files")
    parser.add_argument("--force", action="store_true", help="Force processing of all files regardless of history")
    parser.add_argument("--batch-size", type=int, default=50, help=f"Batch size (default: 50)")
    parser.add_argument("--no-versioning", action="store_true", help="Disable versioning of records")
    parser.add_argument("--skip-media-check", action="store_true", help="Skip checking if media files exist")
    parser.add_argument("--detailed-log", action="store_true", help="Enable detailed logging to console")
    parser.add_argument("--delete-today", action="store_true", help="Delete all records uploaded today and exit")
    parser.add_argument("--keep-versions", action="store_true", help="When using --delete-today, keep version history")
    parser.add_argument("--rebuild-index", action="store_true", help="Force rebuild the local file index")
    parser.add_argument("--skip-quality-report", action="store_true", help="Skip data quality report generation")
    parser.add_argument("--force-url-updates", action="store_true", help="Force update of storage and thumbnail URLs")
    
    args = parser.parse_args()
    
    # Configure logging based on detailed-log flag
    if args.detailed_log:
        import logging
        console_handlers = [h for h in logger.handlers if isinstance(h, logging.StreamHandler) and h.stream.name == '<stdout>']
        if console_handlers:
            console_handlers[0].setLevel(logging.INFO)
    
    # Handle deletion mode
    if args.delete_today:
        logger.warning("\nDELETE MODE ACTIVATED")
        logger.warning("--------------------------------")
        logger.warning("This will delete all records uploaded today from the database.")
        confirmation = input("Are you sure you want to continue? (y/N): ")
        
        if confirmation.lower() != 'y':
            logger.info("Operation cancelled.")
            return
        
        stats = delete_today_uploads(clean_versions=not args.keep_versions)
        
        logger.info("\n--------------------------------")
        logger.info("DELETION STATISTICS")
        logger.info("--------------------------------")
        logger.info(f"Songs deleted: {stats['songs_deleted']}")
        logger.info(f"Song tags deleted: {stats['song_tags_deleted']}")
        logger.info(f"Version records deleted: {stats['versions_deleted']}")
        logger.info(f"API errors: {stats['api_errors']}")
        logger.info("--------------------------------")
        return
    
    # Handle rebuild index mode
    if args.rebuild_index:
        logger.info("\nINDEX REBUILD MODE")
        logger.info("--------------------------------")
        logger.info("Index rebuild not implemented in new service")
        return
    
    # Use default metadata directory from config if not provided
    if not args.metadata_dir:
        if config.JSON_METADATA_FOLDER and config.JSON_METADATA_FOLDER.exists():
            args.metadata_dir = str(config.JSON_METADATA_FOLDER)
            logger.info(f"Using default metadata directory: {args.metadata_dir}")
        else:
            parser.error("--metadata-dir is required unless using --delete-today or JSON_METADATA_FOLDER is configured")
    
    # Validate arguments
    metadata_dir = Path(args.metadata_dir)
    
    if not metadata_dir.exists() or not metadata_dir.is_dir():
        raise ValueError(f"Metadata directory does not exist: {metadata_dir}")
    
    if args.base_dir:
        base_dir = Path(args.base_dir)
        if not base_dir.exists() or not base_dir.is_dir():
            raise ValueError(f"Base directory does not exist: {base_dir}")
    
    logger.info(f"\nStarting metadata upload process")
    logger.info(f"--------------------------------")
    logger.info(f"Metadata directory: {metadata_dir}")
    logger.info(f"Batch size: {args.batch_size}")
    logger.info(f"Incremental mode: {'Enabled' if args.incremental else 'Disabled'}")
    logger.info(f"Versioning: {'Disabled' if args.no_versioning else 'Enabled'}")
    logger.info(f"Media check: {'Disabled' if args.skip_media_check else 'Enabled'}")
    logger.info(f"Force URL updates: {'Enabled' if args.force_url_updates else 'Disabled'}")
    logger.info(f"--------------------------------\n")
    
    # Upload metadata
    start_time = time.time()
    stats = upload_metadata_to_supabase(
        str(metadata_dir),
        args.base_dir,
        args.b2_bucket,
        args.incremental,
        args.force,
        args.batch_size,
        not args.no_versioning,
        args.skip_media_check,
        args.force_url_updates
    )
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    # Print statistics
    logger.info("\n--------------------------------")
    logger.info("UPLOAD STATISTICS")
    logger.info("--------------------------------")
    logger.info(f"Total files processed: {stats['total_files']}")
    logger.info(f"Successfully processed: {stats['processed_files']}")
    logger.info(f"Empty files: {stats['empty_files']}")
    logger.info(f"JSON decode errors: {stats['json_decode_errors']}")
    logger.info(f"API errors: {stats['api_errors']}")
    logger.info(f"Batch count: {stats['batch_count']}")
    
    # Format time nicely
    hours, remainder = divmod(elapsed_time, 3600)
    minutes, seconds = divmod(remainder, 60)
    time_format = f"{int(hours):02d}:{int(minutes):02d}:{seconds:.2f}"
    logger.info(f"Time elapsed: {time_format}")
    
    files_per_sec = stats['processed_files'] / elapsed_time if elapsed_time > 0 else 0
    logger.info(f"Processing rate: {files_per_sec:.2f} files/second")
    logger.info("--------------------------------")
    
    logger.info("\nLog file: upload_to_supabase.log")
    logger.info("--------------------------------")


if __name__ == "__main__":
    main()