'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface UnifiedTileProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function UnifiedTile({ children, className, onClick }: UnifiedTileProps) {
  return (
    <div 
      className={cn(
        'bg-spotify-gray rounded-lg p-3 hover:bg-spotify-lightgray transition-colors cursor-pointer group',
        'aspect-[5/4] flex flex-col justify-between', // More rectangular, less tall
        'touch-manipulation', // Better touch handling
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface UnifiedGridProps {
  children: React.ReactNode;
  className?: string;
}

export function UnifiedGrid({ children, className }: UnifiedGridProps) {
  return (
    <div className={cn(
      'grid gap-2 sm:gap-3',
      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
      'px-2 sm:px-0', // Add horizontal padding on mobile
      className
    )}>
      {children}
    </div>
  );
}
