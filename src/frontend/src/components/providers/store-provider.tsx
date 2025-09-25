'use client';

import { useEffect } from 'react';
import { useSongStore } from '../../store/song-store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const loadLikedSongs = useSongStore(state => state.loadLikedSongs);

  useEffect(() => {
    // Load liked songs when the app starts
    loadLikedSongs();
  }, [loadLikedSongs]);

  return <>{children}</>;
}
