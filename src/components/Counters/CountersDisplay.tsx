// src/components/Counters/CountersDisplay.tsx
'use client'; // Required for hooks

import React from 'react';
import { Title, Text, Stack, Loader, Alert, SimpleGrid, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchMyCounters } from '@/lib/apiClient'; // Import UserCounters type
import { UserCounters} from '@/types'; // Import UserCounters type
import { IconAlertCircle } from '@tabler/icons-react';
import { CounterCard } from './CounterCard';
import { Counter } from '@/types'; // Import Counter type

// --- Define props to accept the edit handler function ---
interface CountersDisplayProps {
    onEditCounter: (counter: Counter) => void; // Function to open edit modal
}
// ------------------------------------------------------

// Add props to component definition
export function CountersDisplay({ onEditCounter }: CountersDisplayProps) {
  // --- Fetch data using React Query ---
  const { data: countersData, isLoading, error, isError } = useQuery<UserCounters, Error>({
      queryKey: ['myCounters'],
      queryFn: fetchMyCounters,
  });
  // ---------------------------------

  // --- Loading State ---
  if (isLoading) {
    return (
      <Group justify="center" mt="xl"> {/* Updated align/justify */}
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
      return <Text color="dimmed" mt="lg">Could not load counter data.</Text>;
  }

  return (
    <Stack>
      {/* Active Counters Section */}
      <section>
        <Title order={3} mb="md">Active Counters ({countersData.active.length})</Title>
        {countersData.active.length > 0 ? (
          <SimpleGrid
             cols={{ base: 1, sm: 2, md: 3 }}
             spacing={{ base: 'sm', md: 'lg' }}
           >
              {countersData.active.map(counter => (
                  // --- Pass onEdit prop down to CounterCard ---
                  <CounterCard
                     key={counter.id}
                     counter={counter}
                     onEdit={() => onEditCounter(counter)} // Pass handler calling prop
                  />
                  // -------------------------------------------
              ))}
           </SimpleGrid>
         ) : (
             <Text c="dimmed">No active counters yet. Add one!</Text>
         )}
       </section>

       {/* Archived Counters Section */}
       {countersData.archived.length > 0 && (
            <section>
                <Title order={3} mb="md" mt="xl">Archived Counters ({countersData.archived.length})</Title>
                <SimpleGrid
                    cols={{ base: 1, sm: 2, md: 3 }}
                    spacing={{ base: 'sm', md: 'lg' }}
                 >
                    {countersData.archived.map(counter => (
                        // --- Pass onEdit prop down to CounterCard ---
                        <CounterCard
                            key={counter.id}
                            counter={counter}
                            onEdit={() => onEditCounter(counter)} // Pass handler calling prop
                        />
                        // -------------------------------------------
                    ))}
                </SimpleGrid>
            </section>
        )}
    </Stack>
  );
}