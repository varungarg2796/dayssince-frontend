// src/app/about/page.tsx
'use client';  // Add this at the top of the file

import React from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { 
  Container, Title, Text, Stack, Anchor, Paper, Group, ThemeIcon, 
  Badge, Box, SimpleGrid, Card, Avatar, Divider, List, Button
} from '@mantine/core';
import { 
  IconHeart, IconBulb, IconUsers, IconTarget, IconMail, IconBrandGithub, 
  IconRocket, IconClock, IconTrendingUp, IconShield, IconCode, IconPalette,
  IconCheck, IconQuote, IconStar, IconCalendar
} from '@tabler/icons-react';
import { useMantineTheme } from '@mantine/core';
import Link from 'next/link';

export default function AboutPage() {
  const theme = useMantineTheme();

  const features = [
    {
      icon: IconClock,
      title: 'Precision Tracking',
      description: 'Track time down to the second with real-time updates and beautiful displays.'
    },
    {
      icon: IconShield,
      title: 'Privacy First',
      description: 'Keep your personal milestones private or share inspiring journeys publicly - your choice.'
    },
    {
      icon: IconUsers,
      title: 'Community Driven',
      description: 'Discover and share meaningful counters with a supportive community.'
    },
    {
      icon: IconPalette,
      title: 'Beautiful Design',
      description: 'Clean, intuitive interface that makes time tracking a joy, not a chore.'
    },
    {
      icon: IconTrendingUp,
      title: 'Motivation Focused',
      description: 'Visual progress displays designed to keep you motivated and engaged.'
    },
    {
      icon: IconTarget,
      title: 'Smart Organization',
      description: 'Tag, categorize, and organize your counters exactly how you want.'
    }
  ];

  const values = [
    {
      icon: IconHeart,
      title: 'Human-Centered',
      description: 'Every feature is designed around real human needs and emotions.',
      color: 'red'
    },
    {
      icon: IconBulb,
      title: 'Simplicity',
      description: 'Complex problems deserve simple, elegant solutions.',
      color: 'yellow'
    },
    {
      icon: IconUsers,
      title: 'Community',
      description: 'We believe in the power of shared experiences and mutual support.',
      color: 'blue'
    },
    {
      icon: IconTarget,
      title: 'Purpose',
      description: 'Time tracking should inspire action, not just satisfy curiosity.',
      color: 'green'
    }
  ];

  const stats = [
    { label: 'Milestones Tracked', value: '10,000+' },
    { label: 'Active Users', value: '2,500+' },
    { label: 'Countries Reached', value: '45+' },
    { label: 'Uptime', value: '99.9%' }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${theme.colors.deepBlue[7]} 0%, ${theme.colors.vibrantTeal[6]} 100%)`,
          color: theme.white,
          paddingTop: `calc(${theme.spacing.xl} * 2)`,
          paddingBottom: `calc(${theme.spacing.xl} * 2)`,
        }}
      >
        <Container size="lg">
          <Stack align="center" ta="center" gap="xl">
            <Badge size="lg" variant="light" color="vibrantTeal" radius="xl">
              Our Story
            </Badge>
            <Title 
              order={1} 
              size="h1" 
              style={{ 
                fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                lineHeight: 1.2,
                fontWeight: 800
              }}
            >
              Time Is the Most Precious Gift.
              <Text 
                component="span" 
                inherit 
                variant="gradient" 
                gradient={{ from: theme.colors.vibrantTeal[3], to: theme.colors.vibrantTeal[5] }}
                style={{ display: 'block', marginTop: '0.3em' }}
              >
                We Help You Cherish It.
              </Text>
            </Title>
            <Text size="xl" c="deepBlue.1" maw={650} style={{ lineHeight: 1.6 }}>
              DaysSince was born from a simple realization: every moment matters, 
              and the stories our time tells deserve to be celebrated, remembered, and shared.
            </Text>
            
            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl" mt="xl">
              {stats.map((stat, index) => (
                <Stack key={index} align="center" gap={4}>
                  <Text size="xl" fw={700} c="vibrantTeal.3">{stat.value}</Text>
                  <Text size="sm" c="deepBlue.2">{stat.label}</Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)` }}>
        {/* The Story Section */}
        <Stack gap="xl">
          <Paper shadow="md" p="xl" radius="lg" withBorder>
            <Stack gap="lg">
              <Group gap="sm" align="center">
                <ThemeIcon size={40} radius="md" variant="light" color="deepBlue">
                  <IconRocket size={24} />
                </ThemeIcon>
                <Title order={2} size="h2">The Story Behind DaysSince</Title>
              </Group>
              
              <Text size="lg" style={{ lineHeight: 1.7 }}>
                <IconQuote size={20} style={{ verticalAlign: 'top', marginRight: 8, opacity: 0.6 }} />
                It started with a simple question: &quot;How long has it been since I quit smoking?&quot; 
                What seemed like basic math became a daily ritual of calculation, motivation, and reflection. 
                That small moment of curiosity sparked something bigger.
              </Text>
              
              <Text style={{ lineHeight: 1.7 }}>
                We realized that time isn&apos;t just numbers on a clock—it&apos;s the foundation of every meaningful 
                transformation. Whether someone is celebrating 100 days of sobriety, marking their first 
                year of marriage, or simply wondering how long they&apos;ve been working on their dream project, 
                these moments deserve more than mental math.
              </Text>
              
              <Text style={{ lineHeight: 1.7 }}>
                DaysSince transforms time into something tangible. Every second becomes a building block 
                of progress. Every day becomes a milestone worth celebrating. Every milestone becomes 
                a story worth sharing.
              </Text>

              <Box 
                p="lg" 
                style={{ 
                  backgroundColor: theme.colors.vibrantTeal[0], 
                  borderRadius: theme.radius.md,
                  borderLeft: `4px solid ${theme.colors.vibrantTeal[5]}`
                }}
              >
                <Text fw={500} c="vibrantTeal.8" size="lg">
                  &quot;We believe that when you track what matters, you transform how you see time itself.&quot;
                </Text>
                <Text size="sm" c="vibrantTeal.6" mt="xs">— The DaysSince Team</Text>
              </Box>
            </Stack>
          </Paper>

          {/* Mission & Values */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%">
              <Stack gap="lg" h="100%">
                <Group gap="sm">
                  <ThemeIcon size={40} radius="md" variant="light" color="vibrantTeal">
                    <IconTarget size={24} />
                  </ThemeIcon>
                  <Title order={3}>Our Mission</Title>
                </Group>
                <Text style={{ lineHeight: 1.6, flex: 1 }}>
                  To help people find meaning in time by making every moment trackable, 
                  every milestone memorable, and every journey shareable. We&apos;re building 
                  a world where time becomes your greatest motivator, not your biggest mystery.
                </Text>
              </Stack>
            </Paper>

            <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%">
              <Stack gap="lg" h="100%">
                <Group gap="sm">
                  <ThemeIcon size={40} radius="md" variant="light" color="deepBlue">
                    <IconStar size={24} />
                  </ThemeIcon>
                  <Title order={3}>Our Vision</Title>
                </Group>
                <Text style={{ lineHeight: 1.6, flex: 1 }}>
                  A future where everyone has the tools to celebrate their progress, 
                  no matter how small. Where communities form around shared milestones, 
                  and where time becomes a source of inspiration rather than anxiety.
                </Text>
              </Stack>
            </Paper>
          </SimpleGrid>

          {/* Core Values */}
          <Box>
            <Title order={2} ta="center" mb="xl">What Drives Us</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {values.map((value, index) => (
                <Card key={index} shadow="sm" p="lg" radius="lg" withBorder h="100%">
                  <Stack align="center" ta="center" gap="md" h="100%">
                    <ThemeIcon 
                      size={50} 
                      radius="md" 
                      variant="light" 
                      color={value.color}
                    >
                      <value.icon size={28} />
                    </ThemeIcon>
                    <Title order={4} size="h5">{value.title}</Title>
                    <Text size="sm" c="dimmed" style={{ flex: 1, lineHeight: 1.5 }}>
                      {value.description}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Features Overview */}
          <Paper shadow="sm" p="xl" radius="lg" withBorder>
            <Stack gap="lg">
              <Title order={2} ta="center">Built With Purpose</Title>
              <Text size="lg" ta="center" c="dimmed" maw={600} mx="auto">
                Every feature in DaysSince serves a human need, addresses a real problem, 
                and brings you closer to understanding the power of your time.
              </Text>
              
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt="xl">
                {features.map((feature, index) => (
                  <Group key={index} align="flex-start" gap="md">
                    <ThemeIcon 
                      size={40} 
                      radius="md" 
                      variant="light" 
                      color="deepBlue"
                      style={{ flexShrink: 0, marginTop: 4 }}
                    >
                      <feature.icon size={22} />
                    </ThemeIcon>
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text fw={600} size="sm">{feature.title}</Text>
                      <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
                        {feature.description}
                      </Text>
                    </Stack>
                  </Group>
                ))}
              </SimpleGrid>
            </Stack>
          </Paper>

          {/* Technology & Approach */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%">
              <Stack gap="lg" h="100%">
                <Group gap="sm">
                  <ThemeIcon size={40} radius="md" variant="light" color="blue">
                    <IconCode size={24} />
                  </ThemeIcon>
                  <Title order={3}>Our Approach</Title>
                </Group>
                <List spacing="sm" size="sm" style={{ flex: 1 }}>
                  <List.Item icon={<IconCheck size={16} color={theme.colors.green[6]} />}>
                    <strong>Privacy by Design:</strong> Your data belongs to you, always
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color={theme.colors.green[6]} />}>
                    <strong>Performance First:</strong> Lightning-fast, responsive experience
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color={theme.colors.green[6]} />}>
                    <strong>Accessibility Focused:</strong> Built for everyone to use
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color={theme.colors.green[6]} />}>
                    <strong>Mobile Optimized:</strong> Perfect experience on any device
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color={theme.colors.green[6]} />}>
                    <strong>Community Driven:</strong> Features shaped by user feedback
                  </List.Item>
                </List>
              </Stack>
            </Paper>

            <Paper shadow="sm" p="xl" radius="lg" withBorder h="100%">
              <Stack gap="lg" h="100%">
                <Group gap="sm">
                  <ThemeIcon size={40} radius="md" variant="light" color="orange">
                    <IconCalendar size={24} />
                  </ThemeIcon>
                  <Title order={3}>What&apos;s Next</Title>
                </Group>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6, flex: 1 }}>
                  We&apos;re constantly evolving DaysSince based on your needs. Coming soon: 
                  advanced analytics, milestone celebrations, team counters, mobile apps, 
                  and integrations with your favorite tools. The journey is just beginning.
                </Text>
                
                <Button 
                  component={Link} 
                  href="/explore" 
                  variant="light" 
                  color="orange"
                  size="sm"
                  leftSection={<IconRocket size={16} />}
                >
                  See What&apos;s Possible
                </Button>
              </Stack>
            </Paper>
          </SimpleGrid>

          <Divider my="xl" />

          {/* Contact Section */}
          <Paper shadow="md" p="xl" radius="lg" withBorder>
            <Stack gap="lg" align="center" ta="center">
              <Group gap="sm">
                <ThemeIcon size={50} radius="md" variant="light" color="vibrantTeal">
                  <IconMail size={28} />
                </ThemeIcon>
                <Title order={2}>Let&apos;s Connect</Title>
              </Group>
              
              <Text size="lg" c="dimmed" maw={500}>
                Have questions, ideas, or just want to share your DaysSince story? 
                We&apos;d love to hear from you. Every message helps us build something better.
              </Text>

              <Group gap="md" mt="md">
                <Button
                  component="a"
                  href="mailto:varungarg2796@gmail.com"
                  variant="filled"
                  color="vibrantTeal"
                  size="lg"
                  radius="xl"
                  leftSection={<IconMail size={20} />}
                >
                  Get In Touch
                </Button>
                
                <Button
                  component="a"
                  href="#" // Add your GitHub link here
                  variant="outline"
                  color="gray"
                  size="lg"
                  radius="xl"
                  leftSection={<IconBrandGithub size={20} />}
                >
                  View Source
                </Button>
              </Group>

              <Text size="sm" c="dimmed" mt="lg">
                We typically respond within 24 hours. Your privacy is important to us—
                we&apos;ll never share your email or spam you with updates.
              </Text>
            </Stack>
          </Paper>

          {/* Final CTA */}
          <Box 
            ta="center" 
            p="xl" 
            style={{
              background: `linear-gradient(135deg, ${theme.colors.deepBlue[0]} 0%, ${theme.colors.vibrantTeal[0]} 100%)`,
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.gray[3]}`
            }}
          >
            <Stack align="center" gap="md">
              <Title order={3} c="deepBlue.8">Ready to Start Your Journey?</Title>
              <Text c="dimmed" maw={400}>
                Join thousands of people who&apos;ve discovered the power of intentional time tracking.
              </Text>
              <Button
                component={Link}
                href="/"
                size="lg"
                radius="xl"
                variant="gradient"
                gradient={{ from: theme.colors.deepBlue[6], to: theme.colors.vibrantTeal[6] }}
                mt="sm"
              >
                Start Tracking What Matters
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </MainLayout>
  );
}