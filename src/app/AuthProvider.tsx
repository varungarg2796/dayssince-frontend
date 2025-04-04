// src/app/AuthProvider.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import apiClient, { logoutUser } from '@/lib/apiClient'; // Adjust path if needed
import { useAuthStore } from '@/stores/authStore'; // Adjust path if needed
import { User } from '@/types'; // Adjust path if needed
import { Loader, Center } from '@mantine/core';
import { AxiosError } from 'axios';
import { usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setTokens, setLoading, isLoading, clearAuth } = useAuthStore();
    const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false);
    const pathname = usePathname();
    const effectRan = useRef(false);

    useEffect(() => {
        // Skip check on callback path - Assuming layout handles conditional render
        if (pathname === '/auth/callback') {
            console.log("AuthProvider: Skipping check on /auth/callback.");
            if(isLoading) setLoading(false);
            if(!isInitialCheckComplete) setIsInitialCheckComplete(true);
            return;
        }

        // StrictMode Guard
        if (effectRan.current === true && process.env.NODE_ENV === 'development') {
             console.log("AuthProvider: Effect ran twice detected, skipping second run.");
             return;
        }
        effectRan.current = true;

        console.log("AuthProvider: Initializing - Running Auth Check");
        setLoading(true); // Set loading at the start

        let tokenToVerify: string | null = null;
        let storedRefreshToken: string | null = null;

        // Prioritize checking localStorage for existing session
        if (typeof window !== 'undefined') {
            tokenToVerify = localStorage.getItem('accessToken');
            storedRefreshToken = localStorage.getItem('refreshToken');
            if (tokenToVerify) {
                // Sync store immediately if tokens found
                setTokens(tokenToVerify, storedRefreshToken);
                console.log("AuthProvider: Found existing tokens in localStorage.");
            } else {
                 console.log("AuthProvider: No tokens found in localStorage.");
                 // If no tokens, no need to verify, mark as complete & ensure logged out
                 clearAuth();
                 setLoading(false);
                 setIsInitialCheckComplete(true);
                 console.log("AuthProvider: Initial check complete (No tokens).");
                 return; // Exit useEffect early
            }
        } else {
             // Cannot check storage server-side, assume logged out for initial SSR render?
             // Or maybe rely on later hydration? For client component, window check is key.
             clearAuth();
             setLoading(false);
             setIsInitialCheckComplete(true);
             return; // Exit if window not available
        }

        // --- Verify Initial Token State ---
        const verifyInitialToken = async () => { // Access token should exist in localStorage if we reach here
            console.log("AuthProvider: Verifying initial access token...");
            try {
                // Attempt to fetch user data. The apiClient interceptor will handle
                // potential 401s and trigger the refresh flow automatically.
                const response = await apiClient.get<User>('/users/me');

                // If the request succeeds (either initially or after refresh via interceptor):
                setUser(response.data);

                // Update tokens in store *just in case* interceptor refreshed them
                const finalAccessToken = localStorage.getItem('accessToken');
                const finalRefreshToken = localStorage.getItem('refreshToken');
                setTokens(finalAccessToken, finalRefreshToken);

                console.log('AuthProvider: Initial check successful. User:', response.data.username);

            } catch (error: unknown) {
                // This catch block will now mostly be hit if:
                // 1. The initial /users/me call resulted in a NON-401/403 error.
                // 2. The refresh attempt *inside* the interceptor failed and triggered logoutUserInternal, and the error was re-thrown.
                const axiosError = error as AxiosError;
                console.error('AuthProvider: Initial check failed after potential refresh attempt. Status:', axiosError?.response?.status, 'Message:', axiosError?.message);

                // Ensure user is logged out state is set if verification failed
                // logoutUser() might have already been called by interceptor or refresh function
                 if (useAuthStore.getState().isAuthenticated) {
                     await logoutUser(); // Call if store still thinks user is authenticated
                 }

            } finally {
                // Always ensure loading is finished and check marked complete
                setLoading(false);
                setIsInitialCheckComplete(true);
                console.log("AuthProvider: Initial auth check processing finished.");
            }
        };

        // Only verify if we actually found a token
         if (tokenToVerify) {
             verifyInitialToken();
         }
        // If no token was found initially, the logic already returned above.

    // Add store actions to dependency array for linting, although effect runs once
    }, [pathname, clearAuth, setTokens, setUser, setLoading, isInitialCheckComplete, isLoading]);


    // --- Loader Logic ---
    // Shows loading spinner ONLY during the initial auth check on app load (and not on /auth/callback)
    if (isLoading && !isInitialCheckComplete && pathname !== '/auth/callback') {
        console.log('AuthProvider: Showing Loader (Initial Check)');
        return ( <Center style={{ height: '100vh' }}> <Loader size="lg" /> </Center> );
    }

    // Render children after check is done or if on excluded path
    return <>{children}</>;
}