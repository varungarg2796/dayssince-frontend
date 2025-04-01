// frontend/src/components/Counters/CounterCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box, Paper, Modal, Button,
    Menu // Added Anchor
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Counter, Tag, UserCounters } from '../../types/index';
import { IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical, IconUserCircle } from '@tabler/icons-react'; // Added IconUserCircle
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCounter, archiveCounter, unarchiveCounter } from '@/lib/apiClient';
import { notifications } from '@mantine/notifications';

// --- Time Difference Calculation Logic ---
interface TimeDifference {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

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
// -----------------------------------------

// --- Timer Display Component ---
function TimerDisplay({ time }: { time: TimeDifference }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isSmallScreen = useMediaQuery('(max-width: 450px)');
    return (
        <Group gap={isSmallScreen ? 4 : 'xs'} justify="center" wrap="nowrap">
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{time.days}</Text><Text size="xs" c="dimmed">days</Text></Stack>
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{pad(time.hours)}</Text><Text size="xs" c="dimmed">hours</Text></Stack>
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{pad(time.minutes)}</Text><Text size="xs" c="dimmed">mins</Text></Stack>
            <Stack align="center" gap={0}><Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{pad(time.seconds)}</Text><Text size="xs" c="dimmed">secs</Text></Stack>
        </Group>
    );
}
// --------------------------------

// --- Date Formatting Helper ---
const formatLocalDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(dateString));
    } catch { return 'Invalid Date'; }
};
// ---------------------------

// --- Interface with OPTIONAL onEdit ---
interface CounterCardProps {
    counter: Counter;
    onEdit?: (counter: Counter) => void;
}

// --- Main CounterCard Component ---
export function CounterCard({ counter, onEdit }: CounterCardProps) {
    const isArchived = !!counter.archivedAt;
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const queryClient = useQueryClient();
    const isOwnerView = typeof onEdit === 'function'; // Determine if owner is viewing

    // --- Mutations ---
    const { mutate: performDelete, isPending: isDeleting } = useMutation({
        mutationFn: deleteCounter,
        onSuccess: () => { notifications.show({ title: 'Success', message: 'Counter deleted!', color: 'green' }); queryClient.invalidateQueries({ queryKey: ['myCounters'] }); closeDeleteModal(); },
        onError: (error) => { notifications.show({ title: 'Error', message: `Failed to delete counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red' }); closeDeleteModal(); },
    });
    const { mutate: performToggleArchive, isPending: isTogglingArchive } = useMutation({
        mutationFn: isArchived ? unarchiveCounter : archiveCounter,
        onSuccess: (updatedCounterData) => { notifications.show({ title: 'Success', message: `Counter ${isArchived ? 'unarchived' : 'archived'}!`, color: 'blue' }); queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => { if (!oldData) return oldData; let sourceList: Counter[]; let targetList: Counter[]; if (isArchived) { sourceList = oldData.archived.filter(c => c.id !== updatedCounterData.id); targetList = [...oldData.active, updatedCounterData].sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return { active: targetList, archived: sourceList }; } else { sourceList = oldData.active.filter(c => c.id !== updatedCounterData.id); targetList = [...oldData.archived, updatedCounterData].sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return { active: sourceList, archived: targetList }; } }); },
        onError: (error) => { notifications.show({ title: 'Error', message: `Failed to ${isArchived ? 'unarchive' : 'archive'} counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red' }); },
    });
    // -------------------

    // --- State, Memos, Effect for Timer ---
    const [currentTimeDiff, setCurrentTimeDiff] = useState<TimeDifference>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const startDate = useMemo(() => { try { return new Date(counter.startDate); } catch { return null; } }, [counter.startDate]);
    const archivedDate = useMemo(() => { try { return counter.archivedAt ? new Date(counter.archivedAt) : null; } catch { return null; } }, [counter.archivedAt]);
    useEffect(() => { let intervalId: NodeJS.Timeout | null = null; if (!isArchived && startDate instanceof Date && !isNaN(startDate.getTime())) { setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); intervalId = setInterval(() => { setCurrentTimeDiff(calculateTimeDifference(startDate, new Date())); }, 1000); } return () => { if (intervalId) clearInterval(intervalId); }; }, [startDate, isArchived]);
    const archivedTimeDiff = useMemo<TimeDifference>(() => { if (isArchived && startDate instanceof Date && !isNaN(startDate.getTime()) && archivedDate instanceof Date && !isNaN(archivedDate.getTime())) { return calculateTimeDifference(startDate, archivedDate); } return { days: 0, hours: 0, minutes: 0, seconds: 0 }; }, [isArchived, startDate, archivedDate]);
    // ------------------------------------

    // --- Action Handlers ---
    const handleEdit = () => isOwnerView && onEdit?.(counter);
    const handleShare = () => { const shareUrl = `${window.location.origin}/counter/${counter.id}`; navigator.clipboard.writeText(shareUrl).then(() => { notifications.show({ title: 'Link Copied!', message: 'Shareable link copied to clipboard.', color: 'teal' }); }).catch(err => { notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' }); console.error('Failed to copy share link:', err); }); };
    const handleToggleArchive = () => { if (isOwnerView && !isTogglingArchive) performToggleArchive(counter.id); };
    const handleDelete = () => { if (isOwnerView) openDeleteModal(); };
    const handleDeleteConfirm = () => { if (isOwnerView && !isDeleting) performDelete(counter.id); };
    // ---------------------

    // --- Action Buttons JSX ---
    const shareButton = !isArchived && !counter.isPrivate && (<Tooltip label="Copy Share Link" withArrow position="bottom" disabled={isMobile}><ActionIcon variant="subtle" size="lg" onClick={handleShare} title="Share"><IconShare3 size="1.1rem" stroke={1.5}/></ActionIcon></Tooltip>);
    const editButton = isOwnerView && (<Tooltip label="Edit" withArrow position="bottom" disabled={isMobile}><ActionIcon variant="subtle" size="lg" onClick={handleEdit} title="Edit"><IconPencil size="1.1rem" stroke={1.5}/></ActionIcon></Tooltip>);
    const deleteButtonJsx = isOwnerView && (<Tooltip label="Delete" withArrow position="bottom" disabled={isMobile}><ActionIcon variant="subtle" color="red" size="lg" onClick={handleDelete} loading={isDeleting} title="Delete"><IconTrash size="1.1rem" stroke={1.5}/></ActionIcon></Tooltip>);
    const archiveButton = isOwnerView && (<Tooltip label={isArchived ? "Unarchive" : "Archive"} withArrow position="bottom"><ActionIcon variant="subtle" size="lg" onClick={handleToggleArchive} loading={isTogglingArchive} title={isArchived ? "Unarchive" : "Archive"}>{isArchived ? <IconArchiveOff size="1.1rem" stroke={1.5}/> : <IconArchive size="1.1rem" stroke={1.5}/>}</ActionIcon></Tooltip>);
    // ----------------------------

    return (
        <>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                <Stack justify="space-between" h="100%" gap="sm" style={{ flexGrow: 1 }}>
                    {/* Top Section */}
                    <Box>
                        <Group justify="space-between" mb="xs" align="flex-start" wrap="nowrap">
                           <Box style={{ flex: 1, minWidth: 0 }}>
                                <Tooltip label={counter.name} openDelay={500} withArrow position="top-start">
                                    <Text fw={700} size="lg" truncate>{counter.name}</Text>
                                </Tooltip>
                            </Box>
                            {isArchived && isOwnerView && (<Badge color="gray" variant="light" radius="sm" px={7}>Archived</Badge>)}
                        </Group>

                        {/* --- CREATOR USERNAME DISPLAY --- */}
                        {counter.user?.username && (
                            <Group gap={4} mb="xs">
                                <IconUserCircle size={14} stroke={1.5} style={{ color: 'var(--mantine-color-dimmed)' }}/>
                                <Text size="xs" c="dimmed">
                                    by {counter.user.username}
                                </Text>
                            </Group>
                        )}
                        {/* ----------------------------- */}

                        {counter.description && (<Text size="sm" c="dimmed" lineClamp={2} mb="xs">{counter.description}</Text>)}
                        {counter.tags && counter.tags.length > 0 && (
                            <Group gap={4} mb="sm" style={{ flexWrap: 'wrap' }}>
                               {counter.tags.slice(0, isMobile ? 2: 3).map((tag: Tag) => (<Badge key={tag.id} variant="light" radius="sm" size="sm" style={{ textTransform: 'none' }}>{tag.name}</Badge>))}
                               {counter.tags.length > (isMobile ? 2 : 3) && (<Tooltip label={counter.tags.slice(isMobile ? 2 : 3).map(t => t.name).join(', ')} withArrow position="right"><Badge variant='light' radius='sm' size="sm">+{counter.tags.length - (isMobile ? 2 : 3)}</Badge></Tooltip>)}
                            </Group>
                        )}
                   </Box>

                    {/* Timer Section */}
                    <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-body)">
                        {isArchived ? (<TimerDisplay time={archivedTimeDiff} />) : (<TimerDisplay time={currentTimeDiff} />)}
                    </Paper>

                    {/* Bottom Section */}
                    <Box mt="sm">
                        <Stack gap={4} mb="md">
                            <Text size="xs" c="dimmed" style={{ display: 'flex', gap: 4 }}><span>Started:</span><span style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>{formatLocalDate(counter.startDate)}</span></Text>
                            {isArchived && isOwnerView && (<Text size="xs" c="dimmed" style={{ display: 'flex', gap: 4 }}><span>Archived:</span><span style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>{formatLocalDate(counter.archivedAt)}</span></Text>)}
                        </Stack>
                        {/* Actions */}
                        <Group gap={8} justify="flex-end">
                            {isOwnerView ? (
                                <>
                                    {archiveButton}
                                    {isMobile ? (
                                        <Menu shadow="md" width={180} position="bottom-end" withArrow>
                                            <Menu.Target><ActionIcon variant="subtle" size="lg" aria-label="More actions"><IconDotsVertical size="1.1rem" stroke={1.5} /></ActionIcon></Menu.Target>
                                            <Menu.Dropdown>
                                                {shareButton}
                                                <Menu.Item leftSection={<IconPencil size={14} stroke={1.5}/>} onClick={handleEdit}>Edit</Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item color="red" leftSection={<IconTrash size={14} stroke={1.5}/>} onClick={handleDelete}>Delete</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    ) : (
                                        <> {editButton} {shareButton} {deleteButtonJsx} </>
                                    )}
                                </>
                            ) : (
                                shareButton || null // Public view only gets share button
                            )}
                         </Group>
                    </Box>
                </Stack>
            </Card>

             {/* Delete confirmation modal */}
             {isOwnerView && (
                <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Confirm Deletion" centered size="sm">
                     <Text size="sm">Are you sure you want to permanently delete the counter &quot;{counter.name}&quot;?</Text>
                     <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</Button>
                        <Button color="red" onClick={handleDeleteConfirm} loading={isDeleting}>Delete Counter</Button>
                     </Group>
                </Modal>
             )}
        </>
    );
}