# Docker Setup for Vibify

This project supports both local development and production deployment using Docker.

## 🚀 Quick Start

### Local Development

1. **Copy environment variables:**
   ```bash
   cp docker.env.example .env
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production (Railway)

Railway will automatically use the `Dockerfile` in the backend directory.

## 📁 Docker Files

- `docker-compose.yml` - Local development with both frontend and backend
- `src/backend/Dockerfile` - Backend container (works for both local and Railway)
- `src/frontend/Dockerfile` - Frontend container
- `docker.env.example` - Environment variables template

## 🔧 Environment Variables

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Backblaze B2
B2_APPLICATION_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_key
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT_URL=your_b2_endpoint
B2_BASE_URL=your_b2_base_url

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (build-time)
```bash
# Only one environment variable needed
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 🛠️ Development Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🏗️ Production Deployment

### Railway
Railway will automatically detect and use the `Dockerfile` in the backend directory.

### Manual Docker Build
```bash
# Backend
cd src/backend
docker build -t vibify-backend .

# Frontend
cd src/frontend
docker build -t vibify-frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL .
```

## 🔒 Security Notes

- ✅ **No hardcoded secrets** in Dockerfiles
- ✅ **Environment variables** passed at build/runtime
- ✅ **Separate configs** for dev/prod
- ✅ **Railway integration** ready

## 🐛 Troubleshooting

### Port Conflicts
If ports 3000 or 8000 are in use:
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Frontend on 3001
  - "8001:8000"  # Backend on 8001
```

### Environment Variables Not Loading
1. Check `.env` file exists and has correct format
2. Restart containers: `docker-compose down && docker-compose up`
3. Check logs: `docker-compose logs backend`

### Build Failures
1. Clear Docker cache: `docker system prune -a`
2. Rebuild: `docker-compose up --build --force-recreate`
