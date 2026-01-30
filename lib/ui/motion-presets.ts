import type { Variants, Transition, TargetAndTransition } from "framer-motion"

/**
 * Motion Presets - Brova Design System (2026)
 * 
 * Principles:
 * - Motion explains state, never decorates
 * - Fast for micro-interactions
 * - Medium for state changes
 * - Slow for significant transitions
 * - Respects reduced motion preferences
 */

// =============================================================================
// SPRING CONFIGURATIONS
// =============================================================================

export const springConfigs = {
  /** Snappy - Quick response for interactions */
  snappy: { type: "spring" as const, stiffness: 500, damping: 40, mass: 1 },
  
  /** Smooth - Standard fluid motion */
  smooth: { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 },
  
  /** Bouncy - Playful with overshoot */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 15, mass: 1 },
  
  /** Gentle - Slow, relaxed motion */
  gentle: { type: "spring" as const, stiffness: 200, damping: 25, mass: 1 },
  
  /** Stiff - Minimal bounce, fast settle */
  stiff: { type: "spring" as const, stiffness: 700, damping: 50, mass: 1 },
  
  /** Wobbly - More playful bounce */
  wobbly: { type: "spring" as const, stiffness: 350, damping: 12, mass: 0.8 },
} as const

// =============================================================================
// DURATION PRESETS (in seconds)
// =============================================================================

export const durations = {
  instant: 0,
  fastest: 0.05,
  fast: 0.1,
  normal: 0.15,
  relaxed: 0.2,
  slow: 0.3,
  slower: 0.4,
  slowest: 0.5,
  deliberate: 0.7,
} as const

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

export const easings = {
  /** Standard smooth motion */
  smooth: [0.4, 0, 0.2, 1],
  
  /** Quick snap for interactions */
  snappy: [0.2, 0, 0, 1],
  
  /** Bounce for emphasis */
  bounce: [0.34, 1.56, 0.64, 1],
  
  /** Gentle for large movements */
  gentle: [0.25, 0.46, 0.45, 0.94],
  
  /** Anticipation - wind-up effect */
  anticipate: [0.68, -0.6, 0.32, 1.6],
  
  /** Ease out - decelerate */
  easeOut: [0, 0, 0.2, 1],
  
  /** Ease in - accelerate */
  easeIn: [0.4, 0, 1, 1],
} as const

// =============================================================================
// MOTION VARIANTS
// =============================================================================

/**
 * Fade variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * Scale variants - subtle scale with fade
 */
export const scaleVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.98, opacity: 0 },
}

/**
 * Slide variants (direction-aware)
 */
export const slideVariants = {
  up: {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 8, opacity: 0 },
  } as Variants,
  
  down: {
    hidden: { y: -16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -8, opacity: 0 },
  } as Variants,
  
  left: {
    hidden: { x: 16, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: 8, opacity: 0 },
  } as Variants,
  
  right: {
    hidden: { x: -16, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -8, opacity: 0 },
  } as Variants,
}

/**
 * Stagger container - for animating lists
 */
export const staggerContainerVariants = (
  staggerDelay = 0.05,
  delayChildren = 0
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerDelay * 0.5,
      staggerDirection: -1,
    },
  },
})

/**
 * Stagger item - child of stagger container
 */
export const staggerItemVariants: Variants = {
  hidden: { y: 8, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: springConfigs.smooth,
  },
  exit: { y: 4, opacity: 0 },
}

// =============================================================================
// SEMANTIC MOTION PRESETS
// =============================================================================

export const motionPresets = {
  /** Page transitions */
  page: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: durations.relaxed, ease: easings.gentle },
  },

  /** Modal/Dialog appearance */
  modal: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 4 },
    transition: { ...springConfigs.smooth, duration: durations.slow },
  },

  /** Bottom sheet */
  sheet: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: springConfigs.smooth,
  },

  /** Sidebar */
  sidebar: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
    transition: springConfigs.smooth,
  },

  /** Sidebar RTL */
  sidebarRtl: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
    transition: springConfigs.smooth,
  },

  /** Toast notification */
  toast: {
    initial: { y: -16, opacity: 0, scale: 0.95 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: -8, opacity: 0, scale: 0.98 },
    transition: springConfigs.snappy,
  },

  /** Card hover lift */
  cardHover: {
    rest: { y: 0, boxShadow: "var(--shadow-sm)" },
    hover: { y: -2, boxShadow: "var(--shadow-md)" },
    tap: { y: 0, scale: 0.99 },
    transition: { duration: durations.fast, ease: easings.snappy },
  },

  /** Button press */
  buttonPress: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    transition: { duration: durations.fastest, ease: easings.snappy },
  },

  /** Expand/collapse */
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: durations.relaxed, ease: easings.smooth },
  },

  /** Skeleton shimmer */
  skeleton: {
    initial: { backgroundPosition: "200% 0" },
    animate: { 
      backgroundPosition: "-200% 0",
      transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
    },
  },

  /** Spin */
  spin: {
    animate: { 
      rotate: 360,
      transition: { repeat: Infinity, duration: 1, ease: "linear" },
    },
  },

  /** Pulse */
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
  },

  /** Attention grab - subtle bounce */
  attention: {
    animate: {
      y: [0, -4, 0],
      transition: { 
        repeat: Infinity, 
        repeatDelay: 3,
        duration: 0.4, 
        ease: easings.bounce,
      },
    },
  },
} as const

// =============================================================================
// TRANSITION HELPERS
// =============================================================================

/**
 * Create a transition with consistent defaults
 */
export function createTransition(
  duration: keyof typeof durations = "normal",
  easing: keyof typeof easings = "smooth"
): Transition {
  return {
    duration: durations[duration],
    ease: easings[easing],
  }
}

/**
 * Create stagger animation config
 */
export function createStagger(
  staggerDelay = 0.05,
  direction: "forward" | "reverse" = "forward"
) {
  return {
    staggerChildren: staggerDelay,
    staggerDirection: direction === "forward" ? 1 : -1,
  }
}

/**
 * Reduced motion safe wrapper
 * Returns static values when user prefers reduced motion
 */
export function safeMotion<T extends TargetAndTransition>(
  motion: T,
  prefersReducedMotion: boolean
): T | { opacity: number } {
  if (prefersReducedMotion) {
    return { opacity: 1 }
  }
  return motion
}

// =============================================================================
// EXPORTS
// =============================================================================

export type SpringConfig = typeof springConfigs[keyof typeof springConfigs]
export type Duration = keyof typeof durations
export type Easing = keyof typeof easings
