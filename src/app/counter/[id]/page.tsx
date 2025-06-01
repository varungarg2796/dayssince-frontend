// src/app/counter/[id]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchSingleCounter } from '@/lib/apiClient';
import { Counter } from '@/types';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
    Container, Title, Text, Loader, Alert, Stack, Group, Paper, Badge, Box, ActionIcon, Tooltip, Button,
    Center, Progress, // Added Progress
    useMantineTheme, ThemeIcon // Added ThemeIcon
} from '@mantine/core';
import {
    IconAlertCircle, IconShare3, IconArrowLeft, IconLock, IconClock,
    IconTargetArrow, IconTrophy // Added Challenge Icons
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { motion } from 'framer-motion';
import { SharedTimerDisplay, TimeDifference } from '@/components/Counters/SharedTimerDisplay';
// Import Confetti and useViewportSize if you re-add confetti later
// import Confetti from 'react-confetti';
// import { useViewportSize } from '@mantine/hooks';
import dayjs from 'dayjs';

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
    const router = useRouter();
    const theme = useMantineTheme();
    // const { width: windowWidth, height: windowHeight } = useViewportSize(); // For confetti later
    const id = params?.id as string;

    // const [showConfetti, setShowConfetti] = useState(false); // For confetti later
    // const [confettiHasRun, setConfettiHasRun] = useState(false); // For confetti later

    const { data: counter, isLoading, error, isError, isFetching } = useQuery<Counter, Error>({
        queryKey: ['singleOwnedCounter', id],
        queryFn: () => {
            if (!id) throw new Error("Counter ID is required");
            return fetchSingleCounter(id);
        },
        enabled: !!id,
        retry: (failureCount: number, queryError: unknown) => {
            if (axios.isAxiosError(queryError) && (queryError.response?.status === 404 || queryError.response?.status === 403)) {
                return false;
            }
            return failureCount < 2;
        },
        staleTime: 1000 * 60
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

    // --- Challenge Logic ---
    const isChallenge = counter?.isChallenge === true && counter?.challengeDurationDays && counter.challengeDurationDays > 0 && !isArchived;
    let daysSinceChallengeStart = 0;
    let challengeProgressPercent = 0;
    let isChallengeAchieved = false;

    if (isChallenge && startDate && counter?.challengeDurationDays) {
        daysSinceChallengeStart = dayjs().diff(dayjs(startDate), 'day');
        challengeProgressPercent = Math.min((daysSinceChallengeStart / counter.challengeDurationDays) * 100, 100);
        isChallengeAchieved = daysSinceChallengeStart >= counter.challengeDurationDays;
    }

    // Confetti useEffect (can be re-added later)
    // useEffect(() => {
    //     if (isChallengeAchieved && counter && !confettiHasRun) {
    //         const confettiKey = `confetti_shown_counter_${counter.id}`;
    //         if (typeof window !== 'undefined') {
    //             if (!localStorage.getItem(confettiKey)) {
    //                 setShowConfetti(true);
    //                 localStorage.setItem(confettiKey, 'true');
    //                 setConfettiHasRun(true);
    //                 setTimeout(() => setShowConfetti(false), 7000);
    //             } else {
    //                 setConfettiHasRun(true);
    //             }
    //         }
    //     }
    // }, [isChallengeAchieved, counter, confettiHasRun]);
    // --- END Challenge Logic ---


    const handleShare = () => {
        if (!counter || counter.isPrivate || !counter.slug) {
             notifications.show({ title: 'Cannot Share', message: 'This counter is private or does not have a public link.', color: 'orange'});
             return;
        }
        const shareUrl = `${window.location.origin}/c/${counter.slug}`;
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
            let errorTitle = "Error!"; // Default title
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = 'The counter you are looking for was not found. It might have been deleted.';
                    errorTitle = "Counter Not Found";
                    // notFound(); // Optionally call Next.js notFound for a full 404 page
                } else if (error.response?.status === 403) {
                    errorMessage = 'You do not have permission to view this counter. It might belong to another user or require different access rights.';
                    errorTitle = "Access Denied";
                    // notFound();
                } else if (error.message) {
                    errorMessage = `An error occurred: ${error.message}`;
                }
            }
            return (
                <Alert icon={<IconAlertCircle size="1rem" />} title={errorTitle} color="red" mt="lg" radius="md">
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
            {/* {showConfetti && <Confetti width={windowWidth} height={windowHeight} recycle={false} numberOfPieces={300} />} */}
            <Paper shadow="lg" radius="lg" withBorder p={{base: 'md', sm: 'xl'}}>
                <Stack gap="lg">
                    <Group justify="space-between" align="center">
                        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()} size="sm">
                            Back to My Counters
                        </Button>
                        {/* Add Edit/Delete/Archive buttons here, likely in a Menu for owned counters */}
                        {/* This is where you'd place the ActionIcon Menu from HomePage for this specific counter */}
                    </Group>

                    <Box ta="center">
                        <Group justify="center" align="center" gap="xs" mb="xs">
                            {isChallenge && (
                                <ThemeIcon variant="light" color={isChallengeAchieved ? "yellow" : theme.primaryColor} size="lg" radius="md">
                                    {isChallengeAchieved ? <IconTrophy size="1.4rem" /> : <IconTargetArrow size="1.4rem" />}
                                </ThemeIcon>
                            )}
                            {counter.isPrivate && (
                                <Tooltip label="This counter is private" withArrow withinPortal>
                                    <IconLock size="1.4rem" style={{color: theme.colors.gray[6]}} />
                                </Tooltip>
                            )}
                            <Title order={2}>{counter.name}</Title>
                        </Group>
                        {isChallenge && counter.challengeDurationDays && (
                            <Text size="sm" c="dimmed" fs="italic">
                                A {counter.challengeDurationDays}-Day Challenge
                                {isChallengeAchieved && " - Completed!"}
                            </Text>
                        )}
                    </Box>

                    {counter.description && <Text c="dimmed" ta="center" fz="sm" style={{fontStyle: 'italic'}}>{counter.description}</Text>}

                    {counter.tags?.length > 0 && (
                        <Group gap="xs" wrap="wrap" justify="center">
                            {counter.tags.map(tag => (
                                <Badge key={tag.id} variant="light" radius="sm" size="sm">{tag.name}</Badge>
                            ))}
                        </Group>
                    )}

                    {isChallenge && !isArchived && counter.challengeDurationDays && (
                        <Box my="md">
                            <Group justify="space-between" mb={4}>
                                <Text size="xs" fw={500} c="dimmed">Challenge Progress:</Text>
                                <Text size="xs" fw={500} c={theme.primaryColor}>
                                    {daysSinceChallengeStart >=0 ? Math.min(daysSinceChallengeStart, counter.challengeDurationDays) : 0} / {counter.challengeDurationDays} Days
                                </Text>
                            </Group>
                            <Progress value={challengeProgressPercent} size="md" radius="sm" striped animated={!isChallengeAchieved && challengeProgressPercent < 100} color={isChallengeAchieved ? "yellow" : theme.primaryColor} />
                            {isChallengeAchieved && (
                                <Text ta="center" mt="xs" size="sm" fw={500} color="yellow.7">
                                    Congratulations! Challenge Completed! <IconTrophy size={16} style={{verticalAlign: 'bottom'}}/>
                                </Text>
                            )}
                        </Box>
                    )}

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <Paper withBorder radius="lg" p="lg" bg={theme.colors.gray[0]} my="md">
                             <Text size="sm" fw={500} c="dimmed" ta="center" mb="sm" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                                <IconClock size={14} style={{verticalAlign: 'middle', marginRight: 4}}/>
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
                        {!counter.isPrivate && counter.slug && ( // Show share button only if counter is public and has a slug
                            <Tooltip label="Copy Public Link" withArrow withinPortal>
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