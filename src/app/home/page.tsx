// src/app/home/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Title, Button, Group, Stack, Text, Center, Loader, Container, SegmentedControl, Modal, Box, ThemeIcon // Added required components
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MainLayout } from '@/components/Layout/MainLayout'; // Adjust path if needed
import { CountersDisplay } from '@/components/Counters/CountersDisplay'; // Adjust path if needed
import { IconPlus, IconLogin, IconLayoutGrid, IconList, IconTrash, IconShare3, IconArchiveOff, IconArchive } from '@tabler/icons-react'; // Added icons
import { AddEditCounterModal } from '@/components/Counters/AddEditCounterModal'; // Adjust path if needed
import { CounterFormData } from '@/components/Counters/CounterForm'; // Adjust path if needed
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Tag, Counter, UpdateCounterPayload, UserCounters } from '@/types'; // Adjust path if needed
import {
    createCounter, fetchTags, updateCounter, deleteCounter, archiveCounter, unarchiveCounter
} from '@/lib/apiClient'; // Adjust path if needed
import { useAuthStore } from '@/stores/authStore'; // Adjust path if needed

export default function HomePage() {
    // --- State & Hooks ---
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

    // --- View Mode State ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid

    // --- Delete Confirmation State ---
    const [deleteTarget, setDeleteTarget] = useState<Counter | null>(null);
    const [deleteModalOpened, { open: openDeleteConfirmModal, close: closeDeleteConfirmModal }] = useDisclosure(false);

    // --- Data Fetching (Tags) ---
    const { data: tagsData, isLoading: isLoadingTags, error: tagsError } = useQuery<Tag[], Error>({
        queryKey: ['tags'],
        queryFn: fetchTags,
        staleTime: 1000 * 60 * 60,
        enabled: isAuthenticated, // Fetch only when logged in
    });

    useEffect(() => {
        if (tagsError) {
            notifications.show({
                title: 'Error loading tags',
                message: `Could not load categories: ${tagsError.message}`,
                color: 'red',
            });
        }
    }, [tagsError]);

    // --- MUTATIONS ---

    // Create Counter
    const { mutate: addCounter, isPending: isCreating } = useMutation({
        mutationFn: (formData: CounterFormData) => {
            const payload = {
                name: formData.name,
                description: formData.description || undefined,
                startDate: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime()) 
                    ? formData.startDate.toISOString() 
                    : new Date().toISOString(),
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

    // Update Counter
    const { mutate: editCounter, isPending: isUpdating } = useMutation({
        mutationFn: (formData: CounterFormData) => {
             if (!editingCounter) throw new Error("Target counter for edit not found.");
             const payload: UpdateCounterPayload = { // Map form data to payload
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
            // Optimistic update logic (assuming UserCounters structure)
             queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
               if (!oldData) return oldData;
               const listKey = updatedCounterData.archivedAt ? 'archived' : 'active';
               const otherListKey = updatedCounterData.archivedAt ? 'active' : 'archived';
               return {
                 ...oldData,
                 [listKey]: oldData[listKey].map(c => (c.id === updatedCounterData.id ? updatedCounterData : c)),
                 [otherListKey]: oldData[otherListKey] // keep other list same
               };
             });
            closeModal();
        },
        onError: (error: Error) => {
            notifications.show({ title: 'Error', message: `Failed to update: ${error.message}`, color: 'red' });
        },
    });

    // Delete Mutation
    const { mutate: performDelete, isPending: isDeleting } = useMutation({
        mutationFn: deleteCounter, // Expects string ID
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

   // Toggle Archive Mutation
   const { mutate: performToggleArchive } = useMutation({ // Removed isPending variable name collision potential
        mutationFn: (counter: Counter) => counter.archivedAt ? unarchiveCounter(counter.id) : archiveCounter(counter.id),
        onSuccess: (updatedCounterData) => {
            const isArchivedNow = !!updatedCounterData.archivedAt;
            notifications.show({ title: 'Success', message: `Counter ${isArchivedNow ? 'archived' : 'unarchived'}!`, color: 'blue', icon: isArchivedNow ? <IconArchive size="1rem"/> : <IconArchiveOff size="1rem"/>});
             // Optimistic Update
            queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
                 if (!oldData) return oldData;
                 const sourceListKey: keyof UserCounters = isArchivedNow ? 'active' : 'archived';
                 const targetListKey: keyof UserCounters = isArchivedNow ? 'archived' : 'active';

                 const sourceList = oldData[sourceListKey].filter(c => c.id !== updatedCounterData.id);
                 const targetList = [...oldData[targetListKey], { ...updatedCounterData, archivedAt: updatedCounterData.archivedAt }] // Use data directly
                    .sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ensure sorted

                 return { ...oldData, [sourceListKey]: sourceList, [targetListKey]: targetList };
            });
        },
         onError: (error: Error, variables) => {
             const wasArchiving = !variables.archivedAt;
             notifications.show({ title: 'Error', message: `Failed to ${wasArchiving ? 'archive' : 'unarchive'}: ${error.message}`, color: 'red' });
        },
    });


    // --- Modal & Form Handlers ---
    const handleOpenAddModal = () => { setEditingCounter(null); openModal(); };
    const handleOpenEditModal = (counter: Counter) => { setEditingCounter(counter); openModal(); };
    const handleCloseModal = () => { closeModal(); /* Consider setEditingCounter(null); */ };
    const handleFormSubmit = (data: CounterFormData) => {
         if (editingCounter) {
             // Map data for edit mutation if necessary (already done in mutationFn above)
            editCounter(data);
         } else {
             // Map data for add mutation if necessary (already done in mutationFn above)
            addCounter(data);
         }
     };

    // --- List Item Action Handlers ---
    const handleDeleteClick = (counter: Counter) => {
        setDeleteTarget(counter);
        openDeleteConfirmModal();
    };
    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            performDelete(deleteTarget.id); // Pass only the ID
        }
    };
     const handleToggleArchiveClick = (counter: Counter) => {
         performToggleArchive(counter); // Pass the whole counter object
     };
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

    // --- Render Logic ---
    if (isAuthLoading) {
        return (<MainLayout><Center style={{ height: 'calc(100vh - 120px)' }}><Loader size="lg" /></Center></MainLayout>);
    }

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
            <Group justify="space-between" align="center" mb="lg">
                 <Group> <Title order={2}>My Counters</Title> </Group>
                <Group>
                    <SegmentedControl
                         value={viewMode}
                         onChange={(value) => setViewMode(value as 'grid' | 'list')}
                         data={[ { label: <IconLayoutGrid size={16} />, value: 'grid' }, { label: <IconList size={16} />, value: 'list' } ]}
                         size="sm"
                         // color={theme.primaryColor} // Direct theme access might need useMantineTheme()
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAddModal} disabled={isLoadingTags} size="sm">Add</Button>
                 </Group>
            </Group>

            <CountersDisplay
                viewMode={viewMode}
                onEditCounter={handleOpenEditModal}
                onDeleteCounter={handleDeleteClick}
                onToggleArchiveCounter={handleToggleArchiveClick}
                onShareCounter={handleShareClick}
            />

            <AddEditCounterModal
                opened={modalOpened}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
                isLoading={editingCounter ? isUpdating : isCreating}
                initialData={editingCounter}
                availableTags={tagsData || []}
            />

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
        </MainLayout>
    );
}