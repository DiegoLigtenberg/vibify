'use client';

import React, { useEffect, useRef } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useSongStore } from '../../../store/song-store';
import { UnifiedGrid } from '../../../components/common/unified-tile';
import { SongCard } from '../../../components/song/song-card';
import { usePlayerStore } from '../../../store/player-store';

export default function DiscoverPage() {
  const { discoverItems, discoverHasMore, isLoadingDiscover, initDiscover, loadNextDiscover, resetDiscover } = useSongStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calculate optimal batch size based on visible rows
  const calculateBatchSize = () => {
    // Default for server-side rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return 24; // Default fallback
    }
    
    // Get the grid container to calculate visible rows
    const container = document.querySelector('.grid');
    if (!container) return 24; // fallback
    
    const containerWidth = container.clientWidth;
    const cardWidth = 200; // approximate card width + gap
    const cardsPerRow = Math.floor(containerWidth / cardWidth);
    const visibleRows = Math.ceil(window.innerHeight / 300); // approximate row height
    const cardsPerScreen = cardsPerRow * visibleRows;
    
    // Load 2-3 screens worth to ensure smooth scrolling
    return Math.max(cardsPerScreen * 2, 24);
  };

  // Calculate dynamic memory limit based on screen size
  const calculateMaxSongs = () => {
    // Default values for server-side rendering
    if (typeof window === 'undefined') {
      return 180; // Default fallback
    }
    
    const containerWidth = window.innerWidth;
    const cardWidth = 200; // approximate card width + gap
    const cardsPerRow = Math.floor(containerWidth / cardWidth);
    const visibleRows = Math.ceil(window.innerHeight / 300); // approximate row height
    const cardsPerScreen = cardsPerRow * visibleRows;
    
    // Keep 6-8 screens worth of songs for smooth scrolling
    const baseMax = Math.max(cardsPerScreen * 6, 50); // minimum 50 songs
    
    // Ensure max is a multiple of cards per row to prevent position shifting
    const rowsToKeep = Math.ceil(baseMax / cardsPerRow);
    return rowsToKeep * cardsPerRow;
  };

  useEffect(() => {
    initDiscover();
  }, [initDiscover]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    // Use the scrollable main element as root to avoid viewport/sticky issues
    const rootEl = document.querySelector('main');
    const el = sentinelRef.current;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !isLoadingDiscover && discoverHasMore) {
        const batchSize = calculateBatchSize();
        loadNextDiscover(batchSize);
      }
    }, { root: rootEl as Element | null, rootMargin: '800px', threshold: 0 });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [isLoadingDiscover, discoverHasMore, discoverItems.length, loadNextDiscover]);

  const handlePlay = (index: number) => {
    const song = discoverItems[index];
    setQueue(discoverItems, index);
    setCurrentSong(song);
  };

  return (
    <div ref={containerRef} className="flex-1 text-white vibify-gradient p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-spotify-muted">Scroll to explore new music</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-spotify-muted">
            {discoverItems.length} songs loaded • {discoverHasMore ? 'More available' : 'End reached'}
            {discoverItems.length >= calculateMaxSongs() && (
              <span className="ml-2 text-yellow-400">(Memory optimized)</span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Loading {calculateBatchSize()} songs per batch • Max {calculateMaxSongs()} songs in memory
            </div>
          </div>
          <button
            onClick={() => {
              resetDiscover();
              initDiscover();
            }}
            className="px-4 py-2 bg-spotify-green text-black rounded-full font-medium hover:bg-green-400 transition-colors"
          >
            Reset & Reload
          </button>
        </div>
      </div>

      {discoverItems.length === 0 && isLoadingDiscover && (
        <div className="text-spotify-muted">Loading...</div>
      )}

      {discoverItems.length > 0 && (
        <UnifiedGrid>
          {discoverItems.map((song, i) => (
            <SongCard key={song.id} song={song} compact onPlay={() => handlePlay(i)} className="hover:scale-105 transition-transform" />
          ))}
        </UnifiedGrid>
      )}

      {/* Make sentinel tall enough so it can intersect above sticky player bar */}
      <div ref={sentinelRef} className="h-40" />
    </div>
  );
}


