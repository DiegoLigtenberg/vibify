'use client';

import { useParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { PlaylistsAPI } from '../../../../lib/api';
import { SongCard } from '../../../../components/song/song-card';
import { Button } from '../../../../components/ui/button';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '../../../../store/player-store';
import type { PlaylistWithSongs } from '@/shared/types/playlist';

export default function PlaylistPage() {
  const params = useParams();
  const playlistId = params.id as string;
  const [playlist, setPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setCurrentSong, setQueue } = usePlayerStore();

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setLoading(true);
        const playlistData = await PlaylistsAPI.getById(playlistId);
        setPlaylist(playlistData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      loadPlaylist();
    }
  }, [playlistId]);

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      const songs = playlist.songs.map(playlistSong => ({
        id: playlistSong.song.id,
        title: playlistSong.song.title,
        artist: playlistSong.song.artist,
        album: playlistSong.song.album,
        duration: playlistSong.song.duration,
        storage_url: playlistSong.song.storage_url,
        thumbnail_url: playlistSong.song.thumbnail_url,
        view_count: 0,
        like_count: 0,
        streams: 0,
        is_public: true,
        created_at: '',
        updated_at: ''
      }));
      
      setQueue(songs);
      setCurrentSong(songs[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-spotify-muted">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-2">
          {error || 'Playlist not found'}
        </div>
        <p className="text-spotify-muted">
          The playlist you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Playlist Header */}
      <div className="flex items-end space-x-6">
        <div className="w-48 h-48 bg-spotify-gray rounded-md flex-shrink-0">
          {playlist.thumbnail_url ? (
            <img
              src={playlist.thumbnail_url}
              alt={playlist.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-spotify-muted text-4xl">♪</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold text-white mb-2">
            {playlist.name}
          </h1>
          <p className="text-spotify-muted text-lg mb-4">
            {playlist.description || 'No description'}
          </p>
          <p className="text-spotify-muted text-sm">
            {playlist.song_count} songs
          </p>
        </div>
      </div>

      {/* Playlist Actions */}
      <div className="flex items-center space-x-4">
        <Button onClick={handlePlayAll} variant="spotify" size="lg">
          <Play className="h-5 w-5 mr-2" />
          Play
        </Button>
        
        <Button variant="spotifySecondary">
          <Heart className="h-4 w-4 mr-2" />
          Save
        </Button>
        
        <Button variant="spotifySecondary">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Songs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Songs</h2>
        
        <div className="space-y-2">
          {playlist.songs.map((playlistSong, index) => (
            <div
              key={playlistSong.id}
              className="flex items-center space-x-4 p-3 hover:bg-spotify-lightgray rounded-lg group"
            >
              <span className="text-spotify-muted text-sm w-6 text-center">
                {index + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate">
                  {playlistSong.song.title}
                </h4>
                <p className="text-spotify-muted text-xs truncate">
                  {playlistSong.song.artist}
                </p>
              </div>
              
              <span className="text-spotify-muted text-xs">
                {Math.floor(playlistSong.song.duration / 60)}:{(playlistSong.song.duration % 60).toString().padStart(2, '0')}
              </span>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-spotify-muted hover:text-white">
                  <Heart className="h-4 w-4" />
                </button>
                <button className="text-spotify-muted hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
