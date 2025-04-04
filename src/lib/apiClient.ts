// src/lib/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import { useAuthStore } from '@/stores/authStore'; // Adjust path if needed
// Import necessary types
import type {
    Counter, CreateCounterDto, Tag, UpdateCounterPayload, UserCounters,
    PaginatedCountersResult, FindPublicCountersOptions
} from '@/types'; // Adjust path if needed

// --- Axios Instance Creation ---
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000, // Example: Add a request timeout
});

// --- Refresh State and Queue Logic ---
let isCurrentlyRefreshing = false; // Flag to prevent multiple refresh calls simultaneously
let failedRequestQueue: {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    config: InternalAxiosRequestConfig; // Store the original config
}[] = [];

// Function to process the queue after a refresh attempt
const processRequestQueue = (error: Error | null, token: string | null = null) => {
  failedRequestQueue.forEach(prom => {
    if (error) {
      console.debug("Rejecting queued request due to refresh error", error);
      prom.reject(error); // Reject queued requests if refresh failed
    } else if (token) {
       console.debug("Retrying queued request with new token");
       // Update header with new token and retry
       (prom.config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
       apiClient(prom.config) // Retry with the globally configured apiClient instance
          .then(response => prom.resolve(response)) // Resolve with the successful response
          .catch(err => prom.reject(err)); // Reject if retry still fails
    } else {
        prom.reject(new Error("No token provided after refresh attempt.")); // Should not happen if logic is correct
    }
  });
  failedRequestQueue = []; // Clear the queue
};

// --- Internal Logout Function (Handles State & Storage) ---
const logoutUserInternal = async (): Promise<void> => {
  const currentAuthState = useAuthStore.getState();

  // Avoid multiple logout calls if already logged out client-side
  if (!currentAuthState.isAuthenticated && !localStorage.getItem('refreshToken')) {
      // console.log("Internal Logout: Already logged out client-side, skipping.");
      return;
  }
  console.log("Internal Logout: Logout process starting.");

  let accessTokenForBackendCall: string | null = currentAuthState.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  const refreshTokenToRevoke: string | null = currentAuthState.refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
  let attemptedRefresh = false;

  // --- Attempt to get a fresh Access Token *if* a Refresh Token exists ---
  // This ensures the backend logout call (which requires authentication) has a higher chance of succeeding.
  // We don't strictly *need* to check if the access token is expired client-side,
  // we can just attempt refresh if the refresh token is present.
  if (refreshTokenToRevoke && !accessTokenForBackendCall) { // Or add logic to check AT expiry here if desired
      console.log("Logout: Access token missing or assumed expired. Attempting pre-logout refresh...");
      attemptedRefresh = true;
      try {
          // Use the internal refresh function defined in this file
          const newAccessToken = await refreshAccessTokenInternal(refreshTokenToRevoke);
          accessTokenForBackendCall = newAccessToken; // Use the newly obtained token
          console.log("Logout: Pre-logout refresh successful.");
      } catch (refreshError) {
          console.warn("Logout: Pre-logout token refresh failed. Backend revocation might fail if attempted.", refreshError);
          accessTokenForBackendCall = null; // Don't try backend logout with invalid/no token
      }
  }
  // ---------------------------------------------------------------------

  // --- Perform Client-Side Cleanup (Always do this) ---
  console.log("Internal Logout: Clearing client-side state and localStorage tokens.");
  if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
  }
  currentAuthState.clearAuth(); // Clear Zustand store state LAST after getting tokens
  // ----------------------------------------------------

  // --- Notify Backend to Revoke (If possible and intended) ---
  // Requires a valid refresh token to revoke and potentially a valid access token for the endpoint guard
  if (refreshTokenToRevoke && accessTokenForBackendCall) {
      try {
          console.log("Logout: Notifying backend /auth/logout to revoke session...");
          const baseUrl = apiClient.defaults.baseURL || 'http://localhost:3000/api';

          // Use basic axios or configure apiClient *not* to add its own default interceptor token here
          await axios.post(
              `${baseUrl}/auth/logout`,
              { refreshToken: refreshTokenToRevoke }, // Send RT for backend to identify session to revoke
              {
                  headers: {
                      // Send the current (potentially just refreshed) Access Token
                      'Authorization': `Bearer ${accessTokenForBackendCall}`
                  },
                  timeout: 4000 // Slightly longer timeout for logout+revoke
              }
          );
          console.log("Internal Logout: Backend logout/revocation endpoint acknowledged.");
      } catch (e: unknown) {
          // Log errors but don't prevent client logout
          console.warn("Internal Logout: Backend /auth/logout call failed. Status:", (e as AxiosError).response?.status, "Message:", (e as Error).message);
          // Possible reasons: Access token *still* expired (race condition?), network error, backend issue.
          // Client-side logout is already done, so this is mostly informational.
      }
  } else {
      if (!refreshTokenToRevoke) {
           console.log("Internal Logout: Skipping backend notification (no refresh token found).");
      } else if (!accessTokenForBackendCall && attemptedRefresh) {
           console.log("Internal Logout: Skipping backend notification (pre-logout refresh failed).");
      } else if (!accessTokenForBackendCall) {
          console.log("Internal Logout: Skipping backend notification (no valid access token).");
      }
  }
  // --------------------------------------------------------
  console.log("Internal Logout: Process finished.");
};


// --- Internal Refresh Function (Handles API call, Storage, State) ---
const refreshAccessTokenInternal = async (refreshToken: string): Promise<string> => {
    console.log("Internal Refresh: Attempting API call...");
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
        // Use basic axios without interceptors for this specific call
        const response = await axios.post<{ accessToken: string }>(
            `${baseUrl}/auth/refresh`,
            { refreshToken }
            // No auth header needed
        );
        const { accessToken: newAccessToken } = response.data;
        if (!newAccessToken) throw new Error("No access token in refresh response");

        console.log("Internal Refresh: Success! Updating storage & store.");
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', newAccessToken);
            // Refresh token usually doesn't change unless rotation is implemented
            // localStorage.setItem('refreshToken', newRefreshToken); // If rotation implemented
        }
         // Update store state
        useAuthStore.getState().setTokens(newAccessToken, refreshToken); // Pass existing RT back

        return newAccessToken;
    } catch (error: unknown) {
        const axiosError = error as AxiosError;
        console.error("Internal Refresh: Failed!", axiosError.response?.status, axiosError.message);
        // If refresh itself fails with 401/403, it means the refresh token is invalid/revoked - Logout!
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            console.log("Internal Refresh: Refresh token invalid/revoked. Logging out.");
            await logoutUserInternal(); // Trigger full logout
        }
         // Re-throw error for the interceptor's catch block
        throw error;
    }
};

// --- Request Interceptor (Keeps adding current token) ---
apiClient.interceptors.request.use(
  (config) => {
    // Add token from store/localStorage if header isn't already set
    const typedHeaders = config.headers as import('axios').AxiosHeaders;
    if (!typedHeaders.Authorization) { // Important: Check if Authorization is NOT already set
         // Prioritize token from store, fallback to localStorage
        const token = useAuthStore.getState().accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        if (token) {
           typedHeaders.Authorization = `Bearer ${token}`;
        }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor (Handles 401 errors) ---
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response, // Simply return successful responses
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Check specifically for 401 Unauthorized
    if (status === 401 && originalRequest && !originalRequest._retry) {
      console.log(`Interceptor: 401 detected for ${originalRequest.url}`);

      // If already refreshing, queue the request
      if (isCurrentlyRefreshing) {
        console.log("Interceptor: Refresh in progress, queuing request...");
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Mark this request as being retried & set refreshing flag
      originalRequest._retry = true;
      isCurrentlyRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);

      if (!refreshToken) {
        console.log("Interceptor: No refresh token found. Logging out.");
        await logoutUserInternal();
        isCurrentlyRefreshing = false;
        processRequestQueue(new Error("No refresh token."), null); // Reject queue
        return Promise.reject(error); // Reject original error
      }

      // --- Try to refresh the token ---
      try {
        console.log("Interceptor: Attempting token refresh...");
        const newAccessToken = await refreshAccessTokenInternal(refreshToken);
        console.log("Interceptor: Refresh successful. Processing queue...");

        processRequestQueue(null, newAccessToken); // Retry queued requests with new token

         // Retry the original failed request
         console.log(`Interceptor: Retrying original request ${originalRequest.url}`);
         (originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${newAccessToken}`);
         return apiClient(originalRequest); // Return the promise of the retried request

      } catch (refreshError: unknown) {
          // refreshAccessTokenInternal handles logout if refresh itself fails with 401/403
          console.error(`Interceptor: Refresh failed. Error: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}. Queue will be rejected.`);
          processRequestQueue(refreshError instanceof Error ? refreshError : new Error('Unknown refresh error'), null); // Reject queue
           // The original request promise should be rejected
          return Promise.reject(error); // Reject with the original 401 error (or the refresh error?)
      } finally {
          isCurrentlyRefreshing = false; // Release the refreshing lock
       }

    } else if (status === 401 && originalRequest?._retry) {
       // If even the retried request failed with 401, logout completely.
       console.error(`Interceptor: Retried request to ${originalRequest.url} failed with 401. Logging out.`);
       await logoutUserInternal();
    } else if (status === 403) {
        // Optionally handle 403 Forbidden (permission errors) differently
        console.error(`Interceptor: Received 403 Forbidden for ${originalRequest?.url}. Maybe log out?`);
        // await logoutUserInternal(); // Uncomment to logout on any 403
    }

    // For all other errors, just pass them through
    return Promise.reject(error);
  }
);
// --------------------------------------------------


// --- Public API Functions (Using the interceptor-enhanced client) ---
export const fetchMyCounters = async (): Promise<UserCounters> => { const {data} = await apiClient.get('/counters/mine'); return data; };
export const fetchSingleCounter = async (id: string): Promise<Counter> => { const {data} = await apiClient.get(`/counters/${id}`); return data; };
export const createCounter = async (payload: CreateCounterDto): Promise<Counter> => { const {data} = await apiClient.post('/counters', payload); return data; };
export const updateCounter = async ({ id, payload }: { id: string; payload: UpdateCounterPayload }): Promise<Counter> => { const {data} = await apiClient.patch(`/counters/${id}`, payload); return data; };
export const deleteCounter = async (id: string): Promise<void> => { await apiClient.delete(`/counters/${id}`); };
export const archiveCounter = async (id: string): Promise<Counter> => { const {data} = await apiClient.patch(`/counters/${id}/archive`); return data; };
export const unarchiveCounter = async (id: string): Promise<Counter> => { const {data} = await apiClient.patch(`/counters/${id}/unarchive`); return data; };
export const fetchTags = async (): Promise<Tag[]> => { const {data} = await apiClient.get('/tags'); return data; };
export const fetchPublicCounters = async (options: FindPublicCountersOptions): Promise<PaginatedCountersResult> => {
    const params = new URLSearchParams();
    // ... build params from options ...
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.search) params.append('search', options.search);
    if (options.tagSlugs && options.tagSlugs.length > 0) params.append('tags', options.tagSlugs.join(','));
    const {data} = await apiClient.get('/counters/public', { params });
    return data;
};

// --- Export Logout function separately if needed by UI components directly ---
export const logoutUser = logoutUserInternal;


export default apiClient; // Export the configured Axios instance