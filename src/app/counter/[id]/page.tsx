// src/app/counter/[id]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation'; // Hook to get route params
import { useQuery } from '@tanstack/react-query';
import { fetchSingleCounter } from '@/lib/apiClient';
import { Counter } from '@/types';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
    Container, Title, Text, Loader, Alert, Stack, Group, Paper, Badge, Box, ActionIcon, Tooltip
} from '@mantine/core';
import { IconAlertCircle, IconUserCircle, IconShare3 } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import axios from 'axios'; // Import axios to check for AxiosError

// --- Reusable Timer/Date Logic (Copied from CounterCard - Consider refactoring to hook later) ---
interface TimeDifference { days: number; hours: number; minutes: number; seconds: number; }

function calculateTimeDifference(startDate: Date, endDate: Date): TimeDifference {
  const differenceMs = endDate.getTime() - startDate.getTime();
  if (differenceMs < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(differenceMs / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function TimerDisplay({ time }: { time: TimeDifference }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isSmallScreen = useMediaQuery('(max-width: 450px)');
    return (
        <Group gap={isSmallScreen ? 4 : 'xs'} justify="center" wrap="nowrap">
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'xl' : '2rem'} fw={700} lh={1.1}>{time.days}</Text><Text size="sm" c="dimmed">days</Text></Stack>
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'xl' : '2rem'} fw={700} lh={1.1}>{pad(time.hours)}</Text><Text size="sm" c="dimmed">hours</Text></Stack>
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'xl' : '2rem'} fw={700} lh={1.1}>{pad(time.minutes)}</Text><Text size="sm" c="dimmed">mins</Text></Stack>
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'xl' : '2rem'} fw={700} lh={1.1}>{pad(time.seconds)}</Text><Text size="sm" c="dimmed">secs</Text></Stack>
        </Group>
    );
}

const formatLocalDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(dateString));
    } catch  { return 'Invalid Date'; }
};
// --- End Reusable Logic ---


export default function SingleCounterPage() {
    const params = useParams();
    const id = params?.id as string; // Get ID from URL, assert as string

    // --- Fetch Single Counter Data ---
    const { data: counter, isLoading, error, isError } = useQuery<Counter, Error>({
        // Query key includes the ID to fetch the specific counter
        queryKey: ['singleCounter', id],
        // Only run the query if the ID exists
        queryFn: () => fetchSingleCounter(id),
        enabled: !!id, // Ensure query only runs when id is available
        retry: (failureCount: number, error: unknown) => {
            // Don't retry on 404 (Not Found) or 403 (Forbidden) errors
            if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 403)) {
                return false;
            }
            // Otherwise, retry up to 3 times (React Query default)
            return failureCount < 3;
        }
    });

    // --- Timer State Logic (Adapted from CounterCard) ---
    const isArchived = !!counter?.archivedAt;
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return counter?.startDate ? new Date(counter.startDate) : null; } catch { return null; } }, [counter?.startDate]);
    const archivedDate = useMemo(() => { try { return counter?.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter?.archivedAt]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (counter && !isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
            setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            intervalId = setInterval(() => {
                setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            }, 1000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [startDate, isArchived, counter]); // Added counter dependency

    const archivedTimeDiff = useMemo<TimeDifference>(() => {
        if (counter && isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
            return calculateTimeDifference(startDate, archivedDate);
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [isArchived, startDate, archivedDate, counter]); // Added counter dependency
    // --- End Timer State Logic ---

    // --- Share Handler ---
     const handleShare = () => {
        if (!counter) return;
        const shareUrl = window.location.href; // Get current page URL
        navigator.clipboard.writeText(shareUrl).then(() => {
            notifications.show({ title: 'Link Copied!', message: 'Link to this page copied to clipboard.', color: 'teal' });
        }).catch(err => {
            notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' });
            console.error('Failed to copy share link:', err);
        });
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return (
                <Group justify="center" mt="xl">
                    <Loader /> <Text>Loading counter...</Text>
                </Group>
            );
        }

        if (isError) {
            let errorMessage = 'Failed to load counter.';
             if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = 'Counter not found.';
                } else if (error.response?.status === 403) {
                    errorMessage = 'You do not have permission to view this private counter.';
                } else if (error.message) {
                    errorMessage = `Error: ${error.message}`;
                }
            }
            return (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg">
                    {errorMessage}
                </Alert>
            );
        }

        if (!counter) {
            // Should be caught by error handling, but good to have a fallback
            return <Text c="dimmed" ta="center" mt="xl">Counter data is unavailable.</Text>;
        }

        // --- Display Counter Details ---
        return (
            <Paper shadow="md" p="xl" radius="md" withBorder>
                <Stack gap="lg">
                    {/* Header */}
                    <Box>
                        <Title order={2}>{counter.name}</Title>
                        {counter.user?.username && (
                            <Group gap={4} mt={5}>
                                <IconUserCircle size={16} stroke={1.5} style={{ color: 'var(--mantine-color-dimmed)' }}/>
                                <Text size="sm" c="dimmed">by {counter.user.username}</Text>
                            </Group>
                        )}
                    </Box>

                    {/* Description */}
                    {counter.description && (
                        <Text c="dimmed">{counter.description}</Text>
                    )}

                    {/* Tags */}
                    {counter.tags && counter.tags.length > 0 && (
                        <Group gap="xs" wrap="wrap">
                            {counter.tags.map((tag) => (
                                <Badge key={tag.id} variant="light" radius="sm">
                                    {tag.name}
                                </Badge>
                            ))}
                        </Group>
                    )}

                    {/* Timer/Duration Display */}
                    <Paper withBorder radius="lg" p="lg" bg="var(--mantine-color-gray-0)">
                        {isArchived ? (
                            <>
                                <TimerDisplay time={archivedTimeDiff} />
                                <Text ta="center" size="sm" c="dimmed" mt="xs">
                                    Total duration (Archived on {formatLocalDate(counter.archivedAt)})
                                </Text>
                            </>
                        ) : (
                             <>
                                <TimerDisplay time={currentTimeDiff} />
                                 <Text ta="center" size="sm" c="dimmed" mt="xs">
                                    Time since event started
                                </Text>
                            </>
                        )}
                    </Paper>

                    {/* Dates and Share */}
                    <Group justify="space-between" align="center" mt="md">
                         <Text size="sm" c="dimmed">
                            Started on: {formatLocalDate(counter.startDate)}
                         </Text>
                         {/* Share button only if public and not archived */}
                         {!isArchived && !counter.isPrivate && (
                             <Tooltip label="Copy Link to Counter" withArrow>
                                <ActionIcon variant="default" size="lg" onClick={handleShare} radius="md">
                                    <IconShare3 size="1.1rem" stroke={1.5}/>
                                </ActionIcon>
                             </Tooltip>
                         )}
                    </Group>

                </Stack>
            </Paper>
        );
    };

    return (
        <MainLayout>
            <Container size="md" py="lg"> {/* Use smaller container for single view */}
                {renderContent()}
            </Container>
        </MainLayout>
    );
}