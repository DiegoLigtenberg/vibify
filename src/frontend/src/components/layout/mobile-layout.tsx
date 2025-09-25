'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { UnifiedBottomBar } from './unified-bottom-bar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header - spans full width above content */}
      <Header 
        onMenuToggle={handleMenuToggle}
        isMenuOpen={isMobileMenuOpen}
      />
      
      {/* Middle section: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isMobileMenuOpen}
          onClose={handleMenuClose}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 vibify-gradient overflow-y-auto">
            <div className="pb-20 md:pb-10">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Unified Bottom Bar - part of flex layout */}
      <UnifiedBottomBar />
    </div>
  );
}
