// src/app/settings/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/apiClient';
import { Container, Title, Stack, TextInput, Button, Alert, Group, Text, Loader, Center, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { User } from '@/types'; // Import user type
import axios from 'axios';
import { useRouter } from 'next/navigation'; // To redirect if not authenticated

// Validation regex (mirror backend)
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

export default function SettingsPage() {
  const { user, setUser, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect or show loading if auth state is resolving or user not logged in
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/?error=unauthorized'); // Redirect to home/login if not logged in
    }
    if (user) {
      setCurrentUsername(user.username);
      setNewUsername(user.username); // Initialize with current username
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  const validateUsername = useCallback((username: string): string | null => {
    if (!username) return "Username cannot be empty.";
    if (username.length < MIN_LENGTH) return `Username must be at least ${MIN_LENGTH} characters.`;
    if (username.length > MAX_LENGTH) return `Username must be no more than ${MAX_LENGTH} characters.`;
    if (!USERNAME_REGEX.test(username)) return "Username can only contain letters, numbers, and underscores.";
    return null; // No error
  }, []);

  const validationError = validateUsername(newUsername);
  const isUsernameChanged = newUsername !== currentUsername;
  const canSubmit = !validationError && isUsernameChanged && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return; // Extra check

    setIsLoading(true);
    setError(null);

    try {
      // Use apiClient directly or add a dedicated function
      const response = await apiClient.patch<Omit<User, 'password' | 'hashedRefreshToken'>>(
          '/users/me',
          { username: newUsername }
      );

      const updatedUser = response.data;

      notifications.show({
          title: 'Success!',
          message: 'Username updated successfully.',
          color: 'teal',
          icon: <IconCheck size="1rem" />,
      });

      // Update user state in Zustand store
      setUser(updatedUser); // Update with the full user object returned from backend

      // Update local state to reflect the change
      setCurrentUsername(updatedUser.username);
      // setNewUsername(updatedUser.username); // Keep input as is or update? Usually update.
      setNewUsername(updatedUser.username);


    } catch (err: unknown) {
        let message = 'Failed to update username.';
        if (axios.isAxiosError(err)) {
            const responseData = err.response?.data;
            if (err.response?.status === 409) { // Conflict
                message = responseData?.message || 'That username is already taken.';
            } else if (err.response?.status === 400 && responseData?.message) { // Validation error
                // Handle potential array of messages from class-validator
                message = Array.isArray(responseData.message)
                    ? responseData.message.join(' ')
                    : responseData.message;
            } else if (responseData?.message) {
                 message = responseData.message; // General backend error message
            }
        } else if (err instanceof Error) {
             message = err.message;
        }
        setError(message); // Show error in Alert component
        notifications.show({ // Also show notification for more visibility
             title: 'Update Failed',
             message: message,
             color: 'red',
             icon: <IconAlertCircle size="1rem" />,
         });

    } finally {
      setIsLoading(false);
    }
  };

  // Loading state for initial auth check
  if (isAuthLoading || !isAuthenticated) {
     return <MainLayout><Center style={{ height: '50vh' }}><Loader /></Center></MainLayout>;
  }

  return (
    <MainLayout>
      <Container size="xs" pt="xl">
        <Title order={2} mb="lg">Change Username</Title>
        <Paper shadow="xs" p="lg" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Text fw={500} size="sm">Your power to post anonymously!!</Text>
              <TextInput
                label="Current Username"
                value={currentUsername}
                disabled // Current username is not editable here
                styles={{ input: { backgroundColor: '#f1f3f5', cursor: 'not-allowed' } }} // Optional styling for disabled
              />
              <TextInput
                label="New Username"
                placeholder="Enter your desired username"
                value={newUsername}
                onChange={(event) => setNewUsername(event.currentTarget.value)}
                error={validationError && isUsernameChanged ? validationError : undefined} // Show validation error only if changed
                maxLength={MAX_LENGTH + 1} // Allow typing slightly over to show error
                required
              />

              {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" radius="sm" withCloseButton onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={!canSubmit}
                >
                  Save Username
                </Button>
              </Group>
              {!isUsernameChanged && <Text size="xs" c="dimmed" ta="right">Enter a different username to enable saving.</Text>}

            </Stack>
          </form>
        </Paper>
      </Container>
    </MainLayout>
  );
}