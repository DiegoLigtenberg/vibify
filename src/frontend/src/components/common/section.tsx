'use client';

import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SectionProps {
  title: string;
  subtitle?: string;
  showAll?: boolean;
  onShowAll?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  children: React.ReactNode;
  className?: string;
  arrowColorClass?: string;
}

export function Section({
  title,
  subtitle,
  showAll = false,
  onShowAll,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = true,
  children,
  className = '',
  arrowColorClass = 'text-white'
}: SectionProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-bold hover:underline cursor-pointer">
              {title}
            </h2>
            {subtitle && (
              <p className="text-spotify-muted text-sm mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Navigation arrows */}
          {(onPrevious || onNext) && (
            <div className="flex items-center space-x-2">
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  className={`p-2 rounded-full bg-spotify-lightgray hover:bg-spotify-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${arrowColorClass}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className={`p-2 rounded-full bg-spotify-lightgray hover:bg-spotify-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${arrowColorClass}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Show all button */}
        {showAll && onShowAll && (
          <Button 
            variant="ghost" 
            className="text-spotify-muted hover:text-white text-sm"
            onClick={onShowAll}
          >
            Show all
          </Button>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
