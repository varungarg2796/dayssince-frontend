// src/components/Counters/CounterForm.tsx
'use client'; // Needs to be client for form hooks

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Textarea, Switch, Button, Group, Stack, MultiSelect } from '@mantine/core';
import { Counter, Tag } from '@/types'; // Import types
import { ModernDateTimePicker } from './ModernDateTimePicker';

// Define expected form values (matches CreateCounterDto structure mostly)
export interface CounterFormData {
    name: string;
    description?: string;
    startDate: Date | null; // Use Date object for picker
    isPrivate?: boolean;
    tagIds?: number[];
}

// Define Props for the component
interface CounterFormProps {
    onSubmit: (data: CounterFormData) => void; // Function to call on valid submission
    onCancel: () => void; // Function to call on cancel
    isLoading: boolean; // Loading state for submit button
    initialData?: Counter | null; // Optional initial data for editing
    availableTags?: Tag[]; // Optional list of tags for MultiSelect
}

export function CounterForm({
    onSubmit,
    onCancel,
    isLoading,
    initialData = null,
    availableTags = [],
}: CounterFormProps) {

    const {
        control,
        handleSubmit,
        reset, // Function to reset form state
        formState: { errors, isDirty }, // Get errors and dirty state
    } = useForm<CounterFormData>({
        // Set default values - important for controlled components
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(), // Default to now or existing
            isPrivate: initialData?.isPrivate || false,
            tagIds: initialData?.tags?.map(tag => tag.id) || [], // Map existing tags to IDs
        },
    });

    // Reset form if initialData changes (e.g., opening edit modal for different item)
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                description: initialData.description || '',
                startDate: new Date(initialData.startDate),
                isPrivate: initialData.isPrivate,
                tagIds: initialData.tags?.map(tag => tag.id) || [],
            });
        } else {
            reset({ // Reset to defaults for Add mode
                name: '', description: '', startDate: new Date(), isPrivate: false, tagIds: []
            });
        }
    }, [initialData, reset]);


    // Prepare tags data for Mantine MultiSelect format { value: string, label: string }
    const tagSelectData = availableTags.map(tag => ({
        value: tag.id.toString(), // Value must be string for MultiSelect
        label: tag.name,
    }));

    return (
        // Use handleSubmit to wrap our onSubmit logic
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
                {/* Name Input */}
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Counter name is required' }}
                    render={({ field }) => (
                        <TextInput
                            label="Counter Name"
                            placeholder="e.g., Time since last coffee"
                            withAsterisk // Indicate required
                            error={errors.name?.message}
                            {...field} // Spread field props (value, onChange, onBlur)
                        />
                    )}
                />

                {/* Description Textarea */}
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <Textarea
                            label="Description"
                            placeholder="Optional details about the event..."
                            minRows={3}
                            {...field}
                        />
                    )}
                />

                {/* Start Date/Time Picker */}
                <Controller
  name="startDate"
  control={control}
  rules={{ required: 'Start date and time are required' }}
  render={({ field, fieldState }) => (
    <ModernDateTimePicker
      label="Start Date & Time"
      value={field.value}
      onChange={field.onChange}
      required
      error={fieldState.error?.message}
    />
  )}
/>


                {/* Tags MultiSelect */}
                <Controller
                    name="tagIds"
                    control={control}
                    render={({ field }) => (
                        <MultiSelect
                            label="Tags (Optional)"
                            placeholder="Select relevant tags"
                            data={tagSelectData}
                            // Convert number[] from form state to string[] for component value
                            value={field.value?.map(id => id.toString()) || []}
                            // Convert string[] from component onChange back to number[] for form state
                            onChange={(selectedStringIds) => {
                                field.onChange(selectedStringIds.map(strId => parseInt(strId, 10)));
                            }}
                            searchable
                            clearable
                        // {...field} // Manual handling needed for value/onChange type conversion
                        />
                    )}
                />


                {/* Privacy Switch */}
                <Controller
                    name="isPrivate"
                    control={control}
                    render={({ field }) => (
                        <Switch
                            label="Make this counter private"
                            description="Private counters won't appear on the Explore page."
                            // Use checked/onChange for Switch
                            checked={field.value || false}
                            onChange={(event) => field.onChange(event.currentTarget.checked)}
                        // {...field} // Manual handling needed for checked/onChange
                        />
                    )}
                />


                {/* Action Buttons */}
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={isLoading} disabled={!isDirty && !!initialData}> {/* Disable save if not dirty in edit mode */}
                        {initialData ? 'Save Changes' : 'Create Counter'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}