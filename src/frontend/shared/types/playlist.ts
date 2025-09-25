export interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  song_count: number;
  total_duration: number;
  thumbnail_url?: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
  song: {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    storage_url: string;
    thumbnail_url: string;
  };
}

export interface PlaylistWithSongs extends Playlist {
  songs: PlaylistSong[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface AddSongToPlaylistRequest {
  song_id: string;
  position?: number;
}

export interface RemoveSongFromPlaylistRequest {
  song_id: string;
}

export interface ReorderPlaylistSongsRequest {
  song_positions: Array<{
    song_id: string;
    position: number;
  }>;
}

export interface PlaylistSearchParams {
  query?: string;
  user_id?: string;
  is_public?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'created_at' | 'song_count';
  sort_order?: 'asc' | 'desc';
}

export interface PlaylistSearchResult {
  playlists: Playlist[];
  total: number;
  has_more: boolean;
}
