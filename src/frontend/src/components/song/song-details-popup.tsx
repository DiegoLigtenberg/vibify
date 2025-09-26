"use client";

import React, { useState } from 'react';
import { X, Play, Heart, MoreHorizontal, Download } from 'lucide-react';
import { Song } from '@/shared/types/song';
import { useSongStore } from '@/store/song-store';
import { SongImage } from '../ui/song-image';

interface SongDetailsPopupProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (song: Song) => void;
}

export default function SongDetailsPopup({ 
  song, 
  isOpen, 
  onClose, 
  onPlay 
}: SongDetailsPopupProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { toggleLike, isLiked, isLiking } = useSongStore();
  
  
  if (!isOpen || !song) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup - More vertically rectangular */}
      <div className="relative rounded-lg shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden" style={{backgroundColor: '#1f1f1f'}}>
        {/* Header */}
        <div className="flex items-start p-6 border-b border-gray-700" style={{backgroundColor: '#0a0a0a'}}>
          {/* Thumbnail */}
          <div className="w-16 rounded-lg overflow-hidden mr-4 flex-shrink-0">
            <SongImage 
              src={song.thumbnail_url} 
              alt={song.title}
              className="w-full h-auto"
            />
          </div>
          
          {/* Title and Artist */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
              {song.title}
            </h2>
            <p className="text-gray-300 text-base mb-1 font-medium">
              {song.artist}
            </p>
            {song.album && (
              <p className="text-gray-400 text-sm">
                {song.album}
              </p>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]" style={{backgroundColor: '#1f1f1f'}}>
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatNumber(song.streams || 0)}
              </div>
              <div className="text-sm text-gray-400">Plays</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatNumber(song.like_count || 0)}
              </div>
              <div className="text-sm text-gray-400">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatDuration(song.duration)}
              </div>
              <div className="text-sm text-gray-400">Duration</div>
            </div>
          </div>
          
          {/* Stripe Separator - only if there are genres */}
          {song.genres && song.genres.length > 0 && (
            <div className="w-full h-px bg-gray-600 mb-6"></div>
          )}

          {/* Genres */}
          {song.genres && song.genres.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {song.genres.map((genre: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-800 text-white text-sm rounded-full hover:bg-gray-700 transition-colors"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Stripe Separator - always show before description */}
          <div className="w-full h-px bg-gray-600 mb-6"></div>

          {/* Description */}
          {song.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {showFullDescription ? song.description : song.description.substring(0, 200)}
                {song.description.length > 200 && !showFullDescription && '...'}
              </p>
              {song.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-spotify-green hover:text-green-400 text-sm font-medium mt-2 transition-colors"
                >
                  {showFullDescription ? 'View Less' : 'View More'}
                </button>
              )}
            </div>
          )}

          {/* Release Date */}
          {song.release_date && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Release Date</h3>
              <p className="text-gray-300 text-sm">
                {new Date(song.release_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions - Like and Download buttons */}
        <div className="flex items-center justify-center space-x-4 p-6 border-t border-gray-700" style={{backgroundColor: '#0a0a0a'}}>
          <button 
            onClick={() => song && toggleLike(song.id)}
            disabled={isLiking}
            className={`transition-colors p-2 ${
              song && isLiked(song.id) 
                ? 'text-spotify-green' 
                : 'text-gray-400 hover:text-spotify-green'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title="Like song"
          >
            <Heart size={20} fill={song && isLiked(song.id) ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            onClick={() => {
              if (!song?.id) {
                console.error('No song ID available for download');
                return;
              }
              
              // Use backend download endpoint for native download
              const downloadUrl = `http://localhost:8000/api/songs/${song.id}/download`;
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${song.artist} - ${song.title}.mp3`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="text-gray-400 hover:text-white transition-colors p-2 cursor-pointer"
            title="Download song"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
