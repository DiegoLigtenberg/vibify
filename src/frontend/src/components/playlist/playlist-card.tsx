'use client';

import React from 'react';
import { Play, MoreHorizontal } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';
import type { Playlist } from '@/shared/types/playlist';

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay?: (playlist: Playlist) => void;
  onMore?: (playlist: Playlist) => void;
  className?: string;
}

export function PlaylistCard({ 
  playlist, 
  onPlay,
  onMore,
  className 
}: PlaylistCardProps) {
  const handlePlay = () => {
    if (onPlay) {
      onPlay(playlist);
    }
  };

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMore) {
      onMore(playlist);
    }
  };

  return (
    <div className={cn('song-card p-4', className)}>
      {/* Thumbnail */}
      <div className="relative mb-3">
        <div className="w-full bg-spotify-gray rounded-md overflow-hidden">
          {playlist.thumbnail_url ? (
            <img
              src={playlist.thumbnail_url}
              alt={playlist.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
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

      {/* Playlist Info */}
      <div className="space-y-1">
        <h3 className="text-white text-sm font-medium truncate">
          {playlist.name}
        </h3>
        
        <p className="text-spotify-muted text-xs truncate">
          {playlist.description || 'No description'}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-spotify-muted text-xs">
            {playlist.song_count} songs
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
