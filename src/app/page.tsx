// src/app/page.tsx
'use client';

import React from 'react'; // Need React if using JSX components like Button/Link
import { Title, Text, Stack, Button, Container, Box } from '@mantine/core';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuthStore } from '@/stores/authStore';
import { IconLogin } from '@tabler/icons-react';
import Link from 'next/link';
import { useMantineTheme } from '@mantine/core'; // Import useMantineTheme hook

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const theme = useMantineTheme(); // Get theme context

  return (
    <MainLayout>
        {/* Hero Section */}
        <Box
          style={{
            // Use theme variables for gradient
            background: `linear-gradient(135deg, ${theme.colors.deepBlue[7]} 0%, ${theme.colors.deepBlue[5]} 100%)`,
            color: theme.white, // Set text color
            // Use theme spacing or specific values for height/padding
            minHeight: 'calc(70vh)', // Example height
            paddingTop: `calc(var(--mantine-spacing-xl) * 2)`, // Example padding
            paddingBottom: `calc(var(--mantine-spacing-xl) * 2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Container size="md">
                 <Stack align="center" gap="xl" /* Increased gap */ ta="center">
                     <Title
                        order={1}
                        // Use Mantine's responsive font size prop or direct CSS
                        style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', lineHeight: 1.2 }}
                      >
                        Mark Your Moments.<br/> Track Your Progress.
                     </Title>
                     <Text size="xl" c="deepBlue.1" maw={600} /* Max width for readability */ >
                        The simple, visual way to track time since important events.
                        Create personal counters, track habits, or explore public milestones.
                     </Text>

                     {/* CTA Button */}
                     {!isAuthenticated ? (
                        <Button
                             component="a" // Use anchor for external link
                             href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`}
                             variant="white" // High contrast button
                             color="deepBlue" // Text color based on theme name
                             size="lg"
                             radius="xl"
                             mt="lg" // Add margin-top
                             leftSection={<IconLogin size={20} stroke={1.5} />}
                         >
                            Log In & Start Tracking
                         </Button>
                     ) : (
                        <Button
                            component={Link} // Use Link for internal navigation
                            href="/home"
                            variant="white"
                            color="deepBlue"
                            size="lg"
                            radius="xl"
                            mt="lg"
                        >
                             Go to My Counters
                         </Button>
                      )}
                 </Stack>
             </Container>
        </Box>

         {/* Optional: Feature Highlight Section (Can be styled further) */}
          {/* <Container size="lg" py="xl">
              <Title order={2} ta="center" mb="xl">How it Works</Title>
               <Grid gutter="xl">
                   <Grid.Col span={{ base: 12, sm: 4 }}>
                       <Stack align="center" ta="center">
                            <ThemeIcon size={60} radius={60} variant="light"><IconCirclePlus/></ThemeIcon>
                           <Text fw={600} size="lg" mt="sm">Create</Text>
                            <Text c="dimmed" size="sm">Easily add counters for any event with names, dates, tags, and privacy settings.</Text>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                         <Stack align="center" ta="center">
                             <ThemeIcon size={60} radius={60} variant="light"><IconShare/></ThemeIcon>
                             <Text fw={600} size="lg" mt="sm">Share (Optional)</Text>
                             <Text c="dimmed" size="sm">Make your counters public and share unique links for others to see the progress.</Text>
                         </Stack>
                     </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                       <Stack align="center" ta="center">
                            <ThemeIcon size={60} radius={60} variant="light"><IconCompass/></ThemeIcon>
                            <Text fw={600} size="lg" mt="sm">Explore</Text>
                           <Text c="dimmed" size="sm">Discover interesting public counters created by the community.</Text>
                        </Stack>
                     </Grid.Col>
                </Grid>
            </Container> */}

    </MainLayout>
  );
}