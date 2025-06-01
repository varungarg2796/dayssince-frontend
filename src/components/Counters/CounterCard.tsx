/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Counters/CounterCard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box,
    Menu, useMantineTheme, ThemeIcon, Divider, Transition, Paper, Progress,
    useMantineColorScheme
} from '@mantine/core';
import { useMediaQuery, useHover } from '@mantine/hooks';
import { Counter, Tag } from '../../types/index';
import {
    IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical,
    IconUserCircle, IconCalendar, IconClock, IconLock, IconTags, IconExternalLink,
    IconTargetArrow, IconTrophy
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

    const isChallenge = counter.isChallenge === true && counter.challengeDurationDays && counter.challengeDurationDays > 0 && !isArchived;
    let daysSinceChallengeStart = 0;
    let challengeProgressPercent = 0;
    let isChallengeAchieved = false;

    if (isChallenge && startDate) {
        daysSinceChallengeStart = dayjs().diff(dayjs(startDate), 'day');
        challengeProgressPercent = Math.min((daysSinceChallengeStart / counter.challengeDurationDays!) * 100, 100);
        isChallengeAchieved = daysSinceChallengeStart >= counter.challengeDurationDays!;
    }

    const getCardBorderColor = () => hovered && isLinkable ? theme.colors[theme.primaryColor][6] : 'transparent';
    
    const getCardStyle = () => {
        const baseStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            opacity: isArchived && isOwnerView ? 0.85 : 1,
            cursor: isLinkable ? 'pointer' : 'default',
            borderColor: getCardBorderColor(),
            borderWidth: '2px',
            position: 'relative',
            overflow: 'visible',
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
            transform: hovered && !isMobile && isLinkable ? 'translateY(-4px)' : 'translateY(0)',
        };
        return baseStyle;
    };

    // Action Handlers
    const handleEditWrapper = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (isOwnerView && onEdit) { onEdit(counter); } };
    const handleShareWrapper = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (onShare) { onShare(counter); } };
    const handleDeleteWrapper = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (isOwnerView && onDelete) { onDelete(counter); } };
    const handleToggleArchiveWrapper = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (isOwnerView && onRequestToggleArchive) { onRequestToggleArchive(counter); } };

    const getActionIconProps = (color?: string) => ({ 
        variant: "subtle" as const, 
        size: isMobile ? "sm" : "md", 
        radius: "xl", 
        color: color || (colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6]), 
        style: { transition: 'all 0.2s ease' } 
    });

    // Get the primary status badge
    const getPrimaryBadge = () => {
        if (isArchived && isOwnerView) {
            return <Badge color="gray" variant="light" size="sm" radius="md">Archived</Badge>;
        }
        if (isChallenge) {
            return (
                <Badge 
                    color={isChallengeAchieved ? "yellow" : theme.primaryColor} 
                    variant="light" 
                    size="sm" 
                    radius="md"
                    leftSection={isChallengeAchieved ? <IconTrophy size={12} /> : <IconTargetArrow size={12} />}
                >
                    {isChallengeAchieved ? 'Challenge Complete!' : `${counter.challengeDurationDays}d Challenge`}
                </Badge>
            );
        }
        if (counter.isPrivate) {
            return (
                <Badge 
                    color="gray" 
                    variant="light" 
                    size="sm" 
                    radius="md"
                    leftSection={<IconLock size={12} />}
                >
                    Private
                </Badge>
            );
        }
        return null;
    };

    const CardContent = (
        <Stack justify="space-between" h="100%" gap="md" style={{ flexGrow: 1 }}>
            {/* Header Section - Always consistent height */}
            <Stack gap="sm">
                {/* Top badges row */}
                <Group justify="space-between" align="flex-start">
                    <Box>
                        {getPrimaryBadge()}
                    </Box>
                    {canLinkPublicly && (
                        <Tooltip label="View Public Page" withArrow withinPortal>
                            <ActionIcon 
                                variant="subtle" 
                                size="xs" 
                                color="gray" 
                                onClick={(e) => e.stopPropagation()}
                                style={{ opacity: 0.7 }}
                            > 
                                <IconExternalLink size="0.8rem" stroke={1.5} /> 
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>

                {/* Title Section */}
                <Box>
                    <Text 
                        component="span" 
                        fw={600} 
                        size={isMobile ? "lg" : "xl"} 
                        lh={1.3} 
                        lineClamp={2} 
                        style={{ transition: 'color 0.2s ease' }}
                    >
                        {counter.name}
                    </Text>
                    
                    {/* Author info (non-owner view only) */}
                    {counter.user?.username && !isOwnerView && (
                        <Group gap={6} mt={4}>
                            <IconUserCircle 
                                size={14} 
                                stroke={1.5} 
                                style={{ color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6] }} 
                            />
                            <Text size="sm" c="dimmed">by {counter.user.username}</Text>
                        </Group>
                    )}
                </Box>

                {/* Description Section - Fixed height container */}
                <Box style={{ minHeight: counter.description ? 'auto' : '0' }}>
                    {counter.description && (
                        <Text 
                            size="sm" 
                            c="dimmed" 
                            lineClamp={isMobile ? 2 : 3} 
                            style={{ lineHeight: 1.4 }}
                        >
                            {counter.description}
                        </Text>
                    )}
                </Box>

                {/* Meta Section - Tags and Challenge Progress */}
                <Box>
                    {/* Tags */}
                    {counter.tags && counter.tags.length > 0 && (
                        <Group gap={4} mb={isChallenge && !isChallengeAchieved ? "xs" : 0} wrap="wrap" align="center">
                            {!isMobile && (
                                <ThemeIcon size="xs" color="gray" variant="subtle" radius="sm">
                                    <IconTags size="0.7rem" stroke={1.5} />
                                </ThemeIcon>
                            )}
                            {counter.tags.slice(0, isMobile ? 1 : 2).map((tag: Tag) => (
                                <Badge 
                                    key={tag.id} 
                                    variant="dot" 
                                    size="xs" 
                                    color={theme.primaryColor} 
                                    radius="sm"
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                            {counter.tags.length > (isMobile ? 1 : 2) && (
                                <Tooltip 
                                    label={counter.tags.slice(isMobile ? 1 : 2).map(t => t.name).join(', ')} 
                                    withArrow 
                                    withinPortal
                                >
                                    <Badge 
                                        variant="outline" 
                                        color="gray" 
                                        radius="sm" 
                                        size="xs"
                                        style={{ cursor: 'help' }}
                                    >
                                        +{counter.tags.length - (isMobile ? 1 : 2)}
                                    </Badge>
                                </Tooltip>
                            )}
                        </Group>
                    )}

                    {/* Challenge Progress */}
                    {isChallenge && !isChallengeAchieved && (
                        <Box pt={counter.tags && counter.tags.length > 0 ? "xs" : 0}>
                            <Group justify="space-between" align="center" mb={4}>
                                <Text size="xs" fw={500} c="dimmed">
                                    Progress
                                </Text>
                                <Text size="xs" fw={500} c={theme.primaryColor}>
                                    {daysSinceChallengeStart} / {counter.challengeDurationDays} days
                                </Text>
                            </Group>
                            <Progress 
                                value={challengeProgressPercent} 
                                size={8} 
                                radius="sm" 
                                color={theme.primaryColor}
                            />
                        </Box>
                    )}
                </Box>
            </Stack>

            {/* Timer Section - Defined with visual separation */}
            <Box>
                <Divider 
                    mb="sm" 
                    color={colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}
                    style={{ opacity: 0.6 }}
                />
                <Paper 
                    p={isMobile ? "sm" : "md"} 
                    radius="md" 
                    style={{ 
                        textAlign: 'center', 
                        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
                        border: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]}`
                    }}
                >
                    <Group align="center" justify="center" gap={6} mb="xs">
                        <IconClock size={14} stroke={1.5} style={{ opacity: 0.7 }} />
                        <Text size="xs" fw={500} c="dimmed" tt="uppercase" lts="0.5em">
                            {isArchived ? 'Final Duration' : 'Elapsed Time'}
                        </Text>
                    </Group>
                    {isArchived ? 
                        <SharedTimerDisplay time={archivedTimeDiff} isArchived={isArchived} size="default" /> : 
                        <SharedTimerDisplay time={currentTimeDiff} isArchived={isArchived} size="default" />
                    }
                </Paper>
            </Box>

            {/* Footer Section - Defined with visual separation */}
            <Box>
                <Divider 
                    mb="sm" 
                    color={colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}
                    style={{ opacity: 0.6 }}
                />
                <Group justify="space-between" align="flex-end">
                    {/* Start date info */}
                    <Stack gap={2}>
                        <Group gap={4} wrap="nowrap">
                            <IconCalendar 
                                size={12} 
                                stroke={1.5} 
                                style={{ 
                                    color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6], 
                                    flexShrink: 0,
                                    opacity: 0.8
                                }} 
                            />
                            <Text size="xs" c="dimmed">
                                {isMobile ? dayjs(counter.startDate).format('MMM D, YYYY') : formatLocalDate(counter.startDate)}
                            </Text>
                        </Group>
                        {isArchived && isOwnerView && (
                            <Group gap={4} wrap="nowrap">
                                <IconArchive 
                                    size={12} 
                                    stroke={1.5} 
                                    style={{ 
                                        color: theme.colors.blue[colorScheme === 'dark' ? 4 : 6], 
                                        flexShrink: 0,
                                        opacity: 0.8
                                    }} 
                                />
                                <Text size="xs" c="dimmed">
                                    Archived {isMobile ? dayjs(counter.archivedAt).format('MMM D') : formatLocalDate(counter.archivedAt)}
                                </Text>
                            </Group>
                        )}
                    </Stack>

                    {/* Action buttons */}
                    <Group gap={isMobile ? 4 : 8} wrap="nowrap" style={{ flexShrink: 0 }}>
                        {isOwnerView ? (
                            <>
                                {/* Archive button */}
                                {onRequestToggleArchive && (
                                    <Tooltip 
                                        label={isArchived ? "Unarchive" : "Archive"} 
                                        withArrow 
                                        position="bottom" 
                                        openDelay={300} 
                                        withinPortal
                                    >
                                        <ActionIcon 
                                            {...getActionIconProps("blue")} 
                                            onClick={handleToggleArchiveWrapper}
                                        >
                                            {isArchived ? 
                                                <IconArchiveOff size={isMobile ? "1rem" : "1.1rem"} stroke={1.5} /> : 
                                                <IconArchive size={isMobile ? "1rem" : "1.1rem"} stroke={1.5} />
                                            }
                                        </ActionIcon>
                                    </Tooltip>
                                )}

                                {isMobile ? (
                                    <Menu shadow="md" width={180} position="bottom-end" withinPortal closeOnItemClick>
                                        <Menu.Target>
                                            <ActionIcon 
                                                variant="subtle" 
                                                size="sm" 
                                                radius="xl" 
                                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                            >
                                                <IconDotsVertical size="1rem" stroke={1.5} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            {onShare && !counter.isPrivate && counter.slug && (
                                                <Menu.Item 
                                                    leftSection={<IconShare3 size={14} />} 
                                                    onClick={handleShareWrapper}
                                                >
                                                    Copy Public Link
                                                </Menu.Item>
                                            )}
                                            {onEdit && (
                                                <Menu.Item 
                                                    leftSection={<IconPencil size={14} />} 
                                                    onClick={handleEditWrapper}
                                                >
                                                    Edit
                                                </Menu.Item>
                                            )}
                                            {((onEdit || (onShare && !counter.isPrivate && counter.slug)) && onDelete) && (
                                                <Menu.Divider />
                                            )}
                                            {onDelete && (
                                                <Menu.Item 
                                                    color="red" 
                                                    leftSection={<IconTrash size={14} />} 
                                                    onClick={handleDeleteWrapper}
                                                >
                                                    Delete
                                                </Menu.Item>
                                            )}
                                        </Menu.Dropdown>
                                    </Menu>
                                ) : (
                                    <>
                                        {onEdit && (
                                            <Tooltip label="Edit" withArrow position="bottom" openDelay={300} withinPortal>
                                                <ActionIcon {...getActionIconProps(theme.primaryColor)} onClick={handleEditWrapper}>
                                                    <IconPencil size="1.1rem" stroke={1.5} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        {onShare && !counter.isPrivate && counter.slug && (
                                            <Tooltip label="Copy Public Link" withArrow position="bottom" openDelay={300} withinPortal>
                                                <ActionIcon {...getActionIconProps('teal')} onClick={handleShareWrapper}>
                                                    <IconShare3 size="1.1rem" stroke={1.5} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        {onDelete && (
                                            <Tooltip label="Delete" withArrow position="bottom" openDelay={300} withinPortal>
                                                <ActionIcon {...getActionIconProps("red")} onClick={handleDeleteWrapper}>
                                                    <IconTrash size="1.1rem" stroke={1.5} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            onShare && !counter.isPrivate && counter.slug && (
                                <Tooltip label="Copy Public Link" withArrow position="bottom" openDelay={300} withinPortal>
                                    <ActionIcon {...getActionIconProps('teal')} onClick={handleShareWrapper}>
                                        <IconShare3 size={isMobile ? "1rem" : "1.1rem"} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                            )
                        )}
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
                    shadow={hovered && isLinkable ? "md" : "sm"}
                    padding={isMobile ? "sm" : "md"}
                    radius="lg"
                    withBorder
                    h="100%"
                    style={getCardStyle()}
                >
                    {isLinkable ? (
                        <Link 
                            href={linkHref} 
                            passHref 
                            style={{ 
                                textDecoration: 'none', 
                                color: 'inherit', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                height: '100%' 
                            }}
                        >
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