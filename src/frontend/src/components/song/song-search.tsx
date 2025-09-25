'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSongStore } from '../../store/song-store';
import { SongCard } from './song-card';
import { Button } from '../ui/button';
import { debounce } from '../../lib/utils';
import { APP_CONFIG } from '../../lib/settings';

export function SongSearch() {
  const {
    searchQuery,
    searchResults,
    searchTotal,
    searchHasMore,
    isSearching,
    searchError,
    setSearchQuery,
    searchSongs,
    loadMoreSearchResults,
    clearSearch
  } = useSongStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    if (query.trim()) {
      searchSongs({ query: query.trim() });
    }
  }, APP_CONFIG.search.debounceMs);

  useEffect(() => {
    if (localQuery !== searchQuery) {
      debouncedSearch(localQuery);
    }
  }, [localQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      searchSongs({ query: localQuery.trim() });
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
  };

  const handleLoadMore = () => {
    if (searchHasMore && !isSearching) {
      loadMoreSearchResults();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Search</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-spotify-muted" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="What do you want to listen to?"
              className="w-full h-12 pl-10 pr-10 bg-white text-black rounded-full focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-spotify-muted hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {isSearching ? 'Searching...' : `Found ${searchTotal} results`}
            </h2>
          </div>

          {/* Error State */}
          {searchError && (
            <div className="text-red-400 text-center py-8">
              {searchError}
            </div>
          )}

          {/* Results Grid */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {searchHasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMore}
                disabled={isSearching}
                variant="spotifySecondary"
              >
                {isSearching ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchResults.length === 0 && !searchError && (
            <div className="text-center py-12">
              <div className="text-spotify-muted text-lg mb-2">
                No songs found for "{searchQuery}"
              </div>
              <p className="text-spotify-muted text-sm">
                Try searching for a different term
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!searchQuery && (
        <div className="text-center py-12">
          <div className="text-spotify-muted text-lg mb-2">
            Find your favorite songs
          </div>
          <p className="text-spotify-muted text-sm">
            Search for songs, artists, or albums
          </p>
        </div>
      )}
    </div>
  );
}
