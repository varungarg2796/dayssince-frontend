// src/components/Counters/CounterCard.tsx
import React from 'react'; // Import React if using JSX specific features like Fragment
import { Card, Text, Badge, Group, Stack, ActionIcon, Tooltip, Box } from '@mantine/core';
import { Counter } from '@/types';
import { IconArchive, IconArchiveOff, IconPencil, IconTrash, IconShare3 } from '@tabler/icons-react'; // Import action icons

// Helper for date formatting (consider moving to a utils file later)
const formatLocalDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleString(undefined, { // Use user's locale
            dateStyle: 'short',
            timeStyle: 'short',
        });
    } catch (e) {
        return e+'Invalid Date';
    }
};


export function CounterCard({ counter }: { counter: Counter }) {
    const isArchived = !!counter.archivedAt;

    // --- Placeholder Action Handlers ---
    const handleEdit = () => console.log("Edit clicked:", counter.id);
    const handleShare = () => console.log("Share clicked:", counter.id);
    const handleToggleArchive = () => console.log("Toggle Archive clicked:", counter.id);
    const handleDelete = () => console.log("Delete clicked:", counter.id);
    // -----------------------------------

    return (
        // Set height to 100% to help with grid alignment
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack justify="space-between" h="100%"> {/* Stack to push content apart */}
                {/* Top Section: Name, Badge, Description, Tags */}
                <Box>
                     <Group justify="space-between" mb="xs">
                         {/* Truncate long names with Tooltip */}
                         <Tooltip label={counter.name} openDelay={500} withArrow>
                            <Text fw={500} truncate>{counter.name}</Text>
                         </Tooltip>
                        {isArchived && <Badge color="gray" variant="light" radius="sm">Archived</Badge>}
                    </Group>

                    <Text size="sm" color="dimmed" lineClamp={2} mb="md">
                        {counter.description || ' '} {/* Use space to maintain height */}
                    </Text>

                     <Group spacing="xs" mb="sm">
                        {counter.tags?.slice(0, 3).map(tag => ( // Limit initial tags shown
                            <Badge key={tag.id} variant="light" radius="sm">{tag.name}</Badge>
                        ))}
                        {counter.tags?.length > 3 && <Badge variant='outline' radius='sm'>...</Badge>}
                     </Group>
                </Box>

                 {/* Timer/Date Section - Placeholder for now */}
                 <Box mb="sm">
                      {/* TODO: Implement Live Timer for Active Counters */}
                      {/* TODO: Implement Duration Display for Archived */}
                     <Text size="xs" color="dimmed" mt="sm">
                         Started: {formatLocalDate(counter.startDate)}
                     </Text>
                     {isArchived && counter.archivedAt && (
                          <Text size="xs" color="dimmed">
                             Archived: {formatLocalDate(counter.archivedAt)}
                          </Text>
                     )}
                 </Box>

                 {/* Bottom Section: Actions */}
                 <Group spacing="xs" position="right" mt="auto"> {/* Push actions to bottom right */}
                    {!isArchived && (
                         <Tooltip label="Share" withArrow>
                             <ActionIcon variant="default" size="lg" onClick={handleShare} disabled={counter.isPrivate}>
                                <IconShare3 size="1.1rem" />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    <Tooltip label="Edit" withArrow>
                         <ActionIcon variant="default" size="lg" onClick={handleEdit}>
                            <IconPencil size="1.1rem" />
                        </ActionIcon>
                    </Tooltip>
                     <Tooltip label={isArchived ? "Unarchive" : "Archive"} withArrow>
                         <ActionIcon variant="default" size="lg" onClick={handleToggleArchive}>
                            {isArchived ? <IconArchiveOff size="1.1rem" /> : <IconArchive size="1.1rem" />}
                        </ActionIcon>
                    </Tooltip>
                     <Tooltip label="Delete" withArrow>
                         <ActionIcon variant="light" color="red" size="lg" onClick={handleDelete}>
                            <IconTrash size="1.1rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Stack>
        </Card>
    );
}