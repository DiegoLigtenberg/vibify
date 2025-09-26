import { create } from 'zustand';
import { Howl } from 'howler';
import { SongsAPI } from '../lib/api';
import type { Song } from '@/shared/types/song';

interface PlayerState {
  // Current song
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  
  // Play tracking
  playStartTime: number | null;
  hasRecordedPlay: boolean;
  
  // Queue
  queue: Song[];
  currentIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
  
  // Howler instance
  howl: Howl | null;
  progressIntervalId: any;
  isUserSeeking: boolean;
  beginSeek: () => void;
  endSeek: (time: number) => void;
  syncIntervalId: any;
  
  // Callback for auto-loading more songs
  onEndOfQueue?: () => void;
  
  // Actions
  setCurrentSong: (song: Song) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  seek: (time: number) => void;
  
  // Queue actions
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  next: () => void;
  previous: () => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  toggleShuffle: () => void;
  
  // Cleanup
  cleanup: () => void;
  
  // Set callback for auto-loading
  setOnEndOfQueue: (callback: (() => void) | undefined) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  currentSong: null,
  isPlaying: false,
  isLoading: false,
  volume: 0.5,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  playStartTime: null,
  hasRecordedPlay: false,
  queue: [],
  currentIndex: 0,
  repeatMode: 'none',
  shuffleMode: false,
  howl: null,
  progressIntervalId: null,
  isUserSeeking: false,
  syncIntervalId: null,
  onEndOfQueue: undefined,

  // Actions
  setCurrentSong: (song: Song) => {
    const { howl, cleanup } = get();
    
    // Cleanup previous song
    if (howl) {
      cleanup();
    }

    set({ currentSong: song, isLoading: true, currentTime: 0, hasRecordedPlay: false, playStartTime: null });

    // Create new Howl instance
    const newHowl = new Howl({
      src: [song.storage_url],
      html5: true,
      volume: get().volume,
      autoplay: true,
      preload: true, // Preload for better mobile experience
      // Enable background playback on mobile
      onloaderror: (id, error) => {
        console.error('Howler load error:', error);
        // Fallback to regular audio for mobile
        if (typeof window !== 'undefined' && 'ontouchstart' in window) {
          const audio = new Audio(song.storage_url);
          audio.volume = get().volume;
          audio.autoplay = true;
          audio.loop = false;
          audio.play().catch(console.error);
        }
      },
      onload: () => {
        set({ 
          isLoading: false, 
          duration: newHowl.duration() || 0 
        });
      },
      onplay: () => {
        const now = Date.now();
        set({ 
          isPlaying: true, 
          playStartTime: now,
          hasRecordedPlay: false 
        });
        // Start progress ticker
        const intervalId = setInterval(() => {
          const { isUserSeeking } = get();
          if (!isUserSeeking) {
            set({ currentTime: newHowl.seek() as number || 0 });
          }
        }, 250);
        set({ progressIntervalId: intervalId });
        
        // Set a timer to record stream after 30 seconds of listening
        setTimeout(() => {
          const { currentSong, playStartTime, hasRecordedPlay, isPlaying } = get();
          if (currentSong && playStartTime && !hasRecordedPlay && isPlaying) {
            const listenDuration = (Date.now() - playStartTime) / 1000;
            SongsAPI.recordStream(currentSong.id, undefined, listenDuration).catch(error => {
              console.error('Failed to record stream:', error);
            });
            set({ hasRecordedPlay: true });
          }
        }, 30000); // 30 seconds
      },
      onpause: () => {
        const { progressIntervalId } = get();
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          set({ progressIntervalId: null });
        }
        set({ isPlaying: false });
      },
      onstop: () => {
        const { progressIntervalId } = get();
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          set({ progressIntervalId: null });
        }
        set({ isPlaying: false, currentTime: 0 });
      },
      onseek: () => {
        set({ currentTime: newHowl.seek() || 0 });
      },
      onend: () => {
        const { repeatMode, next, currentSong, playStartTime, hasRecordedPlay, progressIntervalId } = get();
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          set({ progressIntervalId: null });
        }
        
        // Record stream if listened for at least 30 seconds
        if (currentSong && playStartTime && !hasRecordedPlay) {
          const listenDuration = (Date.now() - playStartTime) / 1000; // seconds
          SongsAPI.recordStream(currentSong.id, undefined, listenDuration).catch(error => {
            console.error('Failed to record stream:', error);
          });
          set({ hasRecordedPlay: true });
        }
        
        if (repeatMode === 'one') {
          newHowl.play();
        } else {
          next();
        }
      }
    });

    set({ howl: newHowl });

    // Start sync interval to keep UI state in sync with Howler
    const syncInterval = setInterval(() => {
      const { howl, isPlaying } = get();
      if (howl) {
        const actuallyPlaying = howl.playing();
        if (actuallyPlaying !== isPlaying) {
          set({ isPlaying: actuallyPlaying });
        }
      }
    }, 100); // Check every 100ms
    set({ syncIntervalId: syncInterval });
  },

  play: () => {
    const { howl } = get();
    if (howl && !howl.playing()) {
      howl.play();
    }
  },

  pause: () => {
    const { howl } = get();
    if (howl && howl.playing()) {
      howl.pause();
    }
  },

  togglePlay: () => {
    const { howl } = get();
    if (howl) {
      // Use Howler's actual playing state for more reliable toggle
      if (howl.playing()) {
        howl.pause();
        // Immediately update UI state to match Howler
        set({ isPlaying: false });
      } else {
        howl.play();
        // Immediately update UI state to match Howler
        set({ isPlaying: true });
      }
      
      // Force a sync check after a short delay to ensure state is correct
      setTimeout(() => {
        const { howl: currentHowl } = get();
        if (currentHowl) {
          const actuallyPlaying = currentHowl.playing();
          set({ isPlaying: actuallyPlaying });
        }
      }, 50);
    } else {
      // If no howl instance, try to play
      const { play } = get();
      play();
    }
  },

  stop: () => {
    const { howl } = get();
    if (howl) {
      howl.stop();
    }
  },

  setVolume: (volume: number) => {
    const { howl } = get();
    if (howl) {
      howl.volume(volume);
    }
    set({ volume });
  },

  toggleMute: () => {
    const { howl, isMuted, volume } = get();
    if (howl) {
      if (isMuted) {
        howl.volume(volume);
        set({ isMuted: false });
      } else {
        howl.volume(0);
        set({ isMuted: true });
      }
    }
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  seek: (time: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
    }
  },

  beginSeek: () => {
    set({ isUserSeeking: true });
  },

  endSeek: (time: number) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
    }
    set({ isUserSeeking: false, currentTime: time });
  },

  // Queue actions
  setQueue: (songs: Song[], startIndex = 0) => {
    set({ queue: songs, currentIndex: startIndex });
  },

  addToQueue: (song: Song) => {
    const { queue } = get();
    set({ queue: [...queue, song] });
  },

  removeFromQueue: (index: number) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    const newCurrentIndex = index < currentIndex ? currentIndex - 1 : currentIndex;
    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },

  clearQueue: () => {
    set({ queue: [], currentIndex: 0 });
  },

  next: () => {
    const { queue, currentIndex, repeatMode, shuffleMode, setCurrentSong, onEndOfQueue } = get();
    
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        // Auto-load more songs when reaching the end
        if (onEndOfQueue) {
          onEndOfQueue();
        }
        return; // End of queue
      }
    }

    set({ currentIndex: nextIndex });
    setCurrentSong(queue[nextIndex]);
  },

  previous: () => {
    const { queue, currentIndex, setCurrentSong } = get();
    
    if (queue.length === 0) return;

    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    set({ currentIndex: prevIndex });
    setCurrentSong(queue[prevIndex]);
  },

  setRepeatMode: (mode: 'none' | 'one' | 'all') => {
    set({ repeatMode: mode });
  },

  toggleShuffle: () => {
    const { shuffleMode, queue } = get();
    const newShuffleMode = !shuffleMode;
    
    if (newShuffleMode) {
      // Shuffle the queue
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      set({ queue: shuffled, shuffleMode: newShuffleMode });
    } else {
      // Restore original order (this would need to be stored separately in a real app)
      set({ shuffleMode: newShuffleMode });
    }
  },

  cleanup: () => {
    const { howl, progressIntervalId, syncIntervalId } = get();
    if (progressIntervalId) {
      clearInterval(progressIntervalId);
    }
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
    }
    if (howl) {
      howl.unload();
    }
    set({ 
      howl: null, 
      isPlaying: false, 
      currentTime: 0, 
      duration: 0, 
      progressIntervalId: null,
      syncIntervalId: null 
    });
  },

  setOnEndOfQueue: (callback) => {
    set({ onEndOfQueue: callback });
  }
}));
