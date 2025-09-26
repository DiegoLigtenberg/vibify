'use client';

import React, { useEffect, useRef, useState } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useSongStore } from '../../../store/song-store';
import { UnifiedGrid } from '../../../components/common/unified-tile';
import { SongCard } from '../../../components/song/song-card';
import { usePlayerStore } from '../../../store/player-store';
import { calculateBatchSizing } from '../../../lib/batch-sizing';

export default function DiscoverPage() {
  const { discoverItems, discoverHasMore, isLoadingDiscover, initDiscover, loadNextDiscover, resetDiscover } = useSongStore();
  const { setCurrentSong, setQueue } = usePlayerStore();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // State for client-side calculated values to prevent hydration mismatch
  const [batchConfig, setBatchConfig] = useState(() => ({
    batchSize: 48,
    maxSongs: 144,
    cardsPerRow: 6,
    cardsPerScreen: 18,
    rootMargin: '1200px'
  }));
  
  // Track if we're currently processing a load to prevent spam
  const [isProcessingLoad, setIsProcessingLoad] = useState(false);

  // Get current values from config
  const { batchSize, maxSongs, cardsPerRow, cardsPerScreen, rootMargin } = batchConfig;

  // Calculate client-side values to prevent hydration mismatch
  useEffect(() => {
    const calculateValues = () => {
      if (typeof window === 'undefined') return;
      
      // Use centralized batch sizing calculation
      const newConfig = calculateBatchSizing();
      setBatchConfig(newConfig);
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
      console.log(`🔍 Intersection check: isIntersecting=${first.isIntersecting}, isLoading=${isLoadingDiscover}, hasMore=${discoverHasMore}, rootMargin=${rootMargin}`);
      
      // Only trigger if:
      // 1. Element is intersecting
      // 2. Not currently loading
      // 3. Has more content
      // 4. Not already processing a load
      // 5. Intersection ratio is significant (not just barely touching)
      if (first.isIntersecting && 
          !isLoadingDiscover && 
          !isProcessingLoad &&
          discoverHasMore && 
          first.intersectionRatio > 0.1) {
        console.log(`🔄 Intersection detected - loading next batch of ${batchSize} songs (ratio: ${first.intersectionRatio})`);
        setIsProcessingLoad(true);
        loadNextDiscover(batchSize).finally(() => {
          setIsProcessingLoad(false);
        });
      }
    }, { root: rootEl as Element | null, rootMargin, threshold: [0, 0.1, 0.5, 1.0] });
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [isLoadingDiscover, discoverHasMore, discoverItems.length, loadNextDiscover, batchSize, rootMargin, isProcessingLoad]);

  // Scroll-based fallback disabled for testing

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
              <br />
              Grid: {cardsPerRow}×{Math.ceil(cardsPerScreen / cardsPerRow)} cards per screen ({cardsPerScreen} total)
              <br />
              Trigger: {rootMargin} root margin
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


