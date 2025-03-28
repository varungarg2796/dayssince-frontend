// src/lib/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore'; // <-- Import the Zustand store hook/actions

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  // withCredentials: false, // Correctly commented out/removed
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
       const token = localStorage.getItem('accessToken');
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Updated logout function
export const logoutUser = async (): Promise<void> => {
    // 1. Clear tokens from localStorage
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        console.log('localStorage tokens cleared');
    }

    // 2. Clear authentication state in Zustand store
    // We access the state directly using getState() because this is outside a React component
    useAuthStore.getState().clearAuth(); // <-- ADD THIS LINE
    console.log('Zustand auth state cleared');

    // 3. Optional: Call backend logout endpoint if it performs revocation etc.
    // try { await apiClient.post('/auth/logout'); } catch (e) { console.error('Backend logout call failed', e); }
};

export const fetchMyCounters = async (): Promise<UserCounters> => {
    console.log("Attempting to fetch /counters/mine");
    // apiClient already has interceptor to add auth header
    const { data } = await apiClient.get<UserCounters>('/counters/mine');
    return data;
};


export default apiClient;

export interface UserCounters {
    active: Counter[];
    archived: Counter[];
  }
  export interface Tag { // If not already defined
      id: number;
      name: string;
      slug: string;
  }
  export interface Counter {
      id: string;
      userId: string;
      name: string;
      description: string | null;
      startDate: string; // ISO String
      archivedAt: string | null; // ISO String or null
      isPrivate: boolean;
      viewCount: number;
      createdAt: string; // ISO String
      updatedAt: string; // ISO String
      tags: Tag[]; // Array of associated tags
      // Add creator info if needed/returned by API
      // creator: { username: string };
  }