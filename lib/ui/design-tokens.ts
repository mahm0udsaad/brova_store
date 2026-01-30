/**
 * Design Tokens - Brova Design System (2026)
 * 
 * This file defines the semantic tokens for typography, spacing, elevation,
 * and motion. These tokens ensure consistency across the entire platform.
 * 
 * Philosophy:
 * - Calm and confident, not flashy
 * - Progressive disclosure through visual hierarchy
 * - Motion explains state, never decorates
 * - Bilingual-first: RTL/LTR parity
 */

// =============================================================================
// TYPOGRAPHY SCALE
// =============================================================================

/**
 * Type scale based on a 1.25 ratio (major third)
 * Base: 16px
 */
export const typography = {
  // Font families
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },

  // Font sizes with corresponding line heights and letter spacing
  fontSize: {
    // Display sizes - for hero content
    'display-2xl': { size: '4.5rem', lineHeight: '1', letterSpacing: '-0.02em' },     // 72px
    'display-xl': { size: '3.75rem', lineHeight: '1', letterSpacing: '-0.02em' },    // 60px
    'display-lg': { size: '3rem', lineHeight: '1.1', letterSpacing: '-0.02em' },     // 48px
    'display-md': { size: '2.25rem', lineHeight: '1.2', letterSpacing: '-0.02em' },  // 36px
    'display-sm': { size: '1.875rem', lineHeight: '1.2', letterSpacing: '-0.01em' }, // 30px
    
    // Heading sizes - for section headers
    'heading-xl': { size: '1.5rem', lineHeight: '1.3', letterSpacing: '-0.01em' },   // 24px
    'heading-lg': { size: '1.25rem', lineHeight: '1.4', letterSpacing: '-0.01em' },  // 20px
    'heading-md': { size: '1.125rem', lineHeight: '1.4', letterSpacing: '0' },       // 18px
    'heading-sm': { size: '1rem', lineHeight: '1.5', letterSpacing: '0' },           // 16px
    
    // Body sizes - for content
    'body-lg': { size: '1.125rem', lineHeight: '1.6', letterSpacing: '0' },          // 18px
    'body-md': { size: '1rem', lineHeight: '1.6', letterSpacing: '0' },              // 16px
    'body-sm': { size: '0.875rem', lineHeight: '1.6', letterSpacing: '0' },          // 14px
    'body-xs': { size: '0.75rem', lineHeight: '1.5', letterSpacing: '0.01em' },      // 12px
    
    // Label sizes - for UI elements
    'label-lg': { size: '0.875rem', lineHeight: '1.4', letterSpacing: '0.01em' },    // 14px
    'label-md': { size: '0.8125rem', lineHeight: '1.4', letterSpacing: '0.01em' },   // 13px
    'label-sm': { size: '0.75rem', lineHeight: '1.4', letterSpacing: '0.02em' },     // 12px
    'label-xs': { size: '0.6875rem', lineHeight: '1.4', letterSpacing: '0.02em' },   // 11px
  },

  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

// =============================================================================
// SPACING SCALE
// =============================================================================

/**
 * Spacing scale based on 4px base unit
 * Uses semantic naming for clarity
 */
export const spacing = {
  // Primitive scale (use these in custom layouts)
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px

  // Semantic spacing (use these in components)
  component: {
    'gap-xs': '0.25rem',    // 4px - tight inline elements
    'gap-sm': '0.5rem',     // 8px - related items
    'gap-md': '0.75rem',    // 12px - standard gap
    'gap-lg': '1rem',       // 16px - group separation
    'gap-xl': '1.5rem',     // 24px - section separation
    
    'padding-xs': '0.5rem',     // 8px - dense buttons
    'padding-sm': '0.75rem',    // 12px - standard buttons
    'padding-md': '1rem',       // 16px - cards
    'padding-lg': '1.5rem',     // 24px - sections
    'padding-xl': '2rem',       // 32px - page padding
  },

  // Layout spacing
  layout: {
    'page-x-mobile': '0.75rem',   // 12px
    'page-x-tablet': '1rem',      // 16px
    'page-x-desktop': '1.5rem',   // 24px
    'section-gap': '2rem',        // 32px
    'section-gap-lg': '3rem',     // 48px
  },
} as const

// =============================================================================
// ELEVATION (SHADOWS)
// =============================================================================

/**
 * Elevation system for depth hierarchy
 * Uses softer, more diffused shadows for a modern feel
 */
export const elevation = {
  // Subtle shadows for cards and surfaces
  'shadow-xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  'shadow-sm': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  'shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  'shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
  'shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
  
  // Glow effects for focus states and emphasis
  'glow-primary': '0 0 0 3px var(--ring)',
  'glow-success': '0 0 0 3px oklch(0.75 0.15 145)',
  'glow-warning': '0 0 0 3px oklch(0.8 0.15 85)',
  'glow-error': '0 0 0 3px oklch(0.7 0.15 25)',
  
  // Inset shadows for inputs and wells
  'shadow-inset': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const

// =============================================================================
// MOTION TIMING
// =============================================================================

/**
 * Motion timing tokens for consistent animations
 * 
 * Principles:
 * - Fast for micro-interactions (hover, press)
 * - Medium for state changes (expand, collapse)
 * - Slow for significant transitions (page, modal)
 */
export const motion = {
  // Durations
  duration: {
    instant: '0ms',
    fastest: '50ms',
    fast: '100ms',
    normal: '150ms',
    relaxed: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
    deliberate: '700ms',
  },

  // Easing functions
  easing: {
    // Standard easings
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // Custom easings for specific purposes
    snappy: 'cubic-bezier(0.2, 0, 0, 1)',           // Quick snap for interactions
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',         // Standard smooth motion
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',    // Subtle bounce for emphasis
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Gentle for large movements
    anticipate: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // Wind-up and overshoot
  },

  // Spring configurations (for Framer Motion)
  spring: {
    snappy: { type: 'spring', stiffness: 500, damping: 40, mass: 1 },
    smooth: { type: 'spring', stiffness: 300, damping: 30, mass: 1 },
    bouncy: { type: 'spring', stiffness: 400, damping: 15, mass: 1 },
    gentle: { type: 'spring', stiffness: 200, damping: 25, mass: 1 },
    stiff: { type: 'spring', stiffness: 700, damping: 50, mass: 1 },
  },

  // Semantic motion tokens
  semantic: {
    hover: { duration: '100ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    press: { duration: '50ms', easing: 'ease-out' },
    expand: { duration: '200ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    collapse: { duration: '150ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    fadeIn: { duration: '150ms', easing: 'ease-out' },
    fadeOut: { duration: '100ms', easing: 'ease-in' },
    slideIn: { duration: '200ms', easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
    slideOut: { duration: '150ms', easing: 'ease-in' },
    modalIn: { duration: '300ms', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    modalOut: { duration: '200ms', easing: 'ease-in' },
  },
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * Border radius scale for consistent rounding
 */
export const radius = {
  none: '0',
  xs: '0.25rem',    // 4px
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const

// =============================================================================
// Z-INDEX SCALE
// =============================================================================

/**
 * Z-index scale for layering
 */
export const zIndex = {
  hide: -1,
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 30,
  modal: 40,
  popover: 50,
  toast: 60,
  tooltip: 70,
  overlay: 80,
  command: 90,
  max: 100,
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * Responsive breakpoints (matches Tailwind defaults)
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// =============================================================================
// SEMANTIC COLORS (CSS Variable References)
// =============================================================================

/**
 * Semantic color tokens that reference CSS variables
 * These provide meaning to colors, not just values
 */
export const semanticColors = {
  // Feedback colors
  success: {
    bg: 'oklch(0.95 0.05 145)',
    bgSubtle: 'oklch(0.98 0.02 145)',
    text: 'oklch(0.35 0.1 145)',
    border: 'oklch(0.8 0.1 145)',
    icon: 'oklch(0.5 0.15 145)',
  },
  warning: {
    bg: 'oklch(0.95 0.08 85)',
    bgSubtle: 'oklch(0.98 0.03 85)',
    text: 'oklch(0.35 0.1 85)',
    border: 'oklch(0.8 0.1 85)',
    icon: 'oklch(0.6 0.15 85)',
  },
  error: {
    bg: 'oklch(0.95 0.05 25)',
    bgSubtle: 'oklch(0.98 0.02 25)',
    text: 'oklch(0.4 0.15 25)',
    border: 'oklch(0.8 0.1 25)',
    icon: 'oklch(0.55 0.2 25)',
  },
  info: {
    bg: 'oklch(0.95 0.03 250)',
    bgSubtle: 'oklch(0.98 0.01 250)',
    text: 'oklch(0.35 0.08 250)',
    border: 'oklch(0.8 0.06 250)',
    icon: 'oklch(0.5 0.1 250)',
  },
} as const

// =============================================================================
// COMPONENT DEFAULTS
// =============================================================================

/**
 * Default component configurations
 */
export const componentDefaults = {
  // Card
  card: {
    padding: spacing.component['padding-md'],
    radius: radius.xl,
    shadow: elevation['shadow-sm'],
  },
  
  // Button
  button: {
    paddingX: spacing.component['padding-sm'],
    paddingY: spacing.component['padding-xs'],
    radius: radius.lg,
    transitionDuration: motion.duration.fast,
  },
  
  // Input
  input: {
    paddingX: spacing.component['padding-sm'],
    paddingY: spacing.component['padding-xs'],
    radius: radius.lg,
  },
  
  // Modal/Dialog
  modal: {
    padding: spacing.component['padding-lg'],
    radius: radius['2xl'],
    shadow: elevation['shadow-xl'],
  },
} as const

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Typography = typeof typography
export type Spacing = typeof spacing
export type Elevation = typeof elevation
export type Motion = typeof motion
export type Radius = typeof radius
export type ZIndex = typeof zIndex
export type Breakpoints = typeof breakpoints
export type SemanticColors = typeof semanticColors

// Export all tokens as a single object
export const designTokens = {
  typography,
  spacing,
  elevation,
  motion,
  radius,
  zIndex,
  breakpoints,
  semanticColors,
  componentDefaults,
} as const

export default designTokens
