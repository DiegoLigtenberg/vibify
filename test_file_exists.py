#!/usr/bin/env python3
"""
Test script to check if uploaded files exist on Backblaze
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.b2_client import B2Client
from app.config.simple_config import Config

def test_file_exists():
    """Test if the uploaded files exist on Backblaze"""
    try:
        # Initialize B2 client
        b2_client = B2Client()
        
        # Test files from the database
        audio_filename = "0011015-wildstylez---shake-the-ground-(feat.-noubya).mp3"
        thumbnail_filename = "0011015-wildstylez---shake-the-ground-(feat.-noubya).jpg"
        
        print(f"Testing audio file: {audio_filename}")
        audio_exists = b2_client.file_exists(audio_filename, Config.B2_USER_AUDIO_FOLDER)
        print(f"Audio file exists: {audio_exists}")
        
        print(f"\nTesting thumbnail file: {thumbnail_filename}")
        thumbnail_exists = b2_client.file_exists(thumbnail_filename, Config.B2_USER_THUMBNAIL_FOLDER)
        print(f"Thumbnail file exists: {thumbnail_exists}")
        
        if audio_exists and thumbnail_exists:
            print("\n✅ Both files exist on Backblaze!")
            
            # Test URL generation
            audio_url = b2_client.get_user_audio_url(audio_filename)
            thumbnail_url = b2_client.get_user_thumbnail_url(thumbnail_filename)
            
            print(f"\nAudio URL: {audio_url}")
            print(f"Thumbnail URL: {thumbnail_url}")
        else:
            print("\n❌ Some files are missing on Backblaze")
            
    except Exception as e:
        print(f"Error testing files: {e}")

if __name__ == "__main__":
    test_file_exists()
