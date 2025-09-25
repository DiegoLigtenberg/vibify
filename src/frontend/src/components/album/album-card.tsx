'use client';

import React from 'react';
import { Play, MoreHorizontal } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';
import type { Album } from '@/shared/types/album';

interface AlbumCardProps {
  album: Album;
  onPlay?: (album: Album) => void;
  onMore?: (album: Album) => void;
  className?: string;
}

export function AlbumCard({ 
  album, 
  onPlay,
  onMore,
  className 
}: AlbumCardProps) {
  const handlePlay = () => {
    if (onPlay) {
      onPlay(album);
    }
  };

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMore) {
      onMore(album);
    }
  };

  return (
    <div className={cn('song-card p-4', className)}>
      {/* Thumbnail */}
      <div className="relative mb-3">
        <div className="w-full aspect-square bg-spotify-gray rounded-md overflow-hidden">
          {album.thumbnail_url ? (
            <img
              src={album.thumbnail_url}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-spotify-muted text-2xl">♪</span>
            </div>
          )}
        </div>
        
        {/* Play Button */}
        <button
          onClick={handlePlay}
          className="play-button"
        >
          <Play className="h-4 w-4 text-black" />
        </button>
      </div>

      {/* Album Info */}
      <div className="space-y-1">
        <h3 className="text-white text-sm font-medium truncate">
          {album.name}
        </h3>
        
        <p className="text-spotify-muted text-xs truncate">
          {album.artist}
        </p>
        
        {album.release_date && (
          <p className="text-spotify-muted text-xs">
            {new Date(album.release_date).getFullYear()}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-spotify-muted text-xs">
            {album.song_count} songs
          </span>
          
          <button
            onClick={handleMore}
            className="text-spotify-muted hover:text-white transition-colors"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
