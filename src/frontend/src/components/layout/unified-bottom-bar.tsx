'use client';

import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../../lib/config';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  Download
} from 'lucide-react';
import { usePlayerStore } from '../../store/player-store';
import { useSongStore } from '../../store/song-store';
import { Button } from '../ui/button';
import { cn, formatDuration } from '../../lib/utils';
import { SongImage } from '../ui/song-image';
import SongDetailsPopup from '../song/song-details-popup';
import { SongsAPI } from '../../lib/api';
import type { Song } from '@/shared/types/song';

export function UnifiedBottomBar() {
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
    toggleShuffle,
    setCurrentTime
  } = usePlayerStore();
  
  const { toggleLike, isLiked, isLiking } = useSongStore();
  
  // State for song details popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [detailedSong, setDetailedSong] = useState<Song | null>(null);

  // Keyboard event listeners for media controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger media controls when user is typing in input fields
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Prevent default behavior for media keys
      if (event.code === 'MediaPlayPause') {
        event.preventDefault();
        togglePlay();
      } else if (event.code === 'MediaTrackNext') {
        event.preventDefault();
        next();
      } else if (event.code === 'MediaTrackPrevious') {
        event.preventDefault();
        previous();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, next, previous]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update the visual position, don't seek yet
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekMouseDown = () => beginSeek();

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const newTime = parseFloat((e.target as HTMLInputElement).value);
    endSeek(newTime);
  };

  const handleSeekTouchEnd = (e: React.TouchEvent<HTMLInputElement>) => {
    const newTime = parseFloat((e.target as HTMLInputElement).value);
    endSeek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleLike = async () => {
    if (currentSong) {
      await toggleLike(currentSong.id);
    }
  };

  const handleSongClick = async () => {
    if (!currentSong) return;
    
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

  const handleDownload = () => {
    if (!currentSong?.id) {
      console.error('No song ID available for download');
      return;
    }
    
    // Use backend download endpoint for native download
    const downloadUrl = `${APP_CONFIG.api.baseUrl}/api/songs/${currentSong.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${currentSong.artist} - ${currentSong.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-16 md:h-20 unified-bottom-bar flex items-center relative">
      <div className="flex items-center w-full px-2 md:px-6">
        {/* Left Section: Song Info */}
        <div className="w-48 md:w-64 flex items-center space-x-2 md:space-x-3">
          {currentSong && (
            <>
              <div className="w-10 md:w-12 rounded-md overflow-hidden flex-shrink-0">
                <SongImage 
                  src={currentSong.thumbnail_url} 
                  alt={currentSong.title}
                  className="w-full h-auto"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <p className="text-white text-xs md:text-sm font-semibold cursor-pointer hover:underline flex-1 truncate" onClick={handleSongClick}>
                    {currentSong.title}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(currentSong.id);
                    }}
                    disabled={isLiking}
                    className={`transition-colors p-1 ${
                      isLiked(currentSong.id) 
                        ? 'text-spotify-green' 
                        : 'text-gray-400 hover:text-spotify-green'
                    } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Heart size={14} fill={isLiked(currentSong.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
              </div>
            </>
          )}
        </div>

        {/* Center Section: Player Controls */}
        <div className="flex-1 flex flex-col items-center space-y-1 md:space-y-2">
          {currentSong ? (
            <>
              {/* Player Controls Row */}
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Shuffle - Hidden on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShuffle}
                  className={cn(
                    'hidden md:flex p-1 h-8 w-8 text-gray-400 hover:text-white',
                    shuffleMode && 'text-spotify-green'
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>

                {/* Previous */}
                <Button variant="ghost" size="sm" onClick={previous} className="p-1 h-6 w-6 md:h-8 md:w-8 text-gray-400 hover:text-white">
                  <SkipBack className="h-3 w-3 md:h-4 md:w-4" />
                </Button>

                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="p-1.5 md:p-2 h-8 w-8 md:h-10 md:w-10 bg-white text-black hover:bg-gray-200 rounded-full"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
                  )}
                </Button>

                {/* Next */}
                <Button variant="ghost" size="sm" onClick={next} className="p-1 h-6 w-6 md:h-8 md:w-8 text-gray-400 hover:text-white">
                  <SkipForward className="h-3 w-3 md:h-4 md:w-4" />
                </Button>

                {/* Repeat - Hidden on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepeatToggle}
                  className={cn(
                    'hidden md:flex p-1 h-8 w-8 text-gray-400 hover:text-white relative',
                    repeatMode !== 'none' && 'text-spotify-green'
                  )}
                >
                  {repeatMode === 'one' ? (
                    <div className="relative">
                      <Repeat className="h-4 w-4" style={{ transform: 'scaleX(-1)' }} />
                      <span className="absolute -top-1 -right-1 text-xs font-bold">1</span>
                    </div>
                  ) : repeatMode === 'all' ? (
                    <div className="relative">
                      <Repeat className="h-4 w-4" />
                      <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-current rounded-full"></div>
                    </div>
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Progress Bar - Hidden on mobile */}
              <div className="hidden md:flex items-center space-x-2 w-full max-w-md">
                <span className="text-xs text-gray-400 w-10 text-right">
                  {formatDuration(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  onMouseDown={handleSeekMouseDown}
                  onMouseUp={handleSeekMouseUp}
                  onTouchEnd={handleSeekTouchEnd}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-400 w-10">
                  {formatDuration(duration)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm">No song selected</p>
            </div>
          )}
        </div>

        {/* Right Section: Volume Controls */}
        <div className="flex w-32 md:w-64 items-center justify-end space-x-1 md:space-x-2 px-2 md:px-6">
          {currentSong ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="p-1 h-6 w-6 md:h-8 md:w-8 text-gray-400 hover:text-white"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3 w-3 md:h-4 md:w-4" />
                ) : (
                  <Volume2 className="h-3 w-3 md:h-4 md:w-4" />
                )}
              </Button>
              <div className="relative w-12 md:w-20 h-1">
                <div className="absolute inset-0 bg-gray-600 rounded-lg"></div>
                <div 
                  className="absolute inset-y-0 left-0 bg-spotify-green rounded-lg transition-all duration-150"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer slider"
                />
              </div>
              
              {/* Download Button - Hidden on mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="hidden md:flex p-2 h-8 w-8 text-gray-400 hover:text-white transition-colors"
                title="Download song"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Song Details Popup */}
      <SongDetailsPopup 
        song={detailedSong || currentSong} 
        isOpen={isPopupOpen} 
        onClose={handleClosePopup} 
        onPlay={() => {}} 
      />
    </div>
  );
}
