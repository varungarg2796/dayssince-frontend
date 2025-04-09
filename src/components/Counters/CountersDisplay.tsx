// src/components/Counters/CountersDisplay.tsx
'use client';

import React from 'react';
import {
  Title,
  Text,
  Stack,
  Loader,
  Alert,
  SimpleGrid,
  Group,
  Divider,
  Box,
  Center
} from '@mantine/core';
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
  viewMode,
}: CountersDisplayProps) {
  const {
    data: countersData,
    isLoading,
    error,
    isError,
  } = useQuery<UserCounters, Error>({
    queryKey: ['myCounters'],
    queryFn: fetchMyCounters,
  });

  if (isLoading) {
    return (
      <Center mt="xl">
        <Group>
          <Loader />
          <Text size="sm" c="dimmed">
            Loading your counters...
          </Text>
        </Group>
      </Center>
    );
  }

  if (isError) {
    return (
      <Alert
        icon={<IconAlertCircle size="1.2rem" />}
        title="Something went wrong"
        color="red"
        mt="xl"
        radius="md"
      >
        Failed to load counters: {error?.message || 'Unknown error'}
      </Alert>
    );
  }

  if (!countersData) {
    return (
      <Center mt="lg">
        <Text c="dimmed">Could not load counter data.</Text>
      </Center>
    );
  }

  const renderCounters = (counters: Counter[], label: string) => {
    if (counters.length === 0) {
      return (
        <Text c="dimmed" size="sm" mt="xs">
          No {label.toLowerCase()} counters found.
        </Text>
      );
    }

    return viewMode === 'grid' ? (
      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: 'sm', md: 'lg' }}
        mt="sm"
      >
        {counters.map((counter) => (
          <CounterCard
            key={counter.id}
            counter={counter}
            isOwnerView
            onEdit={() => onEditCounter(counter)}
            onRequestToggleArchive={() => onRequestToggleArchive(counter)}
            onDelete={() => onDeleteCounter(counter)}
            onShare={() => onShareCounter(counter)}
          />
        ))}
      </SimpleGrid>
    ) : (
      <Stack gap="xs" mt="sm">
        {counters.map((counter) => (
          <CounterListItem
            key={counter.id}
            counter={counter}
            isOwnerView
            onEdit={() => onEditCounter(counter)}
            onDelete={() => onDeleteCounter(counter)}
            onRequestToggleArchive={() => onRequestToggleArchive(counter)}
            onShare={() => onShareCounter(counter)}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Stack gap="xl" py="md">
      <Box>
        <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'}>
          Active Counters ({countersData.active.length})
        </Title>
        {renderCounters(countersData.active, 'Active')}
      </Box>

      {countersData.archived.length > 0 && (
        <>
          <Divider label="Archived" labelPosition="center" my="lg" />
          <Box>
            <Title order={4} mb={viewMode === 'list' ? 'xs' : 'md'}>
              Archived Counters ({countersData.archived.length})
            </Title>
            {renderCounters(countersData.archived, 'Archived')}
          </Box>
        </>
      )}
    </Stack>
  );
}
