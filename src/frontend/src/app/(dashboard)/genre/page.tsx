'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UnifiedGrid } from '../../../components/common/unified-tile';
import { SongCard } from '../../../components/song/song-card';
import { usePlayerStore } from '../../../store/player-store';
import { useSongStore } from '../../../store/song-store';
import { X, Plus, Search } from 'lucide-react';
import { calculateBatchSizing } from '../../../lib/batch-sizing';
import { TOP_GENRES, Genre } from '../../../lib/constants/genres';

export const dynamic = 'force-dynamic';

// Helper functions
const getCardsPerRow = (width: number) => {
  if (width < 640) return 2;
  if (width < 768) return 3;
  if (width < 1024) return 4;
  if (width < 1280) return 5;
  if (width < 1920) return 6;
  return 8;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getRandomGenres = (count: number, exclude?: string): Genre[] => {
  const available = exclude ? TOP_GENRES.filter(g => g.name !== exclude) : [...TOP_GENRES];
  return shuffleArray(available).slice(0, count);
};

const getGenreColor = (index: number) => {
  const colors = [
    'from-pink-500 to-rose-500', 'from-orange-500 to-red-500', 'from-blue-500 to-indigo-500',
    'from-yellow-500 to-orange-500', 'from-purple-500 to-pink-500', 'from-green-500 to-teal-500',
    'from-red-500 to-pink-500', 'from-indigo-500 to-purple-500', 'from-teal-500 to-cyan-500',
    'from-gray-500 to-gray-700'
  ];
  return colors[index % colors.length];
};

export default function GenrePage() {
  const [randomGenres, setRandomGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGenres, setFilteredGenres] = useState<Genre[]>([]);
  const [isFromHomepage, setIsFromHomepage] = useState(false);
  const [isProcessingLoad, setIsProcessingLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  const [batchConfig, setBatchConfig] = useState(() => calculateBatchSizing());
  const { batchSize, rootMargin } = batchConfig;
  
  const { setCurrentSong, setQueue } = usePlayerStore();
  const { 
    selectedGenres, genreDiscoverItems, genreDiscoverHasMore, isLoadingGenreDiscover,
    genreDiscoverError, setSelectedGenres, initGenreDiscover, loadNextGenreDiscover, resetGenreDiscover 
  } = useSongStore();

  // Initialize random genres on mount and resize
  useEffect(() => {
    const updateRandomGenres = () => {
      if (typeof window === 'undefined') return;
      const cardsPerRow = getCardsPerRow(window.innerWidth);
      setRandomGenres(getRandomGenres(cardsPerRow));
    };

    updateRandomGenres();
    window.addEventListener('resize', updateRandomGenres);
    return () => window.removeEventListener('resize', updateRandomGenres);
  }, []);

  // Handle navigation from homepage with genre pre-selection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const selectedGenre = sessionStorage.getItem('selectedGenre');
    
    if (selectedGenre && randomGenres.length > 0) {
      setIsFromHomepage(true);
      const genreExists = TOP_GENRES.some(genre => genre.name === selectedGenre);
      
      if (genreExists) {
        // Replace first genre and remove duplicates
        setRandomGenres(prev => {
          const selected = TOP_GENRES.find(g => g.name === selectedGenre)!;
          const withoutDuplicates = prev.filter(g => g.name !== selectedGenre);
          return [selected, ...withoutDuplicates.slice(0, prev.length - 1)];
        });
        
        if (!selectedGenres.includes(selectedGenre)) {
          setSelectedGenres([selectedGenre]);
          initGenreDiscover([selectedGenre]);
        } else {
          initGenreDiscover([selectedGenre]);
        }
        
        // Clean up sessionStorage after processing
        sessionStorage.removeItem('selectedGenre');
      }
    } else {
      setIsFromHomepage(false);
    }
  }, [randomGenres.length, initGenreDiscover]);

  // Filter genres based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGenres([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = TOP_GENRES.filter(genre => {
      const name = genre.name.toLowerCase();
      return name.includes(query) || 
             name.split(' ').some(word => word.includes(query)) ||
             query.split(' ').some(word => name.includes(word));
    });
    setFilteredGenres(filtered.slice(0, 20));
  }, [searchQuery]);

  // Handle responsive batch sizing
  useEffect(() => {
    const updateBatchConfig = () => {
      if (typeof window !== 'undefined') {
        setBatchConfig(calculateBatchSizing());
      }
    };
    
    updateBatchConfig();
    window.addEventListener('resize', updateBatchConfig);
    return () => window.removeEventListener('resize', updateBatchConfig);
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && 
          !isLoadingGenreDiscover && 
          !isProcessingLoad &&
          genreDiscoverHasMore && 
          selectedGenres.length > 0 &&
          entry.intersectionRatio > 0.1) {
        setIsProcessingLoad(true);
        loadNextGenreDiscover(batchSize).finally(() => setIsProcessingLoad(false));
      }
    }, { 
      root: document.querySelector('main'), 
      rootMargin, 
      threshold: [0, 0.1, 0.5, 1.0] 
    });
    
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingGenreDiscover, genreDiscoverHasMore, selectedGenres.length, loadNextGenreDiscover, batchSize, rootMargin, isProcessingLoad]);

  // Event handlers
  const handleGenreToggle = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      const newGenres = selectedGenres.filter(g => g !== genreName);
      setSelectedGenres(newGenres);
      newGenres.length > 0 ? initGenreDiscover(newGenres) : resetGenreDiscover();
    } else if (selectedGenres.length < 3) {
      const newGenres = [...selectedGenres, genreName];
      setSelectedGenres(newGenres);
      initGenreDiscover(newGenres);
    }
  };

  const handlePlay = (index: number) => {
    setQueue(genreDiscoverItems, index);
    setCurrentSong(genreDiscoverItems[index]);
  };

  const clearAllGenres = () => {
    setSelectedGenres([]);
    resetGenreDiscover();
  };

  return (
    <div className="flex-1 text-white vibify-gradient">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Browse by Genre</h1>
          {selectedGenres.length > 0 && (
            <div className="text-sm text-gray-400">
              {selectedGenres.length === 1 ? '1 genre selected' : `${selectedGenres.length} genres selected`}
            </div>
          )}
        </div>
        
        {/* Genre Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Select Genres (Max 3)</h2>
            {selectedGenres.length > 0 && (
              <button
                onClick={clearAllGenres}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-full border border-gray-600 hover:border-gray-400 transition-colors"
              >
                Back to Genre Selection
              </button>
            )}
          </div>
          
          {/* Selected Genre Tags */}
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedGenres.map((genre) => (
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
            {selectedGenres.length > 0 && (
              <button
                onClick={clearAllGenres}
                className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-full border border-gray-600 hover:border-gray-400 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
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
                    const exactMatch = TOP_GENRES.find(genre => 
                      genre.name.toLowerCase() === searchQuery.toLowerCase()
                    );
                    if (exactMatch && !selectedGenres.includes(exactMatch.name) && selectedGenres.length < 3) {
                      handleGenreToggle(exactMatch.name);
                      setSearchQuery('');
                    } else if (exactMatch && selectedGenres.includes(exactMatch.name)) {
                      setSearchQuery('');
                    }
                  }
                }}
                className="w-full bg-gray-800 text-white px-10 py-3 rounded-lg border border-gray-700 focus:border-spotify-green focus:outline-none"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery.trim() && filteredGenres.length > 0 && (
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

          {/* Genre Grid */}
          <div className="flex gap-3">
            {randomGenres.map((genre, index) => {
              const isSelected = selectedGenres.includes(genre.name);
              const isDisabled = !isSelected && selectedGenres.length >= 3;
              
              return (
                <button
                  key={genre.name}
                  onClick={() => handleGenreToggle(genre.name)}
                  disabled={isDisabled}
                  className={`flex-1 aspect-[5/4] rounded-lg p-3 text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-spotify-green ring-offset-2 ring-offset-gray-900 scale-105'
                      : 'bg-gradient-to-br hover:scale-105 hover:brightness-110'
                  } ${!isSelected ? getGenreColor(index) : 'bg-gray-800'} ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="h-full flex flex-col justify-center">
                    <h3 className="text-sm font-bold">{genre.name}</h3>
                    <p className="text-xs opacity-75 mt-1">{genre.songCount.toLocaleString()} songs</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Songs Display */}
        {selectedGenres.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                {selectedGenres.length === 1 
                  ? `${selectedGenres[0]} Songs` 
                  : `Songs with ${selectedGenres.join(' + ')}`
                }
              </h2>
              <p className="text-gray-400">
                {genreDiscoverItems.length > 0 && `${genreDiscoverItems.length} songs loaded`}
                {genreDiscoverHasMore && ` • More available`}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-1">
                    Loading {batchSize} songs per batch • Max {batchConfig.maxSongs} songs in memory
                    <br />
                    Grid: {batchConfig.cardsPerRow}×{Math.ceil(batchConfig.cardsPerScreen / batchConfig.cardsPerRow)} cards per screen ({batchConfig.cardsPerScreen} total)
                    <br />
                    Trigger: {rootMargin} root margin
                    {isLoadingGenreDiscover && (
                      <span className="ml-2 text-blue-400">🔄 Loading more songs...</span>
                    )}
                  </div>
                )}
              </p>
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

            {isLoadingGenreDiscover && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
                <p className="text-gray-400 mt-2">Loading songs...</p>
              </div>
            )}

            <div ref={sentinelRef} className="h-40" />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Select genres above to discover music</p>
          </div>
        )}
      </div>
    </div>
  );
}
