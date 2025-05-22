// src/app/about/page.tsx
import React from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Container, Title, Text, Stack, Anchor, Paper } from '@mantine/core';

export default function AboutPage() {
  return (
    <MainLayout>
      <Container size="md" pt="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack gap="lg">
            <Title order={2}>About DaysSince</Title>

            <Text>
              DaysSince is a simple application designed to help you track the time elapsed
              since important events in your life. Whether it&apos;s personal milestones, project deadlines,
              habit tracking, or just fun occurrences, DaysSince provides a clear and easy way to visualize
              how much time has passed.
            </Text>

            <Text>
              Features include creating customizable counters, viewing your active and archived timers,
              and exploring public counters shared by other users.
            </Text>

            <Title order={4} mt="md">Contact</Title>
            <Text>
              If you have any questions, feedback, or issues, please feel free to reach out via email:
            </Text>
            <Anchor href="mailto:varungarg2796@gmail.com" target="_blank" rel="noopener noreferrer">
              varungarg2796@gmail.com
            </Anchor>

          </Stack>
        </Paper>
      </Container>
    </MainLayout>
  );
}