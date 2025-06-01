// src/app/about/page.tsx
'use client';

import React from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
  Container, Title, Text, Stack, Paper, Group, ThemeIcon,
  Badge, Box, Button,
  Avatar
} from '@mantine/core';
import {
  IconMail, IconBrandGithub,
  IconRocket, IconClock
 , // Added IconCalendar for consistency
} from '@tabler/icons-react';
import { useMantineTheme } from '@mantine/core';
import Link from 'next/link'; // Ensure Link is imported

export default function AboutPage() {
  const theme = useMantineTheme();

  return (
    <MainLayout>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${theme.colors.deepBlue[7]} 0%, ${theme.colors.vibrantTeal[6]} 100%)`,
          color: theme.white,
          paddingTop: `calc(${theme.spacing.xl} * 3)`,
          paddingBottom: `calc(${theme.spacing.xl} * 3)`,
          textAlign: 'center',
        }}
      >
        <Container size="md">
          <Stack align="center" gap="lg">
            <Badge size="xl" variant="outline" color="white" radius="xl" styles={{label: {color: theme.white, fontWeight:500}}}>
              Our Story
            </Badge>
            <Title
              order={1}
              style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', lineHeight: 1.2, fontWeight: 700 }}
            >
              More Than Just a Counter.
              <Text component="span" inherit variant="gradient" gradient={{ from: theme.colors.cyan[3], to: theme.colors.teal[3] }} style={{display: 'block', marginTop: '0.2em'}}>
                It&apos;s About Your Journey.
              </Text>
            </Title>
            <Text size="lg" c={theme.colors.deepBlue[0]} maw={700} style={{ lineHeight: 1.7, opacity: 0.9 }}>
              DaysSince began with a simple, personal need: to clearly see the passage of time from moments that truly shaped us. We realized these &apos;since whens&apos; are the invisible threads weaving the fabric of our lives. We wanted a beautiful, simple way to honor them.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 2.5)` }}>

          {/* What is DaysSince? */}
          <Paper shadow="sm" p="xl" radius="lg" withBorder>
            <Stack gap="lg">
              <Group justify="center" gap="sm">
                  <ThemeIcon size={44} radius="md" variant="gradient" gradient={{from: theme.primaryColor, to: theme.colors.vibrantTeal[5]}}>
                      <IconClock size={26} stroke={1.5}/>
                  </ThemeIcon>
                  <Title order={2} ta="center">
                    What is DaysSince?
                  </Title>
              </Group>
              <Text size="lg" c="dimmed" ta="center" maw={750} mx="auto" style={{lineHeight: 1.65}}>
                DaysSince is a modern application designed to help you create, manage, and explore &apos;Counters&apos; – dynamic trackers for the precise time elapsed since any event, big or small. It&apos;s a tool for awareness, a source of motivation, a keeper of memories, and a fun way to connect over shared experiences and even a bit of friendly banter.
              </Text>
            </Stack>
          </Paper>

          {/* The Team / Creator */}
          <Paper shadow="xs" p="xl" radius="lg" withBorder bg={theme.colors.gray[0]}>
            <Stack align="center" ta="center" gap="md">
                <Avatar size="xl" radius="xl" color="blue">VG</Avatar> {/* Placeholder Avatar, replace src if you have an image */}
                <Title order={3}>From the Creator</Title>
                <Text c="dimmed" maw={600} style={{lineHeight: 1.6}}>
                    DaysSince is a passion project by a solo developer, Varun Garg, fueled by a love for clean design and the desire to build useful, meaningful technology.
                    It&apos;s an ongoing journey, and your feedback helps shape its future. Thank you for being a part of it!
                </Text>
            </Stack>
          </Paper>

          {/* Contact Section */}
          <Paper shadow="md" p="xl" radius="lg" withBorder>
            <Stack gap="lg" align="center" ta="center">
              <ThemeIcon size={50} radius="xl" variant="light" color="vibrantTeal">
                <IconMail size={28} />
              </ThemeIcon>
              <Title order={2}>Let&apos;s Connect</Title>
              <Text size="lg" c="dimmed" maw={550}>
                Have questions, feature ideas, or just want to share how you&apos;re using DaysSince?
                We&apos;d love to hear from you.
              </Text>
              <Group mt="md" justify="center"> {/* Add justify="center" here */}
                <Button
                  component="a"
                  href="mailto:varungarg2796@gmail.com"
                  variant="gradient"
                  gradient={{ from: theme.primaryColor, to: theme.colors.vibrantTeal[6] }}
                  size="lg"
                  radius="xl"
                  leftSection={<IconMail size={20} />}
                >
                  Get In Touch
                </Button>
                <Button
                  component="a"
                  href="https://github.com/varungarg2796/dayssince-frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="default"
                  size="lg"
                  radius="xl"
                  leftSection={<IconBrandGithub size={20} />}
                >
                  View on GitHub
                </Button>
              </Group>
            </Stack>
          </Paper>

          {/* Final CTA */}
          <Box
            ta="center"
            py="xl" // Reduced padding
            mt="lg" // Added margin top
          >
            <Button
                component={Link}
                href="/" // Link to homepage to explore or sign up
                size="lg"
                radius="xl"
                variant="light" // Changed from gradient for a softer final CTA here
                color={theme.primaryColor}
                rightSection={<IconRocket size={20}/>}
            >
                Start Tracking Your Moments
            </Button>
          </Box>

      </Container>
    </MainLayout>
  );
}