'use client';

import React, { useEffect, useState, useRef } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useSongStore } from '../../../store/song-store';
import { SongCard } from '../../../components/song/song-card';

export default function DiscoverAllPage() {
  const { loadRandomSongs } = useSongStore();
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [columns, setColumns] = useState(6);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const computeColumns = () => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const minCardWidth = 180; // px
    const gap = 16; // px
    const cols = Math.max(2, Math.floor((width + gap) / (minCardWidth + gap)));
    setColumns(cols);
  };

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      // Temporarily reuse random endpoint; backend will switch to proper paged API later
      const batch = await (await import('../../../lib/api')).SongsAPI.getRandom({ limit: columns * 2 });
      if (!batch || batch.length === 0) {
        setHasMore(false);
      } else {
        setSongs(prev => [...prev, ...batch]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // initial
  useEffect(() => {
    computeColumns();
    const ro = new ResizeObserver(() => computeColumns());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    loadMore();
  }, [columns]);

  // infinite scroll sentinel
  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
      if (nearBottom) loadMore();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLoading, hasMore, columns]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Discover New Music</h1>
      <div ref={containerRef} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {songs.map((song, index) => (
          <SongCard key={`${song.id}-${index}`} song={song} />
        ))}
        {isLoading && Array.from({ length: columns }).map((_, i) => (
          <div key={`skeleton-${i}`} className="song-card p-4 animate-pulse">
            <div className="w-full aspect-square bg-spotify-gray rounded-md mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-spotify-gray rounded w-3/4" />
              <div className="h-3 bg-spotify-gray rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
