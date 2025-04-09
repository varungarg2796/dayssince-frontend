// src/components/Counters/ModernDateTimePicker.tsx
'use client';

import React from 'react';
import {
  Box,
  Text,
  Group,
  rgba,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  IconCalendar,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

interface ModernDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  error?: string;
  minDate?: Date;
  maxDate?: Date; // Keep this prop
}

export const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
  minDate,
  maxDate, // Use the passed maxDate
}) => {

  // Helper to compare only the date part (ignoring time)
  const isDateAfter = (date1: Date, date2: Date): boolean => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      return d1 > d2;
  };


  return (
    <Box>
      <DateTimePicker
        label={
          <Group gap={4}>
            <Text fw={500} size="sm">
              {label}
              {required && <Text span c="red"> *</Text>}
            </Text>
          </Group>
        }
        placeholder="Select date & time"
        valueFormat="DD MMM YYYY hh:mm A"
        value={value}
        onChange={onChange}
        size="md" // Or "sm"
        radius="md"
        minDate={minDate}
        // Still pass maxDate to potentially help internal logic,
        // but rely on getDayProps for visual disabling.
        maxDate={maxDate}
        // --- RE-ADD getDayProps for Visual Disabling ---
        getDayProps={(date) => {
            const isAfterMax = maxDate ? isDateAfter(date, maxDate) : false;
            const isDisabled = isAfterMax; // Add minDate check here if needed too
            return {
                disabled: isDisabled,
                // Apply visual styling for disabled future dates
                style: isDisabled
                  ? {
                      color: '#adb5bd', // Use a standard disabled color
                      // backgroundColor: '#f1f3f5', // Optional subtle background
                      opacity: 0.6,
                      // cursor: 'not-allowed', // Default disabled cursor should apply
                    }
                  : {},
            };
        }}
        // -------------------------------------------
        withSeconds={false}
        clearable={false}
        dropdownType="popover"
        leftSection={<IconCalendar size={18} stroke={1.5} />}
        rightSection={<IconClock size={18} stroke={1.5} />}
        nextIcon={<IconChevronRight size={18} stroke={1.5} />}
        previousIcon={<IconChevronLeft size={18} stroke={1.5} />}
        error={error} // Pass error string
        popoverProps={{
          shadow: 'md', position: 'bottom-start', offset: 6, withinPortal: true, zIndex: 300,
          transitionProps: { transition: 'pop', duration: 150, timingFunction: 'ease' },
        }}
        styles={(theme) => ({
          input: { transition: 'all 0.2s ease', border: `1px solid ${theme.colors.gray[3]}`, backgroundColor: theme.white, '&:focus-within': { boxShadow: `0 0 0 3px ${rgba(theme.colors.blue[4], 0.3)}`, }, },
          // Adjusted hover/disabled styling slightly
          day: { borderRadius: theme.radius.sm, transition: 'all 0.15s ease-in-out', fontWeight: 500, '&[data-selected]': { backgroundColor: theme.colors.blue[6], color: theme.white, }, '&[data-disabled]': { color: theme.colors.gray[5], backgroundColor: 'transparent', opacity: 0.5, }, '&:hover:not([data-disabled]):not([data-selected])': { backgroundColor: theme.colors.blue[0], }, },
          calendarHeaderControl: { border: 'none', backgroundColor: 'transparent', color: theme.colors.gray[7], borderRadius: theme.radius.sm, '&:hover': { backgroundColor: theme.colors.gray[1], }, },
          calendarHeaderLevel: { borderRadius: theme.radius.sm, fontWeight: 600, padding: '6px 10px', fontSize: theme.fontSizes.sm, '&:hover': { backgroundColor: theme.colors.gray[1], }, },
          dropdown: { borderRadius: theme.radius.md, border: `1px solid ${theme.colors.gray[3]}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', },
        })}
      />
      {/* Removed redundant error display block */}
    </Box>
  );
};