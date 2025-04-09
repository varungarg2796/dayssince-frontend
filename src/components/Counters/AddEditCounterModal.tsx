// src/components/Counters/AddEditCounterModal.tsx
import React from 'react';
import { Modal } from '@mantine/core';
import { CounterForm } from './CounterForm'; // Import form and types
import { Counter, CreateCounterDto, Tag, UpdateCounterPayload } from '@/types'; // Import types

interface AddEditCounterModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCounterDto | UpdateCounterPayload) => void;
    isLoading: boolean; // Loading state from mutation
    initialData?: Counter | null; // Data for editing, null/undefined for adding
    availableTags?: Tag[]; // Available tags
}

export function AddEditCounterModal({
    opened,
    onClose,
    onSubmit,
    isLoading,
    initialData,
    availableTags
}: AddEditCounterModalProps) {

    const isEditMode = !!initialData;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isEditMode ? 'Edit Counter' : 'Add New Counter'}
            centered
            size="lg" // Adjust size as needed
        >
            <CounterForm
                onSubmit={onSubmit}
                onCancel={onClose} // Close modal on cancel
                isLoading={isLoading}
                initialData={initialData}
                availableTags={availableTags}
            />
        </Modal>
    );
}