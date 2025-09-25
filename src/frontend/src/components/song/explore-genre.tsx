'use client';

import React, { useState, useEffect } from 'react';
import { Section } from '../common/section';
import { Music, TrendingUp, Star, Zap } from 'lucide-react';
import { UnifiedGrid, UnifiedTile } from '../common/unified-tile';
import { SongsAPI } from '../../lib/api';
import { useRouter } from 'next/navigation';

interface Genre {
  name: string;
  song_count: number;
}

const genreColors = [
  'from-pink-500 to-rose-500',
  'from-red-500 to-orange-500', 
  'from-blue-500 to-indigo-500',
  'from-yellow-500 to-orange-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-teal-500',
  'from-gray-500 to-gray-700',
  'from-indigo-500 to-purple-500',
  'from-teal-500 to-cyan-500',
  'from-orange-500 to-red-500'
];

const genreIcons = [Music, TrendingUp, Star, Zap, Music, Music, Music, Music, Music, Music];

export function ExploreGenre() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setIsLoading(true);
        const genreData = await SongsAPI.getGenres({ limit: 20, min_songs: 1 });
        
        // Sort alphabetically and take first 6 for consistent display
        const sorted = genreData.sort((a, b) => a.name.localeCompare(b.name));
        setGenres(sorted.slice(0, 6));
      } catch (error) {
        console.error('Error loading genres:', error);
        setGenres([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGenres();
  }, []);

  const handleGenreClick = (genre: Genre) => {
    console.log('Exploring genre:', genre.name);
    router.push(`/genre?selected=${encodeURIComponent(genre.name)}`);
  };

  if (isLoading) {
    return (
      <Section
        title="Explore by Genre"
        subtitle="Find your perfect sound"
        showAll={true}
        onShowAll={() => router.push('/genre')}
      >
        <UnifiedGrid>
          {Array.from({ length: 6 }).map((_, index) => (
            <UnifiedTile key={index}>
              <div className="aspect-square bg-gray-700 rounded mb-2 flex items-center justify-center animate-pulse">
                <Music className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <div className="h-3 bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-2 bg-gray-700 rounded animate-pulse w-3/4"></div>
              </div>
            </UnifiedTile>
          ))}
        </UnifiedGrid>
      </Section>
    );
  }

  return (
    <Section
      title="Explore by Genre"
      subtitle="Find your perfect sound"
      showAll={true}
      onShowAll={() => router.push('/genre')}
    >
      <UnifiedGrid>
        {genres.map((genre, index) => {
          const colorIndex = index % genreColors.length;
          const iconIndex = index % genreIcons.length;
          const IconComponent = genreIcons[iconIndex];
          
          return (
            <UnifiedTile
              key={genre.name}
              onClick={() => handleGenreClick(genre)}
            >
              <div className={`aspect-square bg-gradient-to-br ${genreColors[colorIndex]} rounded mb-2 flex items-center justify-center`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-xs group-hover:underline">
                  {genre.name}
                </h3>
                <p className="text-[10px] text-spotify-muted mt-1">
                  {genre.song_count} songs
                </p>
              </div>
            </UnifiedTile>
          );
        })}
      </UnifiedGrid>
    </Section>
  );
}
