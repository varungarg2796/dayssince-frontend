// src/components/Counters/CounterCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box,
    Menu, useMantineTheme, ThemeIcon, Divider, Transition, Paper, useMantineColorScheme
} from '@mantine/core';
import { useMediaQuery, useHover } from '@mantine/hooks';
import { Counter, Tag } from '../../types/index';
import {
    IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical,
    IconUserCircle, IconCalendar, IconClock, IconLock, IconTags
} from '@tabler/icons-react';
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

function TimerDisplay({ time, isArchived }: { time: TimeDifference, isArchived: boolean }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isSmallScreen = useMediaQuery('(max-width: 450px)');
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const primaryColor = theme.primaryColor;

    const getGradient = () => {
        if (isArchived) {
            return { from: colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6], to: theme.colors.gray[7] };
        }
        return { from: theme.colors[primaryColor][5], to: theme.colors[primaryColor][8] };
    };

    const NumberText = ({ children }: { children: React.ReactNode }) => ( <Text size={isSmallScreen ? 'xl' : '2.6rem'} fw={700} lh={1.1} variant="gradient" gradient={getGradient()} ta="center" style={{ minWidth: isSmallScreen ? '1.5rem' : '2.5rem', textShadow: colorScheme === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none' }}> {children} </Text> );
    const LabelText = ({ children }: { children: React.ReactNode }) => ( <Text size="xs" c="dimmed" tt="uppercase" fw={500} ta="center" style={{ letterSpacing: '0.5px' }}> {children} </Text> );
    const TimeSeparator = () => ( <Text size={isSmallScreen ? "xl" : "2.2rem"} fw={300} c="dimmed" lh={1.1}>:</Text> );

    return (
        <Group gap={isSmallScreen ? 'xs' : 'md'} justify="center" wrap="nowrap" my="xs">
            <Stack align="center" gap={2}><NumberText>{time.days}</NumberText><LabelText>days</LabelText></Stack> <TimeSeparator />
            <Stack align="center" gap={2}><NumberText>{pad(time.hours)}</NumberText><LabelText>hours</LabelText></Stack> <TimeSeparator />
            <Stack align="center" gap={2}><NumberText>{pad(time.minutes)}</NumberText><LabelText>mins</LabelText></Stack> <TimeSeparator />
            <Stack align="center" gap={2}><NumberText>{pad(time.seconds)}</NumberText><LabelText>secs</LabelText></Stack>
        </Group>
    );
}

const formatLocalDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try { return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateString)); }
    catch { return 'Invalid Date'; }
};

interface CounterCardProps {
    counter: Counter;
    onEdit?: (counter: Counter) => void;
    onRequestToggleArchive?: (counter: Counter) => void; // Renamed
    onDelete?: (counter: Counter) => void;
    onShare?: (counter: Counter) => void;
}

export function CounterCard({
    counter,
    onEdit,
    onRequestToggleArchive, // Use new prop
    onDelete,
    onShare
}: CounterCardProps) {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isArchived = !!counter.archivedAt;
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 992px)');
    const isOwnerView = typeof onEdit === 'function'; // Or check other owner-specific props
    const { hovered, ref } = useHover();

    const getCardBorderColor = () => hovered ? 'var(--mantine-primary-color-filled)' : 'transparent';
    const getCardStyle = () => ({ display: 'flex', flexDirection: 'column' as const, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', opacity: isArchived && isOwnerView ? 0.85 : 1, cursor: 'default', borderColor: getCardBorderColor(), borderWidth: '2px', position: 'relative' as const, overflow: 'visible' as const, backgroundColor: 'var(--mantine-color-body)' });

    // Timer State
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return new Date(counter.startDate); } catch { return null; } }, [counter.startDate]);
    const archivedDate = useMemo(() => { try { return counter.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter.archivedAt]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (!isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) {
            setCurrentTimeDiff(calculateTimeDifference(startDate, new Date()));
            intervalId = setInterval(() => { setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); }, 1000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [startDate, isArchived]);

    const archivedTimeDiff = useMemo<TimeDifference>(() => {
        if (isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) {
            return calculateTimeDifference(startDate, archivedDate);
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, [isArchived, startDate, archivedDate]);

    // Action Handlers
    const handleEdit = () => onEdit?.(counter);
    const handleShare = () => onShare?.(counter);
    const handleDelete = () => onDelete?.(counter);
    const handleToggleArchive = () => onRequestToggleArchive?.(counter); // Use prop

    // Action Buttons
    const getActionIconProps = (color?: string) => ({ variant: "subtle", size: "md", radius: "xl", color: color || (colorScheme === 'dark' ? 'gray.6' : 'gray.7'), style: { transition: 'all 0.2s ease' } });

    const shareButton = onShare && !isArchived && !counter.isPrivate && ( <Tooltip label="Copy Share Link" withArrow position="bottom" openDelay={300}><ActionIcon {...getActionIconProps('teal')} onClick={handleShare} title="Share"><IconShare3 size="1.1rem" stroke={1.5}/></ActionIcon></Tooltip> );
    const editButton = onEdit && ( <Tooltip label="Edit" withArrow position="bottom" openDelay={300}><ActionIcon {...getActionIconProps(theme.primaryColor)} onClick={handleEdit} title="Edit"><IconPencil size="1.1rem" stroke={1.5}/></ActionIcon></Tooltip> );
    const deleteButtonJsx = onDelete && ( <Tooltip label="Delete" withArrow position="bottom" openDelay={300}><ActionIcon {...getActionIconProps("red")} onClick={handleDelete} title="Delete"><IconTrash size="1.1rem" stroke={1.5}/></ActionIcon></Tooltip> );
    const archiveButton = onRequestToggleArchive && ( <Tooltip label={isArchived ? "Unarchive" : "Archive"} withArrow position="bottom" openDelay={300}><ActionIcon {...getActionIconProps("blue")} onClick={handleToggleArchive} title={isArchived ? "Unarchive" : "Archive"}>{isArchived ? <IconArchiveOff size="1.1rem" stroke={1.5}/> : <IconArchive size="1.1rem" stroke={1.5}/>}</ActionIcon></Tooltip> );

    return (
        <Transition mounted={true} transition="fade" duration={400}>
            {(styles) => (
                <Card ref={ref} shadow={hovered ? "md" : "sm"} padding="lg" radius="lg" withBorder h="100%" style={{ ...getCardStyle(), ...styles, transform: hovered && !isMobile ? 'translateY(-5px)' : 'translateY(0)' }}>
                    {isArchived && isOwnerView && ( <Badge color="gray" variant="filled" radius="sm" size="sm" style={{ position: 'absolute', top: -10, right: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}> Archived </Badge> )}
                    {counter.isPrivate && ( <Tooltip label="Private Counter" withArrow position="top"><ThemeIcon size="xs" color={colorScheme === 'dark' ? 'gray' : 'gray'} variant="light" style={{ position: 'absolute', top: 12, right: 12, borderRadius: '50%' }}> <IconLock size="0.8rem" stroke={1.5} /> </ThemeIcon></Tooltip> )}
                    <Stack justify="space-between" h="100%" gap="md" style={{ flexGrow: 1 }}>
                        <Box>
                            <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                                <Box style={{ flex: 1, minWidth: 0 }}><Text fw={700} size={isTablet ? "lg" : "xl"} lh={1.3} truncate="end" style={{ transition: 'color 0.2s ease' }}>{counter.name}</Text></Box>
                            </Group>
                            {counter.user?.username && ( <Group gap={4} mb="sm"><IconUserCircle size={16} stroke={1.5} style={{ color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6] }} /><Text size="sm" c="dimmed">by {counter.user.username}</Text></Group> )}
                            {counter.description && ( <Text size="sm" c="dimmed" lineClamp={3} mb="sm" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>{counter.description}</Text> )}
                            {counter.tags && counter.tags.length > 0 && (
                                <Group gap={8} mb="sm" wrap="wrap" align="center">
                                    <ThemeIcon size="xs" color={colorScheme === 'dark' ? 'gray.6' : 'gray.6'} variant="light"><IconTags size="0.8rem" stroke={1.5} /></ThemeIcon>
                                    {counter.tags.slice(0, isMobile ? 2 : 4).map((tag: Tag) => ( <Badge key={tag.id} variant="dot" size="sm" color={theme.primaryColor} radius="sm" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{tag.name}</Badge> ))}
                                    {counter.tags.length > (isMobile ? 2 : 4) && ( <Tooltip label={counter.tags.slice(isMobile ? 2 : 4).map(t => t.name).join(', ')} withArrow><Badge variant='filled' color={theme.primaryColor} radius='sm' size="sm">+{counter.tags.length - (isMobile ? 2 : 4)}</Badge></Tooltip> )}
                                </Group>
                            )}
                            <Divider my="md" variant="dashed" opacity={0.6} style={{ borderColor: colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[3] }} />
                        </Box>

                        <Paper p="md" radius="md" shadow="sm" style={{ textAlign: 'center', backgroundColor: 'var(--mantine-color-body)', position: 'relative', overflow: 'hidden' }} my="sm" withBorder>
                            <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', padding: '6px 0', }}>
                                <Group align="center" justify="center" gap={6}>
                                    <IconClock size={14} stroke={1.5} color={colorScheme === 'dark' ? 'white' : 'black'} />
                                    <Text size="xs" fw={600} style={{ letterSpacing: '0.5px', color: colorScheme === 'dark' ? 'white' : 'black' }}>{isArchived ? 'FINAL DURATION' : 'ELAPSED TIME'}</Text>
                                </Group>
                            </Box>
                            <Box pt={25}> {isArchived ? <TimerDisplay time={archivedTimeDiff} isArchived={isArchived} /> : <TimerDisplay time={currentTimeDiff} isArchived={isArchived} />} </Box>
                        </Paper>

                        <Box mt="auto">
                            <Divider mb="md" variant="dashed" opacity={0.6} style={{ borderColor: colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[3] }} />
                            <Group justify="space-between" align="center">
                                <Stack gap={2}>
                                    <Group gap={4} wrap="nowrap"><IconCalendar size={14} stroke={1.5} style={{ color: theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6], flexShrink: 0 }} /><Text size="xs" c="dimmed">Started: {formatLocalDate(counter.startDate)}</Text></Group>
                                    {isArchived && isOwnerView && ( <Group gap={4} wrap="nowrap"><IconArchive size={14} stroke={1.5} style={{ color: theme.colors.blue[colorScheme === 'dark' ? 4 : 6], flexShrink: 0 }} /><Text size="xs" c="dimmed">Archived: {formatLocalDate(counter.archivedAt)}</Text></Group> )}
                                </Stack>
                                <Group gap={isMobile ? 4 : 8} wrap="nowrap" style={{ flexShrink: 0 }}>
                                    {isOwnerView ? (
                                        <>
                                            {archiveButton}
                                            {isMobile ? (
                                                <Menu shadow="md" width={180} position="bottom-end" withArrow>
                                                    <Menu.Target><ActionIcon {...getActionIconProps()} aria-label="More actions"><IconDotsVertical size="1.1rem" stroke={1.5} /></ActionIcon></Menu.Target>
                                                    <Menu.Dropdown>
                                                        {shareButton && !counter.isPrivate && ( <Menu.Item leftSection={<IconShare3 size={14} stroke={1.5} color={theme.colors.teal[6]} />} onClick={handleShare}> Copy Share Link </Menu.Item> )}
                                                        {editButton && ( <Menu.Item leftSection={<IconPencil size={14} stroke={1.5} color={theme.colors[theme.primaryColor][6]} />} onClick={handleEdit}> Edit </Menu.Item> )}
                                                        {(editButton || shareButton) && deleteButtonJsx && <Menu.Divider />}
                                                        {deleteButtonJsx && ( <Menu.Item color="red" leftSection={<IconTrash size={14} stroke={1.5} />} onClick={handleDelete}> Delete </Menu.Item> )}
                                                    </Menu.Dropdown>
                                                </Menu>
                                            ) : ( <> {editButton} {shareButton} {deleteButtonJsx} </> )}
                                        </>
                                    ) : ( shareButton || null )}
                                </Group>
                            </Group>
                        </Box>
                    </Stack>
                </Card>
            )}
        </Transition>
    );
}