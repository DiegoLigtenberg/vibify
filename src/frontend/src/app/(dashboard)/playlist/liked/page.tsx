'use client';

import React, { useEffect, useState } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useSongStore } from '../../../../store/song-store';
import { usePlayerStore } from '../../../../store/player-store';
import { SongCard } from '../../../../components/song/song-card';
import { UnifiedGrid } from '../../../../components/common/unified-tile';
import { Song } from '@/shared/types/song';

export default function LikedSongsPage() {
  const { likedSongs, loadLikedSongs, toggleLike, isLiked } = useSongStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  const [likedSongsList, setLikedSongsList] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLikedSongs();
    // Load the actual liked songs from the API
    loadLikedSongsFromAPI();
  }, []);

  const loadLikedSongsFromAPI = async () => {
    try {
      const { SongsAPI } = await import('../../../../lib/api');
      const songs = await SongsAPI.getLikedSongs();
      // Ensure songs is always an array
      setLikedSongsList(Array.isArray(songs) ? songs : []);
    } catch (error) {
      console.error('Error loading liked songs:', error);
      setLikedSongsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = (song: Song, index: number) => {
    setCurrentSong(song);
    setQueue(likedSongsList, index);
  };

  const handleLike = async (song: Song) => {
    await toggleLike(song.id);
    // Refresh the liked songs list
    loadLikedSongsFromAPI();
  };

  const handleRemoveFromLiked = async (song: Song) => {
    await toggleLike(song.id);
    // Remove from local list immediately
    setLikedSongsList(prev => prev.filter(s => s.id !== song.id));
  };

  if (isLoading) {
    return (
      <div className="flex-1 text-white vibify-gradient p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-spotify-muted">Loading liked songs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white vibify-gradient p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Liked Songs</h1>
        <p className="text-spotify-muted">
          {likedSongsList.length} {likedSongsList.length === 1 ? 'song' : 'songs'}
        </p>
      </div>

      {likedSongsList.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-spotify-muted text-lg mb-2">
            No liked songs yet
          </div>
          <p className="text-spotify-muted text-sm">
            Like songs to see them here
          </p>
        </div>
      ) : (
        <UnifiedGrid>
          {likedSongsList.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              compact
              onPlay={(song) => handlePlay(song, index)}
              onLike={handleRemoveFromLiked}
              className="hover:scale-105 transition-transform"
            />
          ))}
        </UnifiedGrid>
      )}
    </div>
  );
}
