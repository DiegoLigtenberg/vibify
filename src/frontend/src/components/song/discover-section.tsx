'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Section } from '../common/section';
import { SongCard } from './song-card';
import { useSongStore } from '../../store/song-store';
import { usePlayerStore } from '../../store/player-store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Song } from '@/shared/types/song';
import { UnifiedGrid } from '../common/unified-tile';

export function DiscoverSection() {
  const { randomSongs, isLoadingRandom, randomError, loadRandomSongs } = useSongStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  const router = useRouter();
  
  const [columns, setColumns] = useState(6);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const computeColumns = () => {
    // Force 6 columns on desktop for consistent title lengths
    setColumns(6);
  };

  // Load more songs than we display to ensure consistency
  useEffect(() => {
    if (randomSongs.length === 0) {
      loadRandomSongs(10); // Load 10, display 6
    }
  }, []);

  // Recalculate columns on resize
  useEffect(() => {
    computeColumns();
    const ro = new ResizeObserver(() => computeColumns());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleNext = () => {
    // Refresh the visible 6 with a new random set
    loadRandomSongs(10); // Load 10, display 6
  };

  const handlePlay = (song: any, index: number) => {
    setQueue(randomSongs.slice(0, 6), index);
    setCurrentSong(song);
  };

  const handleLike = (song: any) => {
    console.log('Liking:', song.title);
    // TODO: Implement like functionality
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold hover:underline cursor-pointer">
            Discover New Music
          </h2>
          <p className="text-spotify-muted text-sm mt-1">Fresh tracks just for you</p>
        </div>
        
        <button 
          onClick={() => router.push('/discover')}
          className="text-spotify-muted hover:text-white text-sm"
        >
          Show all
        </button>
      </div>

      {/* Loading State */}
      {isLoadingRandom && randomSongs.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
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

      {/* Songs Grid with Arrow on Last Item */}
      {!isLoadingRandom && randomSongs.length > 0 && (
        <UnifiedGrid>
          {randomSongs.slice(0, 6).map((song, index) => (
            <div key={song.id} className="relative">
              <SongCard
                song={song}
                compact
                onPlay={(song) => handlePlay(song, index)}
                onLike={handleLike}
                className="hover:scale-105 transition-transform"
              />
              {/* Arrow on the last (rightmost) song */}
              {index === 5 && (
                <button
                  onClick={handleNext}
                  disabled={isLoadingRandom}
                  className="absolute -right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/80 hover:bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors z-10"
                  title="Load more songs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </UnifiedGrid>
      )}

      {/* Empty State */}
      {!isLoadingRandom && randomSongs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-spotify-muted text-lg mb-2">
            No songs available
          </div>
          <p className="text-spotify-muted text-sm">
            Check back soon for new music
          </p>
        </div>
      )}
    </div>
  );
}
