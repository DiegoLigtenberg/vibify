export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  release_date?: string;
  view_count: number;
  like_count: number;
  streams: number;
  description?: string;
  youtube_url?: string;
  youtube_id?: string;
  storage_url: string;
  thumbnail_url: string;
  search_vector?: string;
  uploaded_by?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  genres?: string[];
}

export interface SongWithGenres extends Song {
  genres: string[];
}

export interface SongSearchParams {
  query?: string;
  artist?: string;
  album?: string;
  genres?: string[];
  limit?: number;
  offset?: number;
  sort_by?: 'title' | 'artist' | 'album' | 'created_at' | 'view_count' | 'like_count' | 'streams';
  sort_order?: 'asc' | 'desc';
}

export interface SongSearchResult {
  songs: Song[];
  total: number;
  has_more: boolean;
}

export interface RandomSongParams {
  limit?: number;
  exclude_ids?: string[];
  genres?: string[];
}

export interface SongStats {
  total_songs: number;
  total_duration: number;
  total_artists: number;
  total_albums: number;
  most_popular_artist: string;
  most_popular_album: string;
}
