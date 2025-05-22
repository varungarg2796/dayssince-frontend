// src/components/Layout/MainLayout.tsx
'use client';

import React, { useEffect } from 'react';
import {
    AppShell, Group, Text, Button, Anchor, Burger, Drawer, Stack, Divider,
     Avatar, Menu, UnstyledButton, Box, useMantineTheme // Added MantineColor for explicit typing
} from '@mantine/core';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { logoutUser } from '@/lib/apiClient';
import { useRouter, usePathname } from 'next/navigation';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
    IconGauge, IconCompass, IconLogin, IconSettings,
    IconInfoCircle, IconLogout, IconChevronDown
} from '@tabler/icons-react';

// --- Navigation Links Definition ---
const publicNavLinks = [
  { href: '/explore', label: 'Explore', icon: IconCompass },
  { href: '/about', label: 'About', icon: IconInfoCircle },
];

const authenticatedNavLinks = [
  { href: '/home', label: 'My Counters', icon: IconGauge },
];

const userMenuLinks = [
    { href: '/settings', label: 'Settings', icon: IconSettings },
];


function HeaderContent() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const theme = useMantineTheme(); // Get theme for potential inline style adjustments
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const pathname = usePathname();

  useEffect(() => {
    if (drawerOpened) {
        closeDrawer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    closeDrawer();
    await logoutUser();
    router.push('/');
  };

  const desktopNavLinks = isAuthenticated
    ? [...publicNavLinks, ...authenticatedNavLinks]
    : publicNavLinks;

  // Define hover background color based on theme for UnstyledButton
  const menuTargetHoverBg = theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1];


  return (
    <>
        <Group justify="space-between" h="100%" px="md">
            {/* Left Group: Burger (mobile) and Logo */}
            <Group gap="sm">
                <Burger
                    opened={drawerOpened}
                    onClick={toggleDrawer}
                    size="sm"
                    aria-label="Toggle navigation"
                    hiddenFrom="sm"
                />
                <Anchor component={Link} href="/" underline="never">
                    <Text
                        size="xl"
                        fw={700}
                        // Explicitly set color if header background changes significantly
                        // For a light gray header, default text color is usually fine
                        // c={theme.colorScheme === 'dark' ? theme.white : theme.black}
                    >
                        DaysSince
                    </Text>
                </Anchor>
            </Group>

            {/* Right Group: Desktop Nav, Auth Buttons/User Menu */}
            <Group gap="sm">
                 {/* Desktop Navigation Links */}
                 <Group gap="xs" visibleFrom="sm">
                     {desktopNavLinks.map((link) => (
                        <Button
                            key={link.href}
                            component={Link}
                            href={link.href}
                            variant={pathname === link.href ? 'light' : 'subtle'}
                            size="sm"
                            leftSection={<link.icon size={16} stroke={1.5} />}
                        >
                            {link.label}
                        </Button>
                     ))}
                 </Group>

                {/* Auth Status / User Menu / Login Button */}
                {isAuthenticated && user ? (
                    <Menu shadow="md" width={200} position="bottom-end" withArrow closeOnItemClick={false}>
                        <Menu.Target>
                            <UnstyledButton
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: theme.spacing.xs, // Using theme spacing
                                    borderRadius: theme.radius.sm,
                                }}
                                // Using a simple class or direct style for hover if sx is avoided
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = menuTargetHoverBg}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Avatar src={user.avatarUrl} alt={user.username} radius="xl" size="sm" mr={isMobile ? 0 : "xs"} />
                                {!isMobile && (
                                    <Box>
                                        <Text size="sm" fw={500} lh={1} truncate style={{maxWidth: '120px'}}>{user.username}</Text>
                                    </Box>
                                )}
                                {!isMobile && <IconChevronDown size="0.9rem" stroke={1.5} style={{ marginLeft: theme.spacing.xs }} />}
                            </UnstyledButton>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {isMobile && (
                                <>
                                    <Menu.Label>Hello, {user.username}!</Menu.Label>
                                    <Menu.Divider />
                                </>
                            )}
                            {userMenuLinks.map(link => (
                                <Menu.Item
                                    key={link.href}
                                    leftSection={<link.icon size="0.9rem" stroke={1.5} />}
                                    component={Link}
                                    href={link.href}
                                    onClick={closeDrawer}
                                >
                                    {link.label}
                                </Menu.Item>
                            ))}
                            <Menu.Divider />
                            <Menu.Item
                                color="red"
                                leftSection={<IconLogout size="0.9rem" stroke={1.5} />}
                                onClick={() => {
                                    closeDrawer();
                                    handleLogout();
                                }}
                            >
                                Logout
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                ) : (
                    <Button
                        component="a"
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`}
                        variant="default"
                        size="sm"
                        leftSection={<IconLogin size={16} stroke={1.5} />}
                    >
                        Login with Google
                    </Button>
                )}
            </Group>
        </Group>

        {/* Mobile Navigation Drawer (Hamburger Menu) */}
        <Drawer
            opened={drawerOpened}
            onClose={closeDrawer}
            padding="md"
            title={
                isAuthenticated && user ? (
                    <Stack gap={0}>
                        <Text fw={600}>Navigation</Text>
                        <Text size="sm" c="dimmed">Hello, {user.username}!</Text>
                    </Stack>
                ) : (
                    <Text fw={600}>Navigation</Text>
                )
            }
            size="md"
            hiddenFrom="sm"
            zIndex={1000}
         >
             <Stack>
                {publicNavLinks.map((link) => (
                    <Button
                        key={`drawer-public-${link.href}`}
                        component={Link}
                        href={link.href}
                        variant={pathname === link.href ? 'light' : 'subtle'}
                        size="md"
                        leftSection={<link.icon size={18} stroke={1.5} />}
                        onClick={closeDrawer}
                        fullWidth
                        justify="start"
                    >
                        {link.label}
                    </Button>
                ))}

                {isAuthenticated && (
                    <>
                        {authenticatedNavLinks.map((link) => (
                            <Button
                                key={`drawer-auth-${link.href}`}
                                component={Link}
                                href={link.href}
                                variant={pathname === link.href ? 'light' : 'subtle'}
                                size="md"
                                leftSection={<link.icon size={18} stroke={1.5} />}
                                onClick={closeDrawer}
                                fullWidth
                                justify="start"
                            >
                                {link.label}
                            </Button>
                        ))}
                        <Divider my="sm" />
                        <Button
                            key="drawer-settings"
                            component={Link}
                            href="/settings"
                            variant={pathname === "/settings" ? 'light' : 'subtle'}
                            size="md"
                            leftSection={<IconSettings size={18} stroke={1.5} />}
                            onClick={closeDrawer}
                            fullWidth
                            justify="start"
                        >
                            Settings
                        </Button>
                    </>
                )}

                <Divider my="sm" />

                {isAuthenticated ? (
                    <Button
                        color="red"
                        variant="light"
                        size="md"
                        leftSection={<IconLogout size={18} stroke={1.5} />}
                        onClick={handleLogout}
                        fullWidth
                        justify="start"
                    >
                        Logout
                    </Button>
                ) : (
                    <Button
                        variant="filled"
                        size="md"
                        leftSection={<IconLogin size={18} stroke={1.5} />}
                        onClick={() => {
                            closeDrawer();
                            router.push(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`);
                        }}
                        fullWidth
                        justify="start"
                    >
                        Login with Google
                    </Button>
                )}
             </Stack>
        </Drawer>
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const theme = useMantineTheme();

  // Define header styles dynamically based on theme
  const headerBackgroundColor = theme.colorScheme === 'dark'
    ? theme.colors.dark[7] // A dark background for dark mode
    : theme.colors.gray[0]; // A very light gray for light mode, distinguishing from pure white body

  const headerBorderColor = theme.colorScheme === 'dark'
    ? theme.colors.dark[5]
    : theme.colors.gray[2];

  return (
    <AppShell
        padding="md"
        header={{ height: 60 }}
    >
      <AppShell.Header
        // Use the style prop for direct CSS
        style={{
            backgroundColor: headerBackgroundColor,
            borderBottom: `1px solid ${headerBorderColor}`,
        }}
        // If you want a shadow instead of/in addition to the border:
        // shadow="xs"
      >
        <HeaderContent />
      </AppShell.Header>

      <AppShell.Main
        // Set a background for the main content area if you want it different from default body
        // For example, if header is gray[0], main could be white.
        // style={{ backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}