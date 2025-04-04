// src/app/explore/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Title, Text, Stack, Loader, Alert, SimpleGrid, Group, Container,
  TextInput, Select, Chip, Pagination, Paper, Box, SegmentedControl, useMantineTheme // Added useMantineTheme
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicCounters, fetchTags } from '@/lib/apiClient'; // Adjust path if needed
import { PaginatedCountersResult, FindPublicCountersOptions, Tag, Counter } from '@/types'; // Added Counter, Adjust path
import { IconAlertCircle, IconSearch, IconLayoutGrid, IconList, IconShare3 } from '@tabler/icons-react'; // Added Icons
import { CounterCard } from '@/components/Counters/CounterCard'; // Adjust path if needed
import { CounterListItem } from '@/components/Counters/CounterListItem'; // Adjust path if needed
import { MainLayout } from '@/components/Layout/MainLayout'; // Adjust path if needed
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications'; // For share notification

// --- Constants ---
const ITEMS_PER_PAGE = 12;
const sortOptions = [
    { value: 'createdAt_desc', label: 'Newest' },
    { value: 'startDate_asc', label: 'Oldest Start Date' },
    { value: 'popularity_desc', label: 'Most Popular' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
];

// --- Component ---
export default function ExplorePage() {
  const theme = useMantineTheme(); // Get theme for controls

  // --- State ---
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState<string>(sortOptions[0].value);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // View mode

  // --- Derived State & Effects ---
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 400);
  const [sortBy, sortOrder] = useMemo(() => {
        const parts = sortValue.split('_');
        const order = (parts[1] === 'asc' || parts[1] === 'desc') ? parts[1] : 'desc';
        const field = parts[0] as FindPublicCountersOptions['sortBy'];
        return [field, order];
   }, [sortValue]);
  useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedTags, sortValue]);

  const queryOptions: FindPublicCountersOptions = {
        page, limit,
        search: debouncedSearchQuery || undefined,
        tagSlugs: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy, sortOrder,
   };

  // --- Data Fetching ---
  const { data: publicCountersData, isLoading: isLoadingCounters, error: countersError, isError: isCountersError } = useQuery<PaginatedCountersResult, Error>({
      queryKey: ['publicCounters', JSON.stringify(queryOptions)],
      queryFn: () => fetchPublicCounters(queryOptions),
      placeholderData: (prev) => prev,
  });
  const { data: availableTags, isLoading: isLoadingTags, error: tagsError, isError: isTagsError } = useQuery<Tag[], Error>({
      queryKey: ['tags'],
      queryFn: fetchTags,
      staleTime: 1000 * 60 * 60,
  });

  // --- Handlers ---
  const handleTagChange = (newSlugs: string[]) => setSelectedTags(newSlugs);
  const handleSortChange = (value: string | null) => { if(value) setSortValue(value); };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.currentTarget.value);
  const handlePageChange = (newPage: number) => { setPage(newPage); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleShareClick = (counter: Counter) => {
       // Identical share logic as on home page (or CounterCard)
       if (counter.isPrivate) return; // Should not happen on explore, but safety check
       const shareUrl = `${window.location.origin}/counter/${counter.id}`;
       navigator.clipboard.writeText(shareUrl).then(() => {
           notifications.show({ title: 'Link Copied!', message: `Link to "${counter.name}" copied.`, color: 'teal', autoClose: 3000, icon:<IconShare3 size="1rem"/>});
       }).catch(err => {
           notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red' });
           console.error('Failed to copy share link:', err);
       });
   };

  const controlsDisabled = isLoadingTags; // Base disabling on tag loading

  // --- Render ---
  return (
    <MainLayout>
      <Container size="xl">
        <Stack gap="lg">
          <Title order={2}>Explore Public Counters</Title>

          {/* Filter/Sort Controls Area */}
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Stack gap="lg">
              <Group grow align="flex-end" preventGrowOverflow={false} wrap="nowrap">
                  <TextInput label="Search" placeholder="Search counters..." leftSection={<IconSearch size={16}/>} value={searchQuery} onChange={handleSearchChange} disabled={controlsDisabled} style={{flexGrow: 1}} />
                   <Box style={{ flexShrink: 0 }}>
                       <Group gap="md" wrap="nowrap">
                          <Select label="Sort by" data={sortOptions} value={sortValue} onChange={handleSortChange} allowDeselect={false} disabled={controlsDisabled} miw={150} />
                          <Stack gap={4}>
                              <Text size="sm" fw={500} component="label" htmlFor="view-toggle">View</Text> {/* Added label + htmlFor */}
                             <SegmentedControl
                                id="view-toggle" // Added id for label association
                                value={viewMode}
                                onChange={(value) => setViewMode(value as 'grid' | 'list')}
                                data={[ { label: <IconLayoutGrid size={16}/>, value: 'grid' }, { label: <IconList size={16} />, value: 'list' } ]}
                                size="sm"
                                disabled={controlsDisabled}
                                color={theme.primaryColor} // Use theme color
                            />
                          </Stack>
                     </Group>
                   </Box>
               </Group>

              {/* Categories (Tags) Filter */}
              <Box>
                 <Text size="sm" fw={500} mb={5}>Categories</Text>
                  {isLoadingTags ? ( <Loader size="xs" /> )
                    : isTagsError ? ( <Text size="sm" c="red">Could not load categories: {tagsError?.message}</Text> )
                    : availableTags && availableTags.length > 0 ? (
                         <Chip.Group multiple value={selectedTags} onChange={handleTagChange}>
                             <Group gap="xs" wrap="wrap">
                                 {availableTags.map((tag) => (
                                     <Chip key={tag.slug} value={tag.slug} size="sm" radius="sm" variant="outline">
                                         {tag.name}
                                     </Chip>
                                ))}
                             </Group>
                         </Chip.Group>
                     ) : ( <Text size="sm" c="dimmed">No categories available.</Text> )
                   }
               </Box>
            </Stack>
          </Paper>

          {/* Display Area */}
          {isLoadingCounters && (<Group justify="center" mt="xl"><Loader /><Text ml="xs">Loading...</Text></Group>)}
          {isCountersError && !isLoadingCounters && (<Alert icon={<IconAlertCircle/>} color="red" title="Error!" mt="lg">{countersError?.message || 'Could not load counters'}</Alert>)}

          {!isLoadingCounters && !isCountersError && publicCountersData?.items && (
            <>
              {publicCountersData.items.length === 0 ? (
                  !isLoadingCounters && <Text c="dimmed" ta="center" mt="xl">No public counters found matching your criteria.</Text>
              ) : (
                  viewMode === 'grid' ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="md">
                        {publicCountersData.items.map(counter => ( <CounterCard key={counter.id} counter={counter} /> ))}
                    </SimpleGrid>
                 ) : ( // viewMode === 'list'
                    <Stack gap="xs" mt="md">
                        {publicCountersData.items.map(counter => (
                            <CounterListItem
                                key={counter.id}
                                counter={counter}
                                isOwnerView={false} // Explicitly false
                                onShare={() => handleShareClick(counter)} // Pass share handler
                                // No edit/delete/archive needed
                            />
                        ))}
                     </Stack>
                 )
              )}

              {/* Pagination */}
              {(publicCountersData?.totalPages ?? 0) > 1 && (<Group justify="center" mt="xl"><Pagination total={publicCountersData.totalPages} value={publicCountersData.currentPage} onChange={handlePageChange} siblings={1} boundaries={1} /></Group>)}
              <Text size="sm" c="dimmed" ta="center" mt="xs">{publicCountersData?.totalItems ?? 0} items found</Text>
            </>
          )}
          {!isLoadingCounters && !isCountersError && !publicCountersData && (<Text c="dimmed" ta="center" mt="xl">Could not display counters.</Text>)}
        </Stack>
      </Container>
    </MainLayout>
  );
}