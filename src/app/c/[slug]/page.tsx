// src/app/c/[slug]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchCounterBySlugPublic } from '@/lib/apiClient';
import { Counter } from '@/types';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
  Container, Title, Text, Loader, Alert, Stack, Group, Paper, Badge, Box, Tooltip, Button,
  Center, Progress, useMantineTheme, ThemeIcon, TextInput // Added TextInput
} from '@mantine/core';
import {
    IconAlertCircle, IconUserCircle, IconArrowLeft,
    IconTargetArrow, IconTrophy, IconClock, IconCopy, IconCheck} from '@tabler/icons-react';
// import { notifications } from '@mantine/notifications'; // Using clipboard tooltip
import axios from 'axios';
import { motion } from 'framer-motion';
import { SharedTimerDisplay, TimeDifference } from '@/components/Counters/SharedTimerDisplay';
import Confetti from 'react-confetti';
import { useViewportSize, useClipboard } from '@mantine/hooks';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

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
  const router = useRouter();
  const theme = useMantineTheme();
  const { width: windowWidth, height: windowHeight } = useViewportSize();
  const slug = typeof params?.slug === 'string' ? params.slug : null;

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiHasRun, setConfettiHasRun] = useState(false);
  const [sharableUrl, setSharableUrl] = useState('');

  const clipboard = useClipboard({ timeout: 2000 });

  const { data: counter, isLoading, error, isError, isFetching } = useQuery<Counter, Error>({
    queryKey: ['publicCounter', slug],
    queryFn: () => {
      if (!slug) throw new Error("Slug is required");
      return fetchCounterBySlugPublic(slug);
    },
    enabled: !!slug,
    retry: (failureCount: number, queryError: unknown) => {
      if (axios.isAxiosError(queryError) && queryError.response?.status === 404) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 2
  });

  useEffect(() => {
    if (counter && counter.slug && typeof window !== 'undefined') {
      setSharableUrl(`${window.location.origin}/c/${counter.slug}`);
    }
  }, [counter]);


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
    if (counter && startDate instanceof Date && !isNaN(startDate.getTime())) {
      if (!isArchived) {
        setCurrentTimeDiff(calculateTimeDifferenceLocal(startDate, new Date()));
        intervalId = setInterval(() => {
          setCurrentTimeDiff(calculateTimeDifferenceLocal(startDate, new Date()));
        }, 1000);
      } else if (archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
        setCurrentTimeDiff(calculateTimeDifferenceLocal(startDate, archivedDate));
      } else {
        setCurrentTimeDiff({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    } else {
      setCurrentTimeDiff({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [startDate, isArchived, archivedDate, counter]);

  const finalArchivedTimeDiff = useMemo<TimeDifference>(() => {
    if (counter && isArchived && startDate instanceof Date && archivedDate instanceof Date &&
      !isNaN(startDate.getTime()) && !isNaN(archivedDate.getTime())) {
      return calculateTimeDifferenceLocal(startDate, archivedDate);
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }, [isArchived, startDate, archivedDate, counter]);

  const wasChallengeWhenArchived = counter?.isChallenge === true && counter?.challengeDurationDays && counter.challengeDurationDays > 0 && isArchived;
  const isActiveChallenge = counter?.isChallenge === true && counter?.challengeDurationDays && counter.challengeDurationDays > 0 && !isArchived;

  let daysSinceChallengeStart = 0;
  let challengeProgressPercent = 0;
  let isChallengeAchievedOnPageLoad = false; // For active challenges
  let wasChallengeAchievedBeforeArchive = false; // For archived challenges

  if (startDate && counter?.challengeDurationDays) {
      if (isActiveChallenge) {
          daysSinceChallengeStart = dayjs().diff(dayjs(startDate), 'day');
          challengeProgressPercent = Math.min((daysSinceChallengeStart / counter.challengeDurationDays) * 100, 100);
          isChallengeAchievedOnPageLoad = daysSinceChallengeStart >= counter.challengeDurationDays;
      } else if (wasChallengeWhenArchived && archivedDate) {
          const challengeEndDate = dayjs(startDate).add(counter.challengeDurationDays, 'day');
          wasChallengeAchievedBeforeArchive = dayjs(archivedDate).isSameOrAfter(challengeEndDate);
      }
  }

  useEffect(() => {
    if (isChallengeAchievedOnPageLoad && counter && !confettiHasRun) {
      const confettiKey = `confetti_shown_counter_${counter.id}`;
      if (typeof window !== 'undefined') {
        if (!localStorage.getItem(confettiKey)) {
          setShowConfetti(true);
          localStorage.setItem(confettiKey, 'true');
          setConfettiHasRun(true);
          const timer = setTimeout(() => setShowConfetti(false), 7000);
          return () => clearTimeout(timer);
        } else {
          setConfettiHasRun(true);
        }
      }
    }
  }, [isChallengeAchievedOnPageLoad, counter, confettiHasRun]);


  const renderContent = () => {
    if (isLoading || (isFetching && !counter && !error)) {
      return <Center style={{minHeight: '50vh'}}><Loader size="lg" /><Text ml="md">Loading counter...</Text></Center>;
    }

    if (isError && axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
      return null;
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
      return <Text c="dimmed" ta="center" mt="xl">Counter data is unavailable. It might have been deleted or made private.</Text>;
    }

    const displayTime = isArchived ? finalArchivedTimeDiff : currentTimeDiff;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {showConfetti && (
            <Confetti
                width={windowWidth}
                height={windowHeight}
                recycle={false}
                numberOfPieces={isChallengeAchievedOnPageLoad ? 300 : 0}
                gravity={0.1}
                initialVelocityY={20}
                colors={[theme.colors.deepBlue[5], theme.colors.vibrantTeal[5], theme.colors.yellow[5], theme.white]}
                style={{zIndex: 9999}}
            />
        )}

        <Paper shadow="lg" radius="lg" withBorder p={{base: 'md', sm: 'xl'}}>
          <Stack gap="xl">
            <Group justify="space-between" align="center">
              <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/explore')} size="sm">
                Back to Explore
              </Button>
            </Group>

            <Box ta="center">
              <Group justify="center" align="center" gap="xs" mb="xs">
                  {(isActiveChallenge || wasChallengeWhenArchived) && (
                      <ThemeIcon variant="light"
                                 color={(isChallengeAchievedOnPageLoad || wasChallengeAchievedBeforeArchive) ? "yellow" : theme.primaryColor}
                                 size="lg" radius="md">
                          {(isChallengeAchievedOnPageLoad || wasChallengeAchievedBeforeArchive) ? <IconTrophy size="1.4rem" /> : <IconTargetArrow size="1.4rem" />}
                      </ThemeIcon>
                  )}
                  {/* Public page, so counter.isPrivate should be false if this page is accessible */}
                  {/* If it could somehow be private and accessible, you'd add a lock icon */}
                  <Title order={2}>{counter.name}</Title>
              </Group>
              {(isActiveChallenge || wasChallengeWhenArchived) && counter.challengeDurationDays && (
                <Text size="sm" c="dimmed" fs="italic">
                    {counter.challengeDurationDays}-Day Challenge
                    {isArchived && (wasChallengeAchievedBeforeArchive ? " (Completed Before Archive)" : " (Incomplete Before Archive)")}
                    {!isArchived && isChallengeAchievedOnPageLoad && " - Completed!"}
                </Text>
              )}
              {counter.user?.username && (
                <Group gap={4} mt={(isActiveChallenge || wasChallengeWhenArchived) ? 'xs': 5} justify="center">
                  <IconUserCircle size={16} />
                  <Text size="sm" c="dimmed">by {counter.user.username}</Text>
                </Group>
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

            {isActiveChallenge && counter.challengeDurationDays && (
                <Box my="md">
                    <Group justify="space-between" mb={4}>
                        <Text size="xs" fw={500} c="dimmed">Challenge Progress:</Text>
                        <Text size="xs" fw={500} c={theme.primaryColor}>
                            {daysSinceChallengeStart >= 0 ? Math.min(daysSinceChallengeStart, counter.challengeDurationDays) : 0} / {counter.challengeDurationDays} Days
                        </Text>
                    </Group>
                    <Progress value={challengeProgressPercent} size="md" radius="sm" striped animated={!isChallengeAchievedOnPageLoad && challengeProgressPercent < 100} color={isChallengeAchievedOnPageLoad ? "yellow" : theme.primaryColor} />
                    {isChallengeAchievedOnPageLoad && (
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
              <Paper withBorder radius="lg" p="lg" bg={ theme.colors.gray[0]} my="md">
                <Text size="sm" fw={500} c="dimmed" ta="center" mb="sm" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                    <IconClock size={14} style={{verticalAlign: 'middle', marginRight: 4}}/>
                    {isArchived ? 'Final Duration' : 'Time Elapsed Since Event'}
                </Text>
                <SharedTimerDisplay
                    time={displayTime}
                    isArchived={isArchived}
                    size="large"
                />
                {wasChallengeWhenArchived && counter.challengeDurationDays && (
                    <Text ta="center" size="xs" c="dimmed" mt="sm">
                        This was a {counter.challengeDurationDays}-day challenge.
                        {wasChallengeAchievedBeforeArchive
                            ? <Text span color="green" fw={500}> It was completed before archiving.</Text>
                            : <Text span color="orange" fw={500}> It was not completed before archiving.</Text>
                        }
                    </Text>
                )}
                {isArchived && !wasChallengeWhenArchived && (
                    <Text ta="center" size="xs" c="dimmed" mt="sm">
                      Archived on {formatLocalDate(counter.archivedAt)}
                    </Text>
                )}
              </Paper>
            </motion.div>

            <Text size="sm" c="dimmed">Event Started: {formatLocalDate(counter.startDate)}</Text>

            {/* Shareable URL Section Integrated Here */}
            {/* On a public page, counter.isPrivate should be false. We ensure slug & URL are set. */}
            {sharableUrl && (
              <Paper mt="lg" p="md" withBorder radius="md" bg={theme.colors.gray[1]}>
                <Stack gap="xs">
                    <Text fw={500} size="sm" c={ theme.colors.dark[2]}>
                        Share this Public Counter:
                    </Text>
                    <Group wrap="nowrap">
                        <TextInput
                            value={sharableUrl}
                            readOnly
                            variant="filled"
                            radius="sm"
                            style={{ flexGrow: 1 }}
                            aria-label="Sharable counter URL"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <Tooltip label={clipboard.copied ? 'Link Copied!' : 'Copy Link'} color={clipboard.copied ? 'teal' : undefined} withArrow position="top" withinPortal>
                        <Button
                            variant={clipboard.copied ? "filled" : "light"}
                            onClick={() => clipboard.copy(sharableUrl)}
                            aria-label="Copy counter URL to clipboard"
                            color={clipboard.copied ? 'teal' : theme.primaryColor}
                            px="sm"
                            leftSection={clipboard.copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                        >
                            {clipboard.copied ? 'Copied' : 'Copy'}
                        </Button>
                        </Tooltip>
                    </Group>
                </Stack>
              </Paper>
            )}
            {/* END Shareable URL Section */}

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