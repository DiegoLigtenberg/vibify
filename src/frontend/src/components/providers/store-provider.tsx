'use client';

import { useEffect } from 'react';
import { useSongStore } from '../../store/song-store';
import { useAuthStore } from '../../store/auth-store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const loadLikedSongs = useSongStore(state => state.loadLikedSongs);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only load liked songs if user is authenticated
    if (isAuthenticated) {
      loadLikedSongs();
    }
  }, [loadLikedSongs, isAuthenticated]);

  return <>{children}</>;
}
