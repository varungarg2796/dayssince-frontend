// src/app/home/page.tsx
'use client'; // <-- ADD THIS DIRECTIVE

import React, { useEffect, useState } from 'react';
// Added Button, Group, useDisclosure
import { Title, Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // Import hook for modal state
import { Providers } from '../providers';
import { MainLayout } from '@/components/Layout/MainLayout';
import { CountersDisplay } from '@/components/Counters/CountersDisplay';
import { IconPlus } from '@tabler/icons-react';
import { AddEditCounterModal } from '@/components/Counters/AddEditCounterModal';
import { CounterFormData } from '@/components/Counters/CounterForm';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Tag, CreateCounterDto, Counter } from '@/types'; // Import Tag and Counter types
import { createCounter, fetchTags, updateCounter } from '@/lib/apiClient';
import { UserCounters, UpdateCounterPayload } from '@/types'; 



export default function HomePage() {
  // Hook for controlling the Add/Edit Modal
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // --- State to hold counter being edited ---
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);

  const queryClient = useQueryClient();

  // --- Fetch available tags for the form ---
  // TODO: Implement GET /api/tags in backend and fetchTags in apiClient
  const { data: tagsData, isLoading: isLoadingTags, error: tagsError } = useQuery<Tag[], Error>({ // Added types
    queryKey: ['tags'],
    queryFn: fetchTags, // <-- Use the actual API function
    staleTime: 1000 * 60 * 60, // Cache tags for an hour, they don't change often
    // Keep previous data while refetching in background (optional)
    // placeholderData: keepPreviousData,
  });
  // Log error if tag fetching fails
  useEffect(() => {
    if (tagsError) {
      notifications.show({
        title: 'Error loading tags',
        message: tagsError.message,
        color: 'red',
      });
    }
  }, [tagsError]);

  // --- Mutation for creating a counter ---
  const { mutate: addCounter, isPending: isCreating } = useMutation({
        mutationFn: async (formData: CounterFormData) => {
          // Convert form data to match the backend DTO (startDate to ISO string)
          const payload: CreateCounterDto = {
              name: formData.name,
              description: formData.description || undefined, // Send undefined if empty
              // Ensure date is valid before calling toISOString()
              startDate: formData.startDate instanceof Date
                          ? formData.startDate.toISOString()
                          : new Date().toISOString(), // Fallback if date is somehow invalid
              isPrivate: formData.isPrivate || false, // Ensure boolean
              tagIds: formData.tagIds || []
          };
          // --- Call the actual API function ---
          return createCounter(payload);
          // ---------------------------------
      },
      onSuccess: () => {
          notifications.show({ title: 'Success', message: 'Counter created!', color: 'green'});
          queryClient.invalidateQueries({ queryKey: ['myCounters'] }); // Refetch the counters list
          closeModal(); // Close modal on success
      },
      onError: (error) => {
          notifications.show({ title: 'Error', message: `Failed to create counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red'});
      }
  });
  // ----------------------------------------
  // --- Add Update Mutation ---
  const { mutate: editCounter, isPending: isUpdating } = useMutation({
    mutationFn: async (formData: CounterFormData) => {
        if (!editingCounter) throw new Error("No counter selected for editing.");

        // Convert form data (Date -> ISO string)
        const payload: UpdateCounterPayload = {
            name: formData.name,
            description: formData.description || undefined,
            startDate: formData.startDate instanceof Date
                         ? formData.startDate.toISOString()
                         : undefined, // Only send if changed/valid
            isPrivate: formData.isPrivate,
            tagIds: formData.tagIds || []
        };
        // Call the update API function
        return updateCounter({ id: editingCounter.id, payload });
    },
    onSuccess: (updatedCounterData) => {
        notifications.show({ title: 'Success', message: 'Counter updated!', color: 'green'});
        // Optimistic update or invalidation
        queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
              if (!oldData) return oldData;
              // Find and update in the correct list (active/archived)
              const updateList = (list: Counter[]) => list.map(c => (c.id === updatedCounterData.id ? updatedCounterData : c));
              return {
                  active: updateList(oldData.active),
                  archived: updateList(oldData.archived)
              };
          });
         // queryClient.invalidateQueries({ queryKey: ['myCounters'] }); // Can also just invalidate
        closeModal(); // Close modal on success
    },
    onError: (error) => {
        notifications.show({ title: 'Error', message: `Failed to update counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red'});
    }
});


  // --- Modal Open/Close Handlers ---
  const handleOpenAddModal = () => {
    setEditingCounter(null); // Ensure no initial data for add mode
    openModal();
};

const handleOpenEditModal = (counter: Counter) => {
    setEditingCounter(counter); // Set the counter to edit
    openModal();
};

const handleCloseModal = () => {
    closeModal();
    // It's good practice to clear editing state when modal closes
    // setEditingCounter(null); // Optional: clear immediately or wait for next open
};

// --- Form Submission Handler (Decides Add or Edit) ---
const handleFormSubmit = (data: CounterFormData) => {
    if (editingCounter) {
        console.log("Form Data Submitted (Edit):", data);
        editCounter(data); // Trigger the update mutation
    } else {
        console.log("Form Data Submitted (Create):", data);
        addCounter(data); // Trigger the create mutation
    }
};

  // -----------------------------

  return (
    <Providers>
      <MainLayout>
        <Group justify="space-between" align="center" mb="lg">
            <Title order={2}>My Counters</Title>
            <Button
               leftSection={<IconPlus size={16} />}
               onClick={handleOpenAddModal} // Use specific handler
               disabled={isLoadingTags}
            >
                Add Counter
            </Button>
        </Group>

        {/* Pass down the edit handler to CountersDisplay */}
        <CountersDisplay onEditCounter={handleOpenEditModal} />

        {/* Modal now uses editingCounter for initialData */}
        <AddEditCounterModal
           opened={modalOpened}
           onClose={handleCloseModal} // Use specific handler
           onSubmit={handleFormSubmit}
           // Pass the correct loading state based on mode
           isLoading={editingCounter ? isUpdating : isCreating}
           initialData={editingCounter} // Pass the counter being edited
           availableTags={tagsData || []} // Pass fetched tags (or empty array if loading/error)
           />

      </MainLayout>
    </Providers>
  );
}