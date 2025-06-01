// src/components/Counters/CounterListItem.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Group, Stack, Text, Badge, ActionIcon, Tooltip, Menu,
    useMantineTheme, useMantineColorScheme, Progress
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Counter } from '@/types';
import {
    IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical,
    IconLock, IconCalendar, IconExternalLink,
    IconTargetArrow, IconTrophy // Added Challenge Icons
} from '@tabler/icons-react';
import Link from 'next/link';
import { SharedTimerDisplay, TimeDifference } from './SharedTimerDisplay';
import dayjs from 'dayjs';

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

const formatListDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString)); }
    catch { return 'Invalid Date'; }
};

interface CounterListItemProps {
    counter: Counter;
    isOwnerView: boolean;
    onEdit?: (counter: Counter) => void;
    onDelete?: (counter: Counter) => void;
    onRequestToggleArchive?: (counter: Counter) => void;
    onShare?: (counter: Counter) => void;
}

export function CounterListItem({
    counter,
    isOwnerView,
    onEdit,
    onDelete,
    onRequestToggleArchive,
    onShare
}: CounterListItemProps) {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isMobile = useMediaQuery('(max-width: 768px)'); // For mobile menu
    const isVerySmallList = useMediaQuery('(max-width: 500px)'); // For even more compact display
    const isArchived = !!counter.archivedAt;

    const linkHref = isOwnerView ? `/counter/${counter.id}` : (counter.slug ? `/c/${counter.slug}` : '#');
    const isLinkable = isOwnerView || (!counter.isPrivate && !!counter.slug);

    const [displayTimeDiff, setDisplayTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return new Date(counter.startDate); } catch { return null; } }, [counter.startDate]);
    const archivedDate = useMemo(() => { try { return counter.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter.archivedAt]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (!isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
            setDisplayTimeDiff(calculateTimeDifference(startDate, new Date()));
            intervalId = setInterval(() => { setDisplayTimeDiff(calculateTimeDifference(startDate, new Date())); }, 1000);
        } else if (isArchived && startDate instanceof Date && archivedDate instanceof Date && !isNaN(startDate.getTime()) && !isNaN(archivedDate.getTime())) {
            setDisplayTimeDiff(calculateTimeDifference(startDate, archivedDate));
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [startDate, isArchived, archivedDate]);

    // Challenge Logic
    const isChallenge = counter.isChallenge === true && counter.challengeDurationDays && counter.challengeDurationDays > 0 && !isArchived;
    let daysSinceChallengeStart = 0;
    let isChallengeAchieved = false;
    let challengeProgressPercent = 0;

    if (isChallenge && startDate) {
        daysSinceChallengeStart = dayjs().diff(dayjs(startDate), 'day');
        isChallengeAchieved = daysSinceChallengeStart >= counter.challengeDurationDays!;
        challengeProgressPercent = Math.min((daysSinceChallengeStart / counter.challengeDurationDays!) * 100, 100);
    }

    const handleShareInternal = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onShare?.(counter); };
    const handleEditInternal = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onEdit?.(counter); };
    const handleDeleteInternal = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onDelete?.(counter); };
    const handleToggleArchiveInternal = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onRequestToggleArchive?.(counter); };

    const sharedIconSize = "1rem";
    const getActionIconProps = (color?: string) => ({
        variant: "subtle" as const,
        size: "sm", // Smaller for list items
        radius: "xl",
        color: color || (colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6]),
        style: { transition: 'color 0.2s ease' }
    });

    const shareButton = onShare && !counter.isPrivate && counter.slug && (
        <Tooltip withinPortal label="Copy Public Link" withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps('teal')} onClick={handleShareInternal}><IconShare3 size={sharedIconSize} stroke={1.5} /></ActionIcon>
        </Tooltip>
    );
    const editButton = isOwnerView && onEdit && (
        <Tooltip withinPortal label="Edit" withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps(theme.primaryColor)} onClick={handleEditInternal}><IconPencil size={sharedIconSize} stroke={1.5} /></ActionIcon>
        </Tooltip>
    );
    const deleteButton = isOwnerView && onDelete && (
        <Tooltip withinPortal label="Delete" withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps("red")} onClick={handleDeleteInternal}><IconTrash size={sharedIconSize} stroke={1.5} /></ActionIcon>
        </Tooltip>
    );
    const archiveButton = isOwnerView && onRequestToggleArchive && (
        <Tooltip withinPortal label={isArchived ? "Unarchive" : "Archive"} withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps("blue")} onClick={handleToggleArchiveInternal}>
                {isArchived ? <IconArchiveOff size={sharedIconSize} stroke={1.5} /> : <IconArchive size={sharedIconSize} stroke={1.5} />}
            </ActionIcon>
        </Tooltip>
    );

    const InnerContent = (
        <Stack style={{ flexGrow: 1, overflow: 'hidden', minWidth: 0 }} gap={2}>
            <Group gap="xs" align="center" wrap="nowrap">
                {isChallenge && (
                    <Tooltip
                        label={isChallengeAchieved ? `Challenge Complete!` : `${counter.challengeDurationDays}-Day Challenge`}
                        withArrow
                        withinPortal
                        openDelay={300}
                    >
                        <ActionIcon variant="transparent" size="xs" color={isChallengeAchieved ? "yellow" : theme.primaryColor} style={{padding:0, marginRight: 2}}>
                           {isChallengeAchieved ? <IconTrophy size={14} /> : <IconTargetArrow size={14} />}
                        </ActionIcon>
                    </Tooltip>
                )}
                {counter.isPrivate && !isChallenge && <Tooltip withinPortal label="Private" openDelay={300}><IconLock size={12} stroke={1.5} color={theme.colors.gray[5]} /></Tooltip>}
                {isArchived && isOwnerView && <Badge variant="outline" color="gray" size="xs" radius="sm">Archived</Badge>}
                <Text fw={500} size="sm" truncate="end" title={counter.name}>{counter.name}</Text>
                {isLinkable && !isOwnerView && (
                    <Tooltip label="View Public Page" withArrow withinPortal openDelay={300}>
                        <IconExternalLink size="0.8rem" stroke={1.5} color={theme.colors.gray[6]} style={{ verticalAlign: 'middle', marginLeft: '2px', flexShrink: 0 }} />
                    </Tooltip>
                )}
            </Group>
            <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" truncate="end">
                    <IconCalendar size={11} stroke={1.5} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                    {formatListDate(counter.startDate)}
                    {counter.user?.username && !isOwnerView ? ` • ${counter.user.username}` : ''}
                </Text>
                {counter.tags?.slice(0, 1).map(t => (<Badge key={t.id} variant="outline" size="xs" radius="sm">{t.name}</Badge>))}
                {counter.tags && counter.tags.length > 1 && (<Tooltip withinPortal label={counter.tags.slice(1).map(t => t.name).join(', ')} withArrow><Badge variant='outline' radius='sm' size="xs">+ {counter.tags.length - 1}</Badge></Tooltip>)}
            </Group>
        </Stack>
    );

    return (
        <Box
            p="xs"
            mb={4}
            style={{
                border: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
                borderRadius: theme.radius.sm,
                backgroundColor: isArchived && isOwnerView
                    ? (colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1])
                    : (colorScheme === 'dark' ? theme.colors.dark[6] : theme.white),
                opacity: isArchived && isOwnerView ? 0.75 : 1,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                    backgroundColor: colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]
                }
            }}
        >
            <Group justify="space-between" wrap="nowrap" gap="sm">
                {isLinkable ? (
                    <Link href={linkHref} passHref style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
                        {InnerContent}
                    </Link>
                ) : InnerContent }

                <Stack gap={2} style={{ flexShrink: 0, minWidth: isChallenge ? (isVerySmallList ? 100: 120) : (isVerySmallList ? 100 : 100), textAlign: 'right' }} align="flex-end">
                    <SharedTimerDisplay time={displayTimeDiff} isArchived={isArchived} size="compact" />
                    {isChallenge && (
                        <Box mt={1} style={{width: '100%'}}>
                            {isChallengeAchieved ? (
                                <Text size="8px" color="yellow.7" fw={600} ta="right">
                                    <IconTrophy size={10} style={{verticalAlign: 'middle', marginRight:2}} /> COMPLETE
                                </Text>
                            ) : (
                                <Group gap={4} justify='flex-end' wrap="nowrap">
                                    <Progress value={challengeProgressPercent} size={5} radius="sm" color={theme.primaryColor} style={{flexGrow:1, maxWidth: '50px'}} />
                                    <Text size="8px" c="dimmed" fw={500}>
                                         {daysSinceChallengeStart}/{counter.challengeDurationDays}
                                    </Text>
                                </Group>
                            )}
                        </Box>
                    )}
                </Stack>

                <Group gap={isMobile ? 0 : 2} wrap="nowrap" justify="flex-end" style={{ flexShrink: 0 }}>
                    {isOwnerView ? (isMobile ? (
                        <Menu shadow="sm" width={160} position="bottom-end" withArrow withinPortal closeOnItemClick>
                            <Menu.Target>
                                <ActionIcon variant="subtle" size="sm" radius="xl" aria-label="More actions" onClick={(e) => e.stopPropagation() }><IconDotsVertical size="0.9rem" stroke={1.5} /></ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown miw={150}>
                                {editButton && <Menu.Item leftSection={<IconPencil size={14} />} onClick={handleEditInternal}>Edit</Menu.Item>}
                                {archiveButton && <Menu.Item leftSection={isArchived ? <IconArchiveOff size={14} /> : <IconArchive size={14} />} onClick={handleToggleArchiveInternal}>{isArchived ? "Unarchive" : "Archive"}</Menu.Item>}
                                {shareButton && <Menu.Item leftSection={<IconShare3 size={14} color={theme.colors.teal[6]} />} onClick={handleShareInternal}>Copy Public Link</Menu.Item>}
                                {(editButton || archiveButton || shareButton) && deleteButton && <Menu.Divider />}
                                {deleteButton && <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDeleteInternal}>Delete</Menu.Item>}
                            </Menu.Dropdown>
                        </Menu>)
                        : (<> {editButton} {archiveButton} {deleteButton} {shareButton} </>))
                        : (shareButton)}
                </Group>
            </Group>
        </Box>
    );
}