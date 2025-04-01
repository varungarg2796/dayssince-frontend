// src/lib/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type { Counter, CreateCounterDto, FindPublicCountersOptions, PaginatedCountersResult, Tag, UpdateCounterPayload, UserCounters } from '@/types'; // Import types

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  // withCredentials: false, // Not needed for header auth
});

// Request Interceptor to add Authorization header
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

// --- Auth Functions ---
export const logoutUser = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        console.log('localStorage tokens cleared');
    }
    useAuthStore.getState().clearAuth();
    console.log('Zustand auth state cleared');
    // Optional: call backend /logout endpoint
    // try { await apiClient.post('/auth/logout'); } catch(e) {}
};

// --- Counter Fetch Functions ---
export const fetchMyCounters = async (): Promise<UserCounters> => {
    console.log("Attempting to fetch /counters/mine");
    const { data } = await apiClient.get<UserCounters>('/counters/mine');
    return data;
};

// --- Counter Action (Mutation) Functions ---
export const deleteCounter = async (counterId: string): Promise<void> => {
    await apiClient.delete(`/counters/${counterId}`);
};

export const archiveCounter = async (counterId: string): Promise<Counter> => {
    const { data } = await apiClient.patch<Counter>(`/counters/${counterId}/archive`);
    return data;
};

export const unarchiveCounter = async (counterId: string): Promise<Counter> => {
    const { data } = await apiClient.patch<Counter>(`/counters/${counterId}/unarchive`);
    return data;
};

export const createCounter = async (payload: CreateCounterDto): Promise<Counter> => {
  console.log("Sending createCounter payload:", payload);
  const { data } = await apiClient.post<Counter>('/counters', payload);
  return data;
};

export const updateCounter = async ({ id, payload }: { id: string; payload: UpdateCounterPayload }): Promise<Counter> => {
  console.log(`Sending updateCounter payload for ID ${id}:`, payload);
  const { data } = await apiClient.patch<Counter>(`/counters/${id}`, payload);
  return data;
};

export const fetchTags = async (): Promise<Tag[]> => {
  console.log("Attempting to fetch /tags");
  const { data } = await apiClient.get<Tag[]>('/tags');
  return data;
};

export const fetchPublicCounters = async (options: FindPublicCountersOptions): Promise<PaginatedCountersResult> => {
  console.log("Attempting to fetch /counters/public with options:", options);
  // Construct query parameters from options
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.search) params.append('search', options.search);
  // Join tag slugs with a comma if the array exists and is not empty
  if (options.tagSlugs && options.tagSlugs.length > 0) {
      params.append('tags', options.tagSlugs.join(','));
  }

  const { data } = await apiClient.get<PaginatedCountersResult>('/counters/public', { params });
  return data;
};

export const fetchSingleCounter = async (id: string): Promise<Counter> => {
  console.log(`Attempting to fetch /counters/${id}`);
  // GET /api/counters/:id
  // The backend handles privacy checks and view count increment
  // The request interceptor automatically adds the auth token if available
  const { data } = await apiClient.get<Counter>(`/counters/${id}`);
  return data;
};


export default apiClient;