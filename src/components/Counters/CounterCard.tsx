// src/components/Counters/CounterCard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box,
    Menu, useMantineTheme, ThemeIcon, Divider, Transition, Paper, useMantineColorScheme
} from '@mantine/core';
import { useMediaQuery, useHover } from '@mantine/hooks';
import { Counter, Tag } from '../../types/index'; // Assuming types are in ../../types
import {
    IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical,
    IconUserCircle, IconCalendar, IconClock, IconLock, IconTags, IconExternalLink
} from '@tabler/icons-react';
import Link from 'next/link';
// Import the SharedTimerDisplay and its TimeDifference interface
import { SharedTimerDisplay, TimeDifference } from './SharedTimerDisplay'; // Assuming it's in the same directory

// calculateTimeDifference is still needed here if used by this component's direct logic
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

// Date Formatting Helper
const formatLocalDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        }).format(new Date(dateString));
    } catch {
        return 'Invalid Date';
    }
};

interface CounterCardProps {
    counter: Counter;
    isOwnerView: boolean;
    onEdit?: (counter: Counter) => void;
    onRequestToggleArchive?: (counter: Counter) => void;
    onDelete?: (counter: Counter) => void;
    onShare?: (counter: Counter) => void;
}

export function CounterCard({
    counter,
    isOwnerView,
    onEdit,
    onRequestToggleArchive,
    onDelete,
    onShare
}: CounterCardProps) {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isArchived = !!counter.archivedAt;
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 992px)');
    const { hovered, ref } = useHover();

    const linkHref = isOwnerView ? `/counter/${counter.id}` : (counter.slug ? `/c/${counter.slug}` : '#');
    const canLinkPublicly = !isOwnerView && !counter.isPrivate && !!counter.slug;
    const isLinkable = isOwnerView || canLinkPublicly;

    const getCardBorderColor = () => hovered && isLinkable ? 'var(--mantine-primary-color-filled)' : 'transparent';
    const getCardStyle = () => ({
        display: 'flex', flexDirection: 'column' as const,
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        opacity: isArchived && isOwnerView ? 0.85 : 1,
        cursor: isLinkable ? 'pointer' : 'default',
        borderColor: getCardBorderColor(),
        borderWidth: '2px',
        position: 'relative' as const,
        overflow: 'visible' as const,
        backgroundColor: 'var(--mantine-color-body)'
    });

    // Timer State
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return new Date(counter.startDate); } catch { return null; } }, [counter.startDate]);
    const archivedDate = useMemo(() => { try { return counter.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter.archivedAt]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (!isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
            setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            intervalId = setInterval(() => {
                setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            }, 1000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [startDate, isArchived]);

    const archivedTimeDiff = useMemo<TimeDifference>(() => {
        if (isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
            return calculateTimeDifference(startDate, archivedDate);
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [isArchived, startDate, archivedDate]);

    // Action Handlers (preventing default link navigation if actions are on the card)
    const handleEdit = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (isOwnerView && onEdit) { onEdit(counter); } };
    const handleShare = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (onShare) { onShare(counter); } };
    const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (isOwnerView && onDelete) { onDelete(counter); } };
    const handleToggleArchive = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (isOwnerView && onRequestToggleArchive) { onRequestToggleArchive(counter); } };


    const getActionIconProps = (color?: string) => ({ variant: "subtle" as const, size: "md", radius: "xl", color: color || (colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.gray[7]), style: { transition: 'all 0.2s ease' } });
    const shareButton = onShare && !counter.isPrivate && counter.slug && (<Tooltip label="Copy Public Link" withArrow position="bottom" openDelay={300} withinPortal><ActionIcon {...getActionIconProps('teal')} onClick={handleShare} title="Share"><IconShare3 size="1.1rem" stroke={1.5} /></ActionIcon></Tooltip>);
    const editButton = isOwnerView && onEdit && (<Tooltip label="Edit" withArrow position="bottom" openDelay={300} withinPortal><ActionIcon {...getActionIconProps(theme.primaryColor)} onClick={handleEdit} title="Edit"><IconPencil size="1.1rem" stroke={1.5} /></ActionIcon></Tooltip>);
    const deleteButtonJsx = isOwnerView && onDelete && (<Tooltip label="Delete" withArrow position="bottom" openDelay={300} withinPortal><ActionIcon {...getActionIconProps("red")} onClick={handleDelete} title="Delete"><IconTrash size="1.1rem" stroke={1.5} /></ActionIcon></Tooltip>);
    const archiveButton = isOwnerView && onRequestToggleArchive && (<Tooltip label={isArchived ? "Unarchive" : "Archive"} withArrow position="bottom" openDelay={300} withinPortal><ActionIcon {...getActionIconProps("blue")} onClick={handleToggleArchive} title={isArchived ? "Unarchive" : "Archive"}>{isArchived ? <IconArchiveOff size="1.1rem" stroke={1.5} /> : <IconArchive size="1.1rem" stroke={1.5} />}</ActionIcon></Tooltip>);

    const CardContent = (
        <Stack justify="space-between" h="100%" gap="sm" /* Reduced gap slightly */ style={{ flexGrow: 1 }}>
            {/* Top Section */}
            <Box>
                <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                    <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Text
                          component="span"
                          fw={700}
                          size={isTablet ? "lg" : "xl"}
                          lh={1.3}
                          lineClamp={2} // Allow title to wrap to 2 lines before truncating
                          style={{ transition: 'color 0.2s ease' }}
                        >
                            {counter.name}
                        </Text>
                    </Box>
                    {canLinkPublicly && (
                        <Tooltip label="View Public Page" withArrow withinPortal>
                            {/* This ActionIcon should not trigger card link navigation if card is wrapped by Link */}
                            <ActionIcon variant="subtle" size="xs" color="gray" onClick={(e) => e.stopPropagation()} >
                                <IconExternalLink size="0.8rem" stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>
                {counter.user?.username && (<Group gap={4} mb="xs" /* Reduced margin */><IconUserCircle size={16} stroke={1.5} style={{ color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6] }} /><Text size="sm" c="dimmed">by {counter.user.username}</Text></Group>)}
                {counter.description && (<Text size="sm" c="dimmed" lineClamp={3} mb="xs" /* Reduced margin */ style={{ fontStyle: 'italic', lineHeight: 1.5 }}>{counter.description}</Text>)}
                {counter.tags && counter.tags.length > 0 && (<Group gap={6} /* Reduced gap */ mb="xs" wrap="wrap" align="center"><ThemeIcon size="xs" color={colorScheme === 'dark' ? 'gray.6' : 'gray.6'} variant="light"><IconTags size="0.8rem" stroke={1.5} /></ThemeIcon>{counter.tags.slice(0, isMobile ? 2 : 3).map((tag: Tag) => (<Badge key={tag.id} variant="light" /* Changed from dot for better visibility */ size="xs" /* Smaller badge */ color={theme.primaryColor} radius="sm">{tag.name}</Badge>))}{counter.tags.length > (isMobile ? 2 : 3) && (<Tooltip label={counter.tags.slice(isMobile ? 2 : 3).map(t => t.name).join(', ')} withArrow withinPortal><Badge variant='light' color={theme.primaryColor} radius='sm' size="xs">+{counter.tags.length - (isMobile ? 2 : 3)}</Badge></Tooltip>)}</Group>)}
                <Divider my="xs" /* Reduced margin */ variant="dashed" opacity={0.6} style={{ borderColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3] }} />
            </Box>

            {/* MODIFIED Timer Section */}
            <Paper p="sm" radius="md" shadow="xs" style={{ textAlign: 'center', backgroundColor: 'var(--mantine-color-body)', position: 'relative', overflow: 'hidden' }} my={0} /* Reduced margin */ withBorder>
                <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', padding: '4px 0', }}>
                    <Group align="center" justify="center" gap={6}>
                        <IconClock size={14} stroke={1.5} /> {/* Removed color to inherit */}
                        <Text size="xs" fw={500} /* Slightly less bold */ c="dimmed" /* Dimmer text */>
                            {isArchived ? 'FINAL DURATION' : 'ELAPSED TIME'}
                        </Text>
                    </Group>
                </Box>
                <Box pt={20} pb={4}> {/* Adjusted padding top/bottom */}
                    {isArchived
                        ? <SharedTimerDisplay time={archivedTimeDiff} isArchived={isArchived} size="default" />
                        : <SharedTimerDisplay time={currentTimeDiff} isArchived={isArchived} size="default" />
                    }
                </Box>
            </Paper>

            {/* Bottom Section */}
            <Box mt="auto" pt="xs" /* Added padding top */>
                <Divider mb="xs" /* Reduced margin */ variant="dashed" opacity={0.6} style={{ borderColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3] }} />
                <Group justify="space-between" align="center">
                    <Stack gap={0} /* Reduced gap */>
                        <Group gap={4} wrap="nowrap">
                            <IconCalendar size={14} stroke={1.5} style={{ color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6], flexShrink: 0 }} />
                            <Text size="xs" c="dimmed">Started: {formatLocalDate(counter.startDate)}</Text>
                        </Group>
                        {isArchived && isOwnerView && (
                            <Group gap={4} wrap="nowrap" mt={2}>
                                <IconArchive size={14} stroke={1.5} style={{ color: theme.colors.blue[colorScheme === 'dark' ? 4 : 6], flexShrink: 0 }} />
                                <Text size="xs" c="dimmed">Archived: {formatLocalDate(counter.archivedAt)}</Text>
                            </Group>
                        )}
                    </Stack>
                    {/* Actions Group - onClick handlers now defined with (e: React.MouseEvent) */}
                    <Group gap={isMobile ? 2 : 6} /* Slightly adjusted gap */ wrap="nowrap" style={{ flexShrink: 0 }}>
                        {isOwnerView ? (
                            <>
                                {archiveButton}
                                {isMobile ? (
                                    <Menu shadow="md" width={180} position="bottom-end" withinPortal closeOnItemClick>
                                        <Menu.Target><ActionIcon variant="subtle" size="md" radius="xl" aria-label="More actions" onClick={(e) => e.stopPropagation()}><IconDotsVertical size="1.1rem" stroke={1.5} /></ActionIcon></Menu.Target>
                                        <Menu.Dropdown>
                                            {shareButton && (<Menu.Item leftSection={<IconShare3 size={14} />} onClick={handleShare}>Copy Public Link</Menu.Item>)}
                                            {editButton && (<Menu.Item leftSection={<IconPencil size={14} />} onClick={handleEdit}>Edit</Menu.Item>)}
                                            {(editButton || shareButton) && deleteButtonJsx && (<Menu.Divider />)}
                                            {deleteButtonJsx && (<Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete}>Delete</Menu.Item>)}
                                        </Menu.Dropdown>
                                    </Menu>
                                ) : (
                                    <> {editButton} {shareButton} {deleteButtonJsx} </>
                                )}
                            </>
                        ) : (shareButton || null)}
                    </Group>
                </Group>
            </Box>
        </Stack>
    );

    return (
        <Transition mounted={true} transition="fade" duration={400}>
            {(styles) => (
                <Card
                    ref={ref}
                    shadow={hovered && isLinkable ? "md" : "sm"} // Only change shadow if linkable
                    padding="md" // Standardized padding
                    radius="lg"
                    withBorder
                    h="100%"
                    style={{ ...getCardStyle(), ...styles, transform: hovered && !isMobile && isLinkable ? 'translateY(-4px)' : 'translateY(0)' }} // Subtle lift on hover if linkable
                >
                    {isArchived && isOwnerView && (<Badge color="gray" variant="filled" radius="sm" size="xs" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}> Archived </Badge>)}
                    {counter.isPrivate && (<Tooltip label="Private Counter" withArrow position="top" withinPortal><ThemeIcon size="xs" color="gray" variant="light" style={{ position: 'absolute', top: 8, right: 8, borderRadius: '50%', zIndex: 1 }}> <IconLock size="0.8rem" stroke={1.5} /> </ThemeIcon></Tooltip>)}

                    {isLinkable ? (
                        <Link href={linkHref} passHref style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {CardContent}
                        </Link>
                    ) : (
                        CardContent
                    )}
                </Card>
            )}
        </Transition>
    );
}