// src/app/c/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation'; // Added useRouter
import { useQuery } from '@tanstack/react-query';
import { fetchCounterBySlugPublic } from '@/lib/apiClient';
import { Counter } from '@/types';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
  Container, Title, Text, Loader, Alert, Stack, Group, Paper, Badge, Box, ActionIcon, Tooltip, Button,
  Center
} from '@mantine/core';
import { IconAlertCircle, IconUserCircle, IconShare3, IconArrowLeft } from '@tabler/icons-react'; // Added IconArrowLeft
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { motion } from 'framer-motion';
import { SharedTimerDisplay, TimeDifference } from '@/components/Counters/SharedTimerDisplay';

// Helper function to calculate time difference (can be moved to a util if not already)
const calculateTimeDifferenceLocal = (startDate: Date, endDate: Date): TimeDifference => {
  const differenceMs = endDate.getTime() - startDate.getTime();
  if (differenceMs < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(differenceMs / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const formatLocalDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }).format(new Date(dateString));
  } catch {
    return 'Invalid Date';
  }
};

export default function PublicCounterPage() {
  const params = useParams();
  const router = useRouter(); // For back button
  const slug = typeof params?.slug === 'string' ? params.slug : null;

  const { data: counter, isLoading, error, isError, isFetching } = useQuery<Counter, Error>({
    queryKey: ['publicCounter', slug],
    queryFn: () => {
      if (!slug) throw new Error("Slug is required");
      return fetchCounterBySlugPublic(slug);
    },
    enabled: !!slug,
    retry: (failureCount: number, error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  const isArchived = !!counter?.archivedAt;
  const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const startDate = useMemo(() => {
    try { return counter?.startDate ? new Date(counter.startDate) : null; } catch { return null; }
  }, [counter?.startDate]);

  const archivedDate = useMemo(() => {
    try { return counter?.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; }
  }, [counter?.archivedAt]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (counter && !isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
      setCurrentTimeDiff(calculateTimeDifferenceLocal(startDate, new Date()));
      intervalId = setInterval(() => {
        setCurrentTimeDiff(calculateTimeDifferenceLocal(startDate, new Date()));
      }, 1000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [startDate, isArchived, counter]);

  const finalArchivedTimeDiff = useMemo<TimeDifference>(() => { // Renamed for clarity
    if (counter && isArchived && startDate instanceof Date && archivedDate instanceof Date &&
      !isNaN(startDate.getTime()) && !isNaN(archivedDate.getTime())) {
      return calculateTimeDifferenceLocal(startDate, archivedDate);
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }, [isArchived, startDate, archivedDate, counter]);

  const handleShare = () => {
    if (!counter?.slug) return;
    const shareUrl = `${window.location.origin}/c/${counter.slug}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => notifications.show({ title: 'Link Copied!', message: 'Link to this page copied to clipboard.', color: 'teal', autoClose: 3000 }))
      .catch(err => {
        notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' });
        console.error('Failed to copy share link:', err);
      });
  };

  const renderContent = () => {
    if (isLoading || (isFetching && !counter && !error)) { // Show loader if fetching and no data/error yet
      return <Center style={{ minHeight: '50vh' }}><Loader size="lg" /><Text ml="md">Loading counter...</Text></Center>;
    }

    if (isError && axios.isAxiosError(error) && error.response?.status === 404) {
      notFound(); // Trigger Next.js 404 page
      return null; // Or a custom 404 component
    }

    if (isError) {
      const errorMessage = axios.isAxiosError(error) && error.message
        ? `Error: ${error.message}`
        : 'Failed to load counter details.';
      return (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg" radius="md">
          {errorMessage}
        </Alert>
      );
    }

    if (!counter) {
      // This case might be hit if query finishes but data is undefined for some reason not caught by error states
      return <Text c="dimmed" ta="center" mt="xl">Counter data is unavailable. It might have been deleted or made private.</Text>;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Paper shadow="lg" radius="lg" withBorder p={{ base: 'md', sm: 'xl' }}>
          <Stack gap="lg">
            <Group justify="space-between" align="center">
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.back()} // Or router.push('/explore')
                size="sm"
              >
                Back to Explore
              </Button>
            </Group>

            <Box>
              <Title order={2} ta="center" mb="xs">{counter.name}</Title>
              {counter.user?.username && (
                <Group gap={4} mt={5} justify="center">
                  <IconUserCircle size={16} />
                  <Text size="sm" c="dimmed">by {counter.user.username}</Text>
                </Group>
              )}
            </Box>

            {counter.description && <Text c="dimmed" ta="center" fz="sm" style={{ fontStyle: 'italic' }}>{counter.description}</Text>}

            {counter.tags?.length > 0 && (
              <Group gap="xs" wrap="wrap" justify="center">
                {counter.tags.map(tag => (
                  <Badge key={tag.id} variant="light" radius="sm" size="sm">{tag.name}</Badge>
                ))}
              </Group>
            )}

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Paper
                withBorder
                radius="lg"
                p="lg"
                my="md"
              >                <Text size="sm" fw={500} c="dimmed" ta="center" mb="sm" tt="uppercase">
                  {isArchived ? 'Final Duration' : 'Time Elapsed Since Event'}
                </Text>
                <SharedTimerDisplay
                  time={isArchived ? finalArchivedTimeDiff : currentTimeDiff}
                  isArchived={isArchived}
                  size="large"
                />
                {isArchived && (
                  <Text ta="center" size="xs" c="dimmed" mt="sm">
                    Archived on {formatLocalDate(counter.archivedAt)}
                  </Text>
                )}
              </Paper>
            </motion.div>

            <Group justify="space-between" align="center" mt="md">
              <Text size="sm" c="dimmed">Event Started: {formatLocalDate(counter.startDate)}</Text>
              {!counter.isPrivate && counter.slug && ( // Share button available if public and has slug
                <Tooltip label="Copy Link to Counter" withArrow withinPortal>
                  <ActionIcon variant="light" size="lg" onClick={handleShare} radius="md" color="blue">
                    <IconShare3 size="1.1rem" stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Stack>
        </Paper>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <Container size="md" py="xl">
        {renderContent()}
      </Container>
    </MainLayout>
  );
}