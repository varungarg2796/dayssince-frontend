// src/app/home/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Title, Button, Group, Stack, Text, Center, Loader, Container // Added Text, Center, Loader, Container
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MainLayout } from '@/components/Layout/MainLayout'; // Ensure this path is correct
import { CountersDisplay } from '@/components/Counters/CountersDisplay'; // Ensure this path is correct
import { IconPlus, IconLogin } from '@tabler/icons-react'; // Added IconLogin
import { AddEditCounterModal } from '@/components/Counters/AddEditCounterModal'; // Ensure this path is correct
import { CounterFormData } from '@/components/Counters/CounterForm'; // Ensure this path is correct
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Tag, CreateCounterDto, Counter, UserCounters, UpdateCounterPayload } from '@/types'; // Ensure this path is correct
import { createCounter, fetchTags, updateCounter } from '@/lib/apiClient'; // Ensure this path is correct
import { useAuthStore } from '@/stores/authStore'; // Ensure this path is correct

export default function HomePage() {
  // --- State & Hooks ---
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const queryClient = useQueryClient();

  // Get Auth State from Zustand store
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  // --- Data Fetching (Tags for Modal) ---
  // Fetch tags only if the user is potentially going to open the modal (i.e., authenticated)
  const { data: tagsData, isLoading: isLoadingTags, error: tagsError } = useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 60, // Cache tags for an hour
    enabled: isAuthenticated, // Only fetch tags if user is authenticated
  });

  // Effect to show error notification for tag fetching
  useEffect(() => {
    if (tagsError) {
      notifications.show({
        title: 'Error loading tags',
        message: `Could not load categories for the form: ${tagsError.message}`,
        color: 'red',
      });
    }
  }, [tagsError]);

  // --- Mutations (Create/Update Counters) ---
  const { mutate: addCounter, isPending: isCreating } = useMutation({
        mutationFn: async (formData: CounterFormData) => {
          const payload: CreateCounterDto = {
              name: formData.name,
              description: formData.description || undefined,
              startDate: formData.startDate instanceof Date
                          ? formData.startDate.toISOString()
                          : new Date().toISOString(), // Sensible fallback
              isPrivate: formData.isPrivate || false,
              tagIds: formData.tagIds || []
          };
          return createCounter(payload);
      },
      onSuccess: () => {
          notifications.show({ title: 'Success', message: 'Counter created!', color: 'green'});
          queryClient.invalidateQueries({ queryKey: ['myCounters'] });
          closeModal();
      },
      onError: (error) => {
          notifications.show({ title: 'Error', message: `Failed to create counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red'});
      }
  });

  const { mutate: editCounter, isPending: isUpdating } = useMutation({
    mutationFn: async (formData: CounterFormData) => {
        if (!editingCounter) throw new Error("No counter selected for editing.");
        const payload: UpdateCounterPayload = {
            name: formData.name,
            description: formData.description || undefined,
            // Only include startDate if it's a valid date (prevents sending invalid data)
            startDate: formData.startDate instanceof Date && !isNaN(formData.startDate.getTime())
                         ? formData.startDate.toISOString()
                         : undefined,
            isPrivate: formData.isPrivate,
            tagIds: formData.tagIds || []
        };
        // Filter out undefined fields before sending? Optional, backend should handle missing fields.
        return updateCounter({ id: editingCounter.id, payload });
    },
    onSuccess: (updatedCounterData) => {
        notifications.show({ title: 'Success', message: 'Counter updated!', color: 'green'});
        // Optimistic update in cache
        queryClient.setQueryData<UserCounters>(['myCounters'], (oldData) => {
              if (!oldData) return oldData;
              const updateList = (list: Counter[]) => list.map(c => (c.id === updatedCounterData.id ? updatedCounterData : c));
              // Maintain sorting or position if possible, otherwise just map
              return {
                  active: updateList(oldData.active),
                  archived: updateList(oldData.archived)
              };
          });
        closeModal();
    },
    onError: (error) => {
        notifications.show({ title: 'Error', message: `Failed to update counter: ${error instanceof Error ? error.message : 'Unknown error'}`, color: 'red'});
    }
});

  // --- Modal and Form Handlers ---
  const handleOpenAddModal = () => {
    setEditingCounter(null);
    openModal();
  };

  const handleOpenEditModal = (counter: Counter) => {
    setEditingCounter(counter);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    // Consider resetting editingCounter here if desired upon any close action
    // setEditingCounter(null);
  };

  const handleFormSubmit = (data: CounterFormData) => {
    if (editingCounter) {
        editCounter(data);
    } else {
        addCounter(data);
    }
  };

  // --- Conditional Rendering Logic ---

  // 1. Show loading state while authentication status is being determined
  if (isAuthLoading) {
      return (
          <MainLayout>
              <Center style={{ height: 'calc(100vh - 120px)' }}> {/* Adjust height based on header/footer */}
                  <Loader size="lg" />
              </Center>
          </MainLayout>
      );
  }

  // 2. If not authenticated after loading, show login prompt
  if (!isAuthenticated) {
      return (
          <MainLayout>
              <Container size="xs" pt={100}> {/* Center content vertically */}
                  <Stack align="center" gap="lg">
                      <Title order={3} ta="center">Your Personal Counters</Title>
                      <Text ta="center" c="dimmed">
                          Log in to view your existing counters or create new ones to track important dates and events.
                      </Text>
                      <Button
                          component="a"
                          // Ensure this points to your backend Google auth endpoint
                          href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`}
                          variant="gradient"
                          gradient={{ from: 'blue', to: 'cyan' }}
                          size="md"
                          leftSection={<IconLogin size={18} />}
                          radius="xl" // Rounded button
                      >
                          Login with Google
                      </Button>
                  </Stack>
              </Container>
          </MainLayout>
      );
  }

  // 3. If authenticated, show the main counters management view
  // No need for <Providers> here if layout.tsx already includes them
  return (
    <MainLayout>
        <Group justify="space-between" align="center" mb="lg">
            <Title order={2}>My Counters</Title>
            <Button
               leftSection={<IconPlus size={16} />}
               onClick={handleOpenAddModal}
               disabled={isLoadingTags} // Disable button if tags are still loading for the modal
            >
                Add Counter
            </Button>
        </Group>

        {/* Display user's counters (fetches data internally) */}
        <CountersDisplay onEditCounter={handleOpenEditModal} />

        {/* Modal for Adding/Editing */}
        <AddEditCounterModal
           opened={modalOpened}
           onClose={handleCloseModal}
           onSubmit={handleFormSubmit}
           isLoading={editingCounter ? isUpdating : isCreating}
           initialData={editingCounter}
           availableTags={tagsData || []} // Pass fetched tags
        />
    </MainLayout>
  );
}