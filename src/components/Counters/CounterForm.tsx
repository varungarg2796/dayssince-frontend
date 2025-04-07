// src/components/Counters/CounterForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { TextInput, Textarea, Switch, Button, Group, Stack, MultiSelect, Text, Popover, Box } from '@mantine/core';
import { Counter, Tag, CreateCounterDto, UpdateCounterPayload } from '@/types'; // Import DTOs too
import { ModernDateTimePicker } from './ModernDateTimePicker';
import { IconHelpCircle } from '@tabler/icons-react';
import slugify from 'slugify';
// Use extended form data type
export interface CounterFormData extends Omit<CreateCounterDto, 'startDate' | 'tagIds'> {
    startDate: Date | null;
    tagIds?: number[];
}

interface CounterFormProps {
    onSubmit: (data: CreateCounterDto | UpdateCounterPayload) => void; // Use DTO types
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Counter | null;
    availableTags?: Tag[];
}

const isValidSlug = (slug: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

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
        reset,
        setValue,
        formState: { errors, isDirty },
    } = useForm<CounterFormData>({
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
            isPrivate: initialData?.isPrivate || false,
            tagIds: initialData?.tags?.map(tag => tag.id) || [],
            slug: initialData?.slug || '',
        },
    });

    const watchedName = useWatch({ control, name: 'name' });
    const watchedIsPrivate = useWatch({ control, name: 'isPrivate' });
    const watchedSlug = useWatch({ control, name: 'slug' });
    const [userModifiedSlug, setUserModifiedSlug] = useState(false);

    useEffect(() => {
        if (!watchedIsPrivate && watchedName && !userModifiedSlug) {
            const suggestedSlug = slugify(watchedName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
             if (suggestedSlug !== watchedSlug) {
                 setValue('slug', suggestedSlug, { shouldValidate: true, shouldDirty: true });
             }
        }
         if (watchedIsPrivate || !watchedName) {
             setUserModifiedSlug(false);
         }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedName, watchedIsPrivate, userModifiedSlug]);

     const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         setUserModifiedSlug(true);
         setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true });
     };

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name, description: initialData.description || '', startDate: new Date(initialData.startDate),
                isPrivate: initialData.isPrivate, tagIds: initialData.tags?.map(tag => tag.id) || [], slug: initialData.slug || '',
            });
        } else {
            reset({ name: '', description: '', startDate: new Date(), isPrivate: false, tagIds: [], slug: '' });
        }
        setUserModifiedSlug(!!initialData?.slug);
    }, [initialData, reset]);

    const tagSelectData = availableTags.map(tag => ({ value: tag.id.toString(), label: tag.name }));

    // Prepare data according to DTO structure before calling onSubmit
     const handleFormSubmitInternal = (data: CounterFormData) => {
         // Base payload structure
         const basePayload = {
             name: data.name,
             description: data.description || undefined,
             startDate: data.startDate instanceof Date && !isNaN(data.startDate.getTime())
                 ? data.startDate.toISOString()
                 : undefined, // Should be handled by required validation
             isPrivate: data.isPrivate,
             tagIds: data.tagIds || [],
         };

          // Add slug only if public and provided
         const slugToSend = (!data.isPrivate && data.slug && data.slug.trim())
             ? data.slug.trim()
             : undefined;

         // Combine into final payload using correct DTO type
         const payload: CreateCounterDto | UpdateCounterPayload = {
             ...basePayload,
             ...(slugToSend && { slug: slugToSend }), // Conditionally add slug
         };

         // If editing, ensure start date isn't sent if not changed (prevents accidental overwrite if component had issue)
         // However, UpdateCounterPayload handles this via PartialType. Let's rely on that.

         onSubmit(payload); // Call the original onSubmit prop with DTO-like payload
     };

    return (
        <form onSubmit={handleSubmit(handleFormSubmitInternal)}>
            <Stack>
                {/* Name Input */}
                <Controller name="name" control={control} rules={{ required: 'Counter name is required', maxLength: { value: 100, message: "Name too long (max 100)"} }}
                    render={({ field }) => <TextInput label="Counter Name" placeholder="e.g., Quit Smoking" withAsterisk error={errors.name?.message} {...field} />}
                />

                {/* Description Textarea */}
                <Controller name="description" control={control} rules={{ maxLength: { value: 500, message: "Description too long (max 500)"}}}
                    render={({ field }) => <Textarea label="Description" placeholder="Optional details..." minRows={3} error={errors.description?.message} {...field} />}
                />

                {/* Start Date/Time Picker */}
                <Controller name="startDate" control={control} rules={{ required: 'Start date and time are required' }}
                    render={({ field, fieldState }) => <ModernDateTimePicker label="Start Date & Time" value={field.value} onChange={field.onChange} required error={fieldState.error?.message} />}
                />

                {/* Tags MultiSelect */}
                <Controller name="tagIds" control={control}
                    render={({ field }) => <MultiSelect label="Tags (Optional)" placeholder="Select categories" data={tagSelectData} value={field.value?.map(id => id.toString()) || []} onChange={(selectedStringIds) => { field.onChange(selectedStringIds.map(strId => parseInt(strId, 10))); }} searchable clearable />}
                />

                {/* Privacy Switch */}
                <Controller name="isPrivate" control={control}
                    render={({ field }) => <Switch label="Make this counter private" description="Private counters are only visible to you." checked={field.value || false} onChange={(event) => field.onChange(event.currentTarget.checked)} />}
                />

                {/* Conditional Slug Input */}
                {!watchedIsPrivate && (
                    <Controller
                        name="slug"
                        control={control}
                        rules={{
                            validate: (value) => !value || isValidSlug(value) || 'Invalid format.',
                            minLength: { value: 3, message: 'Min 3 characters' },
                            maxLength: { value: 80, message: 'Max 80 characters' }
                        }}
                        render={({ field }) => (
                            <TextInput
                                label={
                                    <Group gap={5} wrap='nowrap'>
                                        <Text size="sm" fw={500}>Custom URL Slug (Optional)</Text>
                                        <Popover width={250} position="top" withArrow shadow="md">
                                            <Popover.Target><Box component="span" style={{ cursor: 'help', display: 'inline-flex', alignItems:'center' }}><IconHelpCircle size={14} stroke={1.5} /></Box></Popover.Target>
                                            <Popover.Dropdown><Text size="xs">Customize public URL (/c/<b>your-slug</b>). Lowercase letters, numbers, hyphens only. Auto-generated if empty. Must be unique.</Text></Popover.Dropdown>
                                        </Popover>
                                    </Group>
                                }
                                placeholder="e.g., quit-smoking-challenge"
                                value={field.value || ''}
                                onChange={handleSlugChange}
                                onBlur={field.onBlur}
                                error={errors.slug?.message}
                            />
                        )}
                    />
                )}

                {/* Action Buttons */}
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={onCancel} disabled={isLoading}> Cancel </Button>
                    <Button type="submit" loading={isLoading} disabled={!isDirty && !!initialData}>
                        {initialData ? 'Save Changes' : 'Create Counter'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}