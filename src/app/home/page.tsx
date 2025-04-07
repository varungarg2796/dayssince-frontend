// src/app/home/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Title, Button, Group, Stack, Text, Center, Loader, Container, SegmentedControl, Modal, Box, ThemeIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MainLayout } from '@/components/Layout/MainLayout';
import { CountersDisplay } from '@/components/Counters/CountersDisplay';
import { IconPlus, IconLogin, IconLayoutGrid, IconList, IconTrash, IconShare3, IconArchiveOff, IconArchive } from '@tabler/icons-react';
import { AddEditCounterModal } from '@/components/Counters/AddEditCounterModal';
import { CounterFormData } from '@/components/Counters/CounterForm';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Tag, Counter, UpdateCounterPayload, UserCounters } from '@/types';
import { ModernDateTimePicker } from '@/components/Counters/ModernDateTimePicker'; // Import the date picker
import {
    createCounter, fetchTags, updateCounter, deleteCounter, archiveCounter, unarchiveCounter
} from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [deleteTarget, setDeleteTarget] = useState<Counter | null>(null);
    const [deleteModalOpened, { open: openDeleteConfirmModal, close: closeDeleteConfirmModal }] = useDisclosure(false);

    // Archive/Unarchive Confirmation State
    const [toggleArchiveTarget, setToggleArchiveTarget] = useState<Counter | null>(null);
    const [isConfirmingArchive, setIsConfirmingArchive] = useState<boolean>(false);
    const [customArchiveDate, setCustomArchiveDate] = useState<Date | null>(null); // Should be Date | null
    const [toggleArchiveModalOpened, { open: openToggleArchiveModal, close: closeToggleArchiveModal }] = useDisclosure(false);

    // Data Fetching (Tags)
    const { data: tagsData, isLoading: isLoadingTags, error: tagsError } = useQuery<Tag[], Error>({
        queryKey: ['tags'],
        queryFn: fetchTags,
        staleTime: 1000 * 60 * 60,
        enabled: isAuthenticated,
    });

    useEffect(() => {
        if (tagsError) {
            notifications.show({ title: 'Error loading tags', message: `Could not load categories: ${tagsError.message}`, color: 'red' });
        }
    }, [tagsError]);

    // Mutations
    const { mutate: addCounter, isPending: isCreating } = useMutation({
      mutationFn: (formData: CounterFormData) => {
        const payload = {
          name: formData.name,
          description: formData.description || undefined,
          startDate: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime()) ? formData.startDate.toISOString() : new Date().toISOString(),
          isPrivate: formData.isPrivate,
          tagIds: formData.tagIds || []
        };
        return createCounter(payload);
      },
      onSuccess: () => {
          notifications.show({ title: 'Success', message: 'Counter created!', color: 'green' });
          queryClient.invalidateQueries({ queryKey: ['myCounters'] });
          closeModal();
      },
      onError: (error: Error) => {
          notifications.show({ title: 'Error', message: `Failed to create: ${error.message}`, color: 'red' });
      },
    });

    const { mutate: editCounter, isPending: isUpdating } = useMutation({
        mutationFn: (formData: CounterFormData) => {
             if (!editingCounter) throw new Error("Target counter for edit not found.");
             const payload: UpdateCounterPayload = {
                 name: formData.name,
                 description: formData.description || undefined,
                 startDate: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime()) ? formData.startDate.toISOString() : undefined,
                 isPrivate: formData.isPrivate,
                 tagIds: formData.tagIds || []
             };
             return updateCounter({ id: editingCounter.id, payload });
        },
        onSuccess: (updatedCounterData) => {
            notifications.show({ title: 'Success', message: 'Counter updated!', color: 'green' });
             queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
               if (!oldData) return oldData;
               const listKey = updatedCounterData.archivedAt ? 'archived' : 'active';
               const otherListKey = updatedCounterData.archivedAt ? 'active' : 'archived';
               return {
                 ...oldData,
                 [listKey]: oldData[listKey].map(c => (c.id === updatedCounterData.id ? updatedCounterData : c)),
                 [otherListKey]: oldData[otherListKey].filter(c => c.id !== updatedCounterData.id)
               };
             });
            closeModal();
        },
        onError: (error: Error) => {
            notifications.show({ title: 'Error', message: `Failed to update: ${error.message}`, color: 'red' });
        },
    });

    const { mutate: performDelete, isPending: isDeleting } = useMutation({
        mutationFn: deleteCounter,
        onSuccess: () => {
            notifications.show({ title: 'Success', message: `Counter "${deleteTarget?.name}" deleted!`, color: 'green', icon: <IconTrash size="1rem"/> });
            queryClient.invalidateQueries({ queryKey: ['myCounters'] });
            closeDeleteConfirmModal();
            setDeleteTarget(null);
        },
        onError: (error: Error) => {
            notifications.show({ title: 'Error', message: `Failed to delete: ${error.message}`, color: 'red' });
            closeDeleteConfirmModal();
        },
    });

    // *** FIXED MUTATION CALL ***
    const { mutate: performToggleArchive, isPending: isTogglingArchive } = useMutation({
        mutationFn: ({ counter, archiveAt }: { counter: Counter, archiveAt?: Date | null }) => {
            if (counter.archivedAt) {
                // Unarchiving - no date needed
                return unarchiveCounter(counter.id);
            } else {
                // Archiving - pass Date object or undefined
                return archiveCounter(counter.id, archiveAt ?? undefined); // Pass Date object directly
            }
        },
        onSuccess: (updatedCounterData) => {
            const isArchivedNow = !!updatedCounterData.archivedAt;
            notifications.show({ title: 'Success', message: `Counter ${isArchivedNow ? 'archived' : 'unarchived'}!`, color: 'blue', icon: isArchivedNow ? <IconArchive size="1rem"/> : <IconArchiveOff size="1rem"/>});
            queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
                 if (!oldData) return oldData;
                 const sourceListKey: keyof UserCounters = isArchivedNow ? 'active' : 'archived';
                 const targetListKey: keyof UserCounters = isArchivedNow ? 'archived' : 'active';
                 const sourceList = oldData[sourceListKey].filter(c => c.id !== updatedCounterData.id);
                 const counterToAdd = { ...updatedCounterData, archivedAt: updatedCounterData.archivedAt };
                 const targetList = [...oldData[targetListKey], counterToAdd]
                    .sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                 return { ...oldData, [sourceListKey]: sourceList, [targetListKey]: targetList };
            });
        },
         onError: (error: Error, variables) => {
             const wasArchiving = !variables.counter.archivedAt;
             notifications.show({ title: 'Error', message: `Failed to ${wasArchiving ? 'archive' : 'unarchive'}: ${error.message}`, color: 'red' });
        },
        onSettled: () => {
            closeToggleArchiveModal();
        }
    });

    // Modal & Form Handlers
    const handleOpenAddModal = () => { setEditingCounter(null); openModal(); };
    const handleOpenEditModal = (counter: Counter) => { setEditingCounter(counter); openModal(); };
    const handleCloseModal = () => { closeModal(); };
    const handleFormSubmit = (data: CounterFormData) => {
         if (editingCounter) { editCounter(data); }
         else { addCounter(data); }
     };

    // Delete Action Handlers
    const handleDeleteClick = (counter: Counter) => { setDeleteTarget(counter); openDeleteConfirmModal(); };
    const handleDeleteConfirm = () => { if (deleteTarget) performDelete(deleteTarget.id); };

    // Toggle Archive Action Handlers
    const handleRequestToggleArchive = (counter: Counter) => {
        setToggleArchiveTarget(counter);
        setIsConfirmingArchive(!counter.archivedAt);
        // Reset or set default custom date only when archiving
        setCustomArchiveDate(!counter.archivedAt ? new Date() : null);
        openToggleArchiveModal();
    };

    const handleConfirmToggleArchive = () => {
        if (toggleArchiveTarget) {
            // Pass the Date object (or null/undefined) to the mutation
            const archiveAtForMutation = isConfirmingArchive ? customArchiveDate : null;
            performToggleArchive({ counter: toggleArchiveTarget, archiveAt: archiveAtForMutation });
        }
    };

    const handleCloseToggleArchiveModal = () => {
        closeToggleArchiveModal();
        // Optionally reset state after closing
        // setTimeout(() => {
        //     setToggleArchiveTarget(null);
        //     setCustomArchiveDate(null);
        // }, 200);
    };

    // Share Handler
    const handleShareClick = (counter: Counter) => {
        if (counter.isPrivate) {
             notifications.show({ title: 'Private Counter', message: 'Cannot share a private counter link.', color: 'yellow' });
             return;
        }
        const shareUrl = `${window.location.origin}/counter/${counter.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            notifications.show({ title: 'Link Copied!', message: `Link to "${counter.name}" copied.`, color: 'teal', autoClose: 3000, icon:<IconShare3 size="1rem"/>});
        }).catch(err => {
             notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' });
             console.error('Failed to copy share link:', err);
         });
     };

    // Render Logic
    if (isAuthLoading) { return (<MainLayout><Center style={{ height: 'calc(100vh - 120px)' }}><Loader size="lg" /></Center></MainLayout>); }
    if (!isAuthenticated) {
        return (
            <MainLayout>
                <Container size="xs" pt={100}>
                    <Stack align="center" gap="lg">
                         <Title order={3} ta="center">Your Personal Counters</Title>
                        <Text ta="center" c="dimmed">Log in to view your existing counters or create new ones to track important dates and events.</Text>
                         <Button component="a" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} size="md" leftSection={<IconLogin size={18} />} radius="xl">Login with Google</Button>
                    </Stack>
                </Container>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header Group */}
            <Group justify="space-between" align="center" mb="lg">
                 <Group> <Title order={2}>My Counters</Title> </Group>
                <Group>
                    <SegmentedControl value={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'list')} data={[ { label: <IconLayoutGrid size={16} />, value: 'grid' }, { label: <IconList size={16} />, value: 'list' } ]} size="sm" />
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddModal} disabled={isLoadingTags} size="sm">Add</Button>
                 </Group>
            </Group>

            {/* Counters Display */}
            <CountersDisplay
                viewMode={viewMode}
                onEditCounter={handleOpenEditModal}
                onDeleteCounter={handleDeleteClick}
                onRequestToggleArchive={handleRequestToggleArchive}
                onShareCounter={handleShareClick}
            />

            {/* Add/Edit Modal */}
            <AddEditCounterModal opened={modalOpened} onClose={handleCloseModal} onSubmit={handleFormSubmit} isLoading={editingCounter ? isUpdating : isCreating} initialData={editingCounter} availableTags={tagsData || []} />

             {/* Delete Confirmation Modal */}
             <Modal opened={deleteModalOpened} onClose={closeDeleteConfirmModal} title={<Text fw={600} size="md">Confirm Deletion</Text>} centered size="xs" radius="md" overlayProps={{ blur: 2 }}>
                 <Box mb="md">
                     <Group mb="xs" gap="xs"><ThemeIcon color="red" size="md" variant="light" radius="xl"><IconTrash size="1rem" /></ThemeIcon><Text size="sm" fw={500}>Delete counter?</Text></Group>
                     <Text size="sm" ml={36}>Permanently remove “<Text span fw={500}>{deleteTarget?.name ?? ''}</Text>”?</Text>
                 </Box>
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeDeleteConfirmModal} disabled={isDeleting} radius="md" size="sm">Cancel</Button>
                    <Button color="red" onClick={handleDeleteConfirm} loading={isDeleting} radius="md" size="sm" leftSection={!isDeleting && <IconTrash size="0.9rem" />}>Delete</Button>
                 </Group>
            </Modal>

            {/* Archive/Unarchive Confirmation Modal */}
             <Modal
                opened={toggleArchiveModalOpened}
                onClose={handleCloseToggleArchiveModal}
                title={<Text fw={600} size="lg">{isConfirmingArchive ? 'Confirm Archive' : 'Confirm Unarchive'}</Text>}
                centered size="md" radius="md" overlayProps={{ blur: 2 }}
             >
                 <Stack gap="md">
                     <Group wrap="nowrap" gap="xs">
                        <ThemeIcon color={isConfirmingArchive ? "blue" : "gray"} size="lg" variant="light" radius="xl">
                            {isConfirmingArchive ? <IconArchive size="1.2rem" /> : <IconArchiveOff size="1.2rem" />}
                         </ThemeIcon>
                        <Text size="sm">
                            Are you sure you want to {isConfirmingArchive ? 'archive' : 'unarchive'} the counter
                             “<Text span fw={600}>{toggleArchiveTarget?.name ?? ''}</Text>”?
                        </Text>
                     </Group>

                     {/* Conditional Date Picker (Only for Archiving) */}
                     {isConfirmingArchive && toggleArchiveTarget && (
                         <Box pl={46}>
                            {/* *** FIXED DATE PICKER: Removed getDayProps *** */}
                             <ModernDateTimePicker
                                label="Archive Date & Time (Optional)"
                                value={customArchiveDate}
                                onChange={setCustomArchiveDate}
                             />
                             <Text size="xs" c="dimmed" mt={2}>Defaults to now if left unchanged.</Text>
                         </Box>
                     )}

                     <Group justify="flex-end" mt="lg">
                        <Button variant="default" onClick={handleCloseToggleArchiveModal} disabled={isTogglingArchive} radius="md" size="sm">Cancel</Button>
                        <Button
                            color={isConfirmingArchive ? "blue" : "gray"}
                            onClick={handleConfirmToggleArchive}
                            loading={isTogglingArchive} radius="md" size="sm"
                            leftSection={!isTogglingArchive ? (isConfirmingArchive ? <IconArchive size="1rem" /> : <IconArchiveOff size="1rem" />) : undefined}
                        >
                            {isConfirmingArchive ? 'Archive' : 'Unarchive'}
                        </Button>
                    </Group>
                 </Stack>
             </Modal>
        </MainLayout>
    );
}