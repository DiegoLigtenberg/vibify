'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { UnifiedGrid } from '../../../components/common/unified-tile';
import { SongCard } from '../../../components/song/song-card';
import { usePlayerStore } from '../../../store/player-store';
import { useSongStore } from '../../../store/song-store';
import { X, Plus, Search } from 'lucide-react';
import { calculateBatchSizing } from '../../../lib/batch-sizing';
import { TOP_GENRES, Genre } from '../../../lib/constants/genres';

export default function GenrePage() {
  const searchParams = useSearchParams();
  const [randomGenres, setRandomGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGenres, setFilteredGenres] = useState<Genre[]>([]);
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
    genreDiscoverError,
    setSelectedGenres,
    initGenreDiscover, 
    loadNextGenreDiscover, 
    resetGenreDiscover 
  } = useSongStore();

  // Handle URL parameter for auto-selecting genre
  useEffect(() => {
    const selectedGenre = searchParams.get('selected');
    if (selectedGenre && !selectedGenres.includes(selectedGenre)) {
      // Validate that the genre exists in our TOP_GENRES list
      const genreExists = TOP_GENRES.some(genre => genre.name === selectedGenre);
      if (genreExists) {
        setSelectedGenres([selectedGenre]);
        initGenreDiscover([selectedGenre]);
      }
    }
  }, [searchParams, selectedGenres, initGenreDiscover]);

  // Calculate responsive random genres on mount and resize
  useEffect(() => {
    const calculateRandomGenres = () => {
      if (typeof window === 'undefined') return;
      
      const containerWidth = window.innerWidth;
      let cardsPerRow;
      
      if (containerWidth < 640) { // sm - mobile
        cardsPerRow = 2;
      } else if (containerWidth < 768) { // md - small tablet
        cardsPerRow = 3;
      } else if (containerWidth < 1024) { // lg - tablet
        cardsPerRow = 4;
      } else if (containerWidth < 1280) { // xl - small desktop
        cardsPerRow = 5;
      } else if (containerWidth < 1920) { // 2xl - medium desktop (up to 1920x1080)
        cardsPerRow = 6;
      } else { // 3xl+ - very large desktop (above 1920x1080)
        cardsPerRow = 8;
      }
      
      // Randomly select n genres from top 30, where n = cardsPerRow (1 row)
      // Use Fisher-Yates shuffle for better randomness
      const shuffled = [...TOP_GENRES];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selectedGenres = shuffled.slice(0, cardsPerRow);
      setRandomGenres(selectedGenres);
    };

    // Always calculate random genres on mount (including refresh)
    calculateRandomGenres();
    
    const handleResize = () => calculateRandomGenres();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array is correct - we want this to run on every mount

  // Filter genres based on search query (loose matching)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGenres([]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = TOP_GENRES.filter(genre =>
        genre.name.toLowerCase().includes(query) ||
        genre.name.toLowerCase().split(' ').some(word => word.includes(query)) ||
        query.split(' ').some(word => genre.name.toLowerCase().includes(word))
      );
      setFilteredGenres(filtered.slice(0, 20)); // Limit to 20 suggestions
    }
  }, [searchQuery]);

  // Load songs when genres are selected - now handled directly in handleGenreToggle

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
      const newGenres = selectedGenres.filter(g => g !== genreName);
      setSelectedGenres(newGenres);
      if (newGenres.length > 0) {
        initGenreDiscover(newGenres);
      } else {
        resetGenreDiscover();
      }
    } else if (selectedGenres.length < 3) {
      const newGenres = [...selectedGenres, genreName];
      setSelectedGenres(newGenres);
      initGenreDiscover(newGenres);
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

  // No loading or error states needed since we're using hardcoded data

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
                    const exactMatch = TOP_GENRES.find((genre: Genre) => 
                      genre.name.toLowerCase() === searchQuery.toLowerCase()
                    );
                    if (exactMatch && !selectedGenres.includes(exactMatch.name) && selectedGenres.length < 3) {
                      handleGenreToggle(exactMatch.name);
                      setSearchQuery('');
                    } else if (exactMatch && selectedGenres.includes(exactMatch.name)) {
                      // Genre already selected
                      setSearchQuery('');
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

          {/* Random Genres Display (1 row, responsive) */}
          <div className="flex gap-3">
            {randomGenres.map((genre, index) => (
              <button
                key={genre.name}
                onClick={() => handleGenreToggle(genre.name)}
                disabled={!selectedGenres.includes(genre.name) && selectedGenres.length >= 3}
                className={`flex-1 aspect-[5/4] rounded-lg p-3 text-left transition-all ${
                  selectedGenres.includes(genre.name)
                    ? 'ring-2 ring-spotify-green ring-offset-2 ring-offset-gray-900 scale-105'
                    : 'bg-gradient-to-br hover:scale-105 hover:brightness-110'
                } ${!selectedGenres.includes(genre.name) ? getGenreColor(index) : 'bg-gray-800'} ${
                  !selectedGenres.includes(genre.name) && selectedGenres.length >= 3
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className="h-full flex flex-col justify-center">
                  <h3 className="text-sm font-bold">{genre.name}</h3>
                  <p className="text-xs opacity-75 mt-1">{genre.songCount.toLocaleString()} songs</p>
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
                <p className="text-gray-400 text-lg">
                  {genreDiscoverError || "No songs found for selected genres"}
                </p>
                {genreDiscoverError && (
                  <p className="text-gray-500 text-sm mt-2">
                    Try selecting different genre combinations
                  </p>
                )}
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
