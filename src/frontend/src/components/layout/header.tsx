'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Search, Heart, Music, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { SongsAPI } from '../../lib/api';
import { Song } from '@/shared/types/song';
import { usePlayerStore } from '../../store/player-store';
import { useSongStore } from '../../store/song-store';
import { cn } from '../../lib/utils';
import { SongImage } from '../ui/song-image';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const setCurrentSong = usePlayerStore(s => s.setCurrentSong);
  const addToQueue = usePlayerStore(s => s.addToQueue);
  const { toggleLike, isLiked } = useSongStore();

  // Debounce search input
  const debouncedSearch = useCallback(
    (query: string) => {
      if (query.length > 0) {
        setIsSearching(true);
        SongsAPI.searchSongs(query, 5) // Limit to 5 results for dropdown
          .then((results: Song[]) => {
            setSearchResults(results);
            setShowSearchResults(true);
          })
          .catch((error: any) => {
            console.error('Search error:', error);
            setSearchResults([]);
          })
          .finally(() => {
            setIsSearching(false);
          });
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    },
    []
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debouncedSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSongPlay = (song: Song) => {
    setCurrentSong(song);
    addToQueue(song);
    setShowSearchResults(false);
  };

  const handleLike = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(song.id);
  };

  return (
    <header className="h-16 md:h-20 bg-black flex items-center justify-between px-4 md:px-6 relative z-10 w-full">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 text-white hover:text-spotify-green transition-colors"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Logo - Always visible */}
      <Link 
        href="/" 
        className="flex items-center space-x-2 transition-all duration-300"
      >
        <Music className="h-6 w-6 md:h-8 md:w-8 text-spotify-green" />
        <span className="text-lg md:text-xl font-bold text-white">Vibify</span>
      </Link>

      {/* Search Bar - Always visible */}
      <div className={cn(
        "relative transition-all duration-300",
        "absolute w-80 left-64 top-1/2 transform -translate-y-1/2"
      )} ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search for songs, artists, or albums..."
            className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-full px-10 py-2 md:py-1.5 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-spotify-green/30 focus:shadow-xl transition-all border border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.length > 0 && searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full rounded-xl shadow-2xl border overflow-hidden z-50 max-h-80 overflow-y-auto" style={{backgroundColor: '#262626', borderColor: '#404040'}}>
            {searchResults.map((song) => (
              <div
                key={song.id}
                className="flex items-center p-3 cursor-pointer transition-colors border-b last:border-b-0"
                style={{borderColor: '#404040'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f1f1f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => handleSongPlay(song)}
              >
                <div className="w-12 rounded-md overflow-hidden flex-shrink-0 mr-3">
                  <SongImage 
                    src={song.thumbnail_url} 
                    alt={song.title}
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{song.title}</p>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                </div>
                <button
                  onClick={(e) => handleLike(song, e)}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    isLiked(song.id) 
                      ? 'text-spotify-green hover:text-spotify-green/80' 
                      : 'text-gray-400 hover:text-spotify-green'
                  )}
                >
                  <Heart className={cn(
                    'h-4 w-4',
                    isLiked(song.id) && 'fill-current'
                  )} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
        
      {/* Right side - User Info - Always visible */}
      <div className="flex items-center space-x-3 bg-black/50 rounded-full px-3 md:px-4 py-2 hover:bg-black/70 transition-colors cursor-pointer">
        <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="hidden md:flex flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">User</p>
          <p className="text-gray-300 text-xs truncate">Free Plan</p>
        </div>
      </div>
    </header>
  );
}
