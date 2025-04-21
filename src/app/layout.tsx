// src/app/layout.tsx
import '@mantine/core/styles.css';
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './providers';
import NProgressComponent from '@/components/Layout/NProgressComponent'; // Import the renamed component
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: { template: '%s | DaysSince', default: 'DaysSince - Track Your Moments', },
  description: 'Track the time since important events with DaysSince...',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
        {/* NProgress CSS is now loaded via globals.css */}
      </head>
      <body>
        <Providers>
           {/* Render NProgressComponent here so it has access to context/hooks */}
           <NProgressComponent />
           {children}
        </Providers>
      </body>
    </html>
  );
}