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
      
      // For mobile, ensure autoplay works by triggering user interaction
      if (typeof window !== 'undefined' && 'ontouchstart' in window) {
        // Mobile device - ensure autoplay works
        const audio = new Audio();
        audio.volume = 0;
        audio.play().then(() => {
          audio.pause();
          audio.remove();
        }).catch(() => {
          // Ignore errors, this is just to enable autoplay
        });
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onLike) {
      onLike(song);
    } else {
      try {
        await toggleLike(song.id);
      } catch (error) {
        console.error('Toggle like failed:', error);
      }
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
      <div className="relative mb-0.5">
        <div className={cn('w-full h-40 bg-spotify-gray rounded-md overflow-hidden')}>
          <SongImage
            src={song.thumbnail_url}
            alt={song.title}
            className="w-full h-40 object-cover"
            fallbackIcon={<span className="text-spotify-muted text-2xl">♪</span>}
          />
        </div>
        
        {/* Play Button - Centered */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-60 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <div className="bg-spotify-green rounded-full p-2 hover:scale-110 transition-transform">
            <Play className="h-4 w-4 text-white ml-0.5" />
          </div>
        </button>
      </div>

      {/* Song Info */}
      <div className="space-y-0">
        <div className={cn('text-left text-white font-medium', compact ? 'text-[10px]' : 'text-sm')} style={{ wordBreak: 'break-word', lineHeight: '1.3' }}>
          {song.title}
        </div>
        
        {showArtist && (
          <p className={cn('text-spotify-muted truncate', compact ? 'text-[11px]' : 'text-xs')} style={{ lineHeight: '1.2' }}>
            {song.artist}
          </p>
        )}
        
        {showAlbum && (
          <p className={cn('text-spotify-muted truncate', compact ? 'text-[11px]' : 'text-xs')} style={{ lineHeight: '1.2' }}>
            {song.album}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className={cn('text-spotify-muted', compact ? 'text-[11px]' : 'text-xs')}>
            {formatDuration(song.duration)}
          </span>
          
          <button
            onClick={handleLike}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={cn(
              'text-spotify-muted hover:text-spotify-green transition-colors relative z-10 p-1 rounded-full hover:bg-gray-700/50',
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
