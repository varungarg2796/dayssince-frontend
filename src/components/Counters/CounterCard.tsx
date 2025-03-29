// src/components/Counters/CounterCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box, Paper, Modal, Button, // Added Modal, Button
    Menu
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks'; // Added hooks
import { Counter, Tag, UserCounters } from '../../types/index'; // Import types correctly
import { IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3, IconDotsVertical } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import mutation hooks
import { deleteCounter, archiveCounter, unarchiveCounter } from '@/lib/apiClient'; // Import API functions
import { notifications } from '@mantine/notifications'; // Import notifications

// --- Time Difference Calculation Logic ---
interface TimeDifference {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeDifference(startDate: Date, endDate: Date): TimeDifference {
  const differenceMs = endDate.getTime() - startDate.getTime();

  if (differenceMs < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(differenceMs / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}
// -----------------------------------------


// --- Timer Display Component (Using Mantine v7 Props) ---
function TimerDisplay({ time }: { time: TimeDifference }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isSmallScreen = useMediaQuery('(max-width: 450px)'); // For responsive timer size

    return (
        <Group gap={isSmallScreen ? 4 : 'xs'} justify="center" wrap="nowrap">
            <Stack align="center" gap={0}>
                <Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{time.days}</Text>
                <Text size="xs" color="dimmed">days</Text>
            </Stack>
             <Stack align="center" gap={0}>
                <Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{pad(time.hours)}</Text>
                <Text size="xs" color="dimmed">hours</Text>
            </Stack>
             <Stack align="center" gap={0}>
                <Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{pad(time.minutes)}</Text>
                <Text size="xs" color="dimmed">mins</Text>
            </Stack>
             <Stack align="center" gap={0}>
                <Text size={isSmallScreen ? 'md' : 'xl'} fw={700} lh={1.1}>{pad(time.seconds)}</Text>
                <Text size="xs" color="dimmed">secs</Text>
            </Stack>
        </Group>
    );
}
// --------------------------------

// --- Date Formatting Helper ---
const formatLocalDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(dateString));
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};
// ---------------------------

interface CounterCardProps {
    counter: Counter;
    onEdit: () => void;
}

// --- Main CounterCard Component ---
export function CounterCard({ counter, onEdit }: CounterCardProps)  {
    const isArchived = !!counter.archivedAt;
    const isMobile = useMediaQuery('(max-width: 768px)'); // For actions menu
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

    // --- React Query Client ---
    const queryClient = useQueryClient();

    // --- Mutations ---
    const { mutate: performDelete, isPending: isDeleting } = useMutation({
        mutationFn: deleteCounter,
        onSuccess: () => {
            notifications.show({ title: 'Success', message: 'Counter deleted!', color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['myCounters'] });
            closeDeleteModal();
        },
        onError: (error) => {
             notifications.show({ title: 'Error', message: `Failed to delete counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red' });
            closeDeleteModal();
        },
    });

    const { mutate: performToggleArchive, isPending: isTogglingArchive } = useMutation({
        mutationFn: isArchived ? unarchiveCounter : archiveCounter,
        onSuccess: (updatedCounterData) => {
             notifications.show({ title: 'Success', message: `Counter ${isArchived ? 'unarchived' : 'archived'}!`, color: 'blue' });
             // Optimistic Update
             queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
                if (!oldData) return oldData;
                let sourceList: Counter[]; let targetList: Counter[];
                if (isArchived) { sourceList = oldData.archived; targetList = oldData.active; }
                else { sourceList = oldData.active; targetList = oldData.archived; }
                const updatedSourceList = sourceList.filter(c => c.id !== updatedCounterData.id);
                targetList.push(updatedCounterData); // Add updated data to the target list
                return isArchived
                    ? { active: targetList, archived: updatedSourceList }
                    : { active: updatedSourceList, archived: targetList };
             });
        },
         onError: (error) => {
             notifications.show({ title: 'Error', message: `Failed to ${isArchived ? 'unarchive' : 'archive'} counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red' });
        },
    });
    // -------------------

    // --- State, Memos, Effect for Timer ---
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
    // ------------------------------------

    // --- Action Handlers ---
    const handleEdit = onEdit;
    const handleShare = () => console.log("Share clicked:", counter.id); // Keep placeholder
    const handleToggleArchive = () => { if (!isTogglingArchive) performToggleArchive(counter.id); };
    const handleDelete = () => openDeleteModal(); // Opens the modal
    const handleDeleteConfirm = () => { if (!isDeleting) performDelete(counter.id); };
    // ---------------------

    // --- Action Buttons JSX (for reuse) ---
    const shareButton = !isArchived && (
        <Tooltip label="Share" withArrow position="bottom" disabled={isMobile}>
            <ActionIcon variant="subtle" size="lg" onClick={handleShare} disabled={counter.isPrivate} title="Share">
                <IconShare3 size="1.1rem" stroke={1.5}/>
            </ActionIcon>
        </Tooltip>
    );
    const editButton = (
        <Tooltip label="Edit" withArrow position="bottom" disabled={isMobile}>
            <ActionIcon variant="subtle" size="lg" onClick={handleEdit} title="Edit">
                <IconPencil size="1.1rem" stroke={1.5}/>
            </ActionIcon>
        </Tooltip>
    );
     const deleteButtonJsx = (
        <Tooltip label="Delete" withArrow position="bottom" disabled={isMobile}>
            {/* Changed onClick to open modal */}
            <ActionIcon variant="subtle" color="red" size="lg" onClick={handleDelete} loading={isDeleting} title="Delete">
                <IconTrash size="1.1rem" stroke={1.5}/>
            </ActionIcon>
        </Tooltip>
    );
    const archiveButton = (
         <Tooltip label={isArchived ? "Unarchive" : "Archive"} withArrow position="bottom">
            <ActionIcon variant="subtle" size="lg" onClick={handleToggleArchive} loading={isTogglingArchive} title={isArchived ? "Unarchive" : "Archive"}>
               {isArchived ? <IconArchiveOff size="1.1rem" stroke={1.5}/> : <IconArchive size="1.1rem" stroke={1.5}/>}
           </ActionIcon>
        </Tooltip>
    );
    // ----------------------------

    return (
        <> {/* Fragment needed for Modal */}
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                h="100%"
                style={{ // Keep your preferred style
                    opacity: isArchived ? 0.65 : 1,
                    transition: 'all 0.2s ease',
                    transform: 'translateZ(0)',
                    // Removed hover style from here as it complicates things, add via CSS if needed
                }}
            >
                <Stack justify="space-between" h="100%" gap="sm">
                    {/* Top Section: Meta Info */}
                    <Box>
                        <Group justify="space-between" mb={{ base: 'xs', sm: 'sm' }} align="flex-start" wrap="nowrap">
                           <Box style={{ flex: 1, minWidth: 0 }}> {/* Ensure Box can shrink */}
                                <Tooltip label={counter.name} openDelay={500} withArrow position="top-start">
                                    <Text fw={700} size="lg" truncate>{counter.name}</Text>
                                </Tooltip>
                            </Box>
                            {isArchived && (<Badge color="gray" variant="filled" radius="sm" px={7} style={{ flexShrink: 0 }}>Archived</Badge>)}
                        </Group>
                        {counter.description && (<Text size="sm" color="dimmed" lineClamp={2} mb="xs">{counter.description}</Text>)}
                        {counter.tags && counter.tags.length > 0 && (
                            <Group gap={4} mb="sm" style={{ flexWrap: 'wrap' }}>
                               {/* Your tags rendering logic */}
                                {counter.tags.slice(0, isMobile ? 2: 3).map((tag: Tag) => (<Badge key={tag.id} variant="dot" radius="sm" size="sm" style={{ textTransform: 'none' }}>{tag.name}</Badge>))}
                                {counter.tags.length > (isMobile ? 2 : 3) && (<Tooltip label={counter.tags.slice(isMobile ? 2 : 3).map(t => t.name).join(', ')} withArrow position="right"><Badge variant='filled' radius='sm' size="sm">+{counter.tags.length - (isMobile ? 2 : 3)}</Badge></Tooltip>)}
                            </Group>
                        )}
                   </Box>

                    {/* Timer/Duration Section */}
                    <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-body)">
                        {isArchived ? (<TimerDisplay time={archivedTimeDiff} />) : (<TimerDisplay time={currentTimeDiff} />)}
                    </Paper>

                    {/* Bottom Section: Dates & Actions */}
                    <Box mt="auto">
                        <Stack gap={4} mb="md">
                            <Text size="xs" c="dimmed" style={{ display: 'flex', gap: 4 }}><span>Started:</span><span style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>{formatLocalDate(counter.startDate)}</span></Text>
                            {isArchived && (<Text size="xs" c="dimmed" style={{ display: 'flex', gap: 4 }}><span>Archived:</span><span style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>{formatLocalDate(counter.archivedAt)}</span></Text>)}
                        </Stack>
                        {/* --- Responsive Actions --- */}
                        <Group gap={8} justify="flex-end">
                             {archiveButton} {/* Always show Archive/Unarchive */}
                             {isMobile ? (
                                 // Mobile: Use Menu for other actions
                                 <Menu shadow="md" width={180} position="bottom-end" withArrow>
                                     <Menu.Target>
                                         <ActionIcon variant="subtle" size="lg" aria-label="More actions"><IconDotsVertical size="1.1rem" stroke={1.5} /></ActionIcon>
                                     </Menu.Target>
                                     <Menu.Dropdown>
                                         {!isArchived && !counter.isPrivate && (<Menu.Item leftSection={<IconShare3 size={14} stroke={1.5} />} onClick={handleShare}>Share</Menu.Item>)}
                                         <Menu.Item leftSection={<IconPencil size={14} stroke={1.5}/>} onClick={handleEdit}>Edit</Menu.Item>
                                         <Menu.Divider />
                                         {/* Trigger modal open from menu item */}
                                         <Menu.Item color="red" leftSection={<IconTrash size={14} stroke={1.5}/>} onClick={handleDelete}>Delete</Menu.Item>
                                     </Menu.Dropdown>
                                 </Menu>
                             ) : (
                                 // Desktop: Show all icons
                                 <>
                                     {editButton}
                                     {shareButton} {/* Renders null if not applicable */}
                                     {deleteButtonJsx} {/* Use renamed variable */}
                                 </>
                             )}
                         </Group>
                         {/* ------------------------ */}
                    </Box>
                </Stack>
            </Card>

             <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Confirm Deletion" centered size="sm">
                  <Text size="sm">Are you sure you want to permanently delete the counter {counter.name}?</Text>
                  <Group justify="flex-end" mt="md">
                     <Button variant="default" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</Button>
                      <Button color="red" onClick={handleDeleteConfirm} loading={isDeleting}>Delete Counter</Button>
                  </Group>
             </Modal>
        </>
    );
}