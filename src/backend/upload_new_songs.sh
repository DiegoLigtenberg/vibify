#!/bin/bash
# Script to upload new songs that have both audio and thumbnail files
# This will skip existing songs and only add new ones

echo "🎵 Starting upload of new songs with complete file pairs..."
echo "📁 Looking for songs with both .mp3 and .webp files"
echo "⏭️  Skipping existing songs in database"
echo ""

# Run the upload script with skip-older flag
python scripts/upload_songs.py --batch "G:/Github/audio-foundation/database/dataset_mp3_metadata_llm/new_files" --skip-older --batch-size 50 --verbose

echo ""
echo "✅ Upload completed!"
echo "📊 Check the logs above for statistics"
