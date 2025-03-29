// src/stores/authStore.ts
import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (access: string | null, refresh: string | null) => void;
  clearAuth: () => void; // <-- Action to clear auth state
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial State
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) => set(() => ({
      user,
      isAuthenticated: !!user,
      // isLoading: false // Handled by AuthProvider's initial check separately now
  })),

  setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),

  clearAuth: () => set({ // <-- Implementation
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  }),

  setLoading: (loading) => set({ isLoading: loading }),
}));

// Selectors (remain the same)
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);