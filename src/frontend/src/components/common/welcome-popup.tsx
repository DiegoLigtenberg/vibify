'use client';

import { useState, useEffect } from 'react';
import { Music, X } from 'lucide-react';

interface WelcomePopupProps {
  username: string;
  onClose: () => void;
}

export function WelcomePopup({ username, onClose }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    onClose(); // Clear the new account flag
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6">
              <div className="relative inline-block">
                <Music 
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-green-500 mb-4 animate-bounce" 
                />
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                  <div className="w-full h-full border-2 border-green-500/30 rounded-full animate-ping"></div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-500 mb-2">
                Welcome to Vibify!
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">
                Hello {username}, welcome to your music world
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm sm:text-base">Discover amazing music</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm sm:text-base">Explore genres</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm sm:text-base">Create playlists</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleClose}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
            >
              <Music className="w-5 h-5" />
              Let's Start Listening
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
