# PowerShell script to upload new songs that have both audio and thumbnail files
# This will skip existing songs and only add new ones

Write-Host "🎵 Starting upload of new songs with complete file pairs..." -ForegroundColor Green
Write-Host "📁 Looking for songs with both .mp3 and .webp files" -ForegroundColor Cyan
Write-Host "⏭️  Skipping existing songs in database" -ForegroundColor Yellow
Write-Host ""

# Run the upload script with skip-older flag
python scripts/upload_songs.py --batch "G:/Github/audio-foundation/database/dataset_mp3_metadata_llm/new_files" --skip-older --batch-size 50 --verbose

Write-Host ""
Write-Host "✅ Upload completed!" -ForegroundColor Green
Write-Host "📊 Check the logs above for statistics" -ForegroundColor Cyan
