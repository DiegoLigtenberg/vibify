#!/usr/bin/env python3
"""
Test script to verify user folder structure works
"""

import asyncio
from pathlib import Path
from PIL import Image
from app.services.song_service import SongService
from app.utils.b2_client import B2Client
from app.config.simple_config import Config

async def test_user_folders():
    """Test uploading to user folders"""
    
    print("🧪 Testing user folder structure...")
    print(f"📁 User audio folder: {Config.B2_USER_AUDIO_FOLDER}")
    print(f"📁 User thumbnail folder: {Config.B2_USER_THUMBNAIL_FOLDER}")
    
    # File paths
    database_dir = Path("database")
    mp3_file = database_dir / "Wildstylez - Shake The Ground (feat. Noubya).mp3"
    img_file = database_dir / "test_img.png"
    
    if not mp3_file.exists() or not img_file.exists():
        print("❌ Test files not found")
        return
    
    # Initialize services
    song_service = SongService()
    b2_client = B2Client()
    
    # Get next song number
    current_count = song_service.get_song_count()
    next_song_number = current_count + 1
    song_id = f"{next_song_number:07d}"
    
    print(f"🎵 Next song ID: {song_id}")
    
    # Prepare filenames
    title = "User Folder Test"
    artist = "Test Artist"
    audio_filename = f"{song_id}-{title.replace(' ', '-').lower()}.mp3"
    thumbnail_filename = f"{song_id}-{title.replace(' ', '-').lower()}.png"
    
    try:
        # 1. Process image
        print("\n🖼️  Processing image...")
        with Image.open(img_file) as img:
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            processed_img_path = database_dir / "user_folder_test.png"
            img.save(processed_img_path, 'PNG')
            print(f"✅ Image processed: {processed_img_path}")
        
        # 2. Read file contents
        print("\n📖 Reading file contents...")
        with open(mp3_file, 'rb') as f:
            audio_content = f.read()
        
        with open(processed_img_path, 'rb') as f:
            thumbnail_content = f.read()
        
        print(f"✅ Audio: {len(audio_content)} bytes")
        print(f"✅ Thumbnail: {len(thumbnail_content)} bytes")
        
        # 3. Upload to USER folders
        print(f"\n☁️  Uploading to user folders...")
        
        # Upload audio to user_audio folder
        print(f"🎵 Uploading audio to {Config.B2_USER_AUDIO_FOLDER}...")
        audio_url = await b2_client.upload_file(
            content=audio_content,
            filename=audio_filename,
            folder=Config.B2_USER_AUDIO_FOLDER,
            content_type="audio/mpeg"
        )
        print(f"✅ Audio uploaded: {audio_url[:80]}...")
        
        # Upload thumbnail to user_thumbnails folder
        print(f"🖼️  Uploading thumbnail to {Config.B2_USER_THUMBNAIL_FOLDER}...")
        thumbnail_url = await b2_client.upload_file(
            content=thumbnail_content,
            filename=thumbnail_filename,
            folder=Config.B2_USER_THUMBNAIL_FOLDER,
            content_type="image/png"
        )
        print(f"✅ Thumbnail uploaded: {thumbnail_url[:80]}...")
        
        # 4. Test URL generation
        print(f"\n🔗 Testing URL generation...")
        
        # Test user audio URL
        generated_audio_url = b2_client.get_user_audio_url(audio_filename)
        print(f"🎵 Generated user audio URL: {generated_audio_url[:80]}...")
        
        # Test user thumbnail URL
        generated_thumbnail_url = b2_client.get_user_thumbnail_url(thumbnail_filename)
        print(f"🖼️  Generated user thumbnail URL: {generated_thumbnail_url[:80]}...")
        
        # 5. Verify files exist in user folders
        print(f"\n✅ Verifying files exist...")
        
        audio_exists = b2_client.file_exists(Config.B2_USER_AUDIO_FOLDER, audio_filename)
        thumbnail_exists = b2_client.file_exists(Config.B2_USER_THUMBNAIL_FOLDER, thumbnail_filename)
        
        print(f"🎵 Audio exists in user_audio: {audio_exists}")
        print(f"🖼️  Thumbnail exists in user_thumbnails: {thumbnail_exists}")
        
        if audio_exists and thumbnail_exists:
            print("\n🎉 User folder structure working perfectly!")
            print(f"📁 Files are now in:")
            print(f"   - {Config.B2_USER_AUDIO_FOLDER}/{audio_filename}")
            print(f"   - {Config.B2_USER_THUMBNAIL_FOLDER}/{thumbnail_filename}")
        else:
            print("\n❌ Some files not found in user folders")
        
        # 6. Clean up test files
        print(f"\n🧹 Cleaning up test files...")
        b2_client.delete_file(Config.B2_USER_AUDIO_FOLDER, audio_filename)
        b2_client.delete_file(Config.B2_USER_THUMBNAIL_FOLDER, thumbnail_filename)
        print("✅ Test files cleaned up")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_user_folders())
