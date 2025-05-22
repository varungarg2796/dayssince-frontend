// src/components/Counters/SharedTimerDisplay.tsx
'use client';

import React from 'react';
import { Group, Stack, Text, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export interface TimeDifference {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface SharedTimerDisplayProps {
    time: TimeDifference;
    isArchived?: boolean;
    size?: 'compact' | 'default' | 'large';
}

export function SharedTimerDisplay({ time, isArchived = false, size = 'default' }: SharedTimerDisplayProps) {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();

    // --- Call Hooks at the Top Level ---
    const isLargeSizeViewportConstraint = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
    const isDefaultSizeViewportConstraint = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
    const isCompactSizeViewportConstraint = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`); // Same for compact but kept for clarity if logic diverges

    // --- Helper functions now use the boolean values from hooks ---
    const getNumberFontSize = () => {
        switch (size) {
            case 'large':
                return isLargeSizeViewportConstraint ? '1.5rem' : '2.2rem';
            case 'compact':
                return isCompactSizeViewportConstraint ? 'sm' : 'md';
            case 'default':
            default:
                return isDefaultSizeViewportConstraint ? 'xl' : '1.8rem';
        }
    };

    const getLabelFontSize = () => {
        switch (size) {
            case 'large':
                return isLargeSizeViewportConstraint ? 'xs' : 'sm';
            case 'compact':
                return '8px'; // Compact doesn't use a media query here currently
            case 'default':
            default:
                return isDefaultSizeViewportConstraint ? '9px' : 'xs';
        }
    };

    const getGroupGap = () => {
        switch (size) {
            case 'large':
                return isLargeSizeViewportConstraint ? theme.spacing.xs : theme.spacing.sm;
            case 'compact':
                return 4; // Compact doesn't use a media query here currently
            case 'default':
            default:
                return isDefaultSizeViewportConstraint ? 4 : theme.spacing.xs;
        }
    };

    const getStackGap = () => {
        switch (size) {
            case 'large':
            case 'default':
            default:
                 return isDefaultSizeViewportConstraint ? 0 : 1;
            case 'compact':
                return 0; // Compact doesn't use a media query here currently
        }
    };

    const getSeparatorFontSize = () => {
        switch (size) {
            case 'large':
                return isLargeSizeViewportConstraint ? 'lg' : '1.8rem';
            case 'compact':
                 return isCompactSizeViewportConstraint ? 'xs' : 'sm';
            case 'default':
            default:
                return isDefaultSizeViewportConstraint ? 'md' : 'lg';
        }
    };
    // --- End Sizing Logic ---

    const primaryColor = theme.primaryColor;
    const getGradient = () => {
        if (isArchived) {
            return { from: colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6], to: theme.colors.gray[7] };
        }
        return { from: theme.colors[primaryColor][colorScheme === 'dark' ? 3 : 5], to: theme.colors[primaryColor][colorScheme === 'dark' ? 5 : 7] };
    };

    const NumberText = ({ children }: { children: React.ReactNode }) => (
        <Text
            size={getNumberFontSize()}
            fw={700}
            lh={1.1}
            variant={size === 'compact' || isArchived ? 'text' : 'gradient'}
            color={size === 'compact' || isArchived ? (isArchived ? theme.colors.gray[6] : theme.primaryColor) : undefined}
            gradient={size !== 'compact' && !isArchived ? getGradient() : undefined}
            ta="center"
            style={{
                minWidth: size === 'large' ? '2rem' : (size === 'default' ? '1.5rem' : '1rem'),
                textShadow: (size !== 'compact' && !isArchived && colorScheme === 'dark') ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
        >
            {children}
        </Text>
    );

    const LabelText = ({ children }: { children: React.ReactNode }) => (
        <Text size={getLabelFontSize()} c="dimmed" tt="uppercase" fw={500} ta="center" style={{ letterSpacing: '0.5px' }}>
            {children}
        </Text>
    );

    const TimeSeparator = () => (
        <Text size={getSeparatorFontSize()} fw={300} c="dimmed" lh={1.1}>
            :
        </Text>
    );

    return (
        <Group
            gap={getGroupGap()}
            justify="center"
            wrap="wrap"
        >
            <Stack align="center" gap={getStackGap()}><NumberText>{time.days}</NumberText><LabelText>days</LabelText></Stack>
            <TimeSeparator />
            <Stack align="center" gap={getStackGap()}><NumberText>{pad(time.hours)}</NumberText><LabelText>hours</LabelText></Stack>
            <TimeSeparator />
            <Stack align="center" gap={getStackGap()}><NumberText>{pad(time.minutes)}</NumberText><LabelText>mins</LabelText></Stack>
            {!(isArchived && size === 'compact') && !isArchived && (
                <>
                    <TimeSeparator />
                    <Stack align="center" gap={getStackGap()}><NumberText>{pad(time.seconds)}</NumberText><LabelText>secs</LabelText></Stack>
                </>
            )}
            {isArchived && size !== 'compact' && <Text size="xs" c="dimmed" fs="italic">(Final)</Text>}
        </Group>
    );
}