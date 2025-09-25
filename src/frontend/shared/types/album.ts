export interface Album {
  id: string;
  name: string;
  artist: string;
  release_date?: string;
  description?: string;
  thumbnail_url?: string;
  song_count: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithSongs extends Album {
  songs: Array<{
    id: string;
    title: string;
    duration: number;
    storage_url: string;
    position: number;
  }>;
}

export interface AlbumSearchParams {
  query?: string;
  artist?: string;
  year?: number;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'artist' | 'release_date' | 'song_count';
  sort_order?: 'asc' | 'desc';
}

export interface AlbumSearchResult {
  albums: Album[];
  total: number;
  has_more: boolean;
}

export interface AlbumStats {
  total_albums: number;
  total_duration: number;
  most_productive_artist: string;
  average_songs_per_album: number;
}
