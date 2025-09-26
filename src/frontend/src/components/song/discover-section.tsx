'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Section } from '../common/section';
import { SongCard } from './song-card';
import { useSongStore } from '../../store/song-store';
import { usePlayerStore } from '../../store/player-store';
import { useAuthStore } from '../../store/auth-store';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Song } from '@/shared/types/song';
import { UnifiedGrid } from '../common/unified-tile';

export function DiscoverSection() {
  const { randomSongs, isLoadingRandom, randomError, loadRandomSongs, isRefreshingRandom, toggleLike } = useSongStore();
  const { setCurrentSong, setQueue, queue } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [columns, setColumns] = useState(6);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Use player store queue as single source of truth for display
  const displaySongs = queue.length > 0 ? queue.slice(0, 6) : randomSongs.slice(0, 6);
  
  // Create placeholder songs for unauthenticated users
  const placeholderSongs: Song[] = [
    {
      id: 'placeholder-1',
      title: 'Welcome to Vibify',
      artist: 'Your Music Awaits',
      album: 'Sign in to discover',
      duration: 0,
      view_count: 0,
      like_count: 0,
      streams: 0,
      thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2NS41MzQgMTAwIDE3OCAxMTIuNDY2IDE3OCAxMjhDMTc4IDE0My41MzQgMTY1LjUzNCAxNTYgMTUwIDE1NkMxMzQuNDY2IDE1NiAxMjIgMTQzLjUzNCAxMjIgMTI4QzEyMiAxMTIuNDY2IDEzNC40NjYgMTAwIDE1MCAxMDBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDE4MFYyMDBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+',
      storage_url: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_placeholder: true
    },
    {
      id: 'placeholder-2', 
      title: 'Amazing Music',
      artist: 'Discover New Artists',
      album: 'Sign in to explore',
      duration: 0,
      view_count: 0,
      like_count: 0,
      streams: 0,
      thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2NS41MzQgMTAwIDE3OCAxMTIuNDY2IDE3OCAxMjhDMTc4IDE0My41MzQgMTY1LjUzNCAxNTYgMTUwIDE1NkMxMzQuNDY2IDE1NiAxMjIgMTQzLjUzNCAxMjIgMTI4QzEyMiAxMTIuNDY2IDEzNC40NjYgMTAwIDE1MCAxMDBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDE4MFYyMDBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+',
      storage_url: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_placeholder: true
    },
    {
      id: 'placeholder-3',
      title: 'Create Playlists',
      artist: 'Organize Your Music',
      album: 'Sign in to start',
      duration: 0,
      view_count: 0,
      like_count: 0,
      streams: 0,
      thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2NS41MzQgMTAwIDE3OCAxMTIuNDY2IDE3OCAxMjhDMTc4IDE0My41MzQgMTY1LjUzNCAxNTYgMTUwIDE1NkMxMzQuNDY2IDE1NiAxMjIgMTQzLjUzNCAxMjIgMTI4QzEyMiAxMTIuNDY2IDEzNC40NjYgMTAwIDE1MCAxMDBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDE4MFYyMDBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+',
      storage_url: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_placeholder: true
    },
    {
      id: 'placeholder-4',
      title: 'Like Your Favorites',
      artist: 'Save What You Love',
      album: 'Sign in to like',
      duration: 0,
      view_count: 0,
      like_count: 0,
      streams: 0,
      thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2NS41MzQgMTAwIDE3OCAxMTIuNDY2IDE3OCAxMjhDMTc4IDE0My41MzQgMTY1LjUzNCAxNTYgMTUwIDE1NkMxMzQuNDY2IDE1NiAxMjIgMTQzLjUzNCAxMjIgMTI4QzEyMiAxMTIuNDY2IDEzNC40NjYgMTAwIDE1MCAxMDBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDE4MFYyMDBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+',
      storage_url: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_placeholder: true
    },
    {
      id: 'placeholder-5',
      title: 'Explore Genres',
      artist: 'Find Your Sound',
      album: 'Sign in to browse',
      duration: 0,
      view_count: 0,
      like_count: 0,
      streams: 0,
      thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2NS41MzQgMTAwIDE3OCAxMTIuNDY2IDE3OCAxMjhDMTc4IDE0My41MzQgMTY1LjUzNCAxNTYgMTUwIDE1NkMxMzQuNDY2IDE1NiAxMjIgMTQzLjUzNCAxMjIgMTI4QzEyMiAxMTIuNDY2IDEzNC40NjYgMTAwIDE1MCAxMDBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDE4MFYyMDBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+',
      storage_url: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_placeholder: true
    },
    {
      id: 'placeholder-6',
      title: 'Upload Music',
      artist: 'Share Your Tracks',
      album: 'Sign in to upload',
      duration: 0,
      view_count: 0,
      like_count: 0,
      streams: 0,
      thumbnail_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2NS41MzQgMTAwIDE3OCAxMTIuNDY2IDE3OCAxMjhDMTc4IDE0My41MzQgMTY1LjUzNCAxNTYgMTUwIDE1NkMxMzQuNDY2IDE1NiAxMjIgMTQzLjUzNCAxMjIgMTI4QzEyMiAxMTIuNDY2IDEzNC40NjYgMTAwIDE1MCAxMDBaIiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDE4MFYyMDBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPC9zdmc+',
      storage_url: '',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_placeholder: true
    }
  ];
  
  // Show placeholder songs for unauthenticated users
  const songsToDisplay = isAuthenticated ? displaySongs : placeholderSongs;

  const computeColumns = () => {
    // Force 6 columns on desktop for consistent title lengths
    setColumns(6);
  };

  // Load exactly 6 songs to match what we display - only when authenticated
  useEffect(() => {
    if (isAuthenticated && randomSongs.length === 0) {
      loadRandomSongs(6); // Load exactly 6 songs
    }
  }, [isAuthenticated]);


  // Recalculate columns on resize
  useEffect(() => {
    computeColumns();
    const ro = new ResizeObserver(() => computeColumns());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleNext = () => {
    // Load new random songs - only when authenticated
    if (isAuthenticated) {
      loadRandomSongs(6); // Load exactly 6 songs
    }
  };

  const handlePlay = (song: any, index: number) => {
    // Don't allow playing placeholder songs
    if (song.is_placeholder || !isAuthenticated) {
      return;
    }
    
    const { currentSong, isPlaying, isLoading } = usePlayerStore.getState();
    
    // Prevent multiple instances - if same song is already playing/loading, don't do anything
    if (currentSong?.id === song.id && (isPlaying || isLoading)) {
      return;
    }
    
    setQueue(displaySongs, index);
    setCurrentSong(song);
  };

  const handleLike = async (song: any) => {
    // Don't allow liking placeholder songs
    if (song.is_placeholder || !isAuthenticated) {
      return;
    }
    
    try {
      await toggleLike(song.id);
    } catch (error) {
      console.error('Toggle like failed:', error);
    }
  };

  return (
    <div className="space-y-2 relative">
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
      {!isLoadingRandom && songsToDisplay.length > 0 && (
        <UnifiedGrid>
          {songsToDisplay.map((song, index) => (
            <div key={`${song.id}-${index}`} className="relative">
              <div 
                className={`transition-opacity duration-500 ease-in-out ${
                  isRefreshingRandom 
                    ? 'opacity-40' 
                    : 'opacity-100'
                }`}
              >
                <SongCard
                  song={song}
                  compact
                  onPlay={(song) => handlePlay(song, index)}
                  onLike={handleLike}
                  className="hover:scale-105 transition-transform"
                />
              </div>
              {/* Arrow on the last (rightmost) song - only for authenticated users */}
              {index === 5 && isAuthenticated && (
                <button
                  onClick={handleNext}
                  disabled={isRefreshingRandom}
                  className={`absolute -right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 z-10 ${
                    isRefreshingRandom 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-black/80 hover:bg-black text-white'
                  }`}
                  title={isRefreshingRandom ? "Loading new songs..." : "Load more songs"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </UnifiedGrid>
      )}

      {/* Empty State - only show for authenticated users */}
      {!isLoadingRandom && isAuthenticated && randomSongs.length === 0 && (
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
