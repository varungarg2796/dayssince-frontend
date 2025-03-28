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
  clearAuth: () => void; // <-- Ensure the type includes clearAuth
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
      // Note: isLoading might be managed differently, e.g., only set to false
      // by AuthProvider after the *initial* load, not necessarily on every setUser call.
      // Consider if you need to adjust this later based on usage.
      // isLoading: false
  })),

  setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),

  // --- ADD THIS ACTION ---
  clearAuth: () => set({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    // isLoading: true, // Optional: Reset loading state if needed on logout? Usually not.
  }),
  // ------------------------

  setLoading: (loading) => set({ isLoading: loading }),
}));

// Optional selectors (remain the same)
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);