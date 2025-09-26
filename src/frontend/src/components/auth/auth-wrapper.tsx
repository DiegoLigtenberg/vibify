'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { Music, LogIn, UserPlus } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, login, register } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Auto-login for development mode
  useEffect(() => {
    const autoLogin = async () => {
      if (!isLoading && !isAuthenticated) {
        // Check if we're in development mode (localhost)
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname === '0.0.0.0';
        
        if (isDevelopment) {
          try {
            // Auto-login as test_user in development
            const result = await login('test_user');
            if (result.success) {
              console.log('Auto-logged in as test_user in development mode');
              return; // Don't show auth overlay
            }
          } catch (error) {
            console.log('Auto-login failed, showing auth overlay:', error);
          }
        }
        
        // Show auth overlay if not in development or auto-login failed
        setShowAuth(true);
      } else if (isAuthenticated) {
        setShowAuth(false);
      }
    };

    autoLogin();
  }, [isAuthenticated, isLoading, login]);

  // Animate auth form on mount
  useEffect(() => {
    if (showAuth) {
      const timer = setTimeout(() => {
        setShowAuth(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showAuth]);

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const result = await response.json();
      return result.success; // If login succeeds, username exists
    } catch {
      // If backend is not available, allow test_user as fallback
      return username === 'test_user';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    const trimmedUsername = username.trim();
    
    try {
      // First check if username exists
      setIsCheckingUsername(true);
      const usernameExists = await checkUsernameExists(trimmedUsername);
      setIsCheckingUsername(false);
      
      // Try login if exists, register if not
      const result = usernameExists 
        ? await login(trimmedUsername)
        : await register(trimmedUsername);
      
      if (result.success) {
        setShowAuth(false);
      } else {
        // Fallback for test_user when backend is not available
        if (trimmedUsername === 'test_user') {
          // Use the real test_user ID from database for fallback
          const fallbackUser = {
            id: '11cf4fbf-ff3f-47f9-849a-39f9fc08295b', // Real test_user ID
            username: 'test_user',
            created_at: new Date().toISOString()
          };
          
          // Manually set the auth state for fallback
          const { setUser, setIsAuthenticated } = useAuthStore.getState();
          setUser(fallbackUser);
          setIsAuthenticated(true);
          setShowAuth(false);
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (err) {
      // Fallback for test_user when backend is not available
      if (trimmedUsername === 'test_user') {
        // Use the real test_user ID from database for fallback
        const fallbackUser = {
          id: '11cf4fbf-ff3f-47f9-849a-39f9fc08295b', // Real test_user ID
          username: 'test_user',
          created_at: new Date().toISOString()
        };
        
        // Manually set the auth state for fallback
        const { setUser, setIsAuthenticated } = useAuthStore.getState();
        setUser(fallbackUser);
        setIsAuthenticated(true);
        setShowAuth(false);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setIsCheckingUsername(false);
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      

      {/* Auth Overlay */}
      {showAuth && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Animated Logo */}
            <div className="text-center mb-8">
              <div className={`transition-all duration-1000 transform ${
                showAuth ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}>
                <div className="relative">
                  <Music 
                    className="w-20 h-20 mx-auto text-white mb-4 animate-pulse" 
                    style={{ animationDuration: '2s' }}
                  />
                  <div className="absolute inset-0 w-20 h-20 mx-auto">
                    <div className="w-full h-full border-2 border-white/30 rounded-full animate-ping"></div>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-green-400 mb-2">
                  Vibify
                </h1>
                <p className="text-gray-300 text-lg">Welcome to your music world</p>
              </div>
            </div>

            {/* Auth Form */}
            <div className={`transition-all duration-700 transform ${
              showAuth ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome to Vibify
                  </h2>
                  <p className="text-gray-300">
                    Enter your username to get started or continue
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username (max 10 chars)"
                        maxLength={10}
                        className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {username.length}/10 characters
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!username.trim() || isSubmitting || username.length > 10 || isCheckingUsername}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting || isCheckingUsername ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isCheckingUsername ? 'Checking...' : 'Signing in...'}
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        Continue
                      </>
                    )}
                  </button>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
