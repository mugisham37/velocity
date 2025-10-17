// ERPNext Design Tokens
// Extracted from the original ERPNext system for pixel-perfect recreation

export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Gray Scale (matching ERPNext's neutral colors)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280', // Text muted
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic Colors
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',

  // ERPNext Specific Colors (from analysis)
  border: '#e5e7eb',
  'border-light': '#f3f4f6',
  'bg-hover': '#f5f7fa',
  'text-muted': '#6c7680',
  'card-bg': '#ffffff',
  'control-bg': '#f9fafb',
} as const;

export const typography = {
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ],
    mono: [
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ],
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px - Common in ERPNext
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

export const spacing = {
  // ERPNext commonly used spacing values
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px

  // Component specific spacing
  'form-gap': '1rem',
  'section-gap': '1.5rem',
  'card-padding': '1rem',
  'toolbar-height': '3.25rem', // 52px
  'sidebar-width': '16rem', // 256px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  md: '0.25rem', // 4px - ERPNext default
  lg: '0.375rem', // 6px
  xl: '0.5rem', // 8px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  // ERPNext specific shadows
  card: '0 1px 3px rgba(0, 0, 0, 0.3)', // From exercise-card
  button: '0px 2px 5px rgba(0, 0, 0, 0.15)', // From app-icon-svg
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',

  // ERPNext specific breakpoints (from SCSS analysis)
  'md-width': '768px',
  'lg-width': '1024px',
  'xl-width': '1280px',
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

// Component-specific design tokens
export const components = {
  button: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.5rem',
    },
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    padding: '0.75rem',
  },
  card: {
    padding: '1rem',
    borderRadius: '0.375rem',
    shadow: 'md',
  },
  sidebar: {
    width: '16rem',
    collapsedWidth: '4rem',
  },
  topbar: {
    height: '3.5rem', // 56px
  },
} as const;

// Animation and transition values
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
