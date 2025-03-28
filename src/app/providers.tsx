// src/app/providers.tsx
'use client';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import AuthProvider from './AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional Devtools

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      refetchOnWindowFocus: false, // Optional: Prevent refetch on window focus
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <AuthProvider>
          {children}
        </AuthProvider>
      </MantineProvider>
      {/* Optional: React Query Dev Tools for debugging */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}