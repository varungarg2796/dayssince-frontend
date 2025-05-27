// src/app/page.tsx
'use client';

import React from 'react';
import { Title, Text, Stack, Button, Container, Box, SimpleGrid, ThemeIcon, Paper, Group, Badge, Divider, List, Spotlight, Grid, Card, Center, Avatar } from '@mantine/core';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuthStore } from '@/stores/authStore';
import { 
  IconLogin, IconPlus, IconEye, IconShare, IconListSearch, IconArrowRight, 
  IconHeart, IconTrophy, IconBrain, IconUsers, IconTarget, IconClock,
  IconStar, IconTrendingUp, IconCalendar, IconFlame, IconCheck,
  IconGauge, IconSparkles, IconRocket
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMantineTheme } from '@mantine/core';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const theme = useMantineTheme();

  const commonButtonProps = {
    size: "lg" as const,
    radius: "xl" as const,
    mt: "lg" as const,
  };

  const useCases = [
    {
      icon: IconHeart,
      color: 'red',
      title: 'Life Milestones',
      description: 'Anniversary dates, relationships, life-changing moments',
      examples: ['Days since we got married', 'Time since my child was born', 'Months since I moved to this city']
    },
    {
      icon: IconTrophy,
      color: 'orange',
      title: 'Personal Achievements',
      description: 'Track your victories and maintain momentum',
      examples: ['Days sober/smoke-free', 'Gym streak counter', 'Learning new skills journey']
    },
    {
      icon: IconBrain,
      color: 'blue',
      title: 'Curiosity & Memory',
      description: 'Remember important dates and satisfy your curiosity',
      examples: ['Historic events timeline', 'Project start dates', 'When did that happen?']
    },
    {
      icon: IconUsers,
      color: 'green',
      title: 'Community & Sharing',
      description: 'Share progress and discover others\' journeys',
      examples: ['Public challenges', 'Team project launches', 'Inspiring milestones']
    }
  ];

  const features = [
    {
      icon: IconClock,
      title: 'Precise Time Tracking',
      description: 'Down to the second accuracy with beautiful, real-time displays'
    },
    {
      icon: IconTarget,
      title: 'Smart Organization',
      description: 'Tag, categorize, and organize your counters exactly how you want'
    },
    {
      icon: IconUsers,
      title: 'Public & Private',
      description: 'Keep personal milestones private or share inspiring journeys publicly'
    },
    {
      icon: IconTrendingUp,
      title: 'Visual Progress',
      description: 'See your time investments grow with intuitive, motivating displays'
    }
  ];

  const testimonials = [
    {
      text: "Seeing my 'days sober' counter grow daily gives me incredible motivation to keep going.",
      author: "Sarah M.",
      badge: "365+ Days"
    },
    {
      text: "I love tracking our project milestones. It's amazing to see how far we've come!",
      author: "Dev Team Lead",
      badge: "Team User"
    },
    {
      text: "Perfect for remembering all those important dates I used to forget. Simple and beautiful.",
      author: "Mike R.",
      badge: "Memory Keeper"
    }
  ];

  return (
    <MainLayout>
        {/* Hero Section */}
        <Box
          style={{
            background: `linear-gradient(135deg, ${theme.colors.deepBlue[8]} 0%, ${theme.colors.deepBlue[6]} 40%, ${theme.colors.vibrantTeal[7]} 100%)`,
            color: theme.white,
            minHeight: 'calc(85vh - 60px)',
            paddingTop: `calc(${theme.spacing.xl} * 4)`,
            paddingBottom: `calc(${theme.spacing.xl} * 4)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
            {/* Decorative elements */}
            <Box
              style={{
                position: 'absolute',
                top: '10%',
                right: '10%',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.colors.vibrantTeal[4]}20 0%, transparent 70%)`,
                opacity: 0.6
              }}
            />
            <Box
              style={{
                position: 'absolute',
                bottom: '15%',
                left: '5%',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.colors.deepBlue[4]}30 0%, transparent 70%)`,
                opacity: 0.4
              }}
            />

            <Container size="lg">
                 <Stack align="center" gap="xl" ta="center">
                     <Badge 
                        size="lg" 
                        variant="light" 
                        color="vibrantTeal" 
                        radius="xl"
                        leftSection={<IconSparkles size={16} />}
                     >
                        Track Time That Matters
                     </Badge>
                     
                     <Title
                        order={1}
                        style={{ 
                          fontSize: 'clamp(3rem, 8vw, 5rem)', 
                          lineHeight: 1.1, 
                          fontWeight: 900,
                          textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                      >
                        Every Moment Has
                        <Text 
                          component="span" 
                          inherit 
                          variant="gradient" 
                          gradient={{ from: theme.colors.vibrantTeal[3], to: theme.colors.vibrantTeal[5] }}
                          style={{ display: 'block', marginTop: '0.2em' }}
                        >
                             a Story to Tell
                        </Text>
                     </Title>
                     
                     <Text 
                        size="xl" 
                        c="deepBlue.0" 
                        maw={750} 
                        style={{
                          lineHeight: 1.7,
                          fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                          textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}
                     >
                        From life-changing decisions to daily habits, from relationship milestones to personal victories—
                        <Text component="span" fw={600} c="vibrantTeal.2"> DaysSince transforms time into motivation</Text>.
                        Track what matters, celebrate progress, and never lose sight of how far you&apos;ve come.
                     </Text>

                     {/* Stats row */}
                     <Group gap="xl" mt="lg">
                        <Stack align="center" gap={4}>
                          <Text size="xl" fw={700} c="vibrantTeal.3">10,000+</Text>
                          <Text size="sm" c="deepBlue.2">Milestones Tracked</Text>
                        </Stack>
                        <Stack align="center" gap={4}>
                          <Text size="xl" fw={700} c="vibrantTeal.3">2,500+</Text>
                          <Text size="sm" c="deepBlue.2">Active Users</Text>
                        </Stack>
                        <Stack align="center" gap={4}>
                          <Text size="xl" fw={700} c="vibrantTeal.3">99.9%</Text>
                          <Text size="sm" c="deepBlue.2">Uptime</Text>
                        </Stack>
                     </Group>

                     {/* CTA Buttons */}
                     <Group mt="xl" gap="md" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                        {!isAuthenticated ? (
                            <Button
                                component="a"
                                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`}
                                variant="white"
                                color={theme.primaryColor}
                                leftSection={<IconRocket size={20} stroke={1.8} />}
                                {...commonButtonProps}
                                size="xl"
                                style={{
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                  transform: 'translateY(0px)',
                                  transition: 'all 0.3s ease'
                                }}
                            >
                                Start Your Journey Free
                            </Button>
                        ) : (
                            <Button
                                component={Link}
                                href="/home"
                                variant="white"
                                color={theme.primaryColor}
                                leftSection={<IconGauge size={20} stroke={1.5} />}
                                {...commonButtonProps}
                                size="xl"
                            >
                                View My Counters
                            </Button>
                        )}
                        <Button
                            component={Link}
                            href="/explore"
                            variant="outline"
                            color="white"
                            leftSection={<IconListSearch size={20} stroke={1.5} />}
                            {...commonButtonProps}
                            size="xl"
                        >
                            Explore Community
                        </Button>
                     </Group>
                 </Stack>
             </Container>
        </Box>

        {/* Use Cases Section */}
        <Container size="xl" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
            <Stack gap="xl">
                <Box ta="center" mb="xl">
                    <Badge size="lg" variant="light" color="deepBlue" radius="xl" mb="md">
                        Why People Love DaysSince
                    </Badge>
                    <Title order={2} size="h1" mb="md">
                        Turn Time Into Your Greatest Asset
                    </Title>
                    <Text size="lg" c="dimmed" maw={600} mx="auto">
                        Whether you&apos;re building habits, celebrating milestones, or simply curious about time—
                        DaysSince gives every moment meaning.
                    </Text>
                </Box>

                <SimpleGrid
                    cols={{ base: 1, sm: 2, lg: 4 }}
                    spacing="lg"
                    verticalSpacing="lg"
                >
                    {useCases.map((useCase, index) => (
                        <Card key={index} shadow="sm" padding="lg" radius="lg" withBorder h="100%">
                            <Stack gap="md" h="100%">
                                <Group gap="sm">
                                    <ThemeIcon 
                                        size={40} 
                                        radius="md" 
                                        variant="light" 
                                        color={useCase.color}
                                    >
                                        <useCase.icon size={24} stroke={1.5} />
                                    </ThemeIcon>
                                    <Title order={4} size="h5">{useCase.title}</Title>
                                </Group>
                                
                                <Text size="sm" c="dimmed" style={{flexGrow: 1}}>
                                    {useCase.description}
                                </Text>
                                
                                <List size="xs" spacing={4} c="dimmed">
                                    {useCase.examples.map((example, i) => (
                                        <List.Item key={i} icon={<IconCheck size={12} stroke={2} color={theme.colors[useCase.color][6]} />}>
                                            {example}
                                        </List.Item>
                                    ))}
                                </List>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>

        {/* How It Works Section */}
        <Box style={{ backgroundColor: theme.colors.gray[0] }}>
            <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
                <Stack gap="xl">
                    <Box ta="center" mb="lg">
                        <Badge size="lg" variant="light" color="vibrantTeal" radius="xl" mb="md">
                            Simple & Powerful
                        </Badge>
                        <Title order={2} size="h1" mb="md">
                            Track What Matters in 3 Steps
                        </Title>
                        <Text size="lg" c="dimmed" maw={600} mx="auto">
                            No complex setup, no learning curve. Just pure, beautiful time tracking.
                        </Text>
                    </Box>

                    <SimpleGrid
                        cols={{ base: 1, md: 3 }}
                        spacing={{ base: 'xl', sm: 'xl' }}
                        verticalSpacing="xl"
                    >
                        {/* Step 1 */}
                        <Paper shadow="md" radius="xl" p="xl" style={{height: '100%', position: 'relative'}}>
                            <Badge 
                                size="lg" 
                                variant="filled" 
                                color="deepBlue" 
                                radius="xl"
                                style={{ position: 'absolute', top: -12, left: 20 }}
                            >
                                Step 1
                            </Badge>
                            <Stack align="center" ta="center" gap="lg" pt="md">
                                <ThemeIcon 
                                    size={80} 
                                    radius="xl" 
                                    variant="gradient" 
                                    gradient={{ from: theme.primaryColor, to: theme.colors.vibrantTeal[5] }}
                                >
                                    <IconPlus size={40} stroke={1.8} />
                                </ThemeIcon>
                                <Title order={3} size="h3" fw={700}>Create Your Counter</Title>
                                
                                <Box 
                                    h={200} 
                                    w="100%" 
                                    style={{ 
                                        backgroundColor: theme.colors.deepBlue[0], 
                                        borderRadius: theme.radius.lg, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        border: `2px dashed ${theme.colors.deepBlue[3]}`,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Stack align="center" gap="xs">
                                        <IconCalendar size={48} color={theme.colors.deepBlue[4]} stroke={1} />
                                        <Text c="deepBlue.6" size="sm" fw={500}>Beautiful Creation Form</Text>
                                        <Text c="dimmed" size="xs">Name, date, tags, privacy settings</Text>
                                    </Stack>
                                </Box>
                                
                                <Text c="dimmed" size="sm" style={{minHeight: '80px', lineHeight: 1.6}}>
                                    Add any milestone with a meaningful name, start date, description, and tags. 
                                    Choose to keep it private for personal reflection or make it public to inspire others.
                                </Text>
                            </Stack>
                        </Paper>

                        {/* Step 2 */}
                        <Paper shadow="md" radius="xl" p="xl" style={{height: '100%', position: 'relative'}}>
                            <Badge 
                                size="lg" 
                                variant="filled" 
                                color="vibrantTeal" 
                                radius="xl"
                                style={{ position: 'absolute', top: -12, left: 20 }}
                            >
                                Step 2
                            </Badge>
                            <Stack align="center" ta="center" gap="lg" pt="md">
                                <ThemeIcon 
                                    size={80} 
                                    radius="xl" 
                                    variant="gradient" 
                                    gradient={{ from: theme.colors.vibrantTeal[5], to: theme.colors.vibrantTeal[7] }}
                                >
                                    <IconEye size={40} stroke={1.8} />
                                </ThemeIcon>
                                <Title order={3} size="h3" fw={700}>Watch Time Unfold</Title>
                                
                                <Box 
                                    h={200} 
                                    w="100%" 
                                    style={{ 
                                        backgroundColor: theme.colors.vibrantTeal[0], 
                                        borderRadius: theme.radius.lg, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        border: `2px dashed ${theme.colors.vibrantTeal[3]}`,
                                        position: 'relative'
                                    }}
                                >
                                    <Stack align="center" gap="xs">
                                        <IconFlame size={48} color={theme.colors.vibrantTeal[5]} stroke={1.2} />
                                        <Text c="vibrantTeal.7" size="lg" fw={700}>847 Days</Text>
                                        <Text c="vibrantTeal.6" size="sm">12 hours, 34 minutes</Text>
                                        <Text c="dimmed" size="xs">Live counter display</Text>
                                    </Stack>
                                </Box>
                                
                                <Text c="dimmed" size="sm" style={{minHeight: '80px', lineHeight: 1.6}}>
                                    Watch your counters grow in real-time with precise calculations down to the second. 
                                    Your dashboard organizes everything beautifully with intuitive, motivating displays.
                                </Text>
                            </Stack>
                        </Paper>

                        {/* Step 3 */}
                        <Paper shadow="md" radius="xl" p="xl" style={{height: '100%', position: 'relative'}}>
                            <Badge 
                                size="lg" 
                                variant="filled" 
                                color="orange" 
                                radius="xl"
                                style={{ position: 'absolute', top: -12, left: 20 }}
                            >
                                Step 3
                            </Badge>
                            <Stack align="center" ta="center" gap="lg" pt="md">
                                <ThemeIcon 
                                    size={80} 
                                    radius="xl" 
                                    variant="gradient" 
                                    gradient={{ from: 'orange.5', to: 'orange.7' }}
                                >
                                    <IconShare size={40} stroke={1.8} />
                                </ThemeIcon>
                                <Title order={3} size="h3" fw={700}>Share & Discover</Title>
                                
                                <Box 
                                    h={200} 
                                    w="100%" 
                                    style={{ 
                                        backgroundColor: theme.colors.orange[0], 
                                        borderRadius: theme.radius.lg, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        border: `2px dashed ${theme.colors.orange[3]}`,
                                        position: 'relative'
                                    }}
                                >
                                    <Stack align="center" gap="xs">
                                        <IconUsers size={48} color={theme.colors.orange[5]} stroke={1.2} />
                                        <Text c="orange.7" size="sm" fw={600}>Community Explore</Text>
                                        <Text c="dimmed" size="xs">Discover inspiring journeys</Text>
                                    </Stack>
                                </Box>
                                
                                <Text c="dimmed" size="sm" style={{minHeight: '80px', lineHeight: 1.6}}>
                                    Make your counters public to inspire others, or browse fascinating timelines 
                                    shared by the community. Find motivation in others&apos; journeys and milestones.
                                </Text>
                            </Stack>
                        </Paper>
                    </SimpleGrid>
                </Stack>
            </Container>
        </Box>

        {/* Features Section */}
        <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
            <Stack gap="xl">
                <Box ta="center" mb="lg">
                    <Title order={2} size="h1" mb="md">
                        Built for Everyone, Perfected for You
                    </Title>
                    <Text size="lg" c="dimmed" maw={600} mx="auto">
                        Every feature designed with intention, every detail crafted for the perfect time-tracking experience.
                    </Text>
                </Box>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                    {features.map((feature, index) => (
                        <Group key={index} align="flex-start" gap="lg">
                            <ThemeIcon 
                                size={50} 
                                radius="lg" 
                                variant="light" 
                                color="deepBlue"
                                style={{ flexShrink: 0, marginTop: 4 }}
                            >
                                <feature.icon size={28} stroke={1.5} />
                            </ThemeIcon>
                            <Stack gap="xs" style={{flex: 1}}>
                                <Title order={4} size="h4" fw={600}>{feature.title}</Title>
                                <Text c="dimmed" size="sm" style={{lineHeight: 1.6}}>
                                    {feature.description}
                                </Text>
                            </Stack>
                        </Group>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>

        {/* Social Proof Section */}
        <Box style={{ backgroundColor: theme.colors.gray[0] }}>
            <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 2.5)`}}>
                <Stack gap="xl">
                    <Box ta="center">
                        <Title order={2} size="h1" mb="md">
                            Stories That Inspire Us
                        </Title>
                        <Text size="lg" c="dimmed" maw={500} mx="auto">
                            Real people, real milestones, real motivation.
                        </Text>
                    </Box>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                        {testimonials.map((testimonial, index) => (
                            <Paper key={index} shadow="sm" p="lg" radius="lg" withBorder>
                                <Stack gap="md">
                                    <Group gap="xs">
                                        {[...Array(5)].map((_, i) => (
                                            <IconStar key={i} size={16} fill={theme.colors.yellow[5]} color={theme.colors.yellow[5]} />
                                        ))}
                                    </Group>
                                    <Text style={{lineHeight: 1.6}} size="sm">
                                        &quot;{testimonial.text}&quot;
                                    </Text>
                                    <Group justify="space-between" align="center">
                                        <Text size="sm" fw={500} c="dimmed">
                                            — {testimonial.author}
                                        </Text>
                                        <Badge size="sm" variant="light" color="green">
                                            {testimonial.badge}
                                        </Badge>
                                    </Group>
                                </Stack>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>
        </Box>

        {/* Final CTA Section */}
        <Container size="md" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
            <Paper 
                shadow="xl" 
                p="xl" 
                radius="xl" 
                style={{
                    background: `linear-gradient(135deg, ${theme.colors.deepBlue[6]} 0%, ${theme.colors.vibrantTeal[6]} 100%)`,
                    color: theme.white,
                    textAlign: 'center'
                }}
            >
                <Stack align="center" gap="lg">
                    <IconSparkles size={48} stroke={1.5} color={theme.colors.vibrantTeal[2]} />
                    <Title order={2} size="h1">
                        Your Journey Starts Now
                    </Title>
                    <Text size="lg" c="deepBlue.1" maw={450}>
                        Join thousands who&apos;ve discovered the power of intentional time tracking. 
                        Every day counts—make yours count too.
                    </Text>
                    
                    <Group gap="md" mt="lg">
                        <Button
                            component={Link}
                            href={isAuthenticated ? "/home" : "/explore"}
                            size="xl"
                            radius="xl"
                            variant="white"
                            color={theme.primaryColor}
                            rightSection={<IconArrowRight size={20} stroke={1.8}/>}
                        >
                            {isAuthenticated ? "View My Counters" : "Start Exploring Free"}
                        </Button>
                    </Group>
                    
                    <Text size="xs" c="deepBlue.2" mt="sm">
                        Free forever. No credit card required. Start in seconds.
                    </Text>
                </Stack>
            </Paper>
        </Container>
    </MainLayout>
  );
}