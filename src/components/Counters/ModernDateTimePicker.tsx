'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconCalendar, IconClock, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

// Define the component props
interface ModernDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  error?: string;
}

export const ModernDateTimePicker: React.FC<ModernDateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
}) => {
  // Get current date for comparison
  const now = new Date();
  
  return (
    <Box>
      <DateTimePicker
        label={
          <Text fw={500} size="sm">
            {label}{required && <span style={{ color: 'red' }}> *</span>}
          </Text>
        }
        placeholder="Select date and time"
        valueFormat="DD MMM YYYY hh:mm A"
        value={value}
        onChange={onChange}
        
        // Size and styling
        size="sm"
        radius="md"
        
        // Icons
        leftSection={<IconCalendar size={16} stroke={1.5} />}
        rightSection={<IconClock size={16} stroke={1.5} />}
        
        // Custom date filtering
        maxDate={now}
        getDayProps={(date) => ({
          disabled: date > now,
          style: date > now 
            ? { 
                color: '#ced4da', 
                opacity: 0.5, 
                cursor: 'not-allowed',
                pointerEvents: 'none',
                backgroundColor: '#f8f9fa'
              } 
            : {}
        })}
        
        // Time constraints 
        withSeconds={false}
        
        // Custom dropdown configuration
        dropdownType="popover"
        clearable={false}
        
        // Custom popover settings
        popoverProps={{
          shadow: "md",
          position: "bottom-start",
          offset: 5,
          withinPortal: true,
          zIndex: 300,
          width: "target",
          transitionProps: { 
            transition: "fade", 
            duration: 150 
          }
        }}
        
        // Custom navigation icons
        nextIcon={<IconChevronRight size={16} stroke={1.5} />}
        previousIcon={<IconChevronLeft size={16} stroke={1.5} />}
        
        // Custom styles
        styles={(theme) => ({
          input: {
            transition: 'all 0.2s ease',
            '&:focus': {
              borderColor: theme.colors.blue[5],
              boxShadow: `0 0 0 2px ${theme.colors.blue[1]}`
            }
          },
          day: {
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
            '&[data-selected]': {
              backgroundColor: theme.colors.blue[5],
              color: 'white'
            },
            '&[data-disabled]': {
              color: theme.colors.gray[5],
              backgroundColor: theme.colors.gray[0],
              opacity: 0.6
            },
            '&:hover:not([data-disabled])': {
              backgroundColor: theme.colors.blue[1]
            }
          },
          calendarHeaderControl: {
            border: 'none',
            backgroundColor: 'transparent',
            color: theme.colors.gray[7],
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.colors.gray[1]
            }
          },
          calendarHeaderLevel: {
            borderRadius: '4px',
            fontWeight: 500,
            padding: '6px 10px',
            '&:hover': {
              backgroundColor: theme.colors.gray[1]
            }
          },
          dropdown: {
            borderRadius: theme.radius.md,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.colors.gray[3]}`
          }
        })}
        error={error}
      />
    </Box>
  );
};

// Example usage within the CounterForm
export function DateTimePickerExample() {
  const { control } = useForm();

  return (
    <Controller
      name="startDate"
      control={control}
      rules={{ required: 'Start date and time are required' }}
      render={({ field, fieldState }) => (
        <ModernDateTimePicker
          label="Start Date & Time"
          value={field.value}
          onChange={field.onChange}
          required
          error={fieldState.error?.message}
        />
      )}
    />
  );
}