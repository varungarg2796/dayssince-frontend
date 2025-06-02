// src/app/layout.tsx
import '@mantine/core/styles.css';
import React, { Suspense } from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './providers';
import  {PageLoadingIndicator}  from '@/components/Layout/PageLoadingIndicator';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: { template: '%s | DaysSince', default: 'DaysSince - Track Time That Matters', },
  description: 'Track the time since important events with DaysSince...',
  icons: { icon: '/favicon.png' },
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
          <Suspense fallback={null}>

           {/* Render NProgressComponent here so it has access to context/hooks */}
           <PageLoadingIndicator />
           </Suspense>

           {children}
          <Analytics /> {/* Add this line */}
        </Providers>
      </body>
    </html>
  );
}