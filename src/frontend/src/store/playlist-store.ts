import { create } from 'zustand';
import { PlaylistsAPI } from '../lib/api';
import type { Playlist, PlaylistWithSongs, CreatePlaylistRequest, UpdatePlaylistRequest } from '@/shared/types/playlist';

interface PlaylistState {
  // User playlists
  userPlaylists: Playlist[];
  isLoadingUserPlaylists: boolean;
  userPlaylistsError: string | null;
  
  // Public playlists
  publicPlaylists: Playlist[];
  isLoadingPublicPlaylists: boolean;
  publicPlaylistsError: string | null;
  
  // Current playlist
  currentPlaylist: PlaylistWithSongs | null;
  isLoadingCurrentPlaylist: boolean;
  currentPlaylistError: string | null;
  
  // Playlist operations
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  operationError: string | null;
  
  // Actions
  loadUserPlaylists: (userId: string) => Promise<void>;
  loadPublicPlaylists: () => Promise<void>;
  loadPlaylist: (id: string) => Promise<void>;
  createPlaylist: (userId: string, data: CreatePlaylistRequest) => Promise<Playlist | null>;
  updatePlaylist: (id: string, data: UpdatePlaylistRequest) => Promise<Playlist | null>;
  deletePlaylist: (id: string) => Promise<boolean>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  
  // Utility
  clearErrors: () => void;
  clearCurrentPlaylist: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  // Initial state
  userPlaylists: [],
  isLoadingUserPlaylists: false,
  userPlaylistsError: null,
  publicPlaylists: [],
  isLoadingPublicPlaylists: false,
  publicPlaylistsError: null,
  currentPlaylist: null,
  isLoadingCurrentPlaylist: false,
  currentPlaylistError: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  operationError: null,

  // Actions
  loadUserPlaylists: async (userId: string) => {
    set({ isLoadingUserPlaylists: true, userPlaylistsError: null });
    
    try {
      const playlists = await PlaylistsAPI.getByUser(userId);
      set({
        userPlaylists: playlists,
        isLoadingUserPlaylists: false
      });
    } catch (error) {
      set({
        userPlaylistsError: error instanceof Error ? error.message : 'Load user playlists failed',
        isLoadingUserPlaylists: false
      });
    }
  },

  loadPublicPlaylists: async () => {
    set({ isLoadingPublicPlaylists: true, publicPlaylistsError: null });
    
    try {
      const playlists = await PlaylistsAPI.getPublic();
      set({
        publicPlaylists: playlists,
        isLoadingPublicPlaylists: false
      });
    } catch (error) {
      set({
        publicPlaylistsError: error instanceof Error ? error.message : 'Load public playlists failed',
        isLoadingPublicPlaylists: false
      });
    }
  },

  loadPlaylist: async (id: string) => {
    set({ isLoadingCurrentPlaylist: true, currentPlaylistError: null });
    
    try {
      const playlist = await PlaylistsAPI.getById(id);
      set({
        currentPlaylist: playlist,
        isLoadingCurrentPlaylist: false
      });
    } catch (error) {
      set({
        currentPlaylistError: error instanceof Error ? error.message : 'Load playlist failed',
        isLoadingCurrentPlaylist: false
      });
    }
  },

  createPlaylist: async (userId: string, data: CreatePlaylistRequest) => {
    set({ isCreating: true, operationError: null });
    
    try {
      const playlist = await PlaylistsAPI.create(userId, data);
      
      // Add to user playlists
      const { userPlaylists } = get();
      set({
        userPlaylists: [playlist, ...userPlaylists],
        isCreating: false
      });
      
      return playlist;
    } catch (error) {
      set({
        operationError: error instanceof Error ? error.message : 'Create playlist failed',
        isCreating: false
      });
      return null;
    }
  },

  updatePlaylist: async (id: string, data: UpdatePlaylistRequest) => {
    set({ isUpdating: true, operationError: null });
    
    try {
      const playlist = await PlaylistsAPI.update(id, data);
      
      // Update in user playlists
      const { userPlaylists } = get();
      const updatedUserPlaylists = userPlaylists.map(p => 
        p.id === id ? playlist : p
      );
      
      // Update current playlist if it's the same
      const { currentPlaylist } = get();
      const updatedCurrentPlaylist = currentPlaylist?.id === id 
        ? { ...currentPlaylist, ...playlist }
        : currentPlaylist;
      
      set({
        userPlaylists: updatedUserPlaylists,
        currentPlaylist: updatedCurrentPlaylist,
        isUpdating: false
      });
      
      return playlist;
    } catch (error) {
      set({
        operationError: error instanceof Error ? error.message : 'Update playlist failed',
        isUpdating: false
      });
      return null;
    }
  },

  deletePlaylist: async (id: string) => {
    set({ isDeleting: true, operationError: null });
    
    try {
      await PlaylistsAPI.delete(id);
      
      // Remove from user playlists
      const { userPlaylists } = get();
      const updatedUserPlaylists = userPlaylists.filter(p => p.id !== id);
      
      // Clear current playlist if it's the same
      const { currentPlaylist } = get();
      const updatedCurrentPlaylist = currentPlaylist?.id === id 
        ? null 
        : currentPlaylist;
      
      set({
        userPlaylists: updatedUserPlaylists,
        currentPlaylist: updatedCurrentPlaylist,
        isDeleting: false
      });
      
      return true;
    } catch (error) {
      set({
        operationError: error instanceof Error ? error.message : 'Delete playlist failed',
        isDeleting: false
      });
      return false;
    }
  },

  addSongToPlaylist: async (playlistId: string, songId: string) => {
    try {
      await PlaylistsAPI.addSong(playlistId, { song_id: songId });
      
      // Reload current playlist if it's the same
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        get().loadPlaylist(playlistId);
      }
      
      return true;
    } catch (error) {
      console.error('Add song to playlist failed:', error);
      return false;
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    try {
      await PlaylistsAPI.removeSong(playlistId, songId);
      
      // Reload current playlist if it's the same
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        get().loadPlaylist(playlistId);
      }
      
      return true;
    } catch (error) {
      console.error('Remove song from playlist failed:', error);
      return false;
    }
  },

  clearErrors: () => {
    set({
      userPlaylistsError: null,
      publicPlaylistsError: null,
      currentPlaylistError: null,
      operationError: null
    });
  },

  clearCurrentPlaylist: () => {
    set({
      currentPlaylist: null,
      currentPlaylistError: null
    });
  }
}));
