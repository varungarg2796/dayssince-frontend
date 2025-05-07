// src/lib/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type {
    Counter, CreateCounterDto, Tag, UpdateCounterPayload, UserCounters,
    PaginatedCountersResult, FindPublicCountersOptions
} from '@/types';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_BASE_URL ? process.env.NEXT_PUBLIC_API_BASE_URL + '/api' : 'http://localhost:3000/api'),
  timeout: 10000,
});

console.log(console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL));
let isCurrentlyRefreshing = false;
let failedRequestQueue: { resolve: (value: unknown) => void; reject: (reason?: unknown) => void; config: InternalAxiosRequestConfig; }[] = [];

const processRequestQueue = (error: Error | null, token: string | null = null) => {
  failedRequestQueue.forEach(prom => {
    if (error) { prom.reject(error); }
    else if (token) {
       (prom.config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
       apiClient(prom.config).then(response => prom.resolve(response)).catch(err => prom.reject(err));
    } else { prom.reject(new Error("No token provided after refresh attempt.")); }
  });
  failedRequestQueue = [];
};

const logoutUserInternal = async (): Promise<void> => {
  const currentAuthState = useAuthStore.getState();
  if (!currentAuthState.isAuthenticated && !localStorage.getItem('refreshToken')) { return; }
  let accessTokenForBackendCall: string | null = currentAuthState.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  const refreshTokenToRevoke: string | null = currentAuthState.refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);

  if (refreshTokenToRevoke && !accessTokenForBackendCall) {
      try {
          const newAccessToken = await refreshAccessTokenInternal(refreshTokenToRevoke);
          accessTokenForBackendCall = newAccessToken;
      } catch {
          accessTokenForBackendCall = null;
      }
  }

  if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
  }
  currentAuthState.clearAuth();

  if (refreshTokenToRevoke && accessTokenForBackendCall) {
      try {
          const baseUrl = apiClient.defaults.baseURL + '/api' || 'http://localhost:3000/api';
          await axios.post( `${baseUrl}/auth/logout`, { refreshToken: refreshTokenToRevoke }, { headers: { 'Authorization': `Bearer ${accessTokenForBackendCall}` }, timeout: 4000 });
      } catch { /* Ignore logout errors */ }
  }
};

const refreshAccessTokenInternal = async (refreshToken: string): Promise<string> => {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + '/api' || 'http://localhost:3000/api';
        const response = await axios.post<{ accessToken: string }>( `${baseUrl}/auth/refresh`, { refreshToken } );
        const { accessToken: newAccessToken } = response.data;
        if (!newAccessToken) throw new Error("No access token in refresh response");
        if (typeof window !== 'undefined') { localStorage.setItem('accessToken', newAccessToken); }
        useAuthStore.getState().setTokens(newAccessToken, refreshToken);
        return newAccessToken;
    } catch (error: unknown) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            await logoutUserInternal();
        }
        throw error;
    }
};

apiClient.interceptors.request.use(
  (config) => {
    const typedHeaders = config.headers as import('axios').AxiosHeaders;
    if (!typedHeaders.Authorization) {
        const token = useAuthStore.getState().accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        if (token) { typedHeaders.Authorization = `Bearer ${token}`; }
    }
    return config;
  }, (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isCurrentlyRefreshing) {
        return new Promise((resolve, reject) => { failedRequestQueue.push({ resolve, reject, config: originalRequest }); });
      }
      originalRequest._retry = true;
      isCurrentlyRefreshing = true;
      const refreshToken = useAuthStore.getState().refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);

      if (!refreshToken) {
        await logoutUserInternal();
        isCurrentlyRefreshing = false;
        processRequestQueue(new Error("No refresh token."), null);
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshAccessTokenInternal(refreshToken);
        processRequestQueue(null, newAccessToken);
         (originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${newAccessToken}`);
         return apiClient(originalRequest);
      } catch (refreshError: unknown) {
          processRequestQueue(refreshError instanceof Error ? refreshError : new Error('Unknown refresh error'), null);
          return Promise.reject(error);
      } finally {
          isCurrentlyRefreshing = false;
       }
    } else if (status === 401 && originalRequest?._retry) { await logoutUserInternal(); }
    return Promise.reject(error);
  }
);

// Public API Functions
export const fetchMyCounters = async (): Promise<UserCounters> => { const {data} = await apiClient.get('/counters/mine'); return data; };
export const fetchSingleCounter = async (id: string): Promise<Counter> => { const {data} = await apiClient.get(`/counters/${id}`); return data; };
export const createCounter = async (payload: CreateCounterDto): Promise<Counter> => { const {data} = await apiClient.post('/counters', payload); return data; };
export const updateCounter = async ({ id, payload }: { id: string; payload: UpdateCounterPayload }): Promise<Counter> => { const {data} = await apiClient.patch(`/counters/${id}`, payload); return data; };
export const deleteCounter = async (id: string): Promise<void> => { await apiClient.delete(`/counters/${id}`); };
export const fetchCounterBySlugPublic = async (slug: string): Promise<Counter> => {
  const { data } = await apiClient.get(`/counters/c/${slug}`); // Use /c/ endpoint
  return data;
};
// Modified archiveCounter
export const archiveCounter = async (id: string, archiveAt?: Date): Promise<Counter> => {
  let payload = {}; // Default empty payload

  // Explicitly check if archiveAt is a valid Date object
  if (archiveAt instanceof Date && !isNaN(archiveAt.getTime())) {
      console.log("apiClient: Valid Date detected for archive, creating payload with ISOString", archiveAt);
      payload = { archiveAt: archiveAt.toISOString() };
  } else {
      console.log("apiClient: No valid Date provided or date is invalid. Sending empty payload (backend defaults to now). archiveAt was:", archiveAt);
      // Sending {} means the backend's default Date() will be used if the field wasn't included
  }

  console.log("apiClient: Sending archive payload:", payload);
  const { data } = await apiClient.patch(`/counters/${id}/archive`, payload);
  return data;
};
export const unarchiveCounter = async (id: string): Promise<Counter> => { const {data} = await apiClient.patch(`/counters/${id}/unarchive`); return data; };
export const fetchTags = async (): Promise<Tag[]> => { const {data} = await apiClient.get('/tags'); return data; };
export const fetchPublicCounters = async (options: FindPublicCountersOptions): Promise<PaginatedCountersResult> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.search) params.append('search', options.search);
    if (options.tagSlugs && options.tagSlugs.length > 0) params.append('tags', options.tagSlugs.join(','));
    const {data} = await apiClient.get('/counters/public', { params });
    return data;
};

export const logoutUser = logoutUserInternal;

export default apiClient;