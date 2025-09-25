'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Heart, 
  Music,
  Play,
  Clock,
  Upload,
  Compass,
  TrendingUp,
  Grid3X3,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

const sidebarItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/genre', label: 'Genre', icon: Grid3X3 },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
];

const playlistItems = [
  { href: '/playlist/liked', label: 'Liked Songs', icon: Heart },
  { href: '/playlist/recent', label: 'Recently Played', icon: Clock },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 md:z-auto
        w-64 bg-black h-full flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-spotify-green transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="px-4 md:px-6 py-2 md:py-4">
          <ul className="sidebar-list">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose} // Close mobile menu on navigation
                    className={cn(
                      'sidebar-item',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Playlists Section */}
        <div className="sidebar-section flex-1">
          <div className="sidebar-header">
            <h3 className="sidebar-title">Playlists</h3>
            <button className="sidebar-action">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <ul className="sidebar-list">
            {playlistItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose} // Close mobile menu on navigation
                    className={cn(
                      'sidebar-item',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Creator Section - moved below playlists */}
          <div className="sidebar-header mt-6">
            <h3 className="sidebar-title">Create</h3>
          </div>
          
          <ul className="sidebar-list">
            <li>
              <Link 
                href="/upload" 
                onClick={onClose} // Close mobile menu on navigation
                className="sidebar-item"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Music</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
