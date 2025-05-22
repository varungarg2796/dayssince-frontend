// src/app/explore/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Title, Text, Stack, Alert, SimpleGrid, Group, Container,
  TextInput, Select, Chip, Pagination, Box, SegmentedControl, useMantineTheme,
  Skeleton, Center, Button, Drawer, ScrollArea, Divider, ThemeIcon, // Added ThemeIcon
  Loader
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicCounters, fetchTags } from '@/lib/apiClient';
import { PaginatedCountersResult, FindPublicCountersOptions, Tag, Counter } from '@/types';
import {
    IconAlertCircle, IconSearch, IconLayoutGrid, IconList,
    IconFilter, IconX, IconRotateClockwise, IconZoomCancel // Added IconZoomCancel
} from '@tabler/icons-react';
import { CounterCard } from '@/components/Counters/CounterCard';
import { CounterListItem } from '@/components/Counters/CounterListItem';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Constants
const ITEMS_PER_PAGE = 12;
const sortOptions = [
    { value: 'createdAt_desc', label: 'Newest' }, { value: 'startDate_asc', label: 'Oldest Start Date' },
    { value: 'popularity_desc', label: 'Most Popular' }, { value: 'name_asc', label: 'Name (A-Z)' }, { value: 'name_desc', label: 'Name (Z-A)' },
];
const defaultSortValue = sortOptions[0].value;

// Skeletons
function CardSkeletonExplore() { return (<Skeleton height={220} radius="lg" animate={true} />); }
function ListSkeletonExplore() { return (<Skeleton height={60} radius="sm" animate={true} />); }

export default function ExplorePage() {
  const theme = useMantineTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  // State
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [limit] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(() => searchParams.get('tags')?.split(',') || []);
  const [sortValue, setSortValue] = useState(() => searchParams.get('sort') || defaultSortValue);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Derived State & Effects
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 400);
  const [sortBy, sortOrder] = useMemo(() => { const parts = sortValue.split('_'); const order = parts[1] === 'asc' ? 'asc' : 'desc'; const field = parts[0] as FindPublicCountersOptions['sortBy']; return [field, order] as const; }, [sortValue]);
  useEffect(() => { const params = new URLSearchParams(); if (page > 1) params.set('page', page.toString()); if (debouncedSearchQuery) params.set('search', debouncedSearchQuery); if (selectedTags.length > 0) params.set('tags', selectedTags.join(',')); if (sortValue !== defaultSortValue) params.set('sort', sortValue); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); }, [page, debouncedSearchQuery, selectedTags, sortValue, pathname, router]);
  useEffect(() => { setPage(1); }, [debouncedSearchQuery, selectedTags, sortValue]);

  // API Query Options & Data Fetching
  const queryOptions: FindPublicCountersOptions = useMemo(() => ({ page, limit, search: debouncedSearchQuery || undefined, tagSlugs: selectedTags.length > 0 ? selectedTags : undefined, sortBy, sortOrder, }), [page, limit, debouncedSearchQuery, selectedTags, sortBy, sortOrder]);
  const { data: publicCountersData, isLoading: isLoadingCounters, error: countersError, isError: isCountersError } = useQuery<PaginatedCountersResult, Error>({ queryKey: ['publicCounters', queryOptions], queryFn: () => fetchPublicCounters(queryOptions), placeholderData: (prev) => prev, });
  const { data: availableTags, isLoading: isLoadingTags, isError: isTagsError } = useQuery<Tag[], Error>({ queryKey: ['tags'], queryFn: fetchTags, staleTime: 1000 * 60 * 60, });

  // Handlers
  const handleTagChange = (newSlugs: string[]) => setSelectedTags(newSlugs);
  const handleSortChange = (value: string | null) => { if (value) setSortValue(value); };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.currentTarget.value);
  const handlePageChange = (newPage: number) => { setPage(newPage); };
  const handleShareClick = (counter: Counter) => { if (!counter.slug) { notifications.show({ title: 'Cannot Share', message: 'This counter does not have a public link.', color: 'orange'}); return; } const shareUrl = `${window.location.origin}/c/${counter.slug}`; navigator.clipboard.writeText(shareUrl).then(() => { notifications.show({ title: 'Link Copied!', message: `Public link for "${counter.name}" copied.`, color: 'teal', autoClose: 3000 }); }).catch(err => { notifications.show({ title: 'Error', message: 'Could not copy link.', color: 'red'}); console.error(err)}); };
  const handleClearFilters = () => { setSearchQuery(''); setSelectedTags([]); setSortValue(defaultSortValue); setPage(1); closeDrawer(); };

  // Derived states for UI
  const controlsDisabled = isLoadingTags || isLoadingCounters;
  const isFiltered = !!debouncedSearchQuery || selectedTags.length > 0 || sortValue !== defaultSortValue;

  // Render Skeletons
  const renderSkeletons = () => {
    return viewMode === 'grid' ? ( <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="md"> {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => ( <CardSkeletonExplore key={`exp-skel-grid-${index}`} /> ))} </SimpleGrid> ) : ( <Stack gap="xs" mt="md"> {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => ( <ListSkeletonExplore key={`exp-skel-list-${index}`} /> ))} </Stack> );
  }

  return (
    <MainLayout>
      <Container size="xl">
        <Stack gap="lg">
          <Box> {/* Wrap Title and Text in a Box for better grouping if needed */}
            <Title order={2} ta={{ base: 'center', sm: 'left' }}> {/* Centered on mobile, left on larger */}
                Explore Public Counters
            </Title>
            <Text c="dimmed" size="sm" mt={4} ta={{ base: 'center', sm: 'left' }}> {/* Centered on mobile, left on larger */}
                Discover and browse through a variety of time counters shared by other users from around the community.
            </Text>
          </Box>

          {/* Controls Area */}
          <Group justify="space-between" gap="md">
            <TextInput placeholder="Search public counters..." leftSection={<IconSearch size={16} stroke={1.5} />} value={searchQuery} onChange={handleSearchChange} disabled={isLoadingTags} style={{ flexGrow: 1 }} radius="md" />
            <Group>
              <SegmentedControl value={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'list')} data={[{ label: <IconLayoutGrid size={16} />, value: 'grid' }, { label: <IconList size={16} />, value: 'list' }]} size="sm" radius="md" color={theme.primaryColor} />
              <Button leftSection={<IconFilter size={16} stroke={1.5} />} variant={isFiltered ? "light" : "default"} onClick={openDrawer} disabled={isLoadingTags} radius="md" > Filters & Sort </Button>
            </Group>
          </Group>

          {/* Display Area */}
          {isLoadingCounters ? ( renderSkeletons() )
            : isCountersError ? (<Alert icon={<IconAlertCircle/>} color="red" title="Error!" mt="lg" radius="md"> {countersError?.message || 'Could not load counters'}</Alert>)
            : publicCountersData?.items && publicCountersData.items.length === 0 ? (
                // Enhanced Empty State
                 <Center style={{ minHeight: '40vh', flexDirection: 'column', padding: 'var(--mantine-spacing-xl)' }}>
                       <ThemeIcon variant="light" size={80} radius={80} mb="lg" color="gray">
                           <IconZoomCancel stroke={1.5} style={{ width: '50%', height: '50%' }}/>
                       </ThemeIcon>
                      <Title order={4} ta="center" mb={4}>No Counters Found</Title>
                      <Text c="dimmed" ta="center"> No public counters matched your current search {isFiltered ? 'and filters' : ''}. </Text>
                      {isFiltered && (
                           <Button variant='light' color="gray" size='sm' mt='xl' onClick={handleClearFilters} leftSection={<IconRotateClockwise size={16}/>}>
                                Clear Search & Filters
                           </Button>
                       )}
                  </Center>
            )
            : publicCountersData?.items ? (
                <>
                    {/* Render actual counters based on viewMode */}
                    {viewMode === 'grid' ? (
                       <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="md">
                           {publicCountersData.items.map(counter => ( <CounterCard key={counter.id} counter={counter} isOwnerView={false} onShare={() => handleShareClick(counter)} /> ))}
                       </SimpleGrid>
                    ) : (
                       <Stack gap="xs" mt="md">
                           {publicCountersData.items.map(counter => ( <CounterListItem key={counter.id} counter={counter} isOwnerView={false} onShare={() => handleShareClick(counter)} /> ))}
                       </Stack>
                    )}
                    {/* Pagination & Count */}
                   {(publicCountersData?.totalPages ?? 0) > 1 && (<Group justify="center" mt="xl"><Pagination total={publicCountersData.totalPages} value={page} onChange={handlePageChange} siblings={1} boundaries={1} /></Group>)}
                   <Text size="sm" c="dimmed" ta="center" mt={publicCountersData.totalPages > 1 ? "xs" : "lg"} /* Adjust margin */>{publicCountersData?.totalItems ?? 0} public counters found</Text>
                </>
            )
             : (<Text c="dimmed" ta="center" mt="xl">Could not display counters.</Text>)
           }
        </Stack>
      </Container>

        {/* Filter Drawer */}
        <Drawer opened={drawerOpened} onClose={closeDrawer} title={<Title order={4}>Filters & Sort</Title>} position="right" padding="md" size="md" >
             <ScrollArea style={{ height: 'calc(100vh - 140px)' }}>
                 <Stack gap="xl" p="xs">
                     <Select label="Sort by" data={sortOptions} value={sortValue} onChange={handleSortChange} allowDeselect={false} disabled={controlsDisabled} />
                     <Divider label="Categories" labelPosition="center" />
                     <Box> {isLoadingTags ? <Center><Loader size="sm" /></Center> : isTagsError ? <Text size="sm" c="red">Could not load categories</Text> : availableTags && availableTags.length > 0 ? ( <Chip.Group multiple value={selectedTags} onChange={handleTagChange}> <Group gap="xs" wrap="wrap" justify="center"> {availableTags.map((tag) => ( <Chip key={tag.slug} value={tag.slug} size="sm" radius="xl" variant="outline"> {tag.name} </Chip> ))} </Group> </Chip.Group> ) : ( <Text size="sm" c="dimmed" ta="center">No categories.</Text> )} </Box>
                 </Stack>
             </ScrollArea>
             <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--mantine-spacing-md)', borderTop: `1px solid ${theme.colors.gray[2]}` }}>
                 <Group justify="space-between">
                     <Button variant="subtle" color="gray" onClick={handleClearFilters} leftSection={<IconRotateClockwise size={16}/>} disabled={!isFiltered || controlsDisabled} > Clear All </Button>
                     <Button onClick={closeDrawer} leftSection={<IconX size={16}/>}>Done</Button>
                 </Group>
             </Box>
        </Drawer>
    </MainLayout>
  );
}