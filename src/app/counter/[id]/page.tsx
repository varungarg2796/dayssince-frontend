// src/app/counter/[id]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter, notFound
import { useQuery } from '@tanstack/react-query';
import { fetchSingleCounter } from '@/lib/apiClient'; // Assuming this fetches the *owned* counter
import { Counter } from '@/types';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
    Container, Title, Text, Loader, Alert, Stack, Group, Paper, Badge, Box, ActionIcon, Tooltip, Button,
    Center
} from '@mantine/core';
import { IconAlertCircle, IconShare3, IconArrowLeft, IconLock } from '@tabler/icons-react'; // Added IconArrowLeft, IconLock
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { motion } from 'framer-motion';
// Import the SharedTimerDisplay and its TimeDifference interface
import { SharedTimerDisplay, TimeDifference } from '@/components/Counters/SharedTimerDisplay'; // Adjust path

// Helper function to calculate time difference
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
        return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(dateString));
    } catch  { return 'Invalid Date'; }
};


export default function SingleCounterPage() {
    const params = useParams();
    const router = useRouter(); // For back button
    const id = params?.id as string;

    const { data: counter, isLoading, error, isError, isFetching } = useQuery<Counter, Error>({
        queryKey: ['singleOwnedCounter', id], // Changed queryKey slightly for owned
        queryFn: () => {
            if (!id) throw new Error("Counter ID is required");
            return fetchSingleCounter(id);
        },
        enabled: !!id,
        retry: (failureCount: number, error: unknown) => {
            if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 403)) {
                return false;
            }
            return failureCount < 2; // Reduced retries
        },
        staleTime: 1000 * 60 // 1 minute
    });

    const isArchived = !!counter?.archivedAt;
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return counter?.startDate ? new Date(counter.startDate) : null; } catch { return null; } }, [counter?.startDate]);
    const archivedDate = useMemo(() => { try { return counter?.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter?.archivedAt]);

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

    const finalArchivedTimeDiff = useMemo<TimeDifference>(() => {
        if (counter && isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
            return calculateTimeDifferenceLocal(startDate, archivedDate);
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [isArchived, startDate, archivedDate, counter]);

    const handleShare = () => {
        if (!counter || counter.isPrivate || !counter.slug) {
             notifications.show({ title: 'Cannot Share', message: 'This counter is private or does not have a public link.', color: 'orange'});
             return;
        }
        const shareUrl = `${window.location.origin}/c/${counter.slug}`; // Always share the public /c/ URL
        navigator.clipboard.writeText(shareUrl).then(() => {
            notifications.show({ title: 'Link Copied!', message: 'Public link copied to clipboard.', color: 'teal', autoClose: 3000 });
        }).catch(err => {
            notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' });
            console.error('Failed to copy share link:', err);
        });
    };

    const renderContent = () => {
        if (isLoading || (isFetching && !counter && !error)) {
            return <Center style={{minHeight: '50vh'}}><Loader size="lg" /><Text ml="md">Loading counter...</Text></Center>;
        }

        if (isError) {
            let errorMessage = 'Failed to load counter.';
            let title = "Error!";
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = 'The counter you are looking for was not found. It might have been deleted.';
                    title = "Counter Not Found";
                    // Optionally trigger Next.js notFound() for a proper 404 page
                    // notFound(); return null;
                } else if (error.response?.status === 403) {
                    errorMessage = 'You do not have permission to view this counter. It might belong to another user or require different access rights.';
                    title = "Access Denied";
                    // notFound(); return null;
                } else if (error.message) {
                    errorMessage = `An error occurred: ${error.message}`;
                }
            }
            return (
                <Alert icon={<IconAlertCircle size="1rem" />} title={title} color="red" mt="lg" radius="md">
                    {errorMessage}
                </Alert>
            );
        }

        if (!counter) {
            return <Text c="dimmed" ta="center" mt="xl">Counter data is unavailable. It might have been deleted.</Text>;
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Paper shadow="lg" radius="lg" withBorder p={{base: 'md', sm: 'xl'}}>
                <Stack gap="lg">
                    <Group justify="space-between" align="center">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => router.back()} // Or router.push('/home')
                            size="compact"
                        >
                            Back to My Counters
                        </Button>
                        {/* Potentially Edit/Delete buttons could go here if not in a menu */}
                    </Group>

                    <Box>
                        <Group justify="center" align="center" gap="xs">
                            {counter.isPrivate && (
                                <Tooltip label="This counter is private" withArrow withinPortal>
                                    <IconLock size={20} style={{ color: 'var(--mantine-color-dimmed)'}} />
                                </Tooltip>
                            )}
                            <Title order={2} ta="center" mb="xs">{counter.name}</Title>
                        </Group>
                        {/* User info isn't typically shown for one's own counter view like this, but if needed: */}
                        {/* {counter.user?.username && (
                            <Group gap={4} mt={5} justify="center">
                                <IconUserCircle size={16} />
                                <Text size="sm" c="dimmed">by {counter.user.username}</Text>
                            </Group>
                        )} */}
                    </Box>

                    {counter.description && <Text c="dimmed" ta="center" fz="sm" style={{fontStyle: 'italic'}}>{counter.description}</Text>}

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
                        <Paper withBorder radius="lg" p="lg" my="md">
                             <Text size="sm" fw={500} c="dimmed" ta="center" mb="sm" tt="uppercase">
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
                        {!counter.isPrivate && counter.slug && (
                            <Tooltip label="Copy Public Link" withArrow withinPortal>
                                <ActionIcon variant="light" size="lg" onClick={handleShare} radius="md" color="blue">
                                    <IconShare3 size="1.1rem" stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                     {/* TODO: Add Edit/Archive/Delete Actions for owned counter view */}
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