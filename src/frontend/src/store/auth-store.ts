import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isNewAccount: boolean;
  
  // Actions
  login: (username: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  clearNewAccountFlag: () => void;
  setUser: (user: User) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isNewAccount: false,

      login: async (username: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            set({
              user: {
                id: result.user_id,
                username: result.username,
                created_at: result.created_at,
              },
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              error: result.error,
              isLoading: false,
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = 'Login failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (username: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            set({
              user: {
                id: result.user_id,
                username: result.username,
                created_at: result.created_at,
              },
              isAuthenticated: true,
              isNewAccount: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              error: result.error,
              isLoading: false,
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = 'Registration failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        // Clear all auth data from localStorage
        localStorage.removeItem('auth-storage');
        
        set({
          user: null,
          isAuthenticated: false,
          isNewAccount: false,
          error: null,
        });
      },

      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }

          const response = await fetch('http://127.0.0.1:8000/api/auth/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: currentUser.username }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Clear all auth data from localStorage
            localStorage.removeItem('auth-storage');
            
            set({
              user: null,
              isAuthenticated: false,
              isNewAccount: false,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              error: result.error,
              isLoading: false,
            });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = 'Account deletion failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      clearError: () => {
        set({ error: null });
      },

      clearNewAccountFlag: () => {
        set({ isNewAccount: false });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setIsAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isNewAccount: state.isNewAccount,
      }),
    }
  )
);
