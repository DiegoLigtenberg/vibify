'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../../store/auth-store';
import { usePlayerStore } from '../../../../store/player-store';
import { SongCard } from '../../../../components/song/song-card';
import { UnifiedGrid } from '../../../../components/common/unified-tile';
import { Song } from '@/shared/types/song';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function MySongsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  const [mySongs, setMySongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadMySongs();
    }
  }, [isAuthenticated, user]);

  const loadMySongs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/songs/my-songs`, {
        headers: {
          'X-User-ID': user.id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load songs: ${response.statusText}`);
      }

      const data = await response.json();
      setMySongs(data.songs || []);
    } catch (err) {
      console.error('Error loading my songs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setQueue(mySongs);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">My Songs</h1>
          <p className="text-spotify-muted mb-6">You must be logged in to view your songs</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
          <p className="text-spotify-muted">Loading your songs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-spotify-muted mb-6">{error}</p>
          <button 
            onClick={loadMySongs}
            className="bg-spotify-green text-black px-6 py-2 rounded-full font-semibold hover:bg-green-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spotify-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Songs</h1>
          <p className="text-spotify-muted">
            {mySongs.length === 0 
              ? "You haven't uploaded any songs yet" 
              : `${mySongs.length} song${mySongs.length === 1 ? '' : 's'} uploaded`
            }
          </p>
        </div>

        {/* Songs Grid */}
        {mySongs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-xl font-semibold text-white mb-2">No songs uploaded yet</h2>
            <p className="text-spotify-muted mb-6">
              Start building your music collection by uploading your first song!
            </p>
            <a 
              href="/upload"
              className="bg-spotify-green text-black px-6 py-3 rounded-full font-semibold hover:bg-green-400 transition-colors inline-block"
            >
              Upload Music
            </a>
          </div>
        ) : (
          <UnifiedGrid>
            {mySongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onPlay={() => handlePlaySong(song)}
                showLikeButton={false} // Don't show like button for own songs
              />
            ))}
          </UnifiedGrid>
        )}
      </div>
    </div>
  );
}
