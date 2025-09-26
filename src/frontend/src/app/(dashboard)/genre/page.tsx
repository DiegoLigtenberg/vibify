'use client';

import React, { useState, useEffect, useRef } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { UnifiedGrid } from '../../../components/common/unified-tile';
import { SongCard } from '../../../components/song/song-card';
import { SongsAPI } from '../../../lib/api';
import { usePlayerStore } from '../../../store/player-store';
import { useSongStore } from '../../../store/song-store';
import { X, Plus, Search } from 'lucide-react';
import { calculateBatchSizing } from '../../../lib/batch-sizing';

interface Genre {
  name: string;
  song_count: number;
}

export default function GenrePage() {
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [randomGenres, setRandomGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGenres, setFilteredGenres] = useState<Genre[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  // State for responsive batch sizing
  const [batchConfig, setBatchConfig] = useState(() => ({
    batchSize: 48,
    maxSongs: 144,
    cardsPerRow: 6,
    cardsPerScreen: 18,
    rootMargin: '1200px'
  }));
  const { batchSize, maxSongs, cardsPerRow, cardsPerScreen, rootMargin } = batchConfig;
  
  // Track if we're currently processing a load to prevent spam
  const [isProcessingLoad, setIsProcessingLoad] = useState(false);
  
  const { setCurrentSong, setQueue } = usePlayerStore();
  const { 
    selectedGenres,
    genreDiscoverItems, 
    genreDiscoverHasMore, 
    isLoadingGenreDiscover,
    setSelectedGenres,
    initGenreDiscover, 
    loadNextGenreDiscover, 
    resetGenreDiscover 
  } = useSongStore();

  // Load all genres on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        setIsLoadingGenres(true);
        const genreData = await SongsAPI.getGenres({ limit: 3000, min_songs: 1 });
        console.log('Loaded genres:', genreData.slice(0, 10)); // Debug: show first 10 genres
        console.log('Looking for rock:', genreData.find(g => g.name === 'rock')); // Debug: check if rock exists
        setAllGenres(genreData);
        
        // Get 18 random genres for display (3 rows of 6)
        const shuffled = [...genreData].sort(() => 0.5 - Math.random());
        setRandomGenres(shuffled.slice(0, 18));
      } catch (err) {
        console.error('Error loading genres:', err);
        setError('Failed to load genres');
      } finally {
        setIsLoadingGenres(false);
      }
    };

    loadGenres();
  }, []);

  // Filter genres based on search query (loose matching)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGenres([]);
    } else {
      const query = searchQuery.toLowerCase();
      console.log('Searching for:', query); // Debug
      console.log('Available genres count:', allGenres.length); // Debug
      const filtered = allGenres.filter(genre =>
        genre.name.toLowerCase().includes(query) ||
        genre.name.toLowerCase().split(' ').some(word => word.includes(query)) ||
        query.split(' ').some(word => genre.name.toLowerCase().includes(word))
      );
      console.log('Filtered results:', filtered.slice(0, 5)); // Debug: show first 5 results
      setFilteredGenres(filtered.slice(0, 20)); // Limit to 20 suggestions
    }
  }, [searchQuery, allGenres]);

  // Load songs when genres are selected
  useEffect(() => {
    if (selectedGenres.length > 0) {
      initGenreDiscover(selectedGenres);
    } else {
      resetGenreDiscover();
    }
  }, [selectedGenres, initGenreDiscover, resetGenreDiscover]);

  // Handle responsive batch sizing
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

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const rootEl = document.querySelector('main');
    const el = sentinelRef.current;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      console.log(`🔍 Genre intersection check: isIntersecting=${first.isIntersecting}, isLoading=${isLoadingGenreDiscover}, hasMore=${genreDiscoverHasMore}, rootMargin=${rootMargin}`);
      
      // Only trigger if:
      // 1. Element is intersecting
      // 2. Not currently loading
      // 3. Has more content
      // 4. Has selected genres
      // 5. Not already processing a load
      // 6. Intersection ratio is significant (not just barely touching)
      if (first.isIntersecting && 
          !isLoadingGenreDiscover && 
          !isProcessingLoad &&
          genreDiscoverHasMore && 
          selectedGenres.length > 0 &&
          first.intersectionRatio > 0.1) {
        console.log(`🔄 Genre intersection detected - loading next batch of ${batchSize} songs (ratio: ${first.intersectionRatio})`);
        setIsProcessingLoad(true);
        loadNextGenreDiscover(batchSize).finally(() => {
          setIsProcessingLoad(false);
        });
      }
    }, { root: rootEl as Element | null, rootMargin, threshold: [0, 0.1, 0.5, 1.0] });
    
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [isLoadingGenreDiscover, genreDiscoverHasMore, selectedGenres.length, loadNextGenreDiscover, batchSize, rootMargin, isProcessingLoad]);

  // Scroll-based fallback disabled for testing

  const handleGenreToggle = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genreName));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handlePlay = (index: number) => {
    const song = genreDiscoverItems[index];
    setQueue(genreDiscoverItems, index);
    setCurrentSong(song);
  };

  const getGenreColor = (index: number) => {
    const colors = [
      'from-pink-500 to-rose-500',
      'from-orange-500 to-red-500', 
      'from-blue-500 to-indigo-500',
      'from-yellow-500 to-orange-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-cyan-500',
      'from-gray-500 to-gray-700'
    ];
    return colors[index % colors.length];
  };

  if (isLoadingGenres) {
    return (
      <div className="flex-1 text-white vibify-gradient">
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-6">Browse by Genre</h1>
          <div className="grid grid-cols-6 gap-3 mb-8">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[5/4] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 text-white vibify-gradient">
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-6">Browse by Genre</h1>
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-spotify-green text-white px-4 py-2 rounded-full hover:bg-spotify-green/80"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white vibify-gradient">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">Browse by Genre</h1>
        
        {/* Selected Genres Display */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Genres (Max 3)</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedGenres.map((genre, index) => (
              <div
                key={genre}
                className="flex items-center space-x-2 bg-spotify-green text-black px-3 py-2 rounded-full text-sm font-medium"
              >
                <span>{genre}</span>
                <button
                  onClick={() => handleGenreToggle(genre)}
                  className="hover:bg-black/20 rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {selectedGenres.length < 3 && (
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Plus className="h-4 w-4" />
                <span>Select up to {3 - selectedGenres.length} more</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Only add if the exact search query matches a genre name
                    const exactMatch = allGenres.find(genre => 
                      genre.name.toLowerCase() === searchQuery.toLowerCase()
                    );
                    if (exactMatch && !selectedGenres.includes(exactMatch.name) && selectedGenres.length < 3) {
                      handleGenreToggle(exactMatch.name);
                      setSearchQuery('');
                    } else if (exactMatch && selectedGenres.includes(exactMatch.name)) {
                      // Genre already selected
                      setSearchQuery('');
                    } else {
                      // No exact match found - show error or do nothing
                      console.log('No exact genre match found for:', searchQuery);
                    }
                  }
                }}
                className="w-full bg-gray-800 text-white px-10 py-3 rounded-lg border border-gray-700 focus:border-spotify-green focus:outline-none"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery.trim() !== '' && filteredGenres.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-80 overflow-y-auto z-10">
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                  {filteredGenres.length} genres found
                </div>
                {filteredGenres.map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => {
                      handleGenreToggle(genre.name);
                      setSearchQuery('');
                    }}
                    disabled={!selectedGenres.includes(genre.name) && selectedGenres.length >= 3}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                      !selectedGenres.includes(genre.name) && selectedGenres.length >= 3
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Random Genres Display (3 rows of 6) */}
          <div className="grid grid-cols-6 gap-3">
            {randomGenres.map((genre, index) => (
              <button
                key={genre.name}
                onClick={() => handleGenreToggle(genre.name)}
                disabled={!selectedGenres.includes(genre.name) && selectedGenres.length >= 3}
                className={`aspect-[5/4] rounded-lg p-3 text-left transition-all ${
                  selectedGenres.includes(genre.name)
                    ? 'bg-spotify-green text-black scale-105'
                    : 'bg-gradient-to-br hover:scale-105 hover:brightness-110'
                } ${getGenreColor(index)} ${
                  !selectedGenres.includes(genre.name) && selectedGenres.length >= 3
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="h-full flex flex-col justify-center">
                  <h3 className="text-sm font-bold">{genre.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Songs Display */}
        {selectedGenres.length > 0 && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedGenres.length === 1 
                    ? `${selectedGenres[0]} Songs` 
                    : `Songs with ${selectedGenres.join(' + ')}`
                  }
                </h2>
                <p className="text-gray-400">
                  {genreDiscoverItems.length > 0 && `${genreDiscoverItems.length} songs loaded`}
                  {genreDiscoverHasMore && ` • More available`}
                  <div className="text-xs text-gray-500 mt-1">
                    Loading {batchSize} songs per batch • Max {maxSongs} songs in memory
                    <br />
                    Grid: {cardsPerRow}×{Math.ceil(cardsPerScreen / cardsPerRow)} cards per screen ({cardsPerScreen} total)
                    <br />
                    Trigger: {rootMargin} root margin
                    {isLoadingGenreDiscover && (
                      <span className="ml-2 text-blue-400">🔄 Loading more songs...</span>
                    )}
                  </div>
                </p>
              </div>
            </div>

            {genreDiscoverItems.length > 0 ? (
              <UnifiedGrid>
                {genreDiscoverItems.map((song, index) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    compact
                    onPlay={() => handlePlay(index)}
                    className="hover:scale-105 transition-transform"
                  />
                ))}
              </UnifiedGrid>
            ) : !isLoadingGenreDiscover && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No songs found for selected genres</p>
              </div>
            )}

            {/* Loading indicator */}
            {isLoadingGenreDiscover && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
                <p className="text-gray-400 mt-2">Loading songs...</p>
              </div>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-40" />
          </div>
        )}

        {/* No genres selected state */}
        {selectedGenres.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Select genres above to discover music</p>
          </div>
        )}
      </div>
    </div>
  );
}
