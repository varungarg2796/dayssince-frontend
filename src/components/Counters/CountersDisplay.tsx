// src/components/Counters/CountersDisplay.tsx
'use client';

import React from 'react';
import { Title, Text, Stack, Loader, Alert, SimpleGrid, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchMyCounters } from '@/lib/apiClient';
import { UserCounters, Counter } from '@/types';
import { IconAlertCircle } from '@tabler/icons-react';
import { CounterCard } from './CounterCard';
import { CounterListItem } from './CounterListItem'; // Import the new list item

interface CountersDisplayProps {
    onEditCounter: (counter: Counter) => void;
    // Add props for other actions triggered from ListItem
    onDeleteCounter: (counter: Counter) => void;
    onToggleArchiveCounter: (counter: Counter) => void;
    onShareCounter: (counter: Counter) => void;
    // Add viewMode prop
    viewMode: 'grid' | 'list';
}

export function CountersDisplay({
    onEditCounter,
    onDeleteCounter,
    onToggleArchiveCounter,
    onShareCounter,
    viewMode // Receive viewMode from parent
}: CountersDisplayProps) {
    const { data: countersData, isLoading, error, isError } = useQuery<UserCounters, Error>({
        queryKey: ['myCounters'],
        queryFn: fetchMyCounters,
        // keepPreviousData: true, // Optional: for smoother loading between views?
    });

    // Loading State
    if (isLoading) {
        return <Group justify="center" mt="xl"><Loader /><Text ml="sm">Loading counters...</Text></Group>;
    }

    // Error State
    if (isError) {
        return (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg">
                Failed to load counters: {error?.message || 'Unknown error'}
            </Alert>
        );
    }

    if (!countersData) {
        return <Text c="dimmed" mt="lg">Could not load counter data.</Text>;
    }

    const renderCounters = (counters: Counter[], listTitle: string) => {
        if (counters.length === 0) {
            return <Text c="dimmed" size="sm">No {listTitle.toLowerCase()} counters found.</Text>;
        }

        if (viewMode === 'grid') {
            return (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'sm', md: 'lg' }}>
                    {counters.map(counter => (
                        <CounterCard
                            key={counter.id}
                            counter={counter}
                            onEdit={() => onEditCounter(counter)}
                        />
                    ))}
                </SimpleGrid>
            );
        } else { // viewMode === 'list'
            return (
                <Stack gap="xs">
                    {counters.map(counter => (
                        <CounterListItem
                            key={counter.id}
                            counter={counter}
                            isOwnerView={true} // Always owner view on "My Counters" page
                            onEdit={() => onEditCounter(counter)}
                            onDelete={() => onDeleteCounter(counter)}
                            onToggleArchive={() => onToggleArchiveCounter(counter)}
                            onShare={() => onShareCounter(counter)}
                        />
                    ))}
                </Stack>
            );
        }
    };

    return (
        <Stack gap="xl"> {/* Added larger gap between sections */}
            {/* Active Counters Section */}
            <section>
                <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'}>Active ({countersData.active.length})</Title>
                {renderCounters(countersData.active, "Active")}
            </section>

            {/* Archived Counters Section */}
            {countersData.archived.length > 0 && (
                <section>
                    <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'} mt="xl">Archived ({countersData.archived.length})</Title>
                    {renderCounters(countersData.archived, "Archived")}
                </section>
            )}
        </Stack>
    );
}