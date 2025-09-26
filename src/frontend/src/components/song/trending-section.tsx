'use client';

import React, { useState, useEffect } from 'react';
import { Section } from '../common/section';
import { SongCard } from './song-card';
import { useSongStore } from '../../store/song-store';
import { usePlayerStore } from '../../store/player-store';
import { TrendingUp } from 'lucide-react';
import { UnifiedGrid } from '../common/unified-tile';

export function TrendingSection() {
  const { popularSongs, isLoadingPopular, popularError, loadPopularSongs, toggleLike } = useSongStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  
  const songsPerPage = 10; // Load more than we display for consistency

  // Load initial songs
  useEffect(() => {
    if (popularSongs.length === 0) {
      loadPopularSongs(songsPerPage);
    }
  }, []);

  const handlePlay = (song: any, index: number) => {
    console.log('Playing:', song.title);
    setQueue(popularSongs, index);
    setCurrentSong(song);
  };

  const handleLike = async (song: any) => {
    try {
      await toggleLike(song.id);
    } catch (error) {
      console.error('Toggle like failed:', error);
    }
  };

  return (
    <Section
      title="Trending Now"
      subtitle="Most listened songs by Vibify users"
      showAll={true}
      onShowAll={() => console.log('Show all trending')}
    >
      {/* Error State */}
      {popularError && (
        <div className="text-red-400 text-center py-8">
          {popularError}
        </div>
      )}

      {/* Loading State */}
      {isLoadingPopular && popularSongs.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: songsPerPage }).map((_, i) => (
            <div key={i} className="song-card p-4 animate-pulse">
              <div className="w-full aspect-square bg-spotify-gray rounded-md mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-spotify-gray rounded w-3/4" />
                <div className="h-3 bg-spotify-gray rounded w-1/2" />
                <div className="h-3 bg-spotify-gray rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Songs Grid */}
      {!isLoadingPopular && popularSongs.length > 0 && (
        <UnifiedGrid>
          {popularSongs.slice(0, 6).map((song, index) => (
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
      )}

      {/* Empty State */}
      {!isLoadingPopular && popularSongs.length === 0 && !popularError && (
        <div className="text-center py-12">
          <div className="text-spotify-muted text-lg mb-2">
            No trending songs available
          </div>
          <p className="text-spotify-muted text-sm">
            Try refreshing to load some music
          </p>
        </div>
      )}
    </Section>
  );
}
