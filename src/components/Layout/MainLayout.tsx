// src/components/Layout/MainLayout.tsx
'use client';

import { AppShell, Group, Text, Button, Anchor, Burger, NavLink } from '@mantine/core';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { logoutUser } from '@/lib/apiClient';
import { useRouter, usePathname } from 'next/navigation';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconGauge, IconCompass, IconUserCircle } from '@tabler/icons-react';

// --- Header Content Component ---
function HeaderContent({ opened, toggleMobile }: { opened: boolean; toggleMobile: () => void }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)'); // Example breakpoint

  const handleLogout = async () => {
    // ... (logout logic) ...
    await logoutUser();
    router.push('/');
  };

  const navLinks = [
    { href: '/home', label: 'My Counters', icon: IconGauge },
    { href: '/explore', label: 'Explore', icon: IconCompass },
  ];

  // --- RETURN STATEMENT FOR HeaderContent ---
  return (
    // This Group wraps the entire header content horizontally
    <Group justify="space-between" h="100%" px="md">

        {/* Left Group: Burger (mobile) + Logo */}
        <Group>
            {/* Burger Menu for Mobile */}
            {isAuthenticated && isMobile && (
            <Burger opened={opened} onClick={toggleMobile} size="sm" aria-label="Toggle navigation" />
            )}

            {/* Logo/Title */}
            <Anchor component={Link} href="/" underline="never">
                <Text size="xl" fw={700}>DaysSince</Text>
            </Anchor>
        </Group>

        {/* Right Group: Desktop Nav + Auth Buttons */}
        <Group>
            {/* Desktop Navigation Links - Hide on Mobile */}
            {!isMobile && isAuthenticated && (
                <Group spacing="sm">
                    {navLinks.map((link) => (
                        <Button
                            key={link.href}
                            component={Link}
                            href={link.href}
                            variant={pathname === link.href ? 'light' : 'subtle'}
                            size="sm"
                        >
                            {link.label}
                        </Button>
                    ))}
                </Group>
            )}

            {/* Auth Status / Buttons */}
            {isAuthenticated && user ? (
                <Group ml={!isMobile && isAuthenticated ? "md" : undefined}> {/* Conditional margin */}
                    {!isMobile && <Text size="sm" truncate>Welcome, {user.username}!</Text>}
                    <Button size="xs" variant={isMobile ? 'subtle' : 'outline'} onClick={handleLogout} title="Logout">
                       {isMobile ? <IconUserCircle size="1.2rem" /> : 'Logout'}
                    </Button>
                </Group>
            ) : (
                <Button
                    component="a"
                    href="http://localhost:3000/api/auth/google"
                    variant="default"
                    size="xs"
                >
                    Login with Google
                </Button>
            )}
        </Group>

    </Group> // <-- Closing tag for the main header content Group
  ); // <-- Closing parenthesis for HeaderContent return
} // <-- Closing brace for HeaderContent function


// --- Main Layout Component ---
// (This part should be correct as previously provided)
export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname(); // Need pathname here too for Navbar active state

   const navLinks = [
      { href: '/home', label: 'My Counters', icon: IconGauge },
      { href: '/explore', label: 'Explore', icon: IconCompass },
   ];

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={ isAuthenticated ? {
          width: 250,
          breakpoint: 'sm', // When Navbar goes from drawer to static
          collapsed: { mobile: !mobileOpened },
        } : undefined }
    >
      <AppShell.Header>
        <HeaderContent opened={mobileOpened} toggleMobile={toggleMobile} />
      </AppShell.Header>

      {isAuthenticated && (
            <AppShell.Navbar p="md">
                <Text mb="sm" fw={500}>Navigation</Text>
                 {navLinks.map((link) => ( // Use navLinks here
                      <NavLink
                          key={link.href}
                          href={link.href}
                          label={link.label}
                          component={Link}
                          active={pathname === link.href} // Use pathname
                          leftSection={<link.icon size="1rem" stroke={1.5} />}
                          onClick={toggleMobile}
                      />
                 ))}
            </AppShell.Navbar>
       )}

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}