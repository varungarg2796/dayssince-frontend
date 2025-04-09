// src/app/home/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Title, Button, Group, Stack, Text, Center, Loader, Container, SegmentedControl, Modal, Box, ThemeIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MainLayout } from '@/components/Layout/MainLayout';
import { CountersDisplay } from '@/components/Counters/CountersDisplay';
import { IconPlus, IconLogin, IconLayoutGrid, IconList, IconTrash, IconShare3, IconArchiveOff, IconArchive, IconCalendarOff } from '@tabler/icons-react';
import { AddEditCounterModal } from '@/components/Counters/AddEditCounterModal';
// CounterFormData might not be directly needed here anymore, but keep if other parts rely on it
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CounterFormData } from '@/components/Counters/CounterForm';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Tag, Counter, UpdateCounterPayload, UserCounters, CreateCounterDto } from '@/types';
import { ModernDateTimePicker } from '@/components/Counters/ModernDateTimePicker';
import {
    createCounter, fetchTags, updateCounter, deleteCounter, archiveCounter, unarchiveCounter
} from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

export default function HomePage() {
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [deleteTarget, setDeleteTarget] = useState<Counter | null>(null);
    const [deleteModalOpened, { open: openDeleteConfirmModal, close: closeDeleteConfirmModal }] = useDisclosure(false);
    const [toggleArchiveTarget, setToggleArchiveTarget] = useState<Counter | null>(null);
    const [isConfirmingArchive, setIsConfirmingArchive] = useState<boolean>(false);
    const [customArchiveDate, setCustomArchiveDate] = useState<Date | null>(null);
    const [toggleArchiveModalOpened, { open: openToggleArchiveModal, close: closeToggleArchiveModal }] = useDisclosure(false);

    const { data: tagsData, isLoading: isLoadingTags, error: tagsError } = useQuery<Tag[], Error>({
        queryKey: ['tags'], queryFn: fetchTags, staleTime: 1000 * 60 * 60, enabled: isAuthenticated,
    });
    useEffect(() => { if (tagsError) { notifications.show({ title: 'Error loading tags', message: `Could not load categories: ${tagsError.message}`, color: 'red' }); } }, [tagsError]);

    // --- Mutations ---
    const { mutate: addCounterMutate, isPending: isCreating } = useMutation({
        mutationFn: (payload: CreateCounterDto) => createCounter(payload),
        onSuccess: () => { notifications.show({ title: 'Success', message: 'Counter created!', color: 'green' }); queryClient.invalidateQueries({ queryKey: ['myCounters'] }); closeModal(); },
        onError: (error: unknown) => {
            let message = `Failed to create: ${error instanceof Error ? error.message : 'Unknown error'}`;
            if (axios.isAxiosError(error) && error.response?.status === 409) { message = error.response.data?.message || 'That custom URL slug is already taken.'; }
            else if (axios.isAxiosError(error) && error.response?.data?.message) { message = Array.isArray(error.response.data.message) ? error.response.data.message.join(', ') : error.response.data.message; }
            notifications.show({ title: 'Error', message, color: 'red' });
        },
    });

    const { mutate: editCounterMutate, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: UpdateCounterPayload }) => updateCounter({ id, payload }),
        onSuccess: (updatedCounterData) => { notifications.show({ title: 'Success', message: 'Counter updated!', color: 'green' }); queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => { if (!oldData) return oldData; const listKey = updatedCounterData.archivedAt ? 'archived' : 'active'; const otherListKey = updatedCounterData.archivedAt ? 'active' : 'archived'; const updatedItem = { ...updatedCounterData }; return { ...oldData, [listKey]: oldData[listKey].map(c => (c.id === updatedItem.id ? updatedItem : c)), [otherListKey]: oldData[otherListKey].filter(c => c.id !== updatedItem.id) }; }); closeModal(); },
        onError: (error: unknown) => {
            let message = `Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`;
            if (axios.isAxiosError(error) && error.response?.status === 409) { message = error.response.data?.message || 'That custom URL slug is already taken.'; }
            else if (axios.isAxiosError(error) && error.response?.data?.message) { message = Array.isArray(error.response.data.message) ? error.response.data.message.join(', ') : error.response.data.message; }
            notifications.show({ title: 'Error', message, color: 'red' });
        },
    });

    const { mutate: performDelete, isPending: isDeleting } = useMutation({
        mutationFn: deleteCounter,
        onSuccess: () => { notifications.show({ title: 'Success', message: `Counter "${deleteTarget?.name}" deleted!`, color: 'green', icon: <IconTrash size="1rem"/> }); queryClient.invalidateQueries({ queryKey: ['myCounters'] }); closeDeleteConfirmModal(); setDeleteTarget(null); },
        onError: (error: Error) => { notifications.show({ title: 'Error', message: `Failed to delete: ${error.message}`, color: 'red' }); closeDeleteConfirmModal(); },
    });

    const { mutate: performToggleArchive, isPending: isTogglingArchive } = useMutation({
        mutationFn: ({ counter, archiveAt }: { counter: Counter, archiveAt?: Date | null }) => {
            if (counter.archivedAt) { return unarchiveCounter(counter.id); }
            else { return archiveCounter(counter.id, archiveAt ?? undefined); }
        },
        onSuccess: (updatedCounterData) => { const isArchivedNow = !!updatedCounterData.archivedAt; notifications.show({ title: 'Success', message: `Counter ${isArchivedNow ? 'archived' : 'unarchived'}!`, color: 'blue', icon: isArchivedNow ? <IconArchive size="1rem"/> : <IconArchiveOff size="1rem"/>}); queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => { if (!oldData) return oldData; const sourceListKey: keyof UserCounters = isArchivedNow ? 'active' : 'archived'; const targetListKey: keyof UserCounters = isArchivedNow ? 'archived' : 'active'; const sourceList = oldData[sourceListKey].filter(c => c.id !== updatedCounterData.id); const counterToAdd = { ...updatedCounterData, archivedAt: updatedCounterData.archivedAt }; const targetList = [...oldData[targetListKey], counterToAdd].sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return { ...oldData, [sourceListKey]: sourceList, [targetListKey]: targetList }; }); },
        onError: (error: Error, variables) => { const wasArchiving = !variables.counter.archivedAt; notifications.show({ title: 'Error', message: `Failed to ${wasArchiving ? 'archive' : 'unarchive'}: ${error.message}`, color: 'red' }); },
        onSettled: () => { closeToggleArchiveModal(); }
    });

    // Modal & Form Handlers
    const handleOpenAddModal = () => { setEditingCounter(null); openModal(); };
    const handleOpenEditModal = (counter: Counter) => { setEditingCounter(counter); openModal(); };
    const handleCloseModal = () => { closeModal(); };

    const handleFormSubmit = (data: CreateCounterDto | UpdateCounterPayload) => {
        if (editingCounter) {
            editCounterMutate({ id: editingCounter.id, payload: data as UpdateCounterPayload });
        } else {
            addCounterMutate(data as CreateCounterDto);
        }
     };

    // Delete Action Handlers
    const handleDeleteClick = (counter: Counter) => { setDeleteTarget(counter); openDeleteConfirmModal(); };
    const handleDeleteConfirm = () => { if (deleteTarget) performDelete(deleteTarget.id); };

    // Toggle Archive Action Handlers
    const handleRequestToggleArchive = (counter: Counter) => { setToggleArchiveTarget(counter); setIsConfirmingArchive(!counter.archivedAt); setCustomArchiveDate(!counter.archivedAt ? new Date() : null); openToggleArchiveModal(); };
    const handleConfirmToggleArchive = () => {
        if (!toggleArchiveTarget) return;
        // Use the state value which includes clamping from handleArchiveDateChange
        const archiveAtForMutation = isConfirmingArchive ? customArchiveDate : null;
        const counterStartDate = new Date(toggleArchiveTarget.startDate);

        // Frontend Validation
        if (isConfirmingArchive && archiveAtForMutation) {
            if (archiveAtForMutation < counterStartDate) { notifications.show({ title: 'Invalid Date', message: 'Archive date cannot be before the counter start date.', color: 'orange', icon: <IconCalendarOff size="1rem" /> }); return; }
            // Safety check for future date (although onChange should prevent it)
             if (archiveAtForMutation > new Date()) {
                notifications.show({ title: 'Invalid Date', message: 'Archive date cannot be in the future.', color: 'orange', icon: <IconCalendarOff size="1rem" /> });
                // Immediately call mutation with *clamped* time instead of just returning
                performToggleArchive({ counter: toggleArchiveTarget, archiveAt: new Date() });
                return;
            }
        }
        performToggleArchive({ counter: toggleArchiveTarget, archiveAt: archiveAtForMutation });
    };
    const handleCloseToggleArchiveModal = () => { closeToggleArchiveModal(); };

    // --- Handler for Date Picker onChange to clamp future times ---
    const handleArchiveDateChange = (selectedDate: Date | null) => {
        const now = new Date();
        let finalDate = selectedDate;
        if (selectedDate && selectedDate > now) {
            finalDate = now; // Clamp to current time
        }
        setCustomArchiveDate(finalDate);
    };
    // -----------------------------------------------------------

    // Share Handler
    const handleShareClick = (counter: Counter) => {
        if (counter.isPrivate || !counter.slug) { notifications.show({ title: 'Cannot Share', message: 'This counter is private or does not have a public link.', color: 'orange' }); return; }
        const shareUrl = `${window.location.origin}/c/${counter.slug}`;
        navigator.clipboard.writeText(shareUrl).then(() => { notifications.show({ title: 'Link Copied!', message: `Public link for "${counter.name}" copied.`, color: 'teal', autoClose: 3000, icon:<IconShare3 size="1rem"/>}); }).catch(err => { notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' }); console.error('Failed to copy share link:', err); });
    };

    // Render Logic
    if (isAuthLoading) { return (<MainLayout><Center style={{ height: 'calc(100vh - 120px)' }}><Loader size="lg" /></Center></MainLayout>); }
    if (!isAuthenticated) { return ( <MainLayout> <Container size="xs" pt={100}> <Stack align="center" gap="lg"> <Title order={3} ta="center">Your Personal Counters</Title> <Text ta="center" c="dimmed">Log in to view your existing counters or create new ones...</Text> <Button component="a" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} size="md" leftSection={<IconLogin size={18} />} radius="xl">Login with Google</Button> </Stack> </Container> </MainLayout> ); }

    return (
        <MainLayout>
            {/* Header Group */}
            <Group justify="space-between" align="center" mb="lg"> <Group> <Title order={2}>My Counters</Title> </Group> <Group> <SegmentedControl value={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'list')} data={[ { label: <IconLayoutGrid size={16} />, value: 'grid' }, { label: <IconList size={16} />, value: 'list' } ]} size="sm" /> <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddModal} disabled={isLoadingTags} size="sm">Add</Button> </Group> </Group>

            {/* Counters Display */}
            <CountersDisplay viewMode={viewMode} onEditCounter={handleOpenEditModal} onDeleteCounter={handleDeleteClick} onRequestToggleArchive={handleRequestToggleArchive} onShareCounter={handleShareClick} />

            {/* Add/Edit Modal */}
            <AddEditCounterModal opened={modalOpened} onClose={handleCloseModal} onSubmit={handleFormSubmit} isLoading={editingCounter ? isUpdating : isCreating} initialData={editingCounter} availableTags={tagsData || []} />

             {/* Delete Confirmation Modal */}
             <Modal opened={deleteModalOpened} onClose={closeDeleteConfirmModal} title={<Text fw={600} size="md">Confirm Deletion</Text>} centered size="xs" radius="md" overlayProps={{ blur: 2 }}> <Box mb="md"> <Group mb="xs" gap="xs"><ThemeIcon color="red" size="md" variant="light" radius="xl"><IconTrash size="1rem" /></ThemeIcon><Text size="sm" fw={500}>Delete counter?</Text></Group> <Text size="sm" ml={36}>Permanently remove “<Text span fw={500}>{deleteTarget?.name ?? ''}</Text>”?</Text> </Box> <Group justify="flex-end"> <Button variant="default" onClick={closeDeleteConfirmModal} disabled={isDeleting} radius="md" size="sm">Cancel</Button> <Button color="red" onClick={handleDeleteConfirm} loading={isDeleting} radius="md" size="sm" leftSection={!isDeleting && <IconTrash size="0.9rem" />}>Delete</Button> </Group> </Modal>

            {/* Archive/Unarchive Confirmation Modal */}
             <Modal opened={toggleArchiveModalOpened} onClose={handleCloseToggleArchiveModal} title={<Text fw={600} size="lg">{isConfirmingArchive ? 'Confirm Archive' : 'Confirm Unarchive'}</Text>} centered size="md" radius="md" overlayProps={{ blur: 2 }}>
                 <Stack gap="md">
                     <Group wrap="nowrap" gap="xs"> <ThemeIcon color={isConfirmingArchive ? "blue" : "gray"} size="lg" variant="light" radius="xl"> {isConfirmingArchive ? <IconArchive size="1.2rem" /> : <IconArchiveOff size="1.2rem" />} </ThemeIcon> <Text size="sm"> Are you sure you want to {isConfirmingArchive ? 'archive' : 'unarchive'} the counter “<Text span fw={600}>{toggleArchiveTarget?.name ?? ''}</Text>”? </Text> </Group>
                     {isConfirmingArchive && toggleArchiveTarget && (
                         <Box pl={46}>
                             <ModernDateTimePicker
                                label="Archive Date & Time (Optional)"
                                value={customArchiveDate}
                                // *** USE THE CLAMPING HANDLER ***
                                onChange={handleArchiveDateChange}
                                // *******************************
                                maxDate={new Date()} // Keep for calendar day restriction
                                minDate={toggleArchiveTarget?.startDate ? new Date(toggleArchiveTarget.startDate) : undefined}
                             />
                             <Text size="xs" c="dimmed" mt={2}>Defaults to now if left unchanged.</Text>
                         </Box>
                     )}
                     <Group justify="flex-end" mt="lg"> <Button variant="default" onClick={handleCloseToggleArchiveModal} disabled={isTogglingArchive} radius="md" size="sm">Cancel</Button> <Button color={isConfirmingArchive ? "blue" : "gray"} onClick={handleConfirmToggleArchive} loading={isTogglingArchive} radius="md" size="sm" leftSection={!isTogglingArchive ? (isConfirmingArchive ? <IconArchive size="1rem" /> : <IconArchiveOff size="1rem" />) : undefined}> {isConfirmingArchive ? 'Archive' : 'Unarchive'} </Button> </Group>
                 </Stack>
             </Modal>
        </MainLayout>
    );
}