// src/app/home/page.tsx
import React from 'react';
import { Title } from '@mantine/core';
import { Providers } from '../providers'; // Use providers wrapper
import { MainLayout } from '@/components/Layout/MainLayout'; // Use main layout
import { CountersDisplay } from '@/components/Counters/CountersDisplay'; // Import the new component

export default function HomePage() {
  return (
    <Providers>
      <MainLayout>
        <Title order={2} mb="lg">My Counters</Title>
        {/* Render the component that handles fetching and displaying */}
        <CountersDisplay />
      </MainLayout>
    </Providers>
  );
}