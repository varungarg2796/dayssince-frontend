// src/app/c/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchCounterBySlugPublic } from '@/lib/apiClient';
import { Counter } from '@/types';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
    Container, Title, Text, Loader, Alert, Stack, Group, Paper, Badge, Box, ActionIcon, Tooltip
} from '@mantine/core';
import { IconAlertCircle, IconUserCircle, IconShare3 } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

// Timer/Date Logic (Should be moved to utils)
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
    try { return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(dateString)); }
    catch { return 'Invalid Date'; }
};

export default function PublicCounterPage() {
    const params = useParams();
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
        staleTime: 1000 * 60 * 2
    });

    const isArchived = !!counter?.archivedAt;
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return counter?.startDate ? new Date(counter.startDate) : null; } catch { return null; } }, [counter?.startDate]);
    const archivedDate = useMemo(() => { try { return counter?.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter?.archivedAt]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (counter && !isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
            setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            intervalId = setInterval(() => { setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); }, 1000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [startDate, isArchived, counter]);

    const archivedTimeDiff = useMemo<TimeDifference>(() => {
        if (counter && isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
            return calculateTimeDifference(startDate, archivedDate);
        } return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [isArchived, startDate, archivedDate, counter]);

     const handleShare = () => {
        if (!counter || !counter.slug) return;
        const shareUrl = `${window.location.origin}/c/${counter.slug}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            notifications.show({ title: 'Link Copied!', message: 'Link to this page copied.', color: 'teal' });
        }).catch(err => {
            notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' });
            console.error('Failed to copy share link:', err);
        });
    };

    const renderContent = () => {
        if (isLoading || (isFetching && !counter)) {
            return <Group justify="center" mt="xl"><Loader /> <Text>Loading counter...</Text></Group>;
        }
        if (isError && axios.isAxiosError(error) && error.response?.status === 404) {
             notFound();
        }
        if (isError) {
            let errorMessage = 'Failed to load counter.';
             if (axios.isAxiosError(error) && error.message) { errorMessage = `Error: ${error.message}`; }
            return <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg"> {errorMessage} </Alert>;
        }
        if (!counter) {
            return <Text c="dimmed" ta="center" mt="xl">Counter data is unavailable.</Text>;
        }

        return (
            <Paper shadow="md" p="xl" radius="md" withBorder>
                <Stack gap="lg">
                    <Box>
                        <Title order={2}>{counter.name}</Title>
                        {counter.user?.username && ( <Group gap={4} mt={5}> <IconUserCircle size={16}/> <Text size="sm" c="dimmed">by {counter.user.username}</Text> </Group> )}
                    </Box>
                    {counter.description && <Text c="dimmed">{counter.description}</Text>}
                    {counter.tags && counter.tags.length > 0 && ( <Group gap="xs" wrap="wrap"> {counter.tags.map((tag) => ( <Badge key={tag.id} variant="light" radius="sm"> {tag.name} </Badge> ))} </Group> )}
                    <Paper withBorder radius="lg" p="lg" bg="var(--mantine-color-gray-0)">
                         {isArchived ? ( <> <TimerDisplay time={archivedTimeDiff} /> <Text ta="center" size="sm" c="dimmed" mt="xs"> Total duration (Archived on {formatLocalDate(counter.archivedAt)}) </Text> </> )
                          : ( <> <TimerDisplay time={currentTimeDiff} /> <Text ta="center" size="sm" c="dimmed" mt="xs"> Time since event started </Text> </> )}
                     </Paper>
                    <Group justify="space-between" align="center" mt="md">
                         <Text size="sm" c="dimmed"> Started on: {formatLocalDate(counter.startDate)} </Text>
                         {!isArchived && !counter.isPrivate && counter.slug && (
                             <Tooltip label="Copy Link to Counter" withArrow>
                                <ActionIcon variant="default" size="lg" onClick={handleShare} radius="md"> <IconShare3 size="1.1rem" stroke={1.5}/> </ActionIcon>
                             </Tooltip>
                         )}
                    </Group>
                </Stack>
            </Paper>
        );
    };

    return (
        <MainLayout> <Container size="md" py="lg"> {renderContent()} </Container> </MainLayout>
    );
}