#!/usr/bin/env python3
"""
Script to delete songs from Supabase database that have missing thumbnails.
Reads the missing_thumbnails.txt file and deletes those songs in batches.
"""

import sys
from pathlib import Path
from typing import List

# Add the parent directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from app.database.connection import SupabaseClient
from app.config.logging_global import get_logger

logger = get_logger(__name__)


def read_song_ids_from_file(file_path: str) -> List[str]:
    """
    Read song IDs from the missing thumbnails file.
    
    Args:
        file_path: Path to the missing_thumbnails.txt file
        
    Returns:
        List of song IDs to delete
    """
    try:
        with open(file_path, 'r') as f:
            song_ids = [line.strip() for line in f if line.strip()]
        
        logger.info(f"Read {len(song_ids)} song IDs from {file_path}")
        return song_ids
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return []
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        return []


def delete_songs_in_batches(song_ids: List[str], batch_size: int = 100) -> bool:
    """
    Delete songs from the database in batches.
    
    Args:
        song_ids: List of song IDs to delete
        batch_size: Number of songs to delete per batch
        
    Returns:
        True if successful, False otherwise
    """
    if not song_ids:
        logger.info("No songs to delete")
        return True
    
    supabase_client = SupabaseClient()
    supabase = supabase_client.get_client()
    total_deleted = 0
    
    # Process in batches
    for i in range(0, len(song_ids), batch_size):
        batch = song_ids[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(song_ids) + batch_size - 1) // batch_size
        
        logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} songs)")
        
        try:
            # Delete from song_genres table first (foreign key constraint)
            logger.info(f"Deleting song-genre relationships for batch {batch_num}...")
            supabase.table('song_genres').delete().in_('song_id', batch).execute()
            
            # Delete from user_likes table (foreign key constraint)
            logger.info(f"Deleting user likes for batch {batch_num}...")
            supabase.table('user_likes').delete().in_('song_id', batch).execute()
            
            # Delete from songs table
            logger.info(f"Deleting songs for batch {batch_num}...")
            result = supabase.table('songs').delete().in_('id', batch).execute()
            
            total_deleted += len(batch)
            logger.info(f"✅ Successfully deleted batch {batch_num} ({len(batch)} songs)")
            
        except Exception as e:
            logger.error(f"❌ Error deleting batch {batch_num}: {e}")
            return False
    
    logger.info(f"🎉 Successfully deleted {total_deleted} songs total")
    return True


def main():
    """Main function to delete songs with missing thumbnails."""
    logger.info("🗑️  Starting deletion of songs with missing thumbnails...")
    
    # Read song IDs from file
    missing_thumbnails_file = "missing_thumbnails.txt"
    song_ids = read_song_ids_from_file(missing_thumbnails_file)
    
    if not song_ids:
        logger.info("No songs to delete")
        return
    
    logger.info(f"Found {len(song_ids)} songs to delete")
    
    # Show first 10 examples
    logger.info(f"First 10 songs to delete:")
    for song_id in song_ids[:10]:
        logger.info(f"  - {song_id}")
    
    if len(song_ids) > 10:
        logger.info(f"  ... and {len(song_ids) - 10} more")
    
    # Ask for confirmation
    response = input(f"\nDo you want to delete these {len(song_ids)} songs? (y/N): ")
    if response.lower() != 'y':
        logger.info("Deletion cancelled by user")
        return
    
    # Delete the songs
    success = delete_songs_in_batches(song_ids, batch_size=100)
    
    if success:
        logger.info("✅ Deletion completed successfully!")
    else:
        logger.error("❌ Deletion failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
