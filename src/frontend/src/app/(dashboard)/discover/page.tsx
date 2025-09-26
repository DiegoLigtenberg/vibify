'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  
  // State for client-side calculated values to prevent hydration mismatch
  const [maxSongs, setMaxSongs] = useState(180); // Default fallback
  const [batchSize, setBatchSize] = useState(48); // Default fallback

  // Calculate optimal batch size based on visible rows
  const calculateBatchSize = () => {
    // Default for server-side rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return 48; // Default fallback
    }
    
    // Get the grid container to calculate visible rows
    const container = document.querySelector('.grid');
    if (!container) return 48; // fallback
    
    const containerWidth = container.clientWidth;
    const cardWidth = 200; // approximate card width + gap
    const cardsPerRow = Math.floor(containerWidth / cardWidth);
    const visibleRows = Math.ceil(window.innerHeight / 300); // approximate row height
    const cardsPerScreen = cardsPerRow * visibleRows;
    
    // Load 3-4 screens worth to ensure smooth scrolling (increased from 2-3)
    return Math.max(cardsPerScreen * 3, 48);
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

  // Calculate client-side values to prevent hydration mismatch
  useEffect(() => {
    const calculateValues = () => {
      if (typeof window === 'undefined') return;
      
      // Calculate batch size
      const container = document.querySelector('.grid');
      if (container) {
        const containerWidth = container.clientWidth;
        const cardWidth = 200;
        const cardsPerRow = Math.floor(containerWidth / cardWidth);
        const visibleRows = Math.ceil(window.innerHeight / 300);
        const cardsPerScreen = cardsPerRow * visibleRows;
        const newBatchSize = Math.max(cardsPerScreen * 2, 24);
        setBatchSize(newBatchSize);
      }
      
      // Calculate max songs
      const containerWidth = window.innerWidth;
      const cardWidth = 200;
      const cardsPerRow = Math.floor(containerWidth / cardWidth);
      const visibleRows = Math.ceil(window.innerHeight / 300);
      const cardsPerScreen = cardsPerRow * visibleRows;
      const baseMax = Math.max(cardsPerScreen * 3, 30);
      const rowsToKeep = Math.ceil(baseMax / cardsPerRow);
      const newMaxSongs = rowsToKeep * cardsPerRow;
      setMaxSongs(newMaxSongs);
    };
    
    calculateValues();
    
    // Recalculate on window resize
    const handleResize = () => calculateValues();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initDiscover();
  }, [initDiscover]);

  // Track when discoverItems changes to identify re-render timing
  useEffect(() => {
    const renderStartTime = performance.now();
    console.log(`🎨 Discover page re-rendering with ${discoverItems.length} songs`);
    
    // Use requestAnimationFrame to measure actual DOM update time
    requestAnimationFrame(() => {
      const renderEndTime = performance.now();
      console.log(`🎨 DOM update completed in ${(renderEndTime - renderStartTime).toFixed(2)}ms`);
    });
  }, [discoverItems.length]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    // Use the scrollable main element as root to avoid viewport/sticky issues
    const rootEl = document.querySelector('main');
    const el = sentinelRef.current;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !isLoadingDiscover && discoverHasMore) {
        console.log(`🔄 Intersection detected - loading next batch of ${batchSize} songs`);
        loadNextDiscover(batchSize);
      }
    }, { root: rootEl as Element | null, rootMargin: '1600px', threshold: 0 });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [isLoadingDiscover, discoverHasMore, discoverItems.length, loadNextDiscover, batchSize]);

  // Preload next batch when we're getting close to the end (disabled for now)
  // useEffect(() => {
  //   if (discoverItems.length > 0 && discoverItems.length % 48 === 0 && !isLoadingDiscover && discoverHasMore) {
  //     console.log(`🔄 Preloading next batch - ${discoverItems.length} songs loaded`);
  //     // Small delay to avoid overwhelming the server
  //     const timeoutId = setTimeout(() => {
  //       loadNextDiscover(batchSize);
  //     }, 100);
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [discoverItems.length, isLoadingDiscover, discoverHasMore, loadNextDiscover, batchSize]);

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
            {discoverItems.length >= maxSongs && (
              <span className="ml-2 text-yellow-400">(Memory optimized)</span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Loading {batchSize} songs per batch • Max {maxSongs} songs in memory
              {isLoadingDiscover && (
                <span className="ml-2 text-blue-400">🔄 Loading more songs...</span>
              )}
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


