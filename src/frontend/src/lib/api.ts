import type { Song, SongSearchParams, SongSearchResult, RandomSongParams } from '@/shared/types/song';
import type { Playlist, PlaylistWithSongs, CreatePlaylistRequest, UpdatePlaylistRequest, AddSongToPlaylistRequest } from '@/shared/types/playlist';
import type { Album, AlbumWithSongs, AlbumSearchParams, AlbumSearchResult } from '@/shared/types/album';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api';
import { APP_CONFIG } from './config';

// Utility function to sanitize search queries for PostgreSQL full-text search
function sanitizeSearchQuery(query: string): string {
  if (!query || query.trim().length === 0) {
    return '';
  }
  
  // Make spaces work like commas for user-friendly search
  // Convert "let it go" to "let,it,go" for better PostgreSQL full-text search
  let sanitized = query
    .replace(/'/g, "''") // Escape single quotes for SQL safety
    .replace(/[()]/g, ' ') // Remove parentheses which cause syntax errors
    .replace(/\s+/g, ',') // Convert spaces to commas for better search
    .replace(/,+/g, ',') // Collapse multiple commas
    .replace(/^,|,$/g, '') // Remove leading/trailing commas
    .trim();
  
  return sanitized;
}

// Songs API
export class SongsAPI {
  static async search(params: SongSearchParams = {}): Promise<SongSearchResult> {
    const { query, limit = 20, offset = 0, sort_by = 'created_at', sort_order = 'desc' } = params;
    
    try {
      const searchParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort_by,
        sort_order
      });
      
      if (query) {
        searchParams.append('query', query);
      }
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error searching songs:', error);
      return {
        songs: [],
        total: 0,
        has_more: false
      };
    }
  }

  static async getRandom(params: RandomSongParams = {}): Promise<Song[]> {
    const { limit = 10, exclude_ids = [] } = params;
    
    try {
      const searchParams = new URLSearchParams({
        limit: limit.toString()
      });
      
      if (exclude_ids.length > 0) {
        searchParams.append('exclude_ids', exclude_ids.join(','));
      }
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/random?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Random songs failed: ${response.statusText}`);
      }
      
      const songs = await response.json();
      return songs || [];
    } catch (error) {
      console.error('Error fetching random songs:', error);
      return [];
    }
  }


  static async getPopular(params: { limit?: number } = {}): Promise<Song[]> {
    const { limit = 10 } = params;
    
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/popular?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Popular songs failed: ${response.statusText}`);
      }
      
      const songs = await response.json();
      return songs || [];
    } catch (error) {
      console.error('Error fetching popular songs:', error);
      return [];
    }
  }

  static async getDiscover(params: { limit?: number; cursor?: number; seed?: number } = {}): Promise<{ songs: Song[]; next_cursor: number; has_more: boolean; seed: number; total: number }> {
    const { limit = 20, cursor = 0, seed = 0 } = params;
    const url = `${APP_CONFIG.api.baseUrl}/api/songs/discover?limit=${limit}&cursor=${cursor}&seed=${seed}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Discover fetch failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  }

  static async getDiscoverByGenres(params: { genres: string[]; limit?: number; cursor?: number; seed?: number }): Promise<{ songs: Song[]; next_cursor: number; has_more: boolean; seed: number; total: number }> {
    const { genres, limit = 20, cursor = 0, seed = 0 } = params;
    const genresParam = genres.join(',');
    const url = `${APP_CONFIG.api.baseUrl}/api/songs/discover/genre?genres=${encodeURIComponent(genresParam)}&limit=${limit}&cursor=${cursor}&seed=${seed}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Genre discover fetch failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  }


  static async getById(id: string): Promise<Song | null> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Get song failed: ${response.statusText}`);
      }
      
      const song = await response.json();
      return song;
    } catch (error) {
      console.error('Error fetching song:', error);
      return null;
    }
  }

  static async getByAlbum(album: string): Promise<Song[]> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/album/${encodeURIComponent(album)}`);
      
      if (!response.ok) {
        throw new Error(`Get album songs failed: ${response.statusText}`);
      }
      
      const songs = await response.json();
      return songs || [];
    } catch (error) {
      console.error('Error fetching album songs:', error);
      return [];
    }
  }

  static async getByArtist(artist: string): Promise<Song[]> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/artist/${encodeURIComponent(artist)}`);
      
      if (!response.ok) {
        throw new Error(`Get artist songs failed: ${response.statusText}`);
      }
      
      const songs = await response.json();
      return songs || [];
    } catch (error) {
      console.error('Error fetching artist songs:', error);
      return [];
    }
  }

  static async incrementViewCount(id: string): Promise<void> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Increment view count failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  static async getSongDetails(songId: string): Promise<Song | null> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${songId}/details`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Song details failed: ${response.statusText}`);
      }
      
      const song = await response.json();
      return song;
    } catch (error) {
      console.error('Error fetching song details:', error);
      return null;
    }
  }

  static async likeSong(songId: string): Promise<boolean> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${songId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Like song failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.liked;
    } catch (error) {
      console.error('Error liking song:', error);
      return false;
    }
  }

  static async unlikeSong(songId: string): Promise<boolean> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${songId}/like`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Unlike song failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.liked;
    } catch (error) {
      console.error('Error unliking song:', error);
      return false;
    }
  }

  static async getLikeStatus(songId: string): Promise<boolean> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${songId}/like-status`);

      if (!response.ok) {
        throw new Error(`Get like status failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.liked;
    } catch (error) {
      console.error('Error getting like status:', error);
      return false;
    }
  }

  static async getLikedSongs(): Promise<Song[]> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/liked`);

      if (!response.ok) {
        throw new Error(`Get liked songs failed: ${response.statusText}`);
      }

      const songs = await response.json();
      return songs;
    } catch (error) {
      console.error('Error getting liked songs:', error);
      return [];
    }
  }

  static async toggleLike(id: string, userId: string): Promise<{ liked: boolean }> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error(`Toggle like failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { liked: result.liked };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { liked: false };
    }
  }

  static async recordStream(id: string, userId?: string, listenDuration?: number): Promise<void> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/${id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userId,
          listen_duration: listenDuration 
        })
      });

      if (!response.ok) {
        throw new Error(`Record stream failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error recording stream:', error);
    }
  }

  static async searchSongs(query: string, limit: number = 10): Promise<Song[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const searchParams = new URLSearchParams({
        query,
        limit: limit.toString()
      });
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.songs || [];
    } catch (error) {
      console.error('Error searching songs:', error);
      return [];
    }
  }

  // Test function
  static testFunction() {
    console.log('SongsAPI test function called');
    return 'test';
  }

  // Genres API methods
  static async getGenres(params: { limit?: number; min_songs?: number } = {}): Promise<Array<{name: string; song_count: number}>> {
    try {
      const { limit = 50, min_songs = 1 } = params;
      
      const searchParams = new URLSearchParams({
        limit: limit.toString(),
        min_songs: min_songs.toString()
      });
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/songs/genres?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Get genres failed: ${response.statusText}`);
      }
      
      const genres = await response.json();
      return genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  static async getSongsByGenre(genre: string, params: { limit?: number; offset?: number; sort_by?: string } = {}): Promise<Song[]> {
    try {
      const { limit = 20, offset = 0, sort_by = 'streams' } = params;
      const url = `${APP_CONFIG.api.baseUrl}/api/songs/genres/${encodeURIComponent(genre)}/songs?limit=${limit}&offset=${offset}&sort_by=${sort_by}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Genre songs fetch failed: ${res.statusText}`);
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Error fetching songs for genre ${genre}:`, error);
      return [];
    }
  }

}

// Playlists API
export class PlaylistsAPI {
  static async getByUser(userId: string): Promise<Playlist[]> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Get user playlists failed: ${response.statusText}`);
      }
      
      const playlists = await response.json();
      return playlists || [];
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      return [];
    }
  }

  static async getPublic(): Promise<Playlist[]> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/public`);
      
      if (!response.ok) {
        throw new Error(`Get public playlists failed: ${response.statusText}`);
      }
      
      const playlists = await response.json();
      return playlists || [];
    } catch (error) {
      console.error('Error fetching public playlists:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<PlaylistWithSongs | null> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Get playlist failed: ${response.statusText}`);
      }
      
      const playlist = await response.json();
      return playlist;
    } catch (error) {
      console.error('Error fetching playlist:', error);
      return null;
    }
  }

  static async create(userId: string, data: CreatePlaylistRequest): Promise<Playlist> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, user_id: userId })
      });
      
      if (!response.ok) {
        throw new Error(`Create playlist failed: ${response.statusText}`);
      }
      
      const playlist = await response.json();
      return playlist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  }

  static async update(id: string, data: UpdatePlaylistRequest): Promise<Playlist> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Update playlist failed: ${response.statusText}`);
      }
      
      const playlist = await response.json();
      return playlist;
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Delete playlist failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  }

  static async addSong(playlistId: string, data: AddSongToPlaylistRequest): Promise<void> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Add song to playlist failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      throw error;
    }
  }

  static async removeSong(playlistId: string, songId: string): Promise<void> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Remove song from playlist failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      throw error;
    }
  }
}

// Albums API
export class AlbumsAPI {
  static async getAll(): Promise<Album[]> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/albums`);
      
      if (!response.ok) {
        throw new Error(`Get albums failed: ${response.statusText}`);
      }
      
      const albums = await response.json();
      return albums || [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<AlbumWithSongs | null> {
    try {
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/albums/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Get album failed: ${response.statusText}`);
      }
      
      const album = await response.json();
      return album;
    } catch (error) {
      console.error('Error fetching album:', error);
      return null;
    }
  }

}
