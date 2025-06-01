// src/app/page.tsx
'use client';

import React from 'react';
import {
    Title, Text, Stack, Button, Container, Box, SimpleGrid, ThemeIcon, Paper, Group, Badge, Card
} from '@mantine/core';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuthStore } from '@/stores/authStore';
import {
     IconPlus, IconEye, IconListSearch, IconArrowRight,
    IconHeart, IconTargetArrow, IconClock,
    IconSparkles, IconRocket, IconMoodCrazyHappy,
    IconGauge, IconPalette, IconFlame, IconLock, IconTags,
    IconRibbonHealth, IconUserShield, // Added new icons for new use cases
    IconShare3
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMantineTheme } from '@mantine/core';
import Image from 'next/image'; // Uncomment if you use Next.js Image for placeholders

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const theme = useMantineTheme();

  const commonButtonProps = {
    radius: "xl" as const,
    mt: "lg" as const,
  };

  const useCaseCards = [
    { icon: IconHeart, color: theme.colors.red[6], title: 'Cherish Life Milestones', text: 'Track anniversaries, relationship beginnings, births, moves – every significant life event made memorable.' },
    { icon: IconFlame, color: theme.colors.orange[6], title: 'Build Lasting Habits', text: 'Days sober, gym streaks, learning new skills – visualize your commitment and stay motivated daily.' },
    { icon: IconRocket, color: theme.colors.blue[6], title: 'Achieve Project Goals', text: 'Monitor project timelines, celebrate launch days, and track progress since you started chasing an ambition.' },
    { icon: IconMoodCrazyHappy, color: theme.colors.teal[6], title: 'Fun, Banter & Everyday', text: "Days since your team's last win? Or that hilarious inside joke? Share a laugh and keep score!" },
    {
      icon: IconRibbonHealth,
      color: theme.colors.pink[6],
      title: 'Mark Profound Recoveries',
      text: "Celebrate powerful health journeys, like 'Days Cancer Free' or 'Days Since ACL Surgery' or any recovery milestones. Your strength, your timeline."
    },
    {
      icon: IconUserShield,
      color: theme.colors.gray[7],
      title: 'Track with Anonymity',
      text: "Your privacy matters. Change your display username anytime. Considering anonymous public posts? Your control, your story."
    },
  ];

  const howItWorksSteps = [
    {
      icon: IconPlus,
      title: '1. Create Your Counter',
      text: "Name your event, set the start date & time. Add details, tags, and choose your privacy – keep it personal or prepare to share!",
      imageSrc: "/images/how-it-works/step1-create.png", // <<<--- ADD IMAGE SRC
      imageAlt: "Screenshot of creating a new DaysSince counter form"
    },
    {
      icon: IconEye,
      title: '2. Watch Time Unfold',
      text: 'See your active Counters tick up in real-time. For public ones, you can grab a unique link to easily share your progress with anyone, anywhere.',
      imageSrc: "/images/how-it-works/step2-view.png", // <<<--- ADD IMAGE SRC
      imageAlt: "Screenshot of an active DaysSince counter card with timer"
    },
    {
      icon: IconListSearch,
      title: '3. Share & Discover',
      text: "Organize your private dashboard or make inspiring Counters public. Every public Counter gets a unique, shareable URL to showcase to the world or explore what the community is tracking!",
      imageSrc: "/images/how-it-works/step3-explore-share.png", // <<<--- ADD IMAGE SRC
      imageAlt: "Screenshot of the DaysSince explore page showing public counters"
    },
  ];

  const features = [
    { icon: IconClock, title: 'Real-time Precision', description: 'Track time down to the second.' },
    { icon: IconLock, title: 'You Control Privacy', description: 'Keep Counters private or share publicly.' },
    { icon: IconTags, title: 'Smart Organization', description: 'Categorize with tags for easy filtering.' },
    { icon: IconTargetArrow, title: 'Challenge Tracking', description: 'Set goals and monitor your progress.' },
    { icon: IconPalette, title: 'Clean & Beautiful UI', description: 'An interface that’s a joy to use.' },
    { icon: IconShare3, title: 'Easy Sharing', description: 'Quickly get a shareable link for your public Counters.'},  
  ];

  return (
    <MainLayout>
        {/* Hero Section */}
        <Box
          style={{
            background: `linear-gradient(145deg, ${theme.colors.deepBlue[8]} 0%, ${theme.colors.deepBlue[6]} 40%, ${theme.colors.vibrantTeal[7]} 100%)`,
            color: theme.white,
            minHeight: 'calc(80vh - 60px)',
            paddingTop: `calc(${theme.spacing.xl} * 3)`,
            paddingBottom: `calc(${theme.spacing.xl} * 4)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box component="span" style={{ position: 'absolute', top: '10%', left: '5%', width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(67, 208, 208, 0.1)', filter: 'blur(50px)' }} />
          <Box component="span" style={{ position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250, borderRadius: '50%', backgroundColor: 'rgba(45, 121, 247, 0.15)', filter: 'blur(60px)' }} />

            <Container size="lg" style={{ zIndex: 1, position: 'relative' }}>
                 <Stack align="center" gap="xl" ta="center">
                     <Badge
                        size="xl"
                        variant="filled"
                        color="rgba(255, 255, 255, 0.1)"
                        radius="xl"
                        styles={{root: {backdropFilter: 'blur(10px)'}, label: {color: theme.colors.vibrantTeal[2], fontWeight: 600}}}
                        leftSection={<IconSparkles size={18} style={{color: theme.colors.vibrantTeal[3]}}/>}
                     >
                        Track Time That Matters
                     </Badge>
                     <Title
                        order={1}
                        style={{ fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', lineHeight: 1.15, fontWeight: 800 }}
                      >
                        Every Moment Has a Story.
                        <Text component="span" inherit variant="gradient" gradient={{ from: theme.colors.vibrantTeal[3], to: theme.colors.cyan[4] }} style={{display: 'block', marginTop: '0.1em'}}>
                            How Many Days Into Yours?
                        </Text>
                     </Title>
                     <Text size="xl" c={theme.colors.deepBlue[0]} maw={750} style={{lineHeight: 1.7, opacity: 0.9}}>
                        From personal goals and daily habits, to major life milestones and even those fun &apos;remember whens&apos;! DaysSince helps you effortlessly track the time since <Text component="strong" fw={600} c={theme.colors.vibrantTeal[2]}>any</Text> event.
                        Visualize progress, stay motivated, <Text component="strong" fw={600} c={theme.colors.vibrantTeal[2]}>make your Counters public to share your journey (or keep them private!)</Text>, and cherish every moment!
                     </Text>

                     <Group mt="xl" gap="md" justify="center">
                        {!isAuthenticated ? (
                            <Button
                                component="a"
                                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`}
                                variant="white"
                                color={theme.primaryColor}
                                leftSection={<IconRocket size={22} stroke={1.8} />}
                                size="xl"
                                {...commonButtonProps}
                            >
                                Start Your Journey Free
                            </Button>
                        ) : (
                            <Button
                                component={Link}
                                href="/home"
                                variant="white"
                                color={theme.primaryColor}
                                leftSection={<IconGauge size={22} stroke={1.5} />}
                                size="xl"
                                {...commonButtonProps}
                            >
                                Go to My Counters
                            </Button>
                        )}
                        <Button
                            component={Link}
                            href="/explore"
                            variant="outline"
                            color="white"
                            leftSection={<IconListSearch size={22} stroke={1.5} />}
                            size="xl"
                            {...commonButtonProps}
                        >
                            Explore Community
                        </Button>
                     </Group>
                      <Text size="xs" c={theme.colors.deepBlue[2]} mt="sm" style={{opacity: 0.7}}>
                          Join thousands already marking their moments!
                      </Text>
                 </Stack>
             </Container>
        </Box>

        {/* Why DaysSince? / Use Cases Section */}
        <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
            <Stack gap="xl">
                <Box ta="center" mb="lg">
                    <Title order={2} size="h1" mb="xs">
                        Unlock Your Timeline: <Text component="span" variant="gradient" gradient={{from: theme.primaryColor, to: theme.colors.vibrantTeal[5]}} inherit>What Will You Track?</Text>
                    </Title>
                    <Text size="lg" c="dimmed" maw={600} mx="auto">
                        DaysSince is incredibly versatile. Here&apos;s how people are making time count:
                    </Text>
                </Box>
                {/* Adjusted SimpleGrid to potentially show 3 columns on lg screens for 6 cards */}
                <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg:3 }} spacing="xl" verticalSpacing="xl">
                    {useCaseCards.map((item) => (
                        <Card key={item.title} shadow="md" padding="lg" radius="lg" withBorder h="100%">
                            <Stack align="center" ta="center" h="100%" gap="md">
                                <ThemeIcon size={50} radius="lg" variant="light" color={item.color}>
                                    <item.icon stroke={1.5} size={28}/>
                                </ThemeIcon>
                                <Title order={4} size="h5">{item.title}</Title>
                                <Text size="sm" c="dimmed" style={{flexGrow: 1}}>{item.text}</Text>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>

        {/* How It Works Section */}
        <Box bg={theme.colors.gray[0]}>
            <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
                <Stack gap="xl">
                    <Box ta="center" mb="lg">
                        <Title order={2} size="h1" mb="xs">Get Started in Seconds</Title>
                        <Text size="lg" c="dimmed" maw={600} mx="auto">
                            Tracking time shouldn&apos;t be complicated. With DaysSince, it&apos;s beautifully simple:
                        </Text>
                    </Box>
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" verticalSpacing="xl">
                        {howItWorksSteps.map((step, index) => (
                            <Paper key={index} withBorder shadow="sm" radius="lg" p="xl" style={{height: '100%', backgroundColor: theme.white}}>
                                <Stack align="center" ta="center" gap="lg">
                                    <ThemeIcon size={60} radius={60} variant="gradient" gradient={{ from: theme.primaryColor, to: theme.colors.vibrantTeal[5] }}>
                                        <step.icon size={30} stroke={1.8} />
                                    </ThemeIcon>
                                    <Title order={3} size="h4">{step.title}</Title>
                                    {/* IMAGE IMPLEMENTATION HERE */}
                                    <Box
                                        pos="relative" // For Next.js Image with layout="fill"
                                        h={320} // Set your desired height
                                        w="120%"
                                        style={{
                                            borderRadius: theme.radius.md,
                                            overflow: 'hidden', // Important for rounded corners with fill Image
                                            border: `1px solid ${theme.colors.gray[3]}`, // Optional border for the image box
                                            // backgroundColor: theme.colors.gray[2] // Fallback if image doesn't load
                                        }}
                                    >
                                        <Image
                                            src={step.imageSrc}
                                            alt={step.imageAlt}
                                            fill // Makes the image fill the parent Box
                                            style={{ objectFit: 'cover' }} // 'cover' or 'contain'
                                            // You can add 'priority' prop to the first image for LCP optimization
                                            // priority={index === 0}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Helps Next.js optimize image loading
                                        />
                                    </Box>
                                    <Text c="dimmed" size="sm" style={{minHeight: '60px'}}>{step.text}</Text>
                                </Stack>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>
        </Box>

        {/* Features At a Glance Section */}
        <Container size="lg" py={{ base: 'xl', sm: `calc(${theme.spacing.xl} * 3)`}}>
            <Stack gap="xl">
                <Box ta="center" mb="lg">
                    <Title order={2} size="h1" mb="xs">Everything You Need, Nothing You Don&apos;t</Title>
                     <Text size="lg" c="dimmed" maw={600} mx="auto">
                        Packed with thoughtful features to make your time tracking experience seamless and insightful.
                    </Text>
                </Box>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                    {features.map(feature => (
                        <Group key={feature.title} align="flex-start" gap="md" p="xs" style={{borderRadius: theme.radius.md}}>
                             <ThemeIcon size={44} radius="md" variant="light" color={theme.primaryColor}>
                                <feature.icon stroke={1.5} size={24} />
                            </ThemeIcon>
                            <Box style={{flex: 1}}>
                                <Text fw={600} size="md" mb={4}>{feature.title}</Text>
                                <Text size="sm" c="dimmed">{feature.description}</Text>
                            </Box>
                        </Group>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>

        {/* Final Call to Action Section */}
        <Box bg={`linear-gradient(45deg, ${theme.colors.gray[0]} 0%, ${theme.colors.gray[1]} 100%)`}>
            <Container size="md" py={{ base: `calc(${theme.spacing.xl} * 2)`, sm: `calc(${theme.spacing.xl} * 4)`}}>
                <Paper
                    shadow="xl"
                    p={{base: "lg", sm:"xl"}}
                    radius="xl"
                    style={{
                        background: `linear-gradient(135deg, ${theme.colors.deepBlue[7]} 0%, ${theme.colors.vibrantTeal[6]} 100%)`,
                        color: theme.white,
                        textAlign: 'center'
                    }}
                >
                    <Stack align="center" gap="lg">
                        <ThemeIcon size={60} radius={60} variant="outline" color="white">
                            <IconSparkles size={32} stroke={1.5} style={{ color: theme.white }} />
                        </ThemeIcon>
                        <Title order={2} style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
                            Ready to Make Every Day Count?
                        </Title>
                        <Text size="lg" c={theme.colors.deepBlue[1]} maw={500} style={{opacity: 0.9}}>
                            Stop wondering, start tracking. Your significant moments deserve to be remembered and celebrated. Join DaysSince for free.
                        </Text>
                        <Button
                            component={Link}
                            href={isAuthenticated ? "/home" : "/explore"}
                            size="xl"
                            radius="xl"
                            variant="white"
                            color={theme.primaryColor}
                            rightSection={<IconArrowRight size={22} stroke={1.8}/>}
                            mt="md"
                        >
                            {isAuthenticated ? "Go to My Counters" : "Start Tracking Now"}
                        </Button>
                        <Text size="xs" c={theme.colors.deepBlue[2]} mt="xs" style={{opacity: 0.7}}>
                            Free forever. No credit card required.
                        </Text>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    </MainLayout>
  );
}