// src/components/Counters/CompactTimerDisplay.tsx (or keep inside CounterListItem.tsx)
import React from 'react';
import { Group, Stack, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

interface TimeDifference { days: number; hours: number; minutes: number; seconds: number; }

export function CompactTimerDisplay({ time, isArchived = false }: { time: TimeDifference, isArchived?: boolean }) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const isVerySmallScreen = useMediaQuery('(max-width: 500px)'); // Even smaller breakpoint
    const theme = useMantineTheme();

    const NumberText = ({ children }: { children: React.ReactNode }) => (
        <Text
            size={isVerySmallScreen ? 'sm' : 'md'} // Smaller font size for list view
            fw={600}
            lh={1.1}
            // Slightly dimmer if archived? Or keep primary
             c={isArchived ? theme.colors.gray[6] : theme.primaryColor}
        >
            {children}
        </Text>
    );
    const LabelText = ({ children }: { children: React.ReactNode }) => (
        <Text size="9px" c="dimmed" tt="uppercase" fw={500}> {/* Even smaller */}
            {children}
        </Text>
    );

    return (
        // Reduced gaps for list view
        <Group gap={isVerySmallScreen ? 4 : 'xs'} justify="flex-start" wrap="nowrap" my={2}>
            {time.days > 0 && ( // Conditionally show days to save space
                <>
                    <Stack align="center" gap={0}><NumberText>{time.days}</NumberText><LabelText>d</LabelText></Stack>
                     <Text size="xs" c="dimmed" pt={2}>:</Text>
                </>
            )}
            <Stack align="center" gap={0}><NumberText>{pad(time.hours)}</NumberText><LabelText>h</LabelText></Stack>
            <Text size="xs" c="dimmed" pt={2}>:</Text>
            <Stack align="center" gap={0}><NumberText>{pad(time.minutes)}</NumberText><LabelText>m</LabelText></Stack>
            {/* Conditionally show seconds */}
            {!isArchived && (
                 <>
                    <Text size="xs" c="dimmed" pt={2}>:</Text>
                    <Stack align="center" gap={0}><NumberText>{pad(time.seconds)}</NumberText><LabelText>s</LabelText></Stack>
                 </>
            )}
        </Group>
    );
}