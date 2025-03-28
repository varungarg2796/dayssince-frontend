// src/app/page.tsx
import { Title, Text, Stack } from '@mantine/core';
import { Providers } from './providers';
import { MainLayout } from '@/components/Layout/MainLayout'; // Import MainLayout

export default function HomePage() {
  return (
    <Providers>
      <MainLayout> {/* Use MainLayout here */}
        <Stack align="center" mt="xl">
          <Title order={1}>Welcome to DaysSince!</Title>
          <Text>Track time since your important events.</Text>
          {/* Login button is now in the header, can remove from here */}
        </Stack>
      </MainLayout>
    </Providers>
  );
}