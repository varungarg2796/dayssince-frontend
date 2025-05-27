// src/theme.ts
'use client';

import { createTheme, MantineColorsTuple } from '@mantine/core';
import { Inter } from 'next/font/google'; // Import the font

const inter = Inter({ subsets: ['latin'] });

// Define Color Tuples (Use https://mantine.dev/colors-generator/ for easy generation)
// Example Deep Blue
const deepBlue: MantineColorsTuple = [
  "#eef6ff",
  "#d8e9fe",
  "#aacdfd",
  "#78b0fa",
  "#4f96f8",
  "#3984f7",
  "#2d79f7", // <-- Primary shade (index 6)
  "#1f68dc",
  "#095ac5",
  "#004bad"
];

// Example Vibrant Teal
const vibrantTeal: MantineColorsTuple = [
  "#e6fcfc",
  "#d3f5f6",
  "#a8ebeb",
  "#7ce1e1",
  "#57d8d8",
  "#43d2d2",
  "#3cd0d1", // <-- Often used for highlights/accents
  "#2cb8b9",
  "#1da1a2",
  "#008a8c"
];

// Example Amber (for warnings/attention)
const warmAmber: MantineColorsTuple = [
    '#fff8e1',
    '#ffefcc',
    '#ffde9f',
    '#ffcc6e',
    '#ffbd45',
    '#ffb329', // <-- Example shade
    '#ffaf1b',
    '#e39a0c',
    '#ca8800',
    '#af7500'
];


export const theme = createTheme({
  // Font Setup
  fontFamily: "monospace", // Use font object from next/font
  headings: { fontFamily: "monospace" }, // Apply to headings too

  // Color Definitions
  primaryColor: 'deepBlue', // Set alias for primary color
  colors: {
    deepBlue,
    vibrantTeal,
    warmAmber,
    // You can add overrides for standard colors like 'gray' if needed
    // gray: [...]
  },

  // Global Component Styles (Apply spacing/radius/colors)
  components: {
    Button: {
      defaultProps: {
        radius: 'md', // Consistent button radius
        loaderProps: { type: 'dots' }, // Consistent loader
      },
      // Example: Styles for the primary button variant
      // styles: (theme, props) => ({
      //   root: {
      //      ...(props.variant === 'filled' && { // Apply only to 'filled' variant
      //           // Define specific filled styles if defaults aren't enough
      //      }),
      //   }
      // })
    },
    ActionIcon: {
        defaultProps: {
            radius: 'md', // Consistent radius
            loaderProps: { type: 'dots' },
        },
         // Ensure loader color matches variant if needed
    },
    Paper: {
        defaultProps: {
            shadow: 'sm', // Default shadow
            p: 'lg',      // Default padding
            radius: 'md', // Default radius
            withBorder: true,
        }
    },
    Modal: {
        defaultProps: {
            radius: 'md',
            overlayProps: { blur: 2, backgroundOpacity: 0.65 },
            centered: true,
            zIndex: 300, // Ensure modals are above loaders etc.
        }
    },
    TextInput: {
        defaultProps: {
            radius: 'md',
        }
    },
    Textarea: {
        defaultProps: {
            radius: 'md',
        }
    },
    Select: {
        defaultProps: {
            radius: 'md',
        }
    },
    MultiSelect: {
        defaultProps: {
            radius: 'md',
        }
    },
    // ... add more component default styles for consistency (e.g., InputWrapper, Card)
    Card: {
        defaultProps: {
             radius: 'lg', // Use slightly larger radius for cards
             shadow: 'sm',
             withBorder: true,
        }
    }
  },

  // Default Radius and Spacing
  radius: {
      xs: '2px',
      sm: '4px',
      md: '8px', // Default radius for most interactive elements
      lg: '16px', // Larger radius for containers like Card/Paper
      xl: '32px',
  },

  // Define Spacing steps (adjust values as needed)
  // Mantine uses these for 'xs', 'sm', 'md', 'lg', 'xl' props in components like Stack, Group, Grid etc.
   spacing: {
       xs: '0.5rem', // 8px
       sm: '0.75rem', // 12px
       md: '1rem',   // 16px (common base)
       lg: '1.5rem', // 24px
       xl: '2rem',   // 32px
   },

   // You can also define specific shadows, transitions, etc.
});