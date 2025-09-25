# Vibify Frontend

A modern Next.js 14 frontend for the Vibify music streaming platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Vibify backend running on port 8000

### Environment Setup

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your environment variables in `.env`:**
   ```bash
   # Location: src/frontend/.env
   ```

### Required Environment Variables

#### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### API Endpoints
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

#### File Storage
```env
NEXT_PUBLIC_B2_BUCKET_URL=https://f003.backblazeb2.com/file/your-bucket
```

### Running the Frontend

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: `http://localhost:3000`
   - Make sure backend is running on `http://localhost:8000`

## 📁 Project Structure

```
src/frontend/
├── src/
│   ├── app/                    # Next.js 14 app router
│   │   ├── (dashboard)/        # Dashboard routes
│   │   │   ├── playlist/       # Playlist pages
│   │   │   │   └── liked/      # Liked songs page
│   │   │   ├── search/         # Search page
│   │   │   └── upload/         # Upload page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable components
│   │   ├── common/             # Common UI components
│   │   ├── layout/             # Layout components
│   │   ├── song/               # Song-related components
│   │   └── ui/                 # Base UI components
│   ├── lib/                    # Utilities and API clients
│   │   ├── api.ts              # API client
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # Utility functions
│   ├── store/                  # Zustand state management
│   │   ├── player-store.ts     # Music player state
│   │   ├── song-store.ts       # Song data state
│   │   └── playlist-store.ts  # Playlist state
│   └── types/                  # TypeScript definitions
├── .env                       # Environment variables (create from env.example)
├── env.example                # Environment template
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind CSS config
└── tsconfig.json             # TypeScript config
```

## 🔧 Development

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_B2_BUCKET_URL` | Backblaze B2 bucket URL | `https://f003.backblazeb2.com/file/bucket` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | `your_google_client_id` |

### Key Features

- **Music Player**: Full-featured audio player with play/pause, seek, repeat, shuffle
- **Like System**: Unified like/unlike functionality across all components
- **Search**: Real-time song search with pagination
- **Playlists**: Liked songs playlist with management
- **Responsive Design**: Mobile-first responsive layout
- **Dark Theme**: Spotify-inspired dark theme

### State Management

The app uses Zustand for state management with three main stores:

- **PlayerStore**: Manages audio playback, queue, and player controls
- **SongStore**: Manages song data, search results, and like status
- **PlaylistStore**: Manages playlist data and operations

### API Integration

The frontend communicates with the backend through:
- REST API calls for song data
- WebSocket connections for real-time updates
- Direct Supabase queries for user data

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable UI components
- **Dark Theme**: Consistent Spotify-inspired design
- **Responsive**: Mobile-first responsive design

## 🧪 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # TypeScript type checking
```

## 🔒 Security

- Never commit `.env` files
- Use `NEXT_PUBLIC_` prefix only for client-side variables
- Keep API keys secure
- Validate all user inputs
- Use HTTPS in production

## 📱 Features

### Home Page
- Discover New Music section
- Explore by Genre
- Trending Now section
- Search functionality

### Music Player
- Play/pause controls
- Seek bar with time display
- Volume control
- Repeat modes (none, one, all)
- Shuffle functionality
- Like/unlike songs

### Playlists
- Liked Songs playlist
- Recently Played
- Create new playlists

### Search
- Real-time search
- Pagination
- Filter by genre, artist, etc.
