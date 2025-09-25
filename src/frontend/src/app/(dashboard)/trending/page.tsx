'use client';

import React, { useState, useEffect } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { SongCard } from '../../../components/song/song-card';
import { UnifiedGrid } from '../../../components/common/unified-tile';
import { Song } from '@/shared/types/song';
import { usePlayerStore } from '../../../store/player-store';
import { useSongStore } from '../../../store/song-store';
import { SongsAPI } from '../../../lib/api';

export default function TrendingPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentSong, setQueue } = usePlayerStore();
  const { toggleLike } = useSongStore();

  useEffect(() => {
    const loadTrendingSongs = async () => {
      try {
        setIsLoading(true);
        const songData = await SongsAPI.getPopular({ limit: 50 });
        setSongs(songData);
      } catch (err) {
        console.error('Error loading trending songs:', err);
        setError('Failed to load trending songs');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendingSongs();
  }, []);

  const handlePlay = (song: Song, index: number) => {
    setQueue(songs, index);
    setCurrentSong(song);
  };

  const handleLike = async (song: Song) => {
    await toggleLike(song.id);
  };

  if (isLoading) {
    return (
      <div className="flex-1 text-white vibify-gradient">
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-6">Trending Now</h1>
          <p className="text-gray-400 mb-6">Most popular songs right now</p>
          <UnifiedGrid>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="aspect-[5/4] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </UnifiedGrid>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 text-white vibify-gradient">
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-6">Trending Now</h1>
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-spotify-green text-white px-4 py-2 rounded-full hover:bg-spotify-green/80"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white vibify-gradient">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Trending Now</h1>
        <p className="text-gray-400 mb-6">Most popular songs right now</p>
        
        {songs.length > 0 ? (
          <UnifiedGrid>
            {songs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                compact
                onPlay={(song) => handlePlay(song, index)}
                onLike={handleLike}
                className="hover:scale-105 transition-transform"
              />
            ))}
          </UnifiedGrid>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No trending songs available</p>
          </div>
        )}
      </div>
    </div>
  );
}
