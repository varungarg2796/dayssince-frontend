// src/components/Counters/CountersDisplay.tsx
'use client'; // Required for hooks

import React from 'react';
import { Title, Text, Stack, Loader, Alert, SimpleGrid, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchMyCounters } from '@/lib/apiClient';
import { IconAlertCircle } from '@tabler/icons-react';
import { CounterCard } from './CounterCard'; // We'll move CounterCard here too

export function CountersDisplay() {
  // --- Fetch data using React Query ---
  const { data: countersData, isLoading, error, isError } = useQuery({
      queryKey: ['myCounters'], // Unique key for this query
      queryFn: fetchMyCounters, // The function to call for fetching
  });
  // ---------------------------------

  // --- Loading State ---
  if (isLoading) {
    return (
      <Group position="center" mt="xl">
          <Loader />
          <Text>Loading counters...</Text>
      </Group>
    );
  }

  // --- Error State ---
  if (isError) {
    return (
       <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg">
          Failed to load counters: {error instanceof Error ? error.message : 'Unknown error'}
       </Alert>
    );
  }

  // --- Success State (Data available) ---
  if (!countersData) {
      // Handle case where data is somehow undefined after loading/no error
      return <Text color="dimmed" mt="lg">Could not load counter data.</Text>;
  }

  return (
    <Stack>
      {/* Active Counters Section */}
      <section>
        <Title order={3} mb="md">Active Counters ({countersData.active.length})</Title>
        {countersData.active.length > 0 ? (
          // Use SimpleGrid for responsive columns
          <SimpleGrid
             cols={3} // Default to 3 columns
             spacing="lg"
             breakpoints={[
               { maxWidth: 'md', cols: 2, spacing: 'md' }, // 2 cols on medium screens
               { maxWidth: 'sm', cols: 1, spacing: 'sm' }, // 1 col on small screens
             ]}
           >
              {countersData.active.map(counter => (
                  <CounterCard key={counter.id} counter={counter} />
              ))}
           </SimpleGrid>
         ) : (
             <Text color="dimmed">No active counters yet. Add one!</Text> // Encourage action
         )}
       </section>

       {/* Archived Counters Section */}
       {/* Only show if there are archived counters to avoid clutter */}
       {countersData.archived.length > 0 && (
            <section>
                <Title order={3} mb="md" mt="xl">Archived Counters ({countersData.archived.length})</Title>
                <SimpleGrid
                    cols={3}
                    spacing="lg"
                    breakpoints={[
                        { maxWidth: 'md', cols: 2, spacing: 'md' },
                        { maxWidth: 'sm', cols: 1, spacing: 'sm' },
                    ]}
                >
                    {countersData.archived.map(counter => (
                        <CounterCard key={counter.id} counter={counter} />
                    ))}
                </SimpleGrid>
            </section>
        )}
    </Stack>
  );
}