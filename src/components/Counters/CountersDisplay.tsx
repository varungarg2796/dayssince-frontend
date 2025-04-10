// src/components/Counters/CountersDisplay.tsx
'use client';

import React from 'react';
import { Title, Text, Stack, Alert, SimpleGrid, Group, Skeleton, Box, Center, ThemeIcon, Transition } from '@mantine/core'; // Added ThemeIcon
import { useQuery } from '@tanstack/react-query';
import { fetchMyCounters } from '@/lib/apiClient';
import { UserCounters, Counter } from '@/types';
import { IconAlertCircle, IconDatabaseOff } from '@tabler/icons-react'; // Added IconDatabaseOff
import { CounterCard } from './CounterCard';
import { CounterListItem } from './CounterListItem';

interface CountersDisplayProps {
    onEditCounter: (counter: Counter) => void;
    onDeleteCounter: (counter: Counter) => void;
    onRequestToggleArchive: (counter: Counter) => void;
    onShareCounter: (counter: Counter) => void;
    viewMode: 'grid' | 'list';
}

// --- Helper Component for Skeleton Placeholders ---
function CardSkeleton() {
    return (
        <Box p="lg" style={(theme) => ({ border: `1px solid ${theme.colors.gray[2]}`, borderRadius: theme.radius.lg })}>
             <Stack gap="sm">
                 <Skeleton height={12} radius="md" width="70%" />
                 <Skeleton height={8} mt={6} radius="md" width="40%" />
                 <Skeleton height={40} mt={10} radius="md" />
                 <Skeleton height={80} mt={15} radius="lg" />
                 <Skeleton height={8} mt={10} radius="md" width="60%" />
             </Stack>
        </Box>
    );
}

function ListSkeleton() {
     return (
         <Box p="xs" mb={4} style={(theme) => ({ border: `1px solid ${theme.colors.gray[2]}`, borderRadius: theme.radius.sm })}>
             <Group wrap="nowrap" gap="sm">
                 <Stack gap={4} style={{ flexGrow: 1 }} >
                      <Skeleton height={10} width="50%" radius="sm" />
                      <Skeleton height={8} width="75%" radius="sm" mt={2} />
                 </Stack>
                  <Skeleton height={30} width={160} radius="sm" />
                  <Skeleton height={28} circle />
                  <Skeleton height={28} circle />
             </Group>
         </Box>
     )
 }
// --- End Helper Components ---


export function CountersDisplay({
    onEditCounter,
    onDeleteCounter,
    onRequestToggleArchive,
    onShareCounter,
    viewMode
}: CountersDisplayProps) {
    const { data: countersData, isLoading, error, isError } = useQuery<UserCounters, Error>({
        queryKey: ['myCounters'],
        queryFn: fetchMyCounters,
    });

    // --- Loading State with Skeletons ---
    if (isLoading) {
         const skeletonCount = viewMode === 'grid' ? 6 : 8;
         return (
            <Stack gap="xl">
                 <section>
                      <Skeleton height={20} width="150px" mb={viewMode === 'list' ? 'xs' : 'md'} radius="sm" />
                      {viewMode === 'grid' ? (
                          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'sm', md: 'lg' }}>
                               {Array.from({ length: skeletonCount }).map((_, i) => <CardSkeleton key={`active-skel-grid-${i}`} />)}
                          </SimpleGrid>
                      ) : (
                          <Stack gap="xs">
                              {Array.from({ length: skeletonCount }).map((_, i) => <ListSkeleton key={`active-skel-list-${i}`} />)}
                          </Stack>
                       )}
                  </section>
                 {/* No skeleton for archived during initial load, too much */}
                 {/* <section><Skeleton height={20} width="180px" mt="xl" mb="md" radius="sm" /></section> */}
            </Stack>
         );
    }

    // --- Error State ---
    if (isError && !countersData) { // Show error only if we truly have no data yet
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error Loading Counters" color="red" mt="lg" radius="md"> Something went wrong. Please try refreshing the page. <br /> <Text size="xs" c="red">({error?.message || 'Unknown error'})</Text> </Alert>
        );
    }

    // --- Enhanced No Data State (Handles case where fetch succeeds but is empty) ---
    if (countersData && countersData.active.length === 0 && countersData.archived.length === 0) {
        return (
             <Center style={{ minHeight: '40vh', flexDirection: 'column', padding: 'var(--mantine-spacing-xl)', textAlign: 'center' }}>
                 <ThemeIcon variant="light" size={80} radius={80} mb="lg" color="gray">
                      <IconDatabaseOff stroke={1.5} style={{ width: '50%', height: '50%' }}/>
                  </ThemeIcon>
                 <Title order={3} mb="xs">No Counters Yet!</Title>
                 <Text size="md" c="dimmed">It looks a bit empty here.</Text>
                 <Text size="md" c="dimmed">
                      Click the &apos;Add&apos; button above to start tracking your first event.
                 </Text>
             </Center>
         );
    }

    // Ensure countersData exists before proceeding
    if (!countersData) return null;

    // Render function (can add item transition here)
    const renderCounters = (counters: Counter[]) => {
        return (
            viewMode === 'grid' ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'sm', md: 'lg' }}>
                    {counters.map((counter) => (
                         // Optional: Add item transition
                         <Transition key={counter.id} mounted={true} transition="fade" duration={400} timingFunction="ease">
                            {(styles) => (
                                <div style={styles}>
                                     <CounterCard
                                         counter={counter}
                                         isOwnerView={true}
                                         onEdit={() => onEditCounter(counter)}
                                         onRequestToggleArchive={() => onRequestToggleArchive(counter)}
                                         onDelete={() => onDeleteCounter(counter)}
                                         onShare={() => onShareCounter(counter)}
                                     />
                                 </div>
                             )}
                         </Transition>
                    ))}
                </SimpleGrid>
            ) : ( // viewMode === 'list'
                <Stack gap="xs">
                    {counters.map((counter) => (
                         <Transition key={counter.id} mounted={true} transition="fade" duration={400} timingFunction="ease">
                              {(styles) => (
                                  <div style={styles}>
                                      <CounterListItem
                                          counter={counter}
                                          isOwnerView={true}
                                          onEdit={() => onEditCounter(counter)}
                                          onDelete={() => onDeleteCounter(counter)}
                                          onRequestToggleArchive={() => onRequestToggleArchive(counter)}
                                          onShare={() => onShareCounter(counter)}
                                      />
                                  </div>
                              )}
                          </Transition>
                    ))}
                </Stack>
            )
        );
    };

    // --- Final Render with Data ---
    return (
        <Stack gap="xl">
            {/* Active Section */}
            {countersData.active.length > 0 ? (
                <section>
                    <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'}>Active ({countersData.active.length})</Title>
                    {renderCounters(countersData.active)}
                </section>
             ) : (
                  // Show message only if archive list *will* be rendered
                  countersData.archived.length > 0 && <Text c="dimmed" size="sm" mb="xl"> No active counters.</Text>
              )}

            {/* Archived Section */}
            {countersData.archived.length > 0 && (
                <section>
                    <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'} mt={countersData.active.length > 0 ? 'xl' : undefined}>Archived ({countersData.archived.length})</Title>
                    {renderCounters(countersData.archived)}
                </section>
            )}
        </Stack>
    );
}