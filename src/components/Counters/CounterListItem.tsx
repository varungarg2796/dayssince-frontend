// src/components/Counters/CounterListItem.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Group, Stack, Text, Badge, ActionIcon, Tooltip, Menu,
    useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Counter } from '@/types';
import {
    IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical,
    IconLock, IconCalendar, IconExternalLink
} from '@tabler/icons-react';
import Link from 'next/link';

// Timer/Date Logic
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

const formatListDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString)); }
    catch { return 'Invalid Date'; }
};

function CompactTimerDisplay({ time, isArchived = false }: { time: TimeDifference, isArchived?: boolean }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isVerySmallScreen = useMediaQuery('(max-width: 500px)');
    const theme = useMantineTheme();
    const NumberText = ({ children }: { children: React.ReactNode }) => (<Text size={isVerySmallScreen ? 'sm' : 'md'} fw={600} lh={1.1} c={isArchived ? theme.colors.gray[6] : theme.primaryColor}> {children} </Text>);
    const LabelText = ({ children }: { children: React.ReactNode }) => (<Text size="9px" c="dimmed" tt="uppercase" fw={500}> {children} </Text>);
    const separator = ':';
    return (
        <Group gap={isVerySmallScreen ? 4 : 'xs'} justify="flex-start" wrap="nowrap" my={2}>
            {time.days > 0 && (<><Stack align="center" gap={0}><NumberText>{time.days}</NumberText><LabelText>d</LabelText></Stack><Text size="xs" c="dimmed" pt={2}>{separator}</Text></>)}
            <Stack align="center" gap={0}><NumberText>{pad(time.hours)}</NumberText><LabelText>h</LabelText></Stack><Text size="xs" c="dimmed" pt={2}>{separator}</Text>
            <Stack align="center" gap={0}><NumberText>{pad(time.minutes)}</NumberText><LabelText>m</LabelText></Stack>
            {!isArchived && (<><Text size="xs" c="dimmed" pt={2}>{separator}</Text><Stack align="center" gap={0}><NumberText>{pad(time.seconds)}</NumberText><LabelText>s</LabelText></Stack></>)}
        </Group>
    );
}
// End Timer Logic

interface CounterListItemProps {
    counter: Counter;
    isOwnerView: boolean; // Indicate context
    onEdit?: () => void;
    onDelete?: () => void;
    onRequestToggleArchive?: () => void;
    onShare?: () => void;
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
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isArchived = !!counter.archivedAt;

    // Determine link target based on context
    const linkHref = isOwnerView ? `/counter/${counter.id}` : `/c/${counter.slug}`;
    // Determine if the item should be linkable (owner view always is, public only if public and has slug)
    const isLinkable = isOwnerView || (!counter.isPrivate && !!counter.slug);

    // Timer State
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return new Date(counter.startDate); } catch { return null; } }, [counter.startDate]);
    const archivedDate = useMemo(() => { try { return counter.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter.archivedAt]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (!isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
            setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            intervalId = setInterval(() => { setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); }, 1000);
        } else if (isArchived && startDate instanceof Date && archivedDate instanceof Date) {
            setCurrentTimeDiff(calculateTimeDifference(startDate, archivedDate)); // Set final duration for archived
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [startDate, isArchived, archivedDate]);

    const finalTimeDiff = useMemo<TimeDifference>(() => { // Used for displaying archived time
        if (isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
            return calculateTimeDifference(startDate, archivedDate);
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [isArchived, startDate, archivedDate]);
    // End Timer Logic

    // Action Handlers (call props passed from parent)
    const handleShare = () => onShare?.(); // Parent handles generating the correct URL
    const handleEdit = () => isOwnerView && onEdit?.();
    const handleDelete = () => isOwnerView && onDelete?.();
    const handleToggleArchive = () => isOwnerView && onRequestToggleArchive?.();

    // Action Buttons Configuration
    const sharedIconSize = "1rem";
    const getActionIconProps = (color?: string) => ({
        variant: "subtle" as const,
        size: "sm",
        radius: "xl",
        color: color || (colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6]),
        style: { transition: 'color 0.2s ease' }
    });

    // Share button - enabled if onShare prop exists AND counter is public & has slug
    const shareButton = onShare && !counter.isPrivate && counter.slug && (
        <Tooltip withinPortal label="Copy Public Link" withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps('teal')} onClick={handleShare}>
                <IconShare3 size={sharedIconSize} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );
    const editButton = isOwnerView && onEdit && (
        <Tooltip withinPortal label="Edit" withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps(theme.primaryColor)} onClick={handleEdit}>
                <IconPencil size={sharedIconSize} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );
    const deleteButton = isOwnerView && onDelete && (
        <Tooltip withinPortal label="Delete" withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps("red")} onClick={handleDelete}>
                <IconTrash size={sharedIconSize} stroke={1.5} />
            </ActionIcon>
        </Tooltip>
    );
    const archiveButton = isOwnerView && onRequestToggleArchive && (
        <Tooltip withinPortal label={isArchived ? "Unarchive" : "Archive"} withArrow position="top" openDelay={300}>
            <ActionIcon {...getActionIconProps("blue")} onClick={handleToggleArchive}>
                {isArchived ? <IconArchiveOff size={sharedIconSize} stroke={1.5} /> : <IconArchive size={sharedIconSize} stroke={1.5} />}
            </ActionIcon>
        </Tooltip>
    );
    // End Action Buttons Configuration

    // Content JSX (including conditional Link wrapper)
    const InnerContent = (
        <Stack style={{ flexGrow: 1, overflow: 'hidden', minWidth: 0 }} gap={4}>
            <Group gap="xs" align="center" wrap="nowrap">
                {counter.isPrivate && <Tooltip withinPortal label="Private" openDelay={300}><IconLock size={12} stroke={1.5} color={theme.colors.gray[5]} /></Tooltip>}
                {isArchived && isOwnerView && <Badge variant="outline" color="gray" size="xs" radius="sm">Archived</Badge>}
                <Tooltip label={counter.name} position="top-start" openDelay={600} disabled={counter.name.length < 30}>
                    {/* Removed component="span" as Stack provides block */}
                    <Text fw={500} size="sm" truncate="end">{counter.name}</Text>
                </Tooltip>
                {isLinkable && !isOwnerView && (
                    <Tooltip label="View Public Page" withArrow>
                        <IconExternalLink size="0.8rem" stroke={1.5} color={theme.colors.gray[6]} style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
                    </Tooltip>
                )}
            </Group>
            <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" truncate="end">
                    <IconCalendar size={11} stroke={1.5} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                    {formatListDate(counter.startDate)}
                    {counter.user?.username ? ` • ${counter.user.username}` : ''}
                </Text>
                {counter.tags?.slice(0, 1).map(t => (<Badge key={t.id} variant="outline" size="xs" radius="sm">{t.name}</Badge>))}
                {counter.tags && counter.tags.length > 1 && (<Tooltip withinPortal label={counter.tags.slice(1).map(t => t.name).join(', ')} withArrow><Badge variant='outline' radius='sm' size="xs">+ {counter.tags.length - 1}</Badge></Tooltip>)}
            </Group>
        </Stack>
    );
    // End Content JSX

    return (
        <Box
            p="xs"
            mb={4}
            style={(theme) => ({
                border: `1px solid ${theme.colors[colorScheme === 'dark' ? 'dark' : 'gray'][colorScheme === 'dark' ? 5 : 2]}`,
                borderRadius: theme.radius.sm,
                backgroundColor: isArchived && isOwnerView ? (colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1]) : (colorScheme === 'dark' ? theme.colors.dark[6] : theme.white),
                opacity: isArchived && isOwnerView ? 0.7 : 1,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                    backgroundColor: colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0]
                }
            })}
        >
            <Group justify="space-between" wrap="nowrap" gap="sm">
                {/* --- MODIFIED PART: Conditionally wrap InnerContent with Link --- */}
                {isLinkable ? (
                    <Link href={linkHref} passHref style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
                        {InnerContent}
                    </Link>
                ) : (
                    InnerContent // Render directly if not linkable
                )}
                {/* Middle Section: Timer */}
                <Box style={{ flexShrink: 1, minWidth: 160 }}>
                    <CompactTimerDisplay time={isArchived ? finalTimeDiff : currentTimeDiff} isArchived={isArchived} />
                </Box>

                {/* Right Side: Actions (Stop propagation) */}
                <Group gap={isMobile ? 2 : 4} wrap="nowrap" justify="flex-end" style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {isOwnerView ? (isMobile ? (<Menu shadow="sm" width={160} position="bottom-end" withArrow withinPortal>
                        <Menu.Target>
                            <ActionIcon
                                variant="subtle"
                                size="md"
                                radius="sm"
                                aria-label="More actions"
                            >
                                <IconDotsVertical size="1rem" stroke={1.5} />
                            </ActionIcon>
                        </Menu.Target> <Menu.Dropdown miw={150}> {editButton && <Menu.Item leftSection={<IconPencil size={14} />} onClick={handleEdit}>Edit</Menu.Item>} {archiveButton && <Menu.Item leftSection={isArchived ? <IconArchiveOff size={14} /> : <IconArchive size={14} />} onClick={handleToggleArchive}>{isArchived ? "Unarchive" : "Archive"}</Menu.Item>} {shareButton && <Menu.Item leftSection={<IconShare3 size={14} color={theme.colors.teal[6]} />} onClick={handleShare}>Copy Public Link</Menu.Item>} {(editButton || archiveButton || shareButton) && deleteButton && <Menu.Divider />} {deleteButton && <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete}>Delete</Menu.Item>} </Menu.Dropdown> </Menu>)
                        : (<> {editButton} {archiveButton} {deleteButton} {shareButton} </>))
                        : (shareButton)}
                </Group>
            </Group>
        </Box>
    );
}