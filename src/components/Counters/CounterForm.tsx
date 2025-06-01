// src/components/Counters/CounterForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
    TextInput, Textarea, Switch, Button, Group, Stack, MultiSelect, Text,
    Popover, Box, NumberInput, Collapse, SimpleGrid // Added NumberInput, Collapse, SimpleGrid
} from '@mantine/core';
import { Counter, Tag, CreateCounterDto, UpdateCounterPayload } from '@/types';
import { ModernDateTimePicker } from './ModernDateTimePicker';
import { IconHelpCircle, IconLock, IconTargetArrow, IconUsers } from '@tabler/icons-react'; // Added IconTargetArrow
import slugify from 'slugify';
import { theme } from '@/theme';

// Update form data type to include new optional challenge fields
// These will align with CreateCounterDto and UpdateCounterPayload
export interface CounterFormData extends Omit<CreateCounterDto, 'startDate' | 'tagIds' | 'challengeDurationDays'> {
    startDate: Date | null;
    tagIds?: number[];
    isChallenge?: boolean; // Already in CreateCounterDto as optional
    challengeDurationDays?: number | string; // Allow string for NumberInput, parse later
}

interface CounterFormProps {
    onSubmit: (data: CreateCounterDto | UpdateCounterPayload) => void;
    onCancel: () => void;
    isLoading: boolean;
    initialData?: Counter | null;
    availableTags?: Tag[];
}

const isValidSlug = (slug: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const DEFAULT_CHALLENGE_DURATION = 30;

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
        watch, // Add watch to observe form values
        formState: { errors, isDirty }, // isValid can be useful
    } = useForm<CounterFormData>({
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            startDate: initialData?.startDate
                ? new Date(Math.min(new Date(initialData.startDate).getTime(), Date.now()))
                : new Date(),
            isPrivate: initialData?.isPrivate || false,
            tagIds: initialData?.tags?.map(tag => tag.id) || [],
            slug: initialData?.slug || '',
            // --- NEW: Default values for challenge fields ---
            isChallenge: initialData?.isChallenge || false,
            challengeDurationDays: initialData?.challengeDurationDays || DEFAULT_CHALLENGE_DURATION,
        },
    });

    const watchedName = useWatch({ control, name: 'name' });
    const watchedIsPrivate = useWatch({ control, name: 'isPrivate' });
    const watchedSlug = useWatch({ control, name: 'slug' });
    const [userModifiedSlug, setUserModifiedSlug] = useState(!!initialData?.slug); // Initialize based on initialData

    // --- NEW: Watch the isChallenge field to conditionally show duration input ---
    const isChallengeMode = watch('isChallenge');

    // Slug suggestion effect
    useEffect(() => {
        if (!watchedIsPrivate && watchedName && !userModifiedSlug && !initialData?.slug) { // Only auto-slug if not editing existing slug
            const suggestedSlug = slugify(watchedName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g, replacement: '-' });
            if (suggestedSlug !== watchedSlug) {
                setValue('slug', suggestedSlug, { shouldValidate: true, shouldDirty: true });
            }
        }
        if (watchedIsPrivate || !watchedName) {
            // If it becomes private or name is cleared, and user hasn't manually edited slug, clear slug or reset modification flag
            if (!userModifiedSlug) setValue('slug', '', {shouldDirty: true});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedName, watchedIsPrivate, userModifiedSlug, initialData?.slug]); // Added initialData.slug to deps

    const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserModifiedSlug(true);
        setValue('slug', event.target.value, { shouldValidate: true, shouldDirty: true });
    };

    // Reset effect
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                description: initialData.description || '',
                startDate: new Date(Math.min(new Date(initialData.startDate).getTime(), Date.now())),
                isPrivate: initialData.isPrivate,
                tagIds: initialData.tags?.map(tag => tag.id) || [],
                slug: initialData.slug || '',
                isChallenge: initialData.isChallenge || false,
                challengeDurationDays: initialData.challengeDurationDays || DEFAULT_CHALLENGE_DURATION,
            });
            setUserModifiedSlug(!!initialData.slug);
        } else {
            reset({
                name: '', description: '', startDate: new Date(),
                isPrivate: false, tagIds: [], slug: '',
                isChallenge: false, challengeDurationDays: DEFAULT_CHALLENGE_DURATION,
            });
            setUserModifiedSlug(false);
        }
    }, [initialData, reset]);

    // Effect to set default duration when challenge mode is enabled and no duration is set
    useEffect(() => {
        if (isChallengeMode && (watch('challengeDurationDays') === undefined || watch('challengeDurationDays') === null || Number(watch('challengeDurationDays')) === 0) ) {
            setValue('challengeDurationDays', DEFAULT_CHALLENGE_DURATION, { shouldDirty: true, shouldValidate: true });
        }
    }, [isChallengeMode, setValue, watch]);


    const tagSelectData = availableTags.map(tag => ({ value: tag.id.toString(), label: tag.name }));

    const handleStartDateChange = (selectedDate: Date | null, fieldOnChange: (date: Date | null) => void) => {
        const now = new Date();
        let finalDate = selectedDate;
        if (selectedDate && selectedDate > now) {
            finalDate = now;
        }
        fieldOnChange(finalDate);
    };

    const handleFormSubmitInternal = (data: CounterFormData) => {
        const payload: CreateCounterDto | UpdateCounterPayload = {
            name: data.name,
            description: data.description || undefined,
            startDate: data.startDate instanceof Date && !isNaN(data.startDate.getTime())
                ? new Date(Math.min(data.startDate.getTime(), Date.now())).toISOString()
                : new Date().toISOString(),
            isPrivate: data.isPrivate,
            tagIds: data.tagIds || [],
            slug: (!data.isPrivate && data.slug && data.slug.trim()) ? data.slug.trim() : undefined,
            // --- NEW: Include challenge fields in the payload ---
            isChallenge: data.isChallenge,
            // Ensure challengeDurationDays is a number if isChallenge is true
            challengeDurationDays: data.isChallenge
                ? (Number(data.challengeDurationDays) || DEFAULT_CHALLENGE_DURATION) // Parse to number, default if invalid
                : undefined, // Send undefined if not a challenge, backend will nullify
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmitInternal)}>
            <Stack gap="md"> {/* Reduced default gap */}
                <Controller name="name" control={control} rules={{ required: 'Counter name is required', maxLength: { value: 100, message: "Name too long (max 100)"} }}
                    render={({ field }) => <TextInput label="Counter Name" placeholder="e.g., Quit Smoking, Project Phoenix" withAsterisk error={errors.name?.message} {...field} />}
                />
                <Controller name="description" control={control} rules={{ maxLength: { value: 500, message: "Description too long (max 500)"}}}
                    render={({ field }) => <Textarea label="Description (Optional)" placeholder="Add some details about your counter..." minRows={2} autosize maxRows={4} error={errors.description?.message} {...field} />}
                />
                <ModernDateTimePicker
                    label="Start Date & Time"
                    value={watch('startDate')} // Use watch to get value for ModernDateTimePicker
                    onChange={(date) => handleStartDateChange(date, (newDate) => setValue('startDate', newDate, { shouldDirty: true, shouldValidate: true }))}
                    required
                    maxDate={new Date()}
                    error={errors.startDate?.message}
                />
                <Controller name="tagIds" control={control}
                    render={({ field }) => <MultiSelect label="Tags (Optional)" placeholder="Select categories" data={tagSelectData} value={field.value?.map(id => id.toString()) || []} onChange={(selectedStringIds) => { field.onChange(selectedStringIds.map(strId => parseInt(strId, 10))); }} searchable clearable />}
                />

                <SimpleGrid cols={2} spacing="md" verticalSpacing="xs">
                    <Controller name="isPrivate" control={control}
                        render={({ field }) => <Switch label="Private Counter" description="Only visible to you." checked={field.value || false} onChange={(event) => field.onChange(event.currentTarget.checked)} color="gray" thumbIcon={field.value ? <IconLock size="0.8rem" /> : <IconUsers size="0.8rem" />} />}
                    />
                    {/* --- NEW: Challenge Switch --- */}
                    <Controller name="isChallenge" control={control}
                        render={({ field }) => <Switch label="Set as Challenge" description="Track towards a goal." checked={field.value || false} onChange={(event) => field.onChange(event.currentTarget.checked)} color={theme.primaryColor} thumbIcon={<IconTargetArrow size="0.8rem" />} />}
                    />
                </SimpleGrid>

                {/* --- NEW: Conditional Challenge Duration Input --- */}
                <Collapse in={isChallengeMode || false} transitionDuration={300}>
                    <Box mt="xs" p="xs" style={{ backgroundColor: theme.colors?.gray?.[0] ?? '#f8f9fa', borderRadius: theme.radius?.sm ?? '4px' }}>
                        <Controller
                            name="challengeDurationDays"
                            control={control}
                            rules={{
                                validate: value =>
                                    !isChallengeMode || (typeof value === 'number' && value >= 1) || (typeof value === 'string' && parseInt(value, 10) >= 1) ||
                                    'Duration must be at least 1 day for a challenge.'
                            }}
                            render={({ field, fieldState }) => (
                                <NumberInput
                                    {...field}
                                    label="Challenge Duration (days)"
                                    placeholder={`e.g., ${DEFAULT_CHALLENGE_DURATION} days`}
                                    min={1}
                                    step={1}
                                    allowDecimal={false}
                                    value={field.value === undefined || field.value === null ? '' : Number(field.value)} // Handle undefined/null for NumberInput
                                    onChange={(val) => field.onChange(val === '' ? undefined : Number(val))} // Store as number or undefined
                                    error={fieldState.error?.message}
                                    description="How many days long is your challenge?"
                                />
                            )}
                        />
                    </Box>
                </Collapse>

                <Collapse in={!watchedIsPrivate} transitionDuration={300}>
                     <Controller name="slug" control={control} rules={{ validate: (value) => watchedIsPrivate || !value || isValidSlug(value) || 'Invalid format (lowercase, numbers, hyphens).', minLength: { value: 3, message: 'Min 3 characters' }, maxLength: { value: 80, message: 'Max 80 characters' } }}
                        render={({ field }) => ( <TextInput mt="xs" label={ <Group gap={5} wrap='nowrap'> <Text size="sm" fw={500}>Custom Public URL (Optional)</Text> <Popover width={250} position="top" withArrow shadow="md"> <Popover.Target><Box component="span" style={{ cursor: 'help', display: 'inline-flex', alignItems:'center' }}><IconHelpCircle size={14} stroke={1.5} /></Box></Popover.Target> <Popover.Dropdown><Text size="xs">If public, customize URL: /c/<b>your-slug</b>. Auto-generated if empty. Must be unique.</Text></Popover.Dropdown> </Popover> </Group> } placeholder="e.g., quit-smoking-challenge" value={field.value || ''} onChange={handleSlugChange} onBlur={field.onBlur} error={errors.slug?.message} /> )}
                    />
                </Collapse>

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