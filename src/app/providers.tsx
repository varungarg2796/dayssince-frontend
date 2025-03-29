// src/app/providers.tsx
'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import AuthProvider from './AuthProvider';
// --- React Query Imports ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// --- Mantine Notifications ---
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css'; // Import styles for notifications

// Create React Query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}> {/* React Query */}
      <MantineProvider theme={theme} defaultColorScheme="auto"> {/* Mantine */}
         <Notifications position="top-right" /> {/* Mantine Notifications */}
        <AuthProvider> {/* Your Auth Logic */}
          {children}
        </AuthProvider>
      </MantineProvider>
      <ReactQueryDevtools initialIsOpen={false} /> {/* React Query DevTools */}
    </QueryClientProvider>
  );
}