'use client';

import React, { useEffect } from 'react';
import { useSongStore } from '../../store/song-store';
import { usePlayerStore } from '../../store/player-store';
import { Button } from '../ui/button';
import { RefreshCw, Play, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { APP_CONFIG } from '../../lib/settings';
import { formatDuration } from '../../lib/utils';

export function RandomFeed() {
  const {
    randomSongs,
    isLoadingRandom,
    randomError,
    loadRandomSongs
  } = useSongStore();

  const { setCurrentSong, setQueue } = usePlayerStore();

  useEffect(() => {
    if (randomSongs.length === 0) {
      loadRandomSongs(APP_CONFIG.pagination.defaultPageSize);
    }
  }, [randomSongs.length, loadRandomSongs]);

  const handleRefresh = () => {
    loadRandomSongs(APP_CONFIG.pagination.defaultPageSize);
  };

  const handlePlay = (song: any, index: number) => {
    console.log('Playing:', song.title);
    // Set the current song and queue
    setQueue(randomSongs, index);
    setCurrentSong(song);
  };

  const handleLike = (song: any) => {
    console.log('Liking:', song.title);
    // TODO: Implement like functionality
  };

  if (isLoadingRandom) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  if (randomError) {
    return (
      <div className="text-center py-8">
        <p className="text-spotify-muted mb-4">Failed to load songs</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Made for You</h2>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="text-spotify-muted hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Song List Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-spotify-muted text-sm border-b border-spotify-lightgray">
        <div className="col-span-1">#</div>
        <div className="col-span-5">TITLE</div>
        <div className="col-span-4">ALBUM</div>
        <div className="col-span-1">DATE ADDED</div>
        <div className="col-span-1 flex justify-end">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* Song List */}
      <div className="space-y-1">
        {randomSongs.map((song, index) => (
          <div
            key={song.id}
            className="grid grid-cols-12 gap-4 px-4 py-2 rounded hover:bg-spotify-lightgray group cursor-pointer"
            onClick={() => handlePlay(song, index)}
          >
            {/* Track Number / Play Button */}
            <div className="col-span-1 flex items-center justify-center">
              <div className="group-hover:hidden text-spotify-muted text-sm">
                {index + 1}
              </div>
              <button 
                className="hidden group-hover:block text-white hover:text-spotify-green transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(song, index);
                }}
              >
                <Play className="w-4 h-4" />
              </button>
            </div>

            {/* Song Info */}
            <div className="col-span-5 flex items-center space-x-3">
              <div className="w-10 bg-spotify-lightgray rounded flex-shrink-0">
                {song.thumbnail_url ? (
                  <img
                    src={song.thumbnail_url}
                    alt={song.title}
                    className="w-full h-auto rounded"
                  />
                ) : (
                  <div className="w-full h-10 flex items-center justify-center">
                    <span className="text-spotify-muted text-xs">♪</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-white font-medium truncate group-hover:underline">
                  {song.title}
                </div>
                <div className="text-spotify-muted text-sm truncate">
                  {song.artist}
                </div>
              </div>
            </div>

            {/* Album */}
            <div className="col-span-4 flex items-center">
              <div className="text-spotify-muted text-sm truncate">
                {song.album || 'Unknown Album'}
              </div>
            </div>

            {/* Date Added (use deterministic UTC to avoid hydration mismatch) */}
            <div className="col-span-1 flex items-center">
              <div className="text-spotify-muted text-sm">
                {(() => {
                  try {
                    const d = new Date(song.created_at);
                    // Render as YYYY-MM-DD in UTC so server/client match
                    const year = d.getUTCFullYear();
                    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(d.getUTCDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  } catch {
                    return '';
                  }
                })()}
              </div>
            </div>

            {/* Duration & Actions */}
            <div className="col-span-1 flex items-center justify-end space-x-2">
              <div className="text-spotify-muted text-sm">
                {formatDuration(song.duration)}
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-spotify-muted hover:text-white transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(song);
                }}
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                className="opacity-0 group-hover:opacity-100 text-spotify-muted hover:text-white transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('More options for:', song.title);
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}