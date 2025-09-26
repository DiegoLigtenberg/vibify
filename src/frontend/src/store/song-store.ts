import { create } from 'zustand';
import { SongsAPI } from '../lib/api';
import type { Song, SongSearchParams, SongSearchResult } from '@/shared/types/song';
import { getResponsiveBatchSize, getResponsiveMaxSongs } from '../lib/batch-sizing';

interface SongState {
  // Search state
  searchQuery: string;
  searchResults: Song[];
  searchTotal: number;
  searchHasMore: boolean;
  isSearching: boolean;
  searchError: string | null;
  
  // Random songs
  randomSongs: Song[];
  isLoadingRandom: boolean;
  randomError: string | null;
  
  // Popular songs
  popularSongs: Song[];
  isLoadingPopular: boolean;
  popularError: string | null;
  
  // Recently played
  recentlyPlayed: Song[];
  
  // Liked songs
  likedSongs: Set<string>;
  isLiking: boolean;
  
  // Discover feed (infinite scroll)
  discoverItems: Song[];
  discoverCursor: number;
  discoverSeed: number;
  discoverHasMore: boolean;
  isLoadingDiscover: boolean;
  discoverError: string | null;
  
  // Genre discover feed (infinite scroll with genre filtering)
  genreDiscoverItems: Song[];
  genreDiscoverCursor: number;
  genreDiscoverSeed: number;
  genreDiscoverHasMore: boolean;
  isLoadingGenreDiscover: boolean;
  genreDiscoverError: string | null;
  selectedGenres: string[];
  
  // Current view
  currentView: 'search' | 'random' | 'recent' | 'liked';
  
  // Actions
  setSearchQuery: (query: string) => void;
  searchSongs: (params?: SongSearchParams) => Promise<void>;
  loadMoreSearchResults: () => Promise<void>;
  clearSearch: () => void;
  
  loadRandomSongs: (limit?: number) => Promise<void>;
  loadPopularSongs: (limit?: number) => Promise<void>;
  
         // Discover actions
         initDiscover: (seed?: number) => Promise<void>;
         loadNextDiscover: (limit?: number) => Promise<void>;
         resetDiscover: () => void;
         
         // Genre discover actions
         setSelectedGenres: (genres: string[]) => void;
         initGenreDiscover: (genres: string[], seed?: number) => Promise<void>;
         loadNextGenreDiscover: (limit?: number) => Promise<void>;
         resetGenreDiscover: () => void;
  
  addToRecentlyPlayed: (song: Song) => void;
  clearRecentlyPlayed: () => void;
  
  toggleLike: (songId: string) => Promise<void>;
  loadLikedSongs: () => Promise<void>;
  
  setCurrentView: (view: 'search' | 'random' | 'recent' | 'liked') => void;
  
  // Utility
  isLiked: (songId: string) => boolean;
}

export const useSongStore = create<SongState>((set, get) => ({
  // Initial state
  searchQuery: '',
  searchResults: [],
  searchTotal: 0,
  searchHasMore: false,
  isSearching: false,
  searchError: null,
  randomSongs: [],
  isLoadingRandom: false,
  randomError: null,
  popularSongs: [],
  isLoadingPopular: false,
  popularError: null,
  recentlyPlayed: [],
  likedSongs: new Set(),
  isLiking: false,
  currentView: 'random',
  discoverItems: [],
  discoverCursor: 0,
  discoverSeed: 0,
  discoverHasMore: true,
  isLoadingDiscover: false,
  discoverError: null,
  genreDiscoverItems: [],
  genreDiscoverCursor: 0,
  genreDiscoverSeed: 0,
  genreDiscoverHasMore: true,
  isLoadingGenreDiscover: false,
  genreDiscoverError: null,
  selectedGenres: [],

  // Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  searchSongs: async (params: SongSearchParams = {}) => {
    const { searchQuery } = get();
    const searchParams = { ...params, query: searchQuery };
    
    set({ isSearching: true, searchError: null });
    
    try {
      const result = await SongsAPI.search(searchParams);
      set({
        searchResults: result.songs,
        searchTotal: result.total,
        searchHasMore: result.has_more,
        isSearching: false
      });
    } catch (error) {
      set({
        searchError: error instanceof Error ? error.message : 'Search failed',
        isSearching: false
      });
    }
  },

  loadMoreSearchResults: async () => {
    const { searchResults, searchHasMore, isSearching } = get();
    
    if (!searchHasMore || isSearching) return;
    
    set({ isSearching: true });
    
    try {
      const result = await SongsAPI.search({
        query: get().searchQuery,
        offset: searchResults.length
      });
      
      set({
        searchResults: [...searchResults, ...result.songs],
        searchHasMore: result.has_more,
        isSearching: false
      });
    } catch (error) {
      set({
        searchError: error instanceof Error ? error.message : 'Load more failed',
        isSearching: false
      });
    }
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchResults: [],
      searchTotal: 0,
      searchHasMore: false,
      searchError: null
    });
  },

  loadRandomSongs: async (limit = 20) => {
    console.log('🎵 SongStore: Loading random songs, limit:', limit);
    set({ isLoadingRandom: true, randomError: null });
    
    try {
      const songs = await SongsAPI.getRandom({ limit });
      // Ensure songs is always an array
      const songsArray = Array.isArray(songs) ? songs : [];
      console.log('🎵 SongStore: Loaded songs:', songsArray.length, songsArray);
      set({
        randomSongs: songsArray,
        isLoadingRandom: false
      });
    } catch (error) {
      console.error('🎵 SongStore: Error loading random songs:', error);
      set({
        randomError: error instanceof Error ? error.message : 'Load random songs failed',
        isLoadingRandom: false
      });
    }
  },

  loadPopularSongs: async (limit = 20) => {
    set({ isLoadingPopular: true, popularError: null });
    
    try {
      const songs = await SongsAPI.getPopular({ limit });
      // Ensure songs is always an array
      const songsArray = Array.isArray(songs) ? songs : [];
      set({
        popularSongs: songsArray,
        isLoadingPopular: false
      });
    } catch (error) {
      set({
        popularError: error instanceof Error ? error.message : 'Load popular songs failed',
        isLoadingPopular: false
      });
    }
  },

  // Reset discover state
  resetDiscover: () => {
    set({
      discoverItems: [],
      discoverCursor: 0,
      discoverSeed: 0,
      discoverHasMore: true,
      isLoadingDiscover: false,
      discoverError: null
    });
  },

         // Discover feed: initialize with a seed (optional)
         initDiscover: async (seed = Math.floor(Math.random() * 1_000_000), initialBatchSize = getResponsiveBatchSize()) => {
           const { discoverItems, isLoadingDiscover, discoverSeed, discoverHasMore } = get();
           
           // Force reset if hasMore is false (corrupted state)
           if (!discoverHasMore) {
             get().resetDiscover();
           }
           
           // Guard: avoid re-initializing if we already have data or are loading
           if (isLoadingDiscover || (discoverItems && discoverItems.length > 0 && discoverHasMore)) {
             return;
           }
           // Use existing seed if already set to keep pagination deterministic
           const stableSeed = discoverSeed && discoverSeed > 0 ? discoverSeed : seed;
           set({ discoverItems: [], discoverCursor: 0, discoverSeed: stableSeed, discoverHasMore: true, discoverError: null });
           await get().loadNextDiscover(initialBatchSize);
         },

  // Load the next page for discover
  loadNextDiscover: async (limit = getResponsiveBatchSize()) => {
    const { isLoadingDiscover, discoverHasMore, discoverCursor, discoverSeed, discoverItems } = get();
    
    if (isLoadingDiscover || !discoverHasMore) {
      return;
    }
    
    const startTime = performance.now();
    console.log(`🚀 Starting to load next discover batch at cursor ${discoverCursor} (limit: ${limit})`);
    
    set({ isLoadingDiscover: true, discoverError: null });
    try {
      // Track API call time
      const apiStartTime = performance.now();
      const { songs, next_cursor, has_more } = await SongsAPI.getDiscover({ limit, cursor: discoverCursor, seed: discoverSeed });
      const apiEndTime = performance.now();
      const apiDuration = apiEndTime - apiStartTime;
      
      const added = Array.isArray(songs) ? songs : [];
      console.log(`📡 API call completed in ${apiDuration.toFixed(2)}ms - got ${added.length} songs`);
      
      // Track processing time
      const processStartTime = performance.now();
      
      // Use responsive memory management
      const MAX_SONGS = getResponsiveMaxSongs();
      
      // Deduplicate songs by ID to prevent duplicate React keys
      const existingIds = new Set(discoverItems.map(song => song.id));
      const uniqueAdded = added.filter(song => !existingIds.has(song.id));
      
      console.log(`🔍 Deduplication: ${added.length} new songs, ${uniqueAdded.length} unique after dedup`);
      
      const combined = [...discoverItems, ...uniqueAdded];
      
      // Debug logging
      console.log(`📊 Memory management: ${combined.length} total songs, MAX_SONGS: ${MAX_SONGS}`);
      
      // Remove old songs from the beginning to keep memory usage low
      // Only trim if we're significantly over the limit to prevent visual gaps
      const shouldTrim = combined.length > MAX_SONGS * 1.5; // Only trim when 50% over limit
      const trimmed = shouldTrim ? combined.slice(-MAX_SONGS) : combined;
      
      // Final deduplication to ensure no duplicates in trimmed array
      const finalSongs = [];
      const seenIds = new Set();
      for (const song of trimmed) {
        if (!seenIds.has(song.id)) {
          seenIds.add(song.id);
          finalSongs.push(song);
        }
      }
      
      const processEndTime = performance.now();
      const processDuration = processEndTime - processStartTime;
      
      if (trimmed.length < combined.length) {
        console.log(`🗑️ Removed ${combined.length - trimmed.length} old songs, kept ${trimmed.length} recent songs (trimmed because ${combined.length} > ${MAX_SONGS * 1.5})`);
      } else if (combined.length > MAX_SONGS) {
        console.log(`📊 Memory usage: ${combined.length}/${MAX_SONGS} songs (${Math.round((combined.length / MAX_SONGS) * 100)}% of limit) - not trimming yet`);
      }
      
      if (finalSongs.length < trimmed.length) {
        console.log(`🔄 Removed ${trimmed.length - finalSongs.length} duplicate songs, final count: ${finalSongs.length}`);
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`⚡ Total processing time: ${processDuration.toFixed(2)}ms (API: ${apiDuration.toFixed(2)}ms, Processing: ${processDuration.toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms)`);
      
      set({
        discoverItems: finalSongs,
        discoverCursor: next_cursor,
        discoverHasMore: has_more,
        isLoadingDiscover: false
      });
    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ Error loading next discover batch after ${totalTime.toFixed(2)}ms:`, error);
      set({
        discoverError: error instanceof Error ? error.message : 'Discover load failed',
        isLoadingDiscover: false
      });
    }
  },

  // Genre discover actions
  setSelectedGenres: (genres: string[]) => {
    set({ selectedGenres: genres });
  },

  resetGenreDiscover: () => {
    set({
      genreDiscoverItems: [],
      genreDiscoverCursor: 0,
      genreDiscoverSeed: 0,
      genreDiscoverHasMore: true,
      isLoadingGenreDiscover: false,
      genreDiscoverError: null
    });
  },

  initGenreDiscover: async (genres: string[], seed = Math.floor(Math.random() * 1_000_000), initialBatchSize = getResponsiveBatchSize()) => {
    const { genreDiscoverItems, isLoadingGenreDiscover, genreDiscoverSeed, genreDiscoverHasMore } = get();
    
    // Force reset if hasMore is false (corrupted state)
    if (!genreDiscoverHasMore) {
      get().resetGenreDiscover();
    }
    
    // Guard: avoid re-initializing if we already have data or are loading
    if (isLoadingGenreDiscover || (genreDiscoverItems && genreDiscoverItems.length > 0 && genreDiscoverHasMore)) {
      return;
    }
    
    // Use existing seed if already set to keep pagination deterministic
    const stableSeed = genreDiscoverSeed && genreDiscoverSeed > 0 ? genreDiscoverSeed : seed;
    set({ 
      genreDiscoverItems: [], 
      genreDiscoverCursor: 0, 
      genreDiscoverSeed: stableSeed, 
      genreDiscoverHasMore: true, 
      genreDiscoverError: null 
    });
    await get().loadNextGenreDiscover(initialBatchSize);
  },

  loadNextGenreDiscover: async (limit = getResponsiveBatchSize()) => {
    const { isLoadingGenreDiscover, genreDiscoverHasMore, genreDiscoverCursor, genreDiscoverSeed, genreDiscoverItems, selectedGenres } = get();
    
    if (isLoadingGenreDiscover || !genreDiscoverHasMore || selectedGenres.length === 0) {
      return;
    }
    
    const startTime = performance.now();
    console.log(`🎵 Starting to load next genre discover batch at cursor ${genreDiscoverCursor} (limit: ${limit}, genres: ${selectedGenres.join(', ')})`);
    
    set({ isLoadingGenreDiscover: true, genreDiscoverError: null });
    try {
      // Track API call time
      const apiStartTime = performance.now();
      const { songs, next_cursor, has_more } = await SongsAPI.getDiscoverByGenres({ 
        genres: selectedGenres, 
        limit, 
        cursor: genreDiscoverCursor, 
        seed: genreDiscoverSeed 
      });
      const apiEndTime = performance.now();
      const apiDuration = apiEndTime - apiStartTime;
      
      const added = Array.isArray(songs) ? songs : [];
      console.log(`📡 Genre API call completed in ${apiDuration.toFixed(2)}ms - got ${added.length} songs`);
      
      // Track processing time
      const processStartTime = performance.now();
      
      // Memory management: keep only recent songs to prevent memory issues
      const calculateMaxSongs = () => {
        if (typeof window === 'undefined') return 180;
        const containerWidth = window.innerWidth;
        const cardWidth = 200;
        const cardsPerRow = Math.floor(containerWidth / cardWidth);
        const visibleRows = Math.ceil(window.innerHeight / 300);
        const cardsPerScreen = cardsPerRow * visibleRows;
        const baseMax = Math.max(cardsPerScreen * 6, 50);
        const rowsToKeep = Math.ceil(baseMax / cardsPerRow);
        return rowsToKeep * cardsPerRow;
      };
      
      const MAX_SONGS = calculateMaxSongs();
      
      // Deduplicate songs by ID to prevent duplicate React keys
      const existingIds = new Set(genreDiscoverItems.map(song => song.id));
      const uniqueAdded = added.filter(song => !existingIds.has(song.id));
      
      console.log(`🔍 Genre deduplication: ${added.length} new songs, ${uniqueAdded.length} unique after dedup`);
      
      const combined = [...genreDiscoverItems, ...uniqueAdded];
      
      // Only trim if we're significantly over the limit to prevent visual gaps
      const shouldTrim = combined.length > MAX_SONGS * 1.5; // Only trim when 50% over limit
      const trimmed = shouldTrim ? combined.slice(-MAX_SONGS) : combined;
      
      // Final deduplication to ensure no duplicates in trimmed array
      const finalSongs = [];
      const seenIds = new Set();
      for (const song of trimmed) {
        if (!seenIds.has(song.id)) {
          seenIds.add(song.id);
          finalSongs.push(song);
        }
      }
      
      const processEndTime = performance.now();
      const processDuration = processEndTime - processStartTime;
      
      if (trimmed.length < combined.length) {
        console.log(`🗑️ Genre: Removed ${combined.length - trimmed.length} old songs, kept ${trimmed.length} recent songs (trimmed because ${combined.length} > ${MAX_SONGS * 1.5})`);
      } else if (combined.length > MAX_SONGS) {
        console.log(`📊 Genre memory usage: ${combined.length}/${MAX_SONGS} songs (${Math.round((combined.length / MAX_SONGS) * 100)}% of limit) - not trimming yet`);
      }
      
      if (finalSongs.length < trimmed.length) {
        console.log(`🔄 Genre: Removed ${trimmed.length - finalSongs.length} duplicate songs, final count: ${finalSongs.length}`);
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`⚡ Genre total processing time: ${processDuration.toFixed(2)}ms (API: ${apiDuration.toFixed(2)}ms, Processing: ${processDuration.toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms)`);
      
      set({
        genreDiscoverItems: finalSongs,
        genreDiscoverCursor: next_cursor,
        genreDiscoverHasMore: has_more,
        isLoadingGenreDiscover: false
      });
    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ Error loading next genre discover batch after ${totalTime.toFixed(2)}ms:`, error);
      set({
        genreDiscoverError: error instanceof Error ? error.message : 'Genre discover load failed',
        isLoadingGenreDiscover: false
      });
    }
  },

  addToRecentlyPlayed: (song: Song) => {
    const { recentlyPlayed } = get();
    const filtered = recentlyPlayed.filter(s => s.id !== song.id);
    const updated = [song, ...filtered].slice(0, 50); // Keep last 50 songs
    set({ recentlyPlayed: updated });
  },

  clearRecentlyPlayed: () => {
    set({ recentlyPlayed: [] });
  },

  toggleLike: async (songId: string) => {
    const { isLiking, likedSongs } = get();
    
    if (isLiking) return;
    
    set({ isLiking: true });
    
    try {
      // Check current like status
      const isCurrentlyLiked = likedSongs.has(songId);
      
      let result: boolean;
      if (isCurrentlyLiked) {
        result = await SongsAPI.unlikeSong(songId);
      } else {
        result = await SongsAPI.likeSong(songId);
      }
      
      const newLikedSongs = new Set(likedSongs);
      if (isCurrentlyLiked) {
        // We just unliked the song, so remove it
        newLikedSongs.delete(songId);
      } else {
        // We just liked the song, so add it
        newLikedSongs.add(songId);
      }
      
      set({
        likedSongs: newLikedSongs,
        isLiking: false
      });
    } catch (error) {
      set({
        isLiking: false
      });
      console.error('Toggle like failed:', error);
    }
  },

  loadLikedSongs: async () => {
    try {
      const likedSongs = await SongsAPI.getLikedSongs();
      // Ensure likedSongs is always an array
      const songsArray = Array.isArray(likedSongs) ? likedSongs : [];
      const likedSongIds = new Set(songsArray.map(song => song.id));
      set({ likedSongs: likedSongIds });
    } catch (error) {
      console.error('Load liked songs failed:', error);
      set({ likedSongs: new Set() });
    }
  },

  setCurrentView: (view: 'search' | 'random' | 'recent' | 'liked') => {
    set({ currentView: view });
  },

  isLiked: (songId: string) => {
    return get().likedSongs.has(songId);
  },

  // Performance debugging
  getPerformanceStats: () => {
    const { discoverItems, genreDiscoverItems } = get();
    return {
      discoverItems: discoverItems.length,
      genreDiscoverItems: genreDiscoverItems.length,
      totalSongs: discoverItems.length + genreDiscoverItems.length,
      memoryUsage: {
        discover: `${discoverItems.length} songs`,
        genre: `${genreDiscoverItems.length} songs`,
        total: `${discoverItems.length + genreDiscoverItems.length} songs`
      }
    };
  }
}));
