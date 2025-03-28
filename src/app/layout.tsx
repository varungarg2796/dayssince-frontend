// src/app/layout.tsx
import '@mantine/core/styles.css';
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';
import { metadata } from './metadata';
import { Providers } from './providers';

export const metadata = {
  title: 'DaysSince',
  description: 'Track time since important events!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Ensure no extra whitespace */}
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}