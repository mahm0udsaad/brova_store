/**
 * Accessibility Utilities - Brova Design System
 * 
 * Helpers for building accessible UI components.
 */

// =============================================================================
// REDUCED MOTION
// =============================================================================

/**
 * Check if user prefers reduced motion
 * Use this to disable or simplify animations
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * React hook for reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  
  const [prefersReducedMotion, setPrefersReducedMotion] = 
    typeof window !== "undefined" 
      ? [window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => {}]
      : [false, () => {}]

  return prefersReducedMotion
}

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * Trap focus within a container (for modals, dialogs, etc.)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  container.addEventListener("keydown", handleKeyDown)
  
  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown)
  }
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  return Array.from(elements)
}

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * Handle arrow key navigation in a list
 */
export function handleArrowNavigation(
  e: React.KeyboardEvent,
  items: HTMLElement[],
  options: {
    orientation?: "horizontal" | "vertical" | "both"
    loop?: boolean
  } = {}
): void {
  const { orientation = "vertical", loop = true } = options
  const currentIndex = items.findIndex((item) => item === document.activeElement)
  
  if (currentIndex === -1) return

  let nextIndex = currentIndex

  switch (e.key) {
    case "ArrowDown":
      if (orientation === "vertical" || orientation === "both") {
        e.preventDefault()
        nextIndex = loop 
          ? (currentIndex + 1) % items.length 
          : Math.min(currentIndex + 1, items.length - 1)
      }
      break
    case "ArrowUp":
      if (orientation === "vertical" || orientation === "both") {
        e.preventDefault()
        nextIndex = loop 
          ? (currentIndex - 1 + items.length) % items.length 
          : Math.max(currentIndex - 1, 0)
      }
      break
    case "ArrowRight":
      if (orientation === "horizontal" || orientation === "both") {
        e.preventDefault()
        nextIndex = loop 
          ? (currentIndex + 1) % items.length 
          : Math.min(currentIndex + 1, items.length - 1)
      }
      break
    case "ArrowLeft":
      if (orientation === "horizontal" || orientation === "both") {
        e.preventDefault()
        nextIndex = loop 
          ? (currentIndex - 1 + items.length) % items.length 
          : Math.max(currentIndex - 1, 0)
      }
      break
    case "Home":
      e.preventDefault()
      nextIndex = 0
      break
    case "End":
      e.preventDefault()
      nextIndex = items.length - 1
      break
  }

  items[nextIndex]?.focus()
}

// =============================================================================
// SCREEN READER UTILITIES
// =============================================================================

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  const announcement = document.createElement("div")
  announcement.setAttribute("aria-live", priority)
  announcement.setAttribute("aria-atomic", "true")
  announcement.setAttribute("class", "sr-only")
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0
export function generateId(prefix = "brova"): string {
  return `${prefix}-${++idCounter}-${Math.random().toString(36).substring(2, 9)}`
}

// =============================================================================
// CONTRAST HELPERS
// =============================================================================

/**
 * Check if a color combination meets WCAG contrast requirements
 * Note: This is a simplified version. For production, use a proper color library.
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA"
): boolean {
  // This would require proper color parsing and contrast calculation
  // For now, return true as a placeholder
  console.warn("Contrast check not fully implemented. Use a color contrast tool for verification.")
  return true
}

// =============================================================================
// TYPES
// =============================================================================

export interface AccessibleProps {
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "aria-hidden"?: boolean
  role?: string
  tabIndex?: number
}
