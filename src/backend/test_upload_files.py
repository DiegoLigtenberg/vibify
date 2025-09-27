#!/usr/bin/env python3
"""
Test script to upload the provided MP3 and image files to B2 and Supabase
"""

import asyncio
import os
import shutil
from pathlib import Path
from PIL import Image
from app.services.song_service import SongService
from app.utils.b2_client import B2Client
from app.config.simple_config import Config

async def test_upload_files():
    """Test uploading the provided files"""
    
    # File paths
    database_dir = Path("database")
    mp3_file = database_dir / "Wildstylez - Shake The Ground (feat. Noubya).mp3"
    img_file = database_dir / "test_img.png"
    
    # Check if files exist
    if not mp3_file.exists():
        print(f"❌ MP3 file not found: {mp3_file}")
        return
    
    if not img_file.exists():
        print(f"❌ Image file not found: {img_file}")
        return
    
    print("✅ Found both test files")
    
    # Initialize services
    song_service = SongService()
    b2_client = B2Client()
    
    # Get next song number
    current_count = song_service.get_song_count()
    next_song_number = current_count + 1
    song_id = f"{next_song_number:07d}"
    
    print(f"📊 Current song count: {current_count}")
    print(f"🎵 Next song ID: {song_id}")
    
    # Prepare filenames
    title = "Shake The Ground"
    artist = "Wildstylez"
    audio_filename = f"{song_id}-{title.replace(' ', '-').lower()}.mp3"
    thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.png"
    
    print(f"📁 Audio filename: {audio_filename}")
    print(f"🖼️  Thumbnail filename: {thumbnail_filename}")
    
    try:
        # 1. Convert and rename image to PNG
        print("\n🖼️  Processing image...")
        with Image.open(img_file) as img:
            # Convert to RGB if necessary (for JPEG compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Save as PNG
            processed_img_path = database_dir / "img_upload.png"
            img.save(processed_img_path, 'PNG')
            print(f"✅ Image converted and saved as: {processed_img_path}")
        
        # 2. Read file contents
        print("\n📖 Reading file contents...")
        with open(mp3_file, 'rb') as f:
            audio_content = f.read()
        
        with open(processed_img_path, 'rb') as f:
            thumbnail_content = f.read()
        
        print(f"✅ Audio file size: {len(audio_content)} bytes")
        print(f"✅ Thumbnail file size: {len(thumbnail_content)} bytes")
        
        # 3. Upload to B2 Backblaze
        print("\n☁️  Uploading to B2 Backblaze...")
        
        # Upload audio
        print("🎵 Uploading audio...")
        audio_url = await b2_client.upload_file(
            content=audio_content,
            filename=audio_filename,
            folder=Config.B2_AUDIO_FOLDER,
            content_type="audio/mpeg"
        )
        print(f"✅ Audio uploaded: {audio_url}")
        
        # Upload thumbnail
        print("🖼️  Uploading thumbnail...")
        thumbnail_url = await b2_client.upload_file(
            content=thumbnail_content,
            filename=thumbnail_filename,
            folder=Config.B2_THUMBNAIL_FOLDER,
            content_type="image/png"
        )
        print(f"✅ Thumbnail uploaded: {thumbnail_url}")
        
        # 4. Add metadata to Supabase
        print("\n💾 Adding metadata to Supabase...")
        
        song_data = {
            "id": song_id,
            "title": title,
            "artist": artist,
            "album": "Hardstyle Hits",
            "description": "Test upload from database folder",
            "storage_url": audio_url,
            "thumbnail_url": thumbnail_url,
            "is_public": False,  # User upload - starts as private
            "uploaded_by": None,  # No user ID for test
            "duration": 180,  # Placeholder duration
            "view_count": 0,
            "like_count": 0,
            "streams": 0
        }
        
        result = song_service.supabase.table('songs').insert(song_data).execute()
        
        if result.data:
            print(f"✅ Song metadata added to Supabase: {song_id}")
            print(f"📊 Song data: {result.data[0]}")
        else:
            print("❌ Failed to add song metadata to Supabase")
            return
        
        # 5. Wait 5 seconds
        print("\n⏳ Waiting 5 seconds...")
        await asyncio.sleep(5)
        
        # 6. Search for the uploaded song
        print("\n🔍 Searching for uploaded song...")
        
        # Search by song ID
        search_result = song_service.supabase.table('songs').select('*').eq('id', song_id).execute()
        
        if search_result.data:
            print(f"✅ Found uploaded song: {search_result.data[0]['title']} by {search_result.data[0]['artist']}")
            print(f"🔗 Audio URL: {search_result.data[0]['storage_url']}")
            print(f"🖼️  Thumbnail URL: {search_result.data[0]['thumbnail_url']}")
        else:
            print("❌ Song not found in database")
        
        # 7. Test B2 URL generation
        print("\n🔗 Testing B2 URL generation...")
        
        # Test audio URL generation
        generated_audio_url = b2_client.get_audio_url(audio_filename)
        print(f"🎵 Generated audio URL: {generated_audio_url}")
        
        # Test thumbnail URL generation
        generated_thumbnail_url = b2_client.get_thumbnail_url(thumbnail_filename)
        print(f"🖼️  Generated thumbnail URL: {generated_thumbnail_url}")
        
        print("\n🎉 Upload test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during upload test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_upload_files())
