// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader, Text } from '@mantine/core';
import { useAuthStore } from '@/stores/authStore';

// Function to parse fragment (ensure this exists and is correct)
function parseFragment(fragment: string): Record<string, string> {
    const params = new URLSearchParams(fragment.substring(1)); // Remove leading '#'
    const result: Record<string, string> = {};
    params.forEach((value, key) => { result[key] = value; });
    return result;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Check for errors (optional, from query params if backend ever sends them)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        console.error('AuthCallback error from query:', error);
        router.replace('/?error=' + error);
        return;
    }

    // Parse tokens from URL fragment
    if (window.location.hash) {
      const fragmentParams = parseFragment(window.location.hash);
      const accessToken = fragmentParams.accessToken;
      const refreshToken = fragmentParams.refreshToken;

      if (accessToken && refreshToken) {
        console.log('AuthCallback: Tokens received');
        // Store in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        console.log('AuthCallback: Tokens stored in localStorage');

        // Immediately verify token and get user data
         const fetchUser = async (token: string) => {
             try {
                 // Use fetch or apiClient directly - apiClient already has interceptor
                 const response = await fetch('http://localhost:3000/api/users/me', {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 if (!response.ok) throw new Error(`Failed to fetch user (${response.status})`);
                 const user = await response.json();
                 setUser(user); // Update zustand store
                 console.log('AuthCallback: User fetched and set');
                 // Redirect to intended destination after successful verification
                 router.replace('/home');
             } catch (err) {
                 console.error("AuthCallback: Error fetching user after getting tokens", err);
                 localStorage.removeItem('accessToken'); // Clear bad tokens
                 localStorage.removeItem('refreshToken');
                 setUser(null);
                 router.replace('/?error=user_fetch_failed');
             }
         };
         fetchUser(accessToken);

      } else {
         console.error('AuthCallback: Tokens not found in URL fragment');
         router.replace('/?error=missing_tokens');
      }
    } else {
       console.error('AuthCallback: No URL fragment found');
       router.replace('/?error=invalid_callback');
    }
  // Run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array

  return ( <Center style={{ height: '100vh' }}> <Loader /><Text ml="md">Processing...</Text> </Center> );
}