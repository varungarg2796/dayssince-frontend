// src/app/AuthProvider.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import apiClient, { logoutUser } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';
import { Loader, Center } from '@mantine/core';
import { AxiosError } from 'axios';
import { usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    // Get setters ONCE outside the effect using getState() for stability guarantee
    const staticSetters = useRef(useAuthStore.getState());
    // Get state selectors using hooks
    const isLoading = useAuthStore((state) => state.isLoading);
    // We need isAuthenticated from the store to check state *before* calling logout in catch block
    const isStoreAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false);
    const pathname = usePathname();
    const effectRan = useRef(false); // StrictMode Guard

    useEffect(() => {
        const { setUser, setTokens, setLoading, clearAuth } = staticSetters.current; // Use setters from ref

        // Skip check on callback path
        if (pathname === '/auth/callback') {
            console.log("AuthProvider: Skipping check on /auth/callback.");
            if (useAuthStore.getState().isLoading) setLoading(false);
            if (!isInitialCheckComplete) setIsInitialCheckComplete(true);
            return;
        }

        // StrictMode Guard
        if (effectRan.current === true && process.env.NODE_ENV === 'development') {
            console.log("AuthProvider: Effect ran twice detected, skipping second run.");
            return;
        }

        if (isInitialCheckComplete) {
            console.log("AuthProvider: Initial check already complete, skipping run.");
            if (useAuthStore.getState().isLoading) setLoading(false);
            return;
        }

        effectRan.current = true;
        console.log("AuthProvider: Initializing - Running Auth Check");
        setLoading(true);

        let tokenToVerify: string | null = null;
        let storedRefreshToken: string | null = null;

        if (typeof window !== 'undefined') {
            tokenToVerify = localStorage.getItem('accessToken');
            storedRefreshToken = localStorage.getItem('refreshToken');
            if (tokenToVerify) {
                setTokens(tokenToVerify, storedRefreshToken); // Sync store immediately
                console.log("AuthProvider: Found existing tokens in localStorage.");
            } else {
                console.log("AuthProvider: No tokens found in localStorage.");
                clearAuth();
                setLoading(false);
                setIsInitialCheckComplete(true);
                console.log("AuthProvider: Initial check complete (No tokens).");
                return;
            }
        } else {
             clearAuth();
             setLoading(false);
             setIsInitialCheckComplete(true);
             return;
        }

        // Define async function INSIDE useEffect
        // Removed unused parameters: initialToken, initialRefreshToken
        const verifyInitialToken = async () => {
            console.log("AuthProvider: Verifying initial access token via /api/users/me...");
            try {
                // apiClient uses interceptor to add the token from localStorage/Zustand
                const response = await apiClient.get<User>('/users/me');
                setUser(response.data);

                // Re-sync tokens AFTER potential refresh by interceptor
                const finalAccessToken = localStorage.getItem('accessToken');
                const finalRefreshToken = localStorage.getItem('refreshToken');
                setTokens(finalAccessToken, finalRefreshToken);

                console.log('AuthProvider: Initial check successful. User:', response.data.username);
            } catch (error: unknown) {
                const axiosError = error as AxiosError;
                console.error('AuthProvider: Initial check failed. Status:', axiosError?.response?.status, 'Message:', axiosError?.message);

                // Check current auth state directly from the store before attempting logout
                // Use the 'isStoreAuthenticated' value captured by the hook subscription
                if (isStoreAuthenticated) {
                    console.warn("AuthProvider: Auth check failed while store state was authenticated. Attempting logout.");
                    await logoutUser(); // Ensure logout if interceptor failed silently or error was not 401
                } else {
                    // If already logged out by interceptor or never authenticated, ensure Zustand state is clear
                    console.log("AuthProvider: Check failed and not authenticated in store, ensuring Zustand state is cleared.");
                     clearAuth();
                }
            } finally {
                setLoading(false);
                setIsInitialCheckComplete(true);
                console.log("AuthProvider: Initial auth check processing finished.");
            }
        };

        // Only call verify if we actually found a token initially
        if (tokenToVerify) {
            // No need to pass tokens explicitly, apiClient interceptor handles it
            verifyInitialToken();
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, isInitialCheckComplete, isStoreAuthenticated]);
    // Added isStoreAuthenticated as a dependency because it's used in the catch block logic.
    // This ensures the catch block has the latest state when deciding whether to call logoutUser.

    // Show loader ONLY during the initial check phase
    if (isLoading && !isInitialCheckComplete && pathname !== '/auth/callback') {
        console.log('AuthProvider: Showing Loader (Initial Check)');
        return ( <Center style={{ height: '100vh' }}> <Loader size="lg" /> </Center> );
    }

    return <>{children}</>;
}