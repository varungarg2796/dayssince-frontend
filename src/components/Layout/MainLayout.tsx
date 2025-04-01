// src/components/Layout/MainLayout.tsx
'use client';

import React, { useEffect } from 'react'; // Added useEffect
import { AppShell, Group, Text, Button, Anchor, Burger, Drawer, Stack } from '@mantine/core'; // Added Drawer, Stack, Box
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { logoutUser } from '@/lib/apiClient'; // Use centralized logout
import { useRouter, usePathname } from 'next/navigation';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconGauge, IconCompass, IconUserCircle, IconLogin } from '@tabler/icons-react'; // Added IconLogin, IconMenu2

// --- Navigation Links Definition ---
const navLinks = [
  { href: '/explore', label: 'Explore', icon: IconCompass },
  { href: '/home', label: 'My Counters', icon: IconGauge },
];

// --- Header Content Component (No changes needed from previous correct version) ---
function HeaderContent() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)'); // Use your desired breakpoint ('sm')
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const pathname = usePathname(); // Get pathname for active state

  // Close drawer when route changes
   useEffect(() => {
     closeDrawer();
   }, [pathname, closeDrawer]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/');
    router.refresh(); // Might not be needed if state clears correctly
  };

  return (
    <>
        <Group justify="space-between" h="100%" px="md">

            {/* Left Group: Burger (Logged-in Mobile) + Logo */}
            <Group gap="sm">
                {/* Burger only shown for logged-in users on small screens */}
                {isAuthenticated && (
                    <Burger
                        opened={drawerOpened}
                        onClick={toggleDrawer}
                        size="sm"
                        aria-label="Toggle navigation"
                        hiddenFrom="sm" // Hide burger on 'sm' and larger screens
                    />
                )}
                {/* Logo */}
                <Anchor component={Link} href="/" underline="never">
                    <Text size="xl" fw={700}>DaysSince</Text>
                </Anchor>
            </Group>

            {/* Right Group: Links + Auth */}
            <Group gap="sm">
                 {/* Desktop Navigation Links */}
                 <Group gap="xs" visibleFrom="sm"> {/* Show only on 'sm' and larger screens */}
                     {navLinks.map((link) => (
                         <Button
                             key={link.href}
                             component={Link}
                             href={link.href}
                             variant={pathname === link.href ? 'light' : 'subtle'} // Highlight active link
                             size="sm"
                             leftSection={<link.icon size={16} stroke={1.5} />}
                         >
                             {link.label}
                         </Button>
                     ))}
                 </Group>

                {/* Auth Status / Buttons */}
                {isAuthenticated && user ? (
                    // Logged In View
                    <Group gap="xs">
                         {/* Hide username on very small screens if needed */}
                        {!isMobile && <Text size="sm" truncate>Welcome, {user.username}!</Text>}
                        <Button
                           size="xs"
                           variant={isMobile ? 'subtle' : 'outline'} // Icon button on mobile
                           onClick={handleLogout}
                           title="Logout"
                           px={isMobile ? 'xs' : undefined} // Adjust padding for icon button
                           >
                            {isMobile ? <IconUserCircle size="1.2rem" /> : 'Logout'}
                        </Button>
                    </Group>
                ) : (
                    // Logged Out View
                    <Button
                        component="a"
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`}
                        variant="default"
                        size="sm" // Slightly larger login button
                        leftSection={<IconLogin size={16} stroke={1.5} />}
                    >
                        Login with Google
                    </Button>
                )}
            </Group>

        </Group>

        {/* Mobile Navigation Drawer (Only for Logged In Users) */}
        {isAuthenticated && (
             <Drawer
                 opened={drawerOpened}
                 onClose={closeDrawer}
                 padding="md"
                 title="Navigation"
                 size="md" // Adjust size as needed
                 hiddenFrom="sm" // Only for small screens
                 zIndex={1000} // Ensure it's above other content
             >
                 <Stack>
                    {navLinks.map((link) => (
                          <Button
                              key={link.href}
                              component={Link}
                              href={link.href}
                              variant={pathname === link.href ? 'light' : 'subtle'}
                              size="md" // Make drawer buttons larger
                              leftSection={<link.icon size={18} stroke={1.5} />}
                              onClick={closeDrawer} // Close drawer on click
                              fullWidth // Make buttons fill width
                              justify="start" // Align text/icon left
                          >
                              {link.label}
                          </Button>
                     ))}
                 </Stack>
            </Drawer>
        )}
    </>
  );
}


// --- Main Layout Component ---
export function MainLayout({ children }: { children: React.ReactNode }) {
  // No longer needs navbar state here
  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      // --- REMOVED navbar prop ---
    >
      <AppShell.Header>
         {/* Render HeaderContent directly */}
         <HeaderContent />
      </AppShell.Header>

      {/* --- REMOVED AppShell.Navbar --- */}

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}