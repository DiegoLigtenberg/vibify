'use client';

import React from 'react';
import { Play, Heart } from 'lucide-react';
import { usePlayerStore } from '../../store/player-store';
import { useSongStore } from '../../store/song-store';
import { cn, formatDuration } from '../../lib/utils';
import { SongImage } from '../ui/song-image';
import { Song } from '@/shared/types/song';

interface SongCardProps {
  song: Song;
  showAlbum?: boolean;
  showArtist?: boolean;
  compact?: boolean;
  onPlay?: (song: Song) => void;
  onLike?: (song: Song) => void;
  className?: string;
}

export function SongCard({ 
  song, 
  showAlbum = true, 
  showArtist = true,
  compact = false,
  onPlay,
  onLike,
  className 
}: SongCardProps) {
  const setCurrentSong = usePlayerStore(s => s.setCurrentSong);
  const addToQueue = usePlayerStore(s => s.addToQueue);
  const { toggleLike, isLiked } = useSongStore();

  const handlePlay = () => {
    if (onPlay) {
      onPlay(song);
    } else {
      setCurrentSong(song);
      addToQueue(song);
      // Immediate autoplay handled by player-store Howler.autoplay
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(song);
    } else {
      await toggleLike(song.id);
    }
  };



  return (
    <div 
      className={cn(
        'song-card group cursor-pointer hover:bg-gray-800/50 transition-colors',
        'bg-spotify-gray rounded-lg hover:bg-spotify-lightgray',
        'aspect-square flex flex-col justify-between',
        'touch-manipulation', // Better touch handling
        compact ? 'p-2' : 'p-3',
        className
      )}
      onClick={handlePlay}
    >
      {/* Thumbnail */}
      <div className="relative mb-3">
        <div className={cn('w-full h-48 bg-spotify-gray rounded-md overflow-hidden')}>
          <SongImage
            src={song.thumbnail_url}
            alt={song.title}
            className="w-full h-48 object-cover"
            fallbackIcon={<span className="text-spotify-muted text-2xl">♪</span>}
          />
        </div>
        
        {/* Play Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
          className="play-button"
        >
          <Play className="h-3 w-3 text-white" />
        </button>
      </div>

      {/* Song Info */}
      <div className="space-y-0.5">
        <div className={cn('text-left text-white font-medium', compact ? 'text-[10px]' : 'text-sm')} style={{ wordBreak: 'break-word', lineHeight: '1.1' }}>
          {song.title}
        </div>
        
        {showArtist && (
          <p className={cn('text-spotify-muted truncate', compact ? 'text-[11px]' : 'text-xs')}>
            {song.artist}
          </p>
        )}
        
        {showAlbum && (
          <p className={cn('text-spotify-muted truncate', compact ? 'text-[11px]' : 'text-xs')}>
            {song.album}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className={cn('text-spotify-muted', compact ? 'text-[11px]' : 'text-xs')}>
            {formatDuration(song.duration)}
          </span>
          
          <button
            onClick={handleLike}
            className={cn(
              'text-spotify-muted hover:text-spotify-green transition-colors',
              isLiked(song.id) && 'text-spotify-green'
            )}
          >
            <Heart className={cn(
              compact ? 'h-4 w-4' : 'h-4 w-4',
              isLiked(song.id) && 'fill-current'
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}
