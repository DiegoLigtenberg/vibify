/**
 * Frontend Configuration System
 * Environment-based configuration for development vs production
 */

// Get environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEVELOPMENT = NODE_ENV === 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
console.log( "NODE_ENV", NODE_ENV )
console.log( "IS_DEVELOPMENT", IS_DEVELOPMENT )
console.log( "IS_PRODUCTION", IS_PRODUCTION )

// Environment-specific configuration
const ENV_CONFIG = {
  development: {
    // API Configuration
    API_BASE_URL: 'http://127.0.0.1:8000',
    API_URL: 'http://127.0.0.1:8000',
    WS_URL: 'ws://127.0.0.1:8000',
    
    // Debug settings
    DEBUG: true,
    LOG_LEVEL: 'debug',
    
    // Development-specific features
    ENABLE_DEV_TOOLS: true,
    ENABLE_MOCK_DATA: false, // Set to true if you want to use mock data
  },
  
  production: {
    // API Configuration - use same env vars as development
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    API_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    WS_URL: null, // Not used in current implementation
    
    // Production settings
    DEBUG: false,
    LOG_LEVEL: 'error',
    
    // Production-specific features
    ENABLE_DEV_TOOLS: false,
    ENABLE_MOCK_DATA: false,
  }
};

// Get current environment configuration
const currentConfig = ENV_CONFIG[IS_DEVELOPMENT ? 'development' : 'production'];

// Application configuration
export const APP_CONFIG = {
  // ===========================================
  // APPLICATION SETTINGS
  // ===========================================
  name: 'Vibify',
  version: '1.0.0',
  description: 'A professional Spotify clone built with Next.js and FastAPI',
  
  // ===========================================
  // ENVIRONMENT SETTINGS
  // ===========================================
  env: {
    NODE_ENV,
    IS_DEVELOPMENT,
    IS_PRODUCTION,
  },
  
  // ===========================================
  // API CONFIGURATION
  // ===========================================
  api: {
    baseUrl: currentConfig.API_BASE_URL || (() => {
      throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is required');
    })(),
    url: currentConfig.API_URL || (() => {
      throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is required');
    })(),
    wsUrl: currentConfig.WS_URL, // Not used in current implementation
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // ===========================================
  // DEBUG CONFIGURATION
  // ===========================================
  debug: {
    enabled: currentConfig.DEBUG,
    logLevel: currentConfig.LOG_LEVEL,
    enableDevTools: currentConfig.ENABLE_DEV_TOOLS,
    enableMockData: currentConfig.ENABLE_MOCK_DATA,
  },
  
  // ===========================================
  // UI SETTINGS
  // ===========================================
  theme: {
    default: 'dark',
    available: ['dark', 'light'] as const,
  },
  
  language: {
    default: 'en',
    available: ['en', 'es', 'fr', 'de'] as const,
  },
  
  // ===========================================
  // AUDIO PLAYER SETTINGS
  // ===========================================
  player: {
    defaultVolume: 0.5,
    maxVolume: 1.0,
    minVolume: 0.0,
    autoPlay: false,
    crossfadeDuration: 3, // seconds
    fadeInDuration: 0.5, // seconds
    fadeOutDuration: 0.5, // seconds
  },
  
  // ===========================================
  // PAGINATION SETTINGS
  // ===========================================
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    itemsPerRow: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
      large: 6,
    },
  },
  
  // ===========================================
  // SEARCH SETTINGS
  // ===========================================
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    maxQueryLength: 100,
    maxResults: 50,
  },
  
  // ===========================================
  // UPLOAD SETTINGS
  // ===========================================
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB in bytes
    allowedAudioFormats: ['mp3', 'wav', 'flac', 'm4a', 'aac'],
    allowedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxFilesPerUpload: 10,
    chunkSize: 1024 * 1024, // 1MB chunks
  },
  
  // ===========================================
  // CACHING SETTINGS
  // ===========================================
  cache: {
    songCacheTtl: 5 * 60 * 1000, // 5 minutes
    playlistCacheTtl: 10 * 60 * 1000, // 10 minutes
    albumCacheTtl: 15 * 60 * 1000, // 15 minutes
    searchCacheTtl: 2 * 60 * 1000, // 2 minutes
  },
  
  // ===========================================
  // BREAKPOINTS
  // ===========================================
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    large: 1280,
    xlarge: 1536,
  },
  
  // ===========================================
  // ANIMATION SETTINGS
  // ===========================================
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  
  // ===========================================
  // FEATURE FLAGS
  // ===========================================
  features: {
    enableUpload: true,
    enablePlaylists: true,
    enableAlbums: true,
    enableSearch: true,
    enableRandomFeed: true,
    enableLikes: true,
    enableRecentlyPlayed: true,
    enableShuffle: true,
    enableRepeat: true,
    enableCrossfade: false,
    enableEqualizer: false,
    enableLyrics: false,
  },
  
  // ===========================================
  // VALIDATION RULES
  // ===========================================
  validation: {
    songTitle: {
      minLength: 1,
      maxLength: 200,
    },
    artistName: {
      minLength: 1,
      maxLength: 100,
    },
    albumName: {
      minLength: 1,
      maxLength: 100,
    },
    playlistName: {
      minLength: 1,
      maxLength: 50,
    },
    description: {
      maxLength: 500,
    },
  },
} as const;

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

export function getApiUrl(endpoint: string): string {
  const baseUrl = APP_CONFIG.api.baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${baseUrl}/${cleanEndpoint}`;
}

export function isFeatureEnabled(feature: keyof typeof APP_CONFIG.features): boolean {
  return APP_CONFIG.features[feature];
}

export function getItemsPerRow(screenWidth: number): number {
  const { breakpoints, pagination } = APP_CONFIG;
  
  if (screenWidth >= breakpoints.large) return pagination.itemsPerRow.large;
  if (screenWidth >= breakpoints.desktop) return pagination.itemsPerRow.desktop;
  if (screenWidth >= breakpoints.tablet) return pagination.itemsPerRow.tablet;
  return pagination.itemsPerRow.mobile;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ===========================================
// TYPE EXPORTS
// ===========================================

export type Theme = typeof APP_CONFIG.theme.available[number];
export type Language = typeof APP_CONFIG.language.available[number];
export type FeatureFlag = keyof typeof APP_CONFIG.features;
