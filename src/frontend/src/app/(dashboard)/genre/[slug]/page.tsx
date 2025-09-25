'use client';

import React, { useState, useEffect } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useParams } from 'next/navigation';
import { SongCard } from '../../../../components/song/song-card';
import { UnifiedGrid } from '../../../../components/common/unified-tile';
import { Song } from '@/shared/types/song';
import { usePlayerStore } from '../../../../store/player-store';
import { useSongStore } from '../../../../store/song-store';
import { SongsAPI } from '../../../../lib/api';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function GenreDetailPage() {
  const params = useParams();
  const genreName = decodeURIComponent(params.slug as string);
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentSong, setQueue } = usePlayerStore();
  const { toggleLike } = useSongStore();

  useEffect(() => {
    const loadGenreSongs = async () => {
      try {
        setIsLoading(true);
        const songData = await SongsAPI.getSongsByGenre(genreName, { limit: 50 });
        setSongs(songData);
      } catch (err) {
        console.error('Error loading genre songs:', err);
        setError('Failed to load songs for this genre');
      } finally {
        setIsLoading(false);
      }
    };

    if (genreName) {
      loadGenreSongs();
    }
  }, [genreName]);

  const handlePlay = (song: Song, index: number) => {
    setQueue(songs, index);
    setCurrentSong(song);
  };

  const handleLike = async (song: Song) => {
    await toggleLike(song.id);
  };

  if (isLoading) {
    return (
      <div className="flex-1 text-white vibify-gradient">
        <div className="p-4">
          <div className="flex items-center mb-6">
            <Link 
              href="/genre" 
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{genreName}</h1>
              <p className="text-gray-400">Loading songs...</p>
            </div>
          </div>
          <UnifiedGrid>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="aspect-[5/4] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </UnifiedGrid>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 text-white vibify-gradient">
        <div className="p-4">
          <div className="flex items-center mb-6">
            <Link 
              href="/genre" 
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold">{genreName}</h1>
          </div>
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-spotify-green text-white px-4 py-2 rounded-full hover:bg-spotify-green/80"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white vibify-gradient">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Link 
            href="/genre" 
            className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{genreName}</h1>
            <p className="text-gray-400">{songs.length} songs</p>
          </div>
        </div>
        
        {songs.length > 0 ? (
          <UnifiedGrid>
            {songs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                compact
                onPlay={(song) => handlePlay(song, index)}
                onLike={handleLike}
                className="hover:scale-105 transition-transform"
              />
            ))}
          </UnifiedGrid>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No songs found in this genre</p>
            <Link 
              href="/genre"
              className="text-spotify-green hover:underline mt-2 inline-block"
            >
              Browse other genres
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
