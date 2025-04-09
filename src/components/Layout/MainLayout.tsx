// src/components/Layout/MainLayout.tsx
'use client';

import React, { useEffect } from 'react';
import { AppShell, Group, Text, Button, Anchor, Burger, Drawer, Stack, Divider, ActionIcon } from '@mantine/core'; // Added Divider
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { logoutUser } from '@/lib/apiClient';
import { useRouter, usePathname } from 'next/navigation';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
// Added Icons: IconSettings, IconInfoCircle
import { IconGauge, IconCompass, IconUserCircle, IconLogin, IconSettings, IconInfoCircle } from '@tabler/icons-react';

// --- Navigation Links Definition ---
// Main Nav
const mainNavLinks = [
  { href: '/explore', label: 'Explore', icon: IconCompass },
  { href: '/home', label: 'My Counters', icon: IconGauge },
];
// Secondary Nav (for drawer/menu)
const secondaryNavLinks = [
    { href: '/settings', label: 'Settings', icon: IconSettings },
    { href: '/about', label: 'About', icon: IconInfoCircle },
];

function HeaderContent() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const pathname = usePathname();

  useEffect(() => { closeDrawer(); }, [pathname, closeDrawer]);

  const handleLogout = async () => { await logoutUser(); router.push('/'); router.refresh(); };

  return (
    <>
        <Group justify="space-between" h="100%" px="md">
            {/* Left Group */}
            <Group gap="sm">
                {isAuthenticated && ( <Burger opened={drawerOpened} onClick={toggleDrawer} size="sm" aria-label="Toggle navigation" hiddenFrom="sm"/> )}
                <Anchor component={Link} href="/" underline="never"> <Text size="xl" fw={700}>DaysSince</Text> </Anchor>
            </Group>

            {/* Right Group */}
            <Group gap="sm">
                 {/* Desktop Navigation Links */}
                 <Group gap="xs" visibleFrom="sm">
                     {mainNavLinks.map((link) => ( <Button key={link.href} component={Link} href={link.href} variant={pathname === link.href ? 'light' : 'subtle'} size="sm" leftSection={<link.icon size={16} stroke={1.5} />}> {link.label} </Button> ))}
                     {/* Consider adding About link here too if desired */}
                     <Button component={Link} href="/about" variant={pathname === '/about' ? 'light' : 'subtle'} size="sm" leftSection={<IconInfoCircle size={16} stroke={1.5} />}>About</Button>
                 </Group>

                {/* Auth Status / Buttons */}
                {isAuthenticated && user ? (
                    <Group gap="xs">
                        {!isMobile && <Text size="sm" truncate>Welcome, {user.username}!</Text>}
                         {/* Optional: Add settings link/icon for desktop */}
                         <ActionIcon component={Link} href="/settings" variant="default" size="lg" radius="xl" title="Settings" visibleFrom="sm">
                              <IconSettings size="1.1rem" stroke={1.5} />
                         </ActionIcon>
                        <Button size="xs" variant={isMobile ? 'subtle' : 'outline'} onClick={handleLogout} title="Logout" px={isMobile ? 'xs' : undefined} > {isMobile ? <IconUserCircle size="1.2rem" /> : 'Logout'} </Button>
                    </Group>
                ) : (
                    <Button component="a" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`} variant="default" size="sm" leftSection={<IconLogin size={16} stroke={1.5} />}> Login with Google </Button>
                )}
            </Group>
        </Group>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && (
             <Drawer opened={drawerOpened} onClose={closeDrawer} padding="md" title="Navigation" size="md" hiddenFrom="sm" zIndex={1000} >
                 <Stack>
                    {/* Main Links */}
                    {mainNavLinks.map((link) => ( <Button key={link.href} component={Link} href={link.href} variant={pathname === link.href ? 'light' : 'subtle'} size="md" leftSection={<link.icon size={18} stroke={1.5} />} onClick={closeDrawer} fullWidth justify="start"> {link.label} </Button> ))}
                    <Divider my="sm" />
                     {/* Secondary Links */}
                    {secondaryNavLinks.map((link) => ( <Button key={link.href} component={Link} href={link.href} variant={pathname === link.href ? 'light' : 'subtle'} size="md" leftSection={<link.icon size={18} stroke={1.5} />} onClick={closeDrawer} fullWidth justify="start"> {link.label} </Button> ))}
                 </Stack>
            </Drawer>
        )}
    </>
  );
}

// Main Layout Component
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell padding="md" header={{ height: 60 }} >
      <AppShell.Header> <HeaderContent /> </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
       {/* Optional: Add a Footer here later and potentially move the About link */}
       {/* <AppShell.Footer p="md"> Footer Content </AppShell.Footer> */}
    </AppShell>
  );
}