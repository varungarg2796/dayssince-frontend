// src/app/explore/page.tsx
'use client';

// --- Imports ---
import React, { useState, useEffect, useMemo } from 'react';
import {
  Title, Text, Stack, Loader, Alert, SimpleGrid, Group, Container,
  TextInput, Select, Chip, Pagination, Paper, Box,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicCounters, fetchTags } from '@/lib/apiClient';
import { PaginatedCountersResult, FindPublicCountersOptions, Tag } from '@/types';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { CounterCard } from '@/components/Counters/CounterCard';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useDebouncedValue } from '@mantine/hooks';

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
  // --- State for Query Options ---
  const [page, setPage] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Holds tag *slugs*
  const [sortValue, setSortValue] = useState<string>(sortOptions[0].value); // Default sort

  // --- Debounce Search Query ---
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 400);

  // --- Extract Sort Field and Order ---
  const [sortBy, sortOrder] = useMemo(() => {
    const parts = sortValue.split('_');
    const order = (parts[1] === 'asc' || parts[1] === 'desc') ? parts[1] : 'desc';
    const field = parts[0] as FindPublicCountersOptions['sortBy'];
    return [field, order as 'asc' | 'desc'];
  }, [sortValue]);

  // --- Reset page to 1 when filters/search/sort change ---
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, selectedTags, sortValue]);

  // --- Combine options for React Query ---
  const queryOptions: FindPublicCountersOptions = {
    page,
    limit,
    search: debouncedSearchQuery || undefined,
    tagSlugs: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
    sortOrder,
  };

  // --- Fetch Public Counters Data ---
  const {
    data: publicCountersData,
    isLoading: isLoadingCounters,
    error: countersError, // Keep separate error variable for counters
    isError: isCountersError // Keep separate isError variable for counters
  } = useQuery<PaginatedCountersResult, Error>({
      queryKey: ['publicCounters', JSON.stringify(queryOptions)],
      queryFn: () => fetchPublicCounters(queryOptions),
      // Replace keepPreviousData with placeholderData
      placeholderData: (previousData) => previousData,
  });

  // --- Fetch Available Tags ---
  const {
    data: availableTags,
    isLoading: isLoadingTags,
    error: tagsError, // Keep separate error variable for tags
    isError: isTagsError // Keep separate isError variable for tags
  } = useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // --- Handlers for Controls ---
  const handleTagChange = (newSelectedTagSlugs: string[]) => {
    setSelectedTags(newSelectedTagSlugs);
    // Page reset handled by useEffect
  };

  const handleSortChange = (value: string | null) => {
    if (value) {
      setSortValue(value);
      // Page reset handled by useEffect
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value);
     // Page reset handled by useEffect listening to debouncedSearchQuery
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine overall loading state for UI disabling etc.
  const controlsDisabled = isLoadingTags; // Disable controls while tags load initially

  return (
    <MainLayout>
      <Container size="xl"> {/* Constrain width */}
        <Stack gap="lg">
          <Title order={2}>Explore Public Counters</Title>

          {/* --- Filter/Sort Controls Area --- */}
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Stack gap="lg">
              {/* Search and Sort Row */}
               <Group grow align="flex-end">
                <TextInput
                  label="Search"
                  placeholder="Search counters..."
                  leftSection={<IconSearch size={16} stroke={1.5} />}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={controlsDisabled}
                />
                <Select
                  label="Sort by"
                  data={sortOptions}
                  value={sortValue}
                  onChange={handleSortChange}
                  allowDeselect={false}
                  disabled={controlsDisabled}
                />
              </Group>

              {/* Categories (Tags) Filter */}
              <Box>
                <Text size="sm" fw={500} mb={5}>Categories</Text>
                {isLoadingTags ? (
                  <Loader size="xs" />
                ) : isTagsError ? ( // Use isTagsError
                  <Text size="sm" c="red">Could not load categories: {tagsError?.message}</Text> // Use tagsError
                ) : availableTags && availableTags.length > 0 ? (
                  <Chip.Group multiple value={selectedTags} onChange={handleTagChange}>
                     <Group gap="xs" wrap="wrap">
                      {availableTags.map((tag) => (
                        <Chip key={tag.slug} value={tag.slug} size="sm" radius="sm" variant="outline">
                          {tag.name}
                        </Chip>
                      ))}
                    </Group>
                  </Chip.Group>
                ) : (
                  <Text size="sm" c="dimmed">No categories available.</Text>
                )}
              </Box>
            </Stack>
          </Paper>
          {/* ------------------------------------------- */}


          {/* --- Display Area --- */}
          {/* Show loader only when actively fetching counters */}
          {isLoadingCounters && (
            <Group justify="center" mt="xl">
              <Loader />
              <Text>Loading public counters...</Text>
            </Group>
          )}

          {/* Show error specifically for counters fetch */}
          {isCountersError && !isLoadingCounters && ( // Use isCountersError
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error!" color="red" mt="lg">
              {/* Use countersError */}
              Failed to load public counters: {countersError?.message || 'Unknown error'}
            </Alert>
          )}

          {/* Display grid and pagination only when counters are not loading and there's no counters error */}
          {/* Use optional chaining ?. for safety */}
          {!isLoadingCounters && !isCountersError && publicCountersData?.items && (
            <>
              {publicCountersData.items.length > 0 ? (
                <SimpleGrid
                  cols={{ base: 1, sm: 2, md: 3 }}
                  spacing={{ base: 'sm', md: 'lg' }}
                  mt="md"
                >
                  {publicCountersData.items.map(counter => (
                    <CounterCard
                      key={counter.id}
                      counter={counter}
                      // No onEdit prop passed here, so CounterCard (if modified) will hide owner actions
                    />
                  ))}
                </SimpleGrid>
              ) : (
                 // Show 'no results' only if fetch succeeded but returned empty
                !isLoadingCounters && <Text c="dimmed" ta="center" mt="xl">No public counters found matching your criteria.</Text>
              )}

              {/* --- Pagination Controls --- */}
              {/* Check totalPages with optional chaining */}
              {(publicCountersData?.totalPages ?? 0) > 1 && (
                <Group justify="center" mt="xl">
                   <Pagination
                        // Use optional chaining and nullish coalescing
                        total={publicCountersData?.totalPages ?? 1}
                        value={publicCountersData?.currentPage ?? 1}
                        onChange={handlePageChange}
                        siblings={1}
                        boundaries={1}
                    />
                </Group>
              )}
              {/* Total items info */}
              <Text size="sm" c="dimmed" ta="center" mt="xs">
                   {publicCountersData?.totalItems ?? 0} items found
              </Text>
              {/* -------------------------------------- */}
            </>
          )}
           {/* Handle case where data might still be undefined after loading/no error */}
           {!isLoadingCounters && !isCountersError && !publicCountersData && (
               <Text c="dimmed" ta="center" mt="xl">Could not display counters.</Text>
           )}
          {/* -------------------- */}

        </Stack>
      </Container>
    </MainLayout>
  );
}