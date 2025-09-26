'use client';

import { useParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AlbumsAPI } from '../../../../lib/api';
import { SongCard } from '../../../../components/song/song-card';
import { Button } from '../../../../components/ui/button';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '../../../../store/player-store';
import type { AlbumWithSongs } from '@/shared/types/album';

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.id as string;
  const [album, setAlbum] = useState<AlbumWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setCurrentSong, setQueue } = usePlayerStore();

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        setLoading(true);
        const albumData = await AlbumsAPI.getById(albumId);
        setAlbum(albumData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    if (albumId) {
      loadAlbum();
    }
  }, [albumId]);

  const handlePlayAll = () => {
    if (album && album.songs.length > 0) {
      const songs = album.songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: album.artist,
        album: album.name,
        duration: song.duration,
        storage_url: song.storage_url,
        thumbnail_url: album.thumbnail_url || '',
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
        <div className="text-spotify-muted">Loading album...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-2">
          {error || 'Album not found'}
        </div>
        <p className="text-spotify-muted">
          The album you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Album Header */}
      <div className="flex items-end space-x-6">
        <div className="w-48 bg-spotify-gray rounded-md flex-shrink-0">
          {album.thumbnail_url ? (
            <img
              src={album.thumbnail_url}
              alt={album.name}
              className="w-full h-auto rounded-md"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <span className="text-spotify-muted text-4xl">♪</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold text-white mb-2">
            {album.name}
          </h1>
          <p className="text-spotify-muted text-lg mb-4">
            {album.artist}
          </p>
          <p className="text-spotify-muted text-sm">
            {album.song_count} songs • {album.release_date ? new Date(album.release_date).getFullYear() : 'Unknown year'}
          </p>
        </div>
      </div>

      {/* Album Actions */}
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
          {album.songs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center space-x-4 p-3 hover:bg-spotify-lightgray rounded-lg group"
            >
              <span className="text-spotify-muted text-sm w-6 text-center">
                {index + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate">
                  {song.title}
                </h4>
                <p className="text-spotify-muted text-xs truncate">
                  {album.artist}
                </p>
              </div>
              
              <span className="text-spotify-muted text-xs">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
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
