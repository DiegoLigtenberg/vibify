/**
 * Utility functions for calculating optimal batch sizes based on screen size
 * Ensures consistent loading behavior across all pages
 */

export interface BatchSizeConfig {
  batchSize: number;
  maxSongs: number;
  cardsPerRow: number;
  cardsPerScreen: number;
  rootMargin: string;
}

/**
 * Calculate optimal batch size and memory limits based on screen size
 * Ensures smooth scrolling with proper memory management
 */
export function calculateBatchSizing(): BatchSizeConfig {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return {
      batchSize: 48,
      maxSongs: 144,
      cardsPerRow: 6,
      cardsPerScreen: 18,
      rootMargin: '1200px'
    };
  }

  const containerWidth = window.innerWidth;
  
  // Calculate cards per row based on screen width for optimal viewing
  let cardsPerRow;
  if (containerWidth < 640) { // sm - mobile
    cardsPerRow = 2;
  } else if (containerWidth < 768) { // md - small tablet
    cardsPerRow = 3;
  } else if (containerWidth < 1024) { // lg - tablet
    cardsPerRow = 4;
  } else if (containerWidth < 1280) { // xl - small desktop
    cardsPerRow = 5;
  } else if (containerWidth < 1920) { // 2xl - medium desktop (up to 1920x1080)
    cardsPerRow = 6;
  } else { // 3xl+ - very large desktop (above 1920x1080)
    cardsPerRow = 8;
  }
  const visibleRows = Math.ceil(window.innerHeight / 300); // approximate row height
  const cardsPerScreen = cardsPerRow * visibleRows;
  
  // Calculate batch size - load 8 rows worth for smooth scrolling
  const batchSize = Math.max(8 * cardsPerRow, 24); // 8 rows worth, minimum 24 songs
  
  // Calculate max songs - keep 3x the batch size (1:3 ratio)
  const maxSongs = batchSize * 3;
  
  // Debug logging (disabled to prevent console spam)
  // const breakpoint = containerWidth < 640 ? 'sm' : containerWidth < 768 ? 'md' : containerWidth < 1024 ? 'lg' : containerWidth < 1280 ? 'xl' : '2xl+';
  // console.log(`🔧 Batch sizing debug: screen=${containerWidth}x${window.innerHeight}, breakpoint=${breakpoint}, cardsPerRow=${cardsPerRow}, batchSize=${batchSize}, maxSongs=${maxSongs}`);
  
  // Calculate responsive root margin for intersection observer
  // Use a simpler, more reliable approach based on screen size
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  
  // For very small screens (mobile), use a smaller, more reliable root margin
  let responsiveRootMargin;
  if (screenWidth < 480) { // Very small mobile screens (3x3 grid)
    responsiveRootMargin = Math.max(screenHeight * 1.2, 400); // 1.2x screen height, min 400px
  } else if (screenWidth < 640) { // Small mobile screens
    responsiveRootMargin = Math.max(screenHeight * 1.5, 600); // 1.5x screen height, min 600px
  } else if (screenWidth < 1024) { // Tablet screens
    responsiveRootMargin = Math.max(screenHeight * 2, 800); // 2x screen height, min 800px
  } else { // Desktop screens
    responsiveRootMargin = Math.max(screenHeight * 2.5, 1200); // 2.5x screen height, min 1200px
  }
  
  return {
    batchSize,
    maxSongs,
    cardsPerRow,
    cardsPerScreen,
    rootMargin: `${responsiveRootMargin}px`
  };
}

/**
 * Get responsive batch size for different screen sizes
 */
export function getResponsiveBatchSize(): number {
  const { batchSize } = calculateBatchSizing();
  return batchSize;
}

/**
 * Get responsive max songs for memory management
 */
export function getResponsiveMaxSongs(): number {
  const { maxSongs } = calculateBatchSizing();
  return maxSongs;
}

/**
 * Get responsive root margin for intersection observer
 * Smaller screens get smaller root margin for better triggering
 */
export function getResponsiveRootMargin(): string {
  const { rootMargin } = calculateBatchSizing();
  return rootMargin;
}

/**
 * Check if batch size should be a multiple of cards per row
 * This prevents layout shifts during loading
 */
export function getBatchSizeMultiple(): number {
  const { cardsPerRow } = calculateBatchSizing();
  return cardsPerRow;
}
