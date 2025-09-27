#!/usr/bin/env python3
"""
Test script to upload a song with a real user ID
"""

import asyncio
import os
from pathlib import Path
from PIL import Image
from app.services.song_service import SongService
from app.utils.b2_client import B2Client
from app.config.simple_config import Config

async def test_user_upload():
    """Test uploading with a real user ID"""
    
    # Real user ID from database
    test_user_id = "11cf4fbf-ff3f-47f9-849a-39f9fc08295b"
    print(f"🧑‍💻 Using test user ID: {test_user_id}")
    
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
    
    # Get next song number (use a higher number to avoid conflicts)
    current_count = song_service.get_song_count()
    next_song_number = current_count + 100  # Use higher number
    song_id = f"{next_song_number:07d}"
    
    print(f"📊 Current song count: {current_count}")
    print(f"🎵 Next song ID: {song_id}")
    
    # Prepare filenames
    title = "Shake The Ground (User Test)"
    artist = "Wildstylez"
    audio_filename = f"{song_id}-{title.replace(' ', '-').lower()}.mp3"
    thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.png"
    
    print(f"📁 Audio filename: {audio_filename}")
    print(f"🖼️  Thumbnail filename: {thumbnail_filename}")
    
    try:
        # 1. Convert and rename image to PNG
        print("\n🖼️  Processing image...")
        with Image.open(img_file) as img:
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            processed_img_path = database_dir / "img_upload_user_test.png"
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
        print(f"✅ Audio uploaded: {audio_url[:80]}...")
        
        # Upload thumbnail
        print("🖼️  Uploading thumbnail...")
        thumbnail_url = await b2_client.upload_file(
            content=thumbnail_content,
            filename=thumbnail_filename,
            folder=Config.B2_THUMBNAIL_FOLDER,
            content_type="image/png"
        )
        print(f"✅ Thumbnail uploaded: {thumbnail_url[:80]}...")
        
        # 4. Add metadata to Supabase with REAL USER ID
        print(f"\n💾 Adding metadata to Supabase with user ID: {test_user_id}")
        
        song_data = {
            "id": song_id,
            "title": title,
            "artist": artist,
            "album": "Hardstyle Hits (User Upload)",
            "description": "Test upload with real user ID",
            "storage_url": audio_url,
            "thumbnail_url": thumbnail_url,
            "is_public": False,  # User upload - starts as private
            "uploaded_by": test_user_id,  # REAL USER ID!
            "duration": 180,  # Placeholder duration
            "view_count": 0,
            "like_count": 0,
            "streams": 0
        }
        
        result = song_service.supabase.table('songs').insert(song_data).execute()
        
        if result.data:
            print(f"✅ Song metadata added to Supabase: {song_id}")
            print(f"👤 Uploaded by user: {test_user_id}")
        else:
            print("❌ Failed to add song metadata to Supabase")
            return
        
        # 5. Verify the foreign key relationship
        print("\n🔗 Verifying foreign key relationship...")
        
        # Query to join songs with users
        join_query = f"""
        SELECT 
            s.id, 
            s.title, 
            s.artist, 
            s.uploaded_by,
            u.username,
            u.created_at as user_created_at
        FROM songs s
        LEFT JOIN users u ON s.uploaded_by = u.id
        WHERE s.id = '{song_id}'
        """
        
        join_result = song_service.supabase.rpc('exec_sql', {'query': join_query}).execute()
        
        if join_result.data:
            print(f"✅ Foreign key relationship working!")
            print(f"📊 Song: {join_result.data[0]['title']} by {join_result.data[0]['artist']}")
            print(f"👤 Uploaded by: {join_result.data[0]['username']} (ID: {join_result.data[0]['uploaded_by']})")
            print(f"📅 User created: {join_result.data[0]['user_created_at']}")
        else:
            print("❌ Could not verify foreign key relationship")
        
        print("\n🎉 User upload test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during upload test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_user_upload())
