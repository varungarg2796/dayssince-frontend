// src/components/Counters/CounterCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box, Modal, Button,
    Menu, useMantineTheme, ThemeIcon, Divider, Transition, Paper, useMantineColorScheme
} from '@mantine/core';
import { useDisclosure, useMediaQuery, useHover } from '@mantine/hooks';
import { Counter, Tag, UserCounters } from '../../types/index';
import {
    IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical,
    IconUserCircle, IconCalendar, IconClock, IconLock, IconTags
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCounter, archiveCounter, unarchiveCounter } from '@/lib/apiClient';
import { notifications } from '@mantine/notifications';

// --- Time Difference Calculation Logic ---
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

// --- Enhanced Timer Display Component ---
function TimerDisplay({ time, isArchived }: { time: TimeDifference, isArchived: boolean }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isSmallScreen = useMediaQuery('(max-width: 450px)');
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme(); // Get colorScheme from this hook
    const primaryColor = theme.primaryColor;
    
    // Gradient text effect for timer numbers
    const getGradient = () => {
        if (isArchived) {
            return { from: colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6], to: theme.colors.gray[7] };
        }
        return { from: theme.colors[primaryColor][5], to: theme.colors[primaryColor][8] };
    };
    
    const NumberText = ({ children }: { children: React.ReactNode }) => (
        <Text
            size={isSmallScreen ? 'xl' : '2.6rem'}
            fw={700}
            lh={1.1}
            variant="gradient"
            gradient={getGradient()}
            ta="center"
            style={{ 
                minWidth: isSmallScreen ? '1.5rem' : '2.5rem',
                textShadow: colorScheme === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
            }}
        >
            {children}
        </Text>
    );
    
    const LabelText = ({ children }: { children: React.ReactNode }) => (
        <Text 
            size="xs" 
            c="dimmed" 
            tt="uppercase" 
            fw={500}
            ta="center"
            style={{ letterSpacing: '0.5px' }}
        >
            {children}
        </Text>
    );
    
    const TimeSeparator = () => (
        <Text size={isSmallScreen ? "xl" : "2.2rem"} fw={300} c="dimmed" lh={1.1}>:</Text>
    );

    return (
        <Group gap={isSmallScreen ? 'xs' : 'md'} justify="center" wrap="nowrap" my="xs">
            <Stack align="center" gap={2}>
                <NumberText>{time.days}</NumberText>
                <LabelText>days</LabelText>
            </Stack>
            <TimeSeparator />
            <Stack align="center" gap={2}>
                <NumberText>{pad(time.hours)}</NumberText>
                <LabelText>hours</LabelText>
            </Stack>
            <TimeSeparator />
            <Stack align="center" gap={2}>
                <NumberText>{pad(time.minutes)}</NumberText>
                <LabelText>mins</LabelText>
            </Stack>
            <TimeSeparator />
            <Stack align="center" gap={2}>
                <NumberText>{pad(time.seconds)}</NumberText>
                <LabelText>secs</LabelText>
            </Stack>
        </Group>
    );
}

// --- Date Formatting Helper ---
const formatLocalDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Intl.DateTimeFormat(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit' 
        }).format(new Date(dateString));
    } catch { 
        return 'Invalid Date'; 
    }
};

// --- Interface with OPTIONAL onEdit ---
interface CounterCardProps {
    counter: Counter;
    onEdit?: (counter: Counter) => void;
}

// --- Main CounterCard Component ---
export function CounterCard({ counter, onEdit }: CounterCardProps) {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isArchived = !!counter.archivedAt;
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 992px)');
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const queryClient = useQueryClient();
    const isOwnerView = typeof onEdit === 'function';
    const { hovered, ref } = useHover();

    // --- Animations & Visual Effects ---
    const getCardBorderColor = () => {
        if (isArchived) return 'transparent';
        return hovered 
            ? 'var(--mantine-primary-color-filled)'
            : 'transparent';
    };

    const getCardStyle = () => {
    return {
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        opacity: isArchived && isOwnerView ? 0.85 : 1,
        cursor: 'default',
        borderColor: getCardBorderColor(),
        borderWidth: '2px',
        position: 'relative' as const,
        overflow: 'visible' as const,
        backgroundColor: 'var(--mantine-color-body)'
    };
};

    // --- Mutations ---
    const { mutate: performDelete, isPending: isDeleting } = useMutation({
        mutationFn: deleteCounter,
        onSuccess: () => { 
            notifications.show({ 
                title: 'Success', 
                message: 'Counter deleted!', 
                color: 'green',
                icon: <IconTrash size="1.1rem" />
            }); 
            queryClient.invalidateQueries({ queryKey: ['myCounters'] }); 
            closeDeleteModal(); 
        },
        onError: (error) => { 
            notifications.show({ 
                title: 'Error', 
                message: `Failed to delete counter: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                color: 'red' 
            }); 
            closeDeleteModal(); 
        },
    });
    
    const { mutate: performToggleArchive, isPending: isTogglingArchive } = useMutation({
        mutationFn: isArchived ? unarchiveCounter : archiveCounter,
        onSuccess: (updatedCounterData) => { 
            notifications.show({ 
                title: 'Success', 
                message: `Counter ${isArchived ? 'unarchived' : 'archived'}!`, 
                color: 'blue',
                icon: isArchived ? <IconArchiveOff size="1.1rem" /> : <IconArchive size="1.1rem" />
            }); 
            queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => { 
                if (!oldData) return oldData; 
                let sourceList: Counter[]; 
                let targetList: Counter[]; 
                if (isArchived) { 
                    sourceList = oldData.archived.filter(c => c.id !== updatedCounterData.id); 
                    targetList = [...oldData.active, updatedCounterData]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
                    return { active: targetList, archived: sourceList }; 
                } else { 
                    sourceList = oldData.active.filter(c => c.id !== updatedCounterData.id); 
                    targetList = [...oldData.archived, updatedCounterData]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
                    return { active: sourceList, archived: targetList }; 
                } 
            }); 
        },
        onError: (error) => { 
            notifications.show({ 
                title: 'Error', 
                message: `Failed to ${isArchived ? 'unarchive' : 'archive'} counter: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                color: 'red' 
            }); 
        },
    });

    // --- Timer State, Memos, Effect ---
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { 
        try { 
            return new Date(counter.startDate); 
        } catch { 
            return null; 
        } 
    }, [counter.startDate]);
    
    const archivedDate = useMemo(() => { 
        try { 
            return counter.archivedAt ? new Date(counter.archivedAt) : null; 
        } catch { 
            return null; 
        } 
    }, [counter.archivedAt]);
    
    useEffect(() => { 
        let intervalId: NodeJS.Timeout | null = null; 
        
        if (!isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) { 
            setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); 
            intervalId = setInterval(() => { 
                setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); 
            }, 1000); 
        } 
        
        return () => { 
            if (intervalId) clearInterval(intervalId); 
        }; 
    }, [startDate, isArchived]);
    
    const archivedTimeDiff = useMemo<TimeDifference>(() => { 
        if (isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) 
            && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) { 
            return calculateTimeDifference(startDate, archivedDate); 
        } 
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }; 
    }, [isArchived, startDate, archivedDate]);

    // --- Action Handlers ---
    const handleEdit = () => isOwnerView && onEdit?.(counter);
    const handleShare = () => { 
        const shareUrl = `${window.location.origin}/counter/${counter.id}`; 
        navigator.clipboard.writeText(shareUrl).then(() => { 
            notifications.show({ 
                title: 'Link Copied!', 
                message: `Link to "${counter.name}" copied.`, 
                color: 'teal', 
                autoClose: 3000,
                icon: <IconShare3 size="1.1rem" />
            }); 
        }).catch(err => { 
            notifications.show({ 
                title: 'Error', 
                message: 'Could not copy link.', 
                color: 'red' 
            }); 
            console.error('Failed to copy share link:', err); 
        }); 
    };
    
    const handleToggleArchive = () => { 
        if (isOwnerView && !isTogglingArchive) 
            performToggleArchive(counter.id); 
    };
    
    const handleDelete = () => { 
        if (isOwnerView) openDeleteModal(); 
    };
    
    const handleDeleteConfirm = () => { 
        if (isOwnerView && !isDeleting) 
            performDelete(counter.id); 
    };

    // --- Action Buttons ---
    const getActionIconProps = (color?: string) => ({
        variant: "subtle",
        size: "md",
        radius: "xl",
        color: color || (colorScheme === 'dark' ? 'gray.6' : 'gray.7'),
        style: {
            transition: 'all 0.2s ease'
        }
    });
    
    const shareButton = !isArchived && !counter.isPrivate && (
        <Tooltip label="Copy Share Link" withArrow position="bottom" openDelay={300}>
            <ActionIcon 
                {...getActionIconProps('teal')} 
                onClick={handleShare} 
                title="Share"
            >
                <IconShare3 size="1.1rem" stroke={1.5}/>
            </ActionIcon>
        </Tooltip>
    );
    
    const editButton = isOwnerView && (
        <Tooltip label="Edit" withArrow position="bottom" openDelay={300}>
            <ActionIcon 
                {...getActionIconProps(theme.primaryColor)} 
                onClick={handleEdit} 
                title="Edit"
            >
                <IconPencil size="1.1rem" stroke={1.5}/>
            </ActionIcon>
        </Tooltip>
    );
    
    const deleteButtonJsx = isOwnerView && (
        <Tooltip label="Delete" withArrow position="bottom" openDelay={300}>
            <ActionIcon 
                {...getActionIconProps("red")} 
                onClick={handleDelete} 
                loading={isDeleting} 
                title="Delete"
            >
                <IconTrash size="1.1rem" stroke={1.5}/>
            </ActionIcon>
        </Tooltip>
    );
    
    const archiveButton = isOwnerView && (
        <Tooltip label={isArchived ? "Unarchive" : "Archive"} withArrow position="bottom" openDelay={300}>
            <ActionIcon 
                {...getActionIconProps("blue")} 
                onClick={handleToggleArchive} 
                loading={isTogglingArchive} 
                title={isArchived ? "Unarchive" : "Archive"}
            >
                {isArchived ? <IconArchiveOff size="1.1rem" stroke={1.5}/> : <IconArchive size="1.1rem" stroke={1.5}/>}
            </ActionIcon>
        </Tooltip>
    );

    return (
        <>
            <Transition mounted={true} transition="fade" duration={400}>
                {(styles) => (
                    <Card
                        ref={ref}
                        shadow={hovered ? "md" : "sm"}
                        padding="lg"
                        radius="lg"
                        withBorder
                        h="100%"
                        style={{
                            ...getCardStyle(),
                            ...styles,
                            transform: hovered && !isMobile ? 'translateY(-5px)' : 'translateY(0)'
                        }}
                    >
                        {/* Status indicator */}
                        {isArchived && isOwnerView && (
                            <Badge 
                                color="gray" 
                                variant="filled" 
                                radius="sm" 
                                size="sm"
                                style={{
                                    position: 'absolute',
                                    top: -10,
                                    right: 20,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                Archived
                            </Badge>
                        )}
                        
                        {/* Privacy indicator */}
                        {counter.isPrivate && (
                            <Tooltip label="Private Counter" withArrow position="top">
                                <ThemeIcon 
                                    size="xs" 
                                    color={colorScheme === 'dark' ? 'gray' : 'gray'} 
                                    variant="light"
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        borderRadius: '50%'
                                    }}
                                >
                                    <IconLock size="0.8rem" stroke={1.5} />
                                </ThemeIcon>
                            </Tooltip>
                        )}

                        <Stack justify="space-between" h="100%" gap="md" style={{ flexGrow: 1 }}>
                            {/* Top Section */}
                            <Box>
                                <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                                    <Box style={{ flex: 1, minWidth: 0 }}>
                                        <Text 
                                            fw={700} 
                                            size={isTablet ? "lg" : "xl"} 
                                            lh={1.3} 
                                            truncate="end"
                                            style={{
                                                transition: 'color 0.2s ease'
                                            }}
                                        >
                                            {counter.name}
                                        </Text>
                                    </Box>
                                </Group>

                                {counter.user?.username && (
                                    <Group gap={4} mb="sm">
                                        <IconUserCircle 
                                            size={16} 
                                            stroke={1.5} 
                                            style={{ color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6] }}
                                        />
                                        <Text size="sm" c="dimmed">
                                            by {counter.user.username}
                                        </Text>
                                    </Group>
                                )}

                                {counter.description && (
                                    <Text 
                                        size="sm" 
                                        c="dimmed" 
                                        lineClamp={3} 
                                        mb="sm" 
                                        style={{ 
                                            fontStyle: 'italic',
                                            lineHeight: 1.5
                                        }}
                                    >
                                        {counter.description}
                                    </Text>
                                )}

                                {counter.tags && counter.tags.length > 0 && (
                                    <Group gap={8} mb="sm" wrap="wrap" align="center">
                                        <ThemeIcon 
                                            size="xs" 
                                            color={colorScheme === 'dark' ? 'gray.6' : 'gray.6'} 
                                            variant="light"
                                        >
                                            <IconTags size="0.8rem" stroke={1.5} />
                                        </ThemeIcon>
                                        {counter.tags.slice(0, isMobile ? 2 : 4).map((tag: Tag) => (
                                            <Badge 
                                                key={tag.id} 
                                                variant="dot" 
                                                size="sm"
                                                color={theme.primaryColor}
                                                radius="sm"
                                                style={{
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                        {counter.tags.length > (isMobile ? 2 : 4) && (
                                            <Tooltip 
                                                label={counter.tags.slice(isMobile ? 2 : 4).map(t => t.name).join(', ')} 
                                                withArrow
                                            >
                                                <Badge 
                                                    variant='filled' 
                                                    color={theme.primaryColor} 
                                                    radius='sm' 
                                                    size="sm"
                                                >
                                                    +{counter.tags.length - (isMobile ? 2 : 4)}
                                                </Badge>
                                            </Tooltip>
                                        )}
                                    </Group>
                                )}
                                
                                <Divider 
                                    my="md" 
                                    variant="dashed" 
                                    opacity={0.6}
                                    style={{
                                        borderColor: colorScheme === 'dark' 
                                            ? theme.colors.dark[3] 
                                            : theme.colors.gray[3]
                                    }}
                                />
                            </Box>

                            {/* Timer Section */}
                            <Paper
    p="md"
    radius="md"
    shadow="sm"
    style={{ 
        textAlign: 'center',
        backgroundColor: 'var(--mantine-color-body)',
        position: 'relative',
        overflow: 'hidden'
    }}
    my="sm"
    withBorder
>
<Box 
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
            padding: '6px 0',
        }}
    >
                                    <Group align="center" justify="center" gap={6}>
                                        <IconClock size={14} stroke={1.5} color={colorScheme === 'dark' ? 'white' : 'black'} />
                                        <Text 
                                            size="xs" 
                                            fw={600}
                                            style={{ 
                                                letterSpacing: '0.5px',
                                                color: colorScheme === 'dark' ? 'white' : 'black'
                                            }}
                                        >
                                            {isArchived ? 'FINAL DURATION' : 'ELAPSED TIME'}
                                        </Text>
                                    </Group>
                                </Box>
                                
                                <Box pt={25}>
                                    {isArchived ? (
                                        <TimerDisplay time={archivedTimeDiff} isArchived={isArchived} />
                                    ) : (
                                        <TimerDisplay time={currentTimeDiff} isArchived={isArchived} />
                                    )}
                                </Box>
                            </Paper>

                            {/* Bottom Section */}
                            <Box mt="auto">
                                <Divider 
                                    mb="md" 
                                    variant="dashed" 
                                    opacity={0.6}
                                    style={{
                                        borderColor: colorScheme === 'dark' 
                                            ? theme.colors.dark[3] 
                                            : theme.colors.gray[3]
                                    }}
                                />
                                
                                <Group justify="space-between" align="center">
                                    <Stack gap={2}>
                                        <Group gap={4} wrap="nowrap">
                                            <IconCalendar 
                                                size={14} 
                                                stroke={1.5} 
                                                style={{ 
                                                    color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6], 
                                                    flexShrink: 0 
                                                }}
                                            />
                                            <Text size="xs" c="dimmed">
                                                Started: {formatLocalDate(counter.startDate)}
                                            </Text>
                                        </Group>
                                        {isArchived && isOwnerView && (
                                            <Group gap={4} wrap="nowrap">
                                                <IconArchive 
                                                    size={14} 
                                                    stroke={1.5} 
                                                    style={{ 
                                                        color: theme.colors.blue[colorScheme === 'dark' ? 4 : 6], 
                                                        flexShrink: 0 
                                                    }}
                                                />
                                                <Text size="xs" c="dimmed">
                                                    Archived: {formatLocalDate(counter.archivedAt)}
                                                </Text>
                                            </Group>
                                        )}
                                    </Stack>

                                    {/* Actions */}
                                    <Group gap={isMobile ? 4 : 8} wrap="nowrap" style={{ flexShrink: 0 }}>
                                        {isOwnerView ? (
                                            <>
                                                {archiveButton}
                                                {isMobile ? (
                                                    <Menu shadow="md" width={180} position="bottom-end" withArrow>
                                                        <Menu.Target>
                                                            <ActionIcon 
                                                                {...getActionIconProps()} 
                                                                aria-label="More actions"
                                                            >
                                                                <IconDotsVertical size="1.1rem" stroke={1.5} />
                                                            </ActionIcon>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            {!counter.isPrivate && (
                                                                <Menu.Item 
                                                                    leftSection={<IconShare3 size={14} stroke={1.5} color={theme.colors.teal[6]} />}
                                                                    onClick={handleShare}
                                                                >
                                                                    Copy Share Link
                                                                </Menu.Item>
                                                            )}
                                                            <Menu.Item 
                                                                leftSection={<IconPencil size={14} stroke={1.5} color={theme.colors[theme.primaryColor][6]} />}
                                                                onClick={handleEdit}
                                                            >
                                                                Edit
                                                            </Menu.Item>
                                                            <Menu.Divider />
                                                            <Menu.Item 
                                                                color="red" 
                                                                leftSection={<IconTrash size={14} stroke={1.5} />}
                                                                onClick={handleDelete}
                                                            >
                                                                Delete
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                ) : (
                                                    <> 
                                                        {editButton} 
                                                        {shareButton} 
                                                        {deleteButtonJsx} 
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            shareButton || null
                                        )}
                                    </Group>
                                </Group>
                            </Box>
                        </Stack>
                    </Card>
                )}
            </Transition>

            {/* Delete confirmation modal */}
            {isOwnerView && (
                <Modal 
                    opened={deleteModalOpened} 
                    onClose={closeDeleteModal} 
                    title={
                        <Text fw={600} size="lg">
                            Confirm Deletion
                        </Text>
                    }
                    centered 
                    size="sm" 
                    radius="md"
                    overlayProps={{
                        blur: 3,
                        backgroundOpacity: 0.55
                    }}
                >
                    <Box mb="lg">
                        <Group mb="md">
                            <ThemeIcon 
                                color="red" 
                                size="lg" 
                                variant="light" 
                                radius="xl"
                            >
                                <IconTrash size="1.2rem" />
                            </ThemeIcon>
                            <Text size="sm" fw={500}>
                                Are you sure you want to permanently delete the counter?
                            </Text>
                        </Group>
                        <Text size="sm" fw={700} c={theme.primaryColor}>
                            &ldquo;{counter.name}&rdquo;
                        </Text>
                    </Box>
                    <Group justify="flex-end">
                        <Button 
                            variant="default" 
                            onClick={closeDeleteModal} 
                            disabled={isDeleting}
                            radius="md"
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="red" 
                            onClick={handleDeleteConfirm} 
                            loading={isDeleting}
                            radius="md"
                            leftSection={!isDeleting && <IconTrash size="1rem" />}
                        >
                            Delete Counter
                        </Button>
                    </Group>
                </Modal>
            )}
        </>
    );
}