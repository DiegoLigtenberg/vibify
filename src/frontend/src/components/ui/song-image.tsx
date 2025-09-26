'use client';

import React, { useState } from 'react';
import { Music } from 'lucide-react';

interface SongImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function SongImage({ 
  src, 
  alt, 
  className = "w-full h-auto",
  fallbackIcon
}: SongImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`${className} bg-gray-800 flex items-center justify-center`}>
        {fallbackIcon || <Music className="h-6 w-6 text-gray-500" />}
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-800 animate-pulse`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0 absolute inset-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}
