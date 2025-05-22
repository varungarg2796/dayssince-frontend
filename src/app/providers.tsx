// src/app/providers.tsx
'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme'; // Import your custom theme
import AuthProvider from './AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false, },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Pass your custom theme here */}
      <MantineProvider theme={theme} defaultColorScheme="light">
         <Notifications position="top-right" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </MantineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}