#!/usr/bin/env python3
"""
Test script to verify upload functionality
"""

import asyncio
import tempfile
import os
from app.services.song_service import SongService
from app.utils.b2_client import B2Client

async def test_upload():
    """Test the upload functionality"""
    
    # Test song count
    song_service = SongService()
    current_count = song_service.get_song_count()
    print(f"Current song count: {current_count}")
    
    # Test B2 client
    b2_client = B2Client()
    print(f"B2 client authenticated: {b2_client.is_authenticated()}")
    
    # Test adding a song to Supabase
    next_song_number = 99999  # Use a high number to avoid conflicts
    song_id = f"{next_song_number:07d}"
    
    test_song_data = {
        "id": song_id,
        "title": "Test Song",
        "artist": "Test Artist", 
        "album": "Test Album",
        "description": "Test description",
        "storage_url": "https://test.com/audio.mp3",
        "thumbnail_url": "https://test.com/thumb.jpg",
        "is_public": False,
        "uploaded_by": None,  # Set to None for now since we don't have a real user ID
        "duration": 180,
        "view_count": 0,
        "like_count": 0,
        "streams": 0
    }
    
    try:
        # Insert test song
        result = song_service.supabase.table('songs').insert(test_song_data).execute()
        print(f"✅ Successfully inserted test song: {song_id}")
        print(f"Result: {result.data}")
        
        # Verify it was inserted
        verify_result = song_service.supabase.table('songs').select('*').eq('id', song_id).execute()
        print(f"✅ Verification query result: {verify_result.data}")
        
        # Clean up - delete the test song
        delete_result = song_service.supabase.table('songs').delete().eq('id', song_id).execute()
        print(f"✅ Cleaned up test song: {delete_result.data}")
        
    except Exception as e:
        print(f"❌ Error testing upload: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_upload())
