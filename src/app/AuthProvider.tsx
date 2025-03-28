// src/app/AuthProvider.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';
import { Loader, Center } from '@mantine/core';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';

// Function to parse fragment (keep this)
function parseFragment(fragment: string): Record<string, string> {
    const params = new URLSearchParams(fragment.substring(1));
    const result: Record<string, string> = {};
    params.forEach((value, key) => { result[key] = value; });
    return result;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Get required state/actions from store
  const { setUser, setTokens, setLoading, isLoading } = useAuthStore();
  // Local state to prevent multiple checks during initial load cycle
  const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // Ref to prevent effect running twice due to StrictMode double-invoke if needed
  const effectRan = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode development
    if (effectRan.current === true) {
        return;
    }
    effectRan.current = true;

    console.log("AuthProvider Effect Triggered - Initial Check Starting");
    setLoading(true); // Signal loading start

    let tokenToVerify: string | null = null;
    let processedHash = false;

    // --- 1. Check for tokens in URL Fragment (after login redirect) ---
    if (typeof window !== 'undefined' && window.location.hash) {
      const fragmentParams = parseFragment(window.location.hash);
      const fragmentAccessToken = fragmentParams.accessToken;
      const fragmentRefreshToken = fragmentParams.refreshToken;

      if (fragmentAccessToken && fragmentRefreshToken) {
        console.log('AuthProvider: Tokens found in hash');
        // Store immediately (e.g., localStorage)
        localStorage.setItem('accessToken', fragmentAccessToken);
        localStorage.setItem('refreshToken', fragmentRefreshToken);
        // Update store state
        setTokens(fragmentAccessToken, fragmentRefreshToken);
        tokenToVerify = fragmentAccessToken; // Use this token for immediate verification
        processedHash = true;

        // Clean the URL
        router.replace(pathname, { scroll: false });
        console.log('AuthProvider: Hash processed, URL cleaned.');
      } else if (window.location.hash.includes('accessToken')) {
          // Hash exists but parsing failed or missing tokens
          console.error('AuthProvider: Hash found but tokens missing/invalid.');
          localStorage.removeItem('accessToken'); // Clear any potentially bad tokens
          localStorage.removeItem('refreshToken');
          setTokens(null, null);
          setUser(null);
          setLoading(false);
          setIsInitialCheckComplete(true);
          router.replace(pathname, { scroll: false }); // Clean URL
          return; // Stop processing
      }
    }

    // --- 2. If no hash processed, check for existing token in storage ---
    if (!processedHash && typeof window !== 'undefined') {
       tokenToVerify = localStorage.getItem('accessToken');
       if (tokenToVerify) {
           // Optionally update zustand state if it's somehow out of sync (less likely now)
           // const storedRefreshToken = localStorage.getItem('refreshToken');
           // setTokens(tokenToVerify, storedRefreshToken);
           console.log("AuthProvider: Found existing token in localStorage.");
       }
    }

    // --- 3. Verify Token (if found in hash or storage) or Mark as Unauthenticated ---
    const verifyToken = async (token: string | null) => {
      if (token) {
        console.log("AuthProvider: Verifying token...");
        try {
          // Use the specific token we found, sending it in the header
          const response = await apiClient.get<User>('/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }, // Explicitly use the token found
          });
          setUser(response.data);
          // Sync zustand token state if needed (especially after finding in localStorage)
          const storedRefreshToken = localStorage.getItem('refreshToken');
          setTokens(token, storedRefreshToken);
          console.log('AuthProvider: Token VALID, user authenticated', response.data);
        } catch (error: unknown) {
          console.log('AuthProvider: Token INVALID or error fetching user', axios.isAxiosError(error) ? error.response?.status : error);
          localStorage.removeItem('accessToken'); // Clear invalid token
          localStorage.removeItem('refreshToken');
          setTokens(null, null); // Clear store state
          setUser(null);
          // *** Need Refresh Token Logic Here Eventually ***
        }
      } else {
        console.log("AuthProvider: No token found, user is unauthenticated.");
        // Ensure state reflects logged-out status
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setTokens(null, null);
        setUser(null);
      }
      setLoading(false); // Signal loading finished
      setIsInitialCheckComplete(true); // Mark check complete
    };

    verifyToken(tokenToVerify);

  // Run only ONCE on initial mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- Empty dependency array


  // Use the isLoading state from the store for the loader now
  if (isLoading && !isInitialCheckComplete) {
     console.log('AuthProvider: Showing Loader (isLoading=true)');
    return ( <Center style={{ height: '100vh' }}> <Loader /> </Center> );
  }

  // console.log('AuthProvider: Rendering Children (check complete)');
  return <>{children}</>;
}