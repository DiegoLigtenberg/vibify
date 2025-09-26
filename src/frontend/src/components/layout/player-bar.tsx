'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle,
  Volume2,
  VolumeX,
  Heart
} from 'lucide-react';
import { usePlayerStore } from '../../store/player-store';
import { useSongStore } from '../../store/song-store';
import { Button } from '../ui/button';
import { cn, formatDuration } from '../../lib/utils';
import SongDetailsPopup from '../song/song-details-popup';
import { SongsAPI } from '../../lib/api';
import type { Song } from '@/shared/types/song';

export function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    currentTime,
    duration,
    repeatMode,
    shuffleMode,
    togglePlay,
    next,
    previous,
    setVolume,
    toggleMute,
    seek,
    beginSeek,
    endSeek,
    setRepeatMode,
    toggleShuffle
  } = usePlayerStore();

  const { toggleLike, isLiked } = useSongStore();
  
  // State for song details popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [detailedSong, setDetailedSong] = useState<Song | null>(null);

  if (!currentSong) {
    return (
      <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center">
        <p className="text-spotify-muted text-sm">No song selected</p>
      </div>
    );
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const handleSeekMouseDown = () => beginSeek();

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const newTime = parseFloat((e.target as HTMLInputElement).value);
    endSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleLike = async () => {
    await toggleLike(currentSong.id);
  };

  const handleSongClick = async () => {
    try {
      const songDetails = await SongsAPI.getSongDetails(currentSong.id);
      setDetailedSong(songDetails);
      setIsPopupOpen(true);
    } catch (error) {
      console.error('Error fetching song details:', error);
      setDetailedSong(currentSong); // Fallback to basic song data
      setIsPopupOpen(true); // Show popup even if details fetch fails
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setDetailedSong(null);
  };

  const handleRepeatToggle = () => {
    const modes = ['none', 'one', 'all'] as const;
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

    return (
      <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center px-4">
      {/* Song Info - Clickable */}
      <div className="flex items-center space-x-4 w-1/4">
        <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={handleSongClick}>
          <div className="w-14 bg-spotify-gray rounded-md flex-shrink-0">
            {currentSong.thumbnail_url && (
              <img
                src={currentSong.thumbnail_url}
                alt={currentSong.title}
                className="w-full h-auto rounded-md"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white text-sm font-medium truncate hover:underline">
              {currentSong.title}
            </h4>
            <p className="text-spotify-muted text-xs truncate hover:underline">
              {currentSong.artist}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className={cn(
            'text-spotify-muted hover:text-spotify-green transition-colors',
            isLiked(currentSong.id) && 'text-spotify-green'
          )}
        >
          <Heart className={cn(
            'h-4 w-4',
            isLiked(currentSong.id) && 'fill-current'
          )} />
        </button>
      </div>

      {/* Player Controls */}
      <div className="flex-1 flex flex-col items-center space-y-2">
        {/* Control Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              'text-spotify-muted hover:text-white transition-colors',
              shuffleMode && 'text-spotify-green'
            )}
          >
            <Shuffle className="h-4 w-4" />
          </button>
          
          <button
            onClick={previous}
            className="text-spotify-muted hover:text-white transition-colors"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <Button
            onClick={togglePlay}
            disabled={isLoading}
            size="icon"
            variant="spotify"
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <button
            onClick={next}
            className="text-spotify-muted hover:text-white transition-colors"
          >
            <SkipForward className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleRepeatToggle}
            className={cn(
              'text-spotify-muted hover:text-white transition-colors',
              repeatMode !== 'none' && 'text-spotify-green'
            )}
            title={
              repeatMode === 'none' ? 'Repeat off' :
              repeatMode === 'one' ? 'Repeat one' : 'Repeat all'
            }
          >
            {repeatMode === 'one' ? (
              <Repeat className="h-4 w-4" style={{ transform: 'scaleX(-1)' }} />
            ) : (
              <Repeat className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-2 w-full max-w-md">
          <span className="text-spotify-muted text-xs w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            className="flex-1 h-1 bg-spotify-gray rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-spotify-muted text-xs w-10">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume and Options */}
      <div className="flex items-center space-x-4 w-1/4 justify-end">
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="text-spotify-muted hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-spotify-gray rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Song Details Popup */}
      <SongDetailsPopup
        song={detailedSong || currentSong}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onPlay={() => {}} // No play action needed since song is already playing
      />
    </div>
  );
}
