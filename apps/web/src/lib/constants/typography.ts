// ERPNext Typography System
// Extracted from original system analysis

export const fontFamilies = {
  // Primary font stack used in ERPNext
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
  ].join(', '),

  // Monospace for code and data
  mono: [
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),
} as const;

export const fontSizes = {
  // ERPNext commonly used font sizes (from SCSS analysis)
  xs: '10px', // Used in item-timestamp
  sm: '11px', // Used in show-all-reports
  base: '12px', // Used in pos-list-row, content_display
  md: '14px', // Used in project-item, row-header
  lg: '15px', // Used in payment-mode
  xl: '16px', // Used in amount-label
  '2xl': '17px', // Used in pos-pay
  '3xl': '20px', // Used in numeric-keypad
  '4xl': '24px', // Used in pos-keyboard-key
  '5xl': '50px', // Used in placeholder-text
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500', // Used in row-header
  bold: '700', // Used in task-link, timelog-link
  light: '200', // Used in pos-keyboard-key, numeric-keypad
} as const;

export const lineHeights = {
  none: '1',
  tight: '1.25',
  normal: '1.3', // Used in kb-card .card-title
  relaxed: '1.5',
  loose: '2.5', // Used in user-list (250%)
} as const;

// Typography scale for consistent text hierarchy
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  h4: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  h5: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  h6: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },

  // Body text
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
  },
  bodyLarge: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },

  // UI text
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
  },

  // Specific ERPNext components
  listItem: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
  formLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  tableHeader: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },
} as const;

// Helper function to apply text styles
export function getTextStyle(style: keyof typeof textStyles) {
  return textStyles[style];
}

// CSS class names for text styles (to be used with Tailwind)
export const textClasses = {
  h1: 'text-5xl font-bold leading-tight',
  h2: 'text-4xl font-bold leading-tight',
  h3: 'text-3xl font-medium leading-normal',
  h4: 'text-2xl font-medium leading-normal',
  h5: 'text-xl font-medium leading-normal',
  h6: 'text-lg font-medium leading-normal',
  body: 'text-base font-normal leading-relaxed',
  bodyLarge: 'text-md font-normal leading-relaxed',
  bodySmall: 'text-sm font-normal leading-normal',
  caption: 'text-xs font-normal leading-normal',
  label: 'text-base font-medium leading-normal',
  button: 'text-base font-medium leading-none',
  listItem: 'text-base font-normal leading-normal',
  formLabel: 'text-base font-medium leading-normal',
  tableHeader: 'text-md font-medium leading-normal',
  timestamp: 'text-xs font-normal leading-normal',
} as const;
