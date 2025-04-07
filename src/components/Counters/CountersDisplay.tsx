// src/components/Counters/CountersDisplay.tsx
'use client';

import React from 'react';
import { Title, Text, Stack, Loader, Alert, SimpleGrid, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchMyCounters } from '@/lib/apiClient';
import { UserCounters, Counter } from '@/types';
import { IconAlertCircle } from '@tabler/icons-react';
import { CounterCard } from './CounterCard';
import { CounterListItem } from './CounterListItem';

interface CountersDisplayProps {
    onEditCounter: (counter: Counter) => void;
    onDeleteCounter: (counter: Counter) => void;
    onRequestToggleArchive: (counter: Counter) => void;
    onShareCounter: (counter: Counter) => void;
    viewMode: 'grid' | 'list';
}

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

    if (isLoading) {
        return <Group justify="center" mt="xl"><Loader /><Text ml="sm">Loading counters...</Text></Group>;
    }

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
                            isOwnerView={true}
                            onEdit={() => onEditCounter(counter)}
                            onRequestToggleArchive={() => onRequestToggleArchive(counter)}
                            onDelete={() => onDeleteCounter(counter)}
                            onShare={() => onShareCounter(counter)}
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
                            isOwnerView={true} // This was already correct here
                            onEdit={() => onEditCounter(counter)}
                            onDelete={() => onDeleteCounter(counter)}
                            onRequestToggleArchive={() => onRequestToggleArchive(counter)}
                            onShare={() => onShareCounter(counter)}
                        />
                    ))}
                </Stack>
            );
        }
    };

    return (
        <Stack gap="xl">
            <section>
                <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'}>Active ({countersData.active.length})</Title>
                {renderCounters(countersData.active, "Active")}
            </section>

            {countersData.archived.length > 0 && (
                <section>
                    <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'} mt="xl">Archived ({countersData.archived.length})</Title>
                    {renderCounters(countersData.archived, "Archived")}
                </section>
            )}
        </Stack>
    );
}