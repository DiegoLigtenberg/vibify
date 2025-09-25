# Vibify Backend

A professional FastAPI backend for the Vibify music streaming platform.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- UV package manager
- Supabase account
- Backblaze B2 account

### Environment Setup

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your environment variables in `.env`:**
   ```bash
   # Location: src/backend/.env
   ```

### Required Environment Variables

#### Supabase Configuration
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

#### Backblaze B2 Storage
```env
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT_URL=https://s3.region.backblazeb2.com
B2_BASE_URL=https://f003.backblazeb2.com/file/your-bucket
B2_AUDIO_FOLDER=audio
B2_THUMBNAIL_FOLDER=thumbnails
```

#### File Paths (Update for your system)
```env
JSON_METADATA_FOLDER=path/to/your/metadata/files
AUDIO_FOLDER=path/to/your/audio/files
THUMBNAIL_FOLDER=path/to/your/thumbnail/files
```

### Running the Backend

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Start the server:**
   ```bash
   uv run python run_server.py
   ```

   Or alternatively:
   ```bash
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Verify the server is running:**
   - Health check: `http://localhost:8000/health`
   - API docs: `http://localhost:8000/docs`

## 📁 Project Structure

```
src/backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── api/                 # REST API endpoints
│   │   ├── songs.py         # Song-related endpoints
│   │   └── upload.py        # Upload endpoints
│   ├── services/            # Business logic
│   │   ├── song_service.py  # Song operations
│   │   └── upload_service.py # Upload operations
│   ├── models/              # Pydantic models
│   │   └── song.py          # Song data model
│   ├── database/            # Database connection
│   │   └── connection.py    # Supabase client
│   ├── config/              # Configuration
│   │   ├── settings.py      # App settings
│   │   └── logging.py       # Logging configuration
│   └── utils/               # Utility functions
├── scripts/                 # Utility scripts
│   └── upload_songs.py      # Song upload script
├── tests/                   # Test files
├── run_server.py           # Server startup script
├── .env                    # Environment variables (create from env.example)
├── env.example             # Environment template
└── requirements.txt        # Python dependencies
```

## 🔧 Development

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `B2_KEY_ID` | Backblaze B2 key ID | `0032604ed561e940000000002` |
| `B2_APPLICATION_KEY` | Backblaze B2 application key | `K003x9tfXTKrXdiTdbGhkO8N9Vgz4BI` |
| `B2_BUCKET_NAME` | B2 bucket name | `bucket-vibify` |
| `JSON_METADATA_FOLDER` | Path to metadata JSON files | `G:/path/to/metadata` |
| `AUDIO_FOLDER` | Path to audio files | `G:/path/to/audio` |
| `THUMBNAIL_FOLDER` | Path to thumbnail files | `G:/path/to/thumbnails` |

### API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/songs/random` - Get random songs
- `GET /api/songs/popular` - Get popular songs
- `GET /api/songs/{song_id}/details` - Get song details
- `POST /api/songs/{song_id}/like` - Like a song
- `DELETE /api/songs/{song_id}/like` - Unlike a song
- `GET /api/songs/liked` - Get liked songs

### Uploading Songs

Use the upload script to populate the database:

```bash
# Upload all songs from metadata folder
uv run python scripts/upload_songs.py --batch /path/to/metadata

# Upload with specific options
uv run python scripts/upload_songs.py --batch /path/to/metadata --batch-size 50 --skip-older
```

## 🧪 Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app
```

## 📝 Logging

Logs are written to `logs/vibify.log` with configurable levels via `LOG_LEVEL` environment variable.

## 🔒 Security

- Never commit `.env` files
- Use environment-specific values for production
- Keep API keys secure
- Enable CORS only for trusted origins
