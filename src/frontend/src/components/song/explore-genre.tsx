'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Section } from '../common/section';
import { Music, TrendingUp, Star, Zap } from 'lucide-react';
import { UnifiedGrid, UnifiedTile } from '../common/unified-tile';
import { useRouter } from 'next/navigation';
import { TOP_GENRES, Genre } from '../../lib/constants/genres';

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
  const [displayedGenres, setDisplayedGenres] = useState<Genre[]>([]);
  const [columns, setColumns] = useState(6);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Always show 6 random genres on home page (1 row)
  const computeColumns = () => {
    if (typeof window === 'undefined') return;
    
    // Always use 6 columns for home page
    setColumns(6);
    
    // Randomly select 6 genres from top 30 using Fisher-Yates shuffle
    const shuffled = [...TOP_GENRES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selectedGenres = shuffled.slice(0, 6);
    setDisplayedGenres(selectedGenres);
  };

  useEffect(() => {
    // Force random selection on every mount/remount
    computeColumns();
    
    const handleResize = () => computeColumns();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array ensures this runs on every mount

  // Additional effect to ensure randomization on every page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shuffled = [...TOP_GENRES];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selectedGenres = shuffled.slice(0, 6);
      setDisplayedGenres(selectedGenres);
    }
  }, []); // This will run on every mount

  const handleGenreClick = (genre: Genre) => {
    // Store selected genre in sessionStorage for clean navigation
    sessionStorage.setItem('selectedGenre', genre.name);
    router.push('/genre');
  };

  // No loading state needed since we're using hardcoded data

  return (
    <Section
      title="Explore by Genre"
      subtitle="Find your perfect sound"
      showAll={true}
      onShowAll={() => router.push('/genre')}
    >
      <UnifiedGrid>
        {displayedGenres.map((genre, index) => {
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
                  {genre.songCount.toLocaleString()} songs
                </p>
              </div>
            </UnifiedTile>
          );
        })}
      </UnifiedGrid>
    </Section>
  );
}
