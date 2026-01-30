"use client"

import { useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import { useConcierge } from "../ConciergeProvider"
import type { 
  VisibleComponent, 
  UserSignal,
  OnboardingStep,
} from "@/lib/ai/concierge-context"

/**
 * Enhanced page context hook for AI Concierge
 * 
 * Provides structured, semantic UI context to the AI.
 * The AI is aware because the UI tells it - not because it spies.
 */

// =============================================================================
// PAGE CONFIGURATIONS
// =============================================================================

interface PageConfig {
  pageName: string
  onboardingStep?: OnboardingStep
  defaultComponents: VisibleComponent[]
  capabilities: string[]
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  // Admin Dashboard
  "/admin": {
    pageName: "AdminDashboard",
    onboardingStep: undefined,
    defaultComponents: [
      { type: "WelcomeMessage", variant: "dashboard" },
      { type: "ActionCard", action: "view_stats" },
    ],
    capabilities: [
      "View store overview",
      "Check recent activity",
      "Quick stats",
    ],
  },
  
  // Onboarding Flow
  "/admin/onboarding": {
    pageName: "OnboardingWelcome",
    onboardingStep: "welcome",
    defaultComponents: [
      { type: "WelcomeMessage", variant: "onboarding" },
      { type: "ContinueButton" },
      { type: "SkipButton" },
    ],
    capabilities: [
      "Start store setup",
      "Skip onboarding",
      "Language switch",
    ],
  },
  "/admin/onboarding/brand": {
    pageName: "OnboardingBrand",
    onboardingStep: "brand",
    defaultComponents: [
      { type: "QuestionPrompt", variant: "brand_name" },
      { type: "InputField", variant: "text" },
      { type: "SkipButton" },
    ],
    capabilities: [
      "Set brand name",
      "Choose brand style",
      "Skip question",
    ],
  },
  "/admin/onboarding/products": {
    pageName: "OnboardingProducts",
    onboardingStep: "products",
    defaultComponents: [
      { type: "QuestionPrompt", variant: "products" },
      { type: "ImageUploader" },
      { type: "ProductGrid", state: "inactive" },
    ],
    capabilities: [
      "Add first product",
      "Upload product images",
      "Skip for now",
    ],
  },
  "/admin/onboarding/appearance": {
    pageName: "OnboardingAppearance",
    onboardingStep: "appearance",
    defaultComponents: [
      { type: "QuestionPrompt", variant: "style" },
      { type: "StorePreview" },
      { type: "BrandPreview" },
    ],
    capabilities: [
      "Choose colors",
      "Select fonts",
      "Preview store",
    ],
  },
  "/admin/onboarding/review": {
    pageName: "OnboardingReview",
    onboardingStep: "review",
    defaultComponents: [
      { type: "StorePreview", state: "active" },
      { type: "DraftBadge" },
      { type: "ContinueButton", action: "finish" },
    ],
    capabilities: [
      "Review draft",
      "Make changes",
      "Approve and save",
    ],
  },
  
  // Inventory
  "/admin/inventory": {
    pageName: "ProductsInventory",
    onboardingStep: undefined,
    defaultComponents: [
      { type: "ProductGrid" },
      { type: "ActionCard", action: "add_product" },
    ],
    capabilities: [
      "Search products",
      "Add products",
      "Edit inventory",
    ],
  },
  
  // Products Editor
  "/admin/products": {
    pageName: "ProductEditor",
    onboardingStep: undefined,
    defaultComponents: [
      { type: "InputField", variant: "product_form" },
      { type: "ImageUploader" },
    ],
    capabilities: [
      "Edit product details",
      "Upload images",
      "Set pricing",
    ],
  },
}

// =============================================================================
// HOOK
// =============================================================================

interface UseConciergePageContextOptions {
  /** Additional visible components to add */
  additionalComponents?: VisibleComponent[]
  /** Override the onboarding step */
  onboardingStep?: OnboardingStep
}

export function useConciergePageContext(options: UseConciergePageContextOptions = {}) {
  const pathname = usePathname()
  const locale = useLocale() as "ar" | "en"
  const { updateVisibleComponents, registerSignal, context } = useConcierge()
  
  // Normalize pathname (remove locale prefix)
  const normalizedPath = pathname.replace(/^\/(ar|en)/, "")
  
  // Get page config
  const pageConfig = useMemo(() => {
    // Try exact match first
    if (PAGE_CONFIGS[normalizedPath]) {
      return PAGE_CONFIGS[normalizedPath]
    }
    
    // Try prefix match
    for (const [path, config] of Object.entries(PAGE_CONFIGS)) {
      if (normalizedPath.startsWith(path) && path !== "/admin") {
        return config
      }
    }
    
    // Default to admin dashboard
    return PAGE_CONFIGS["/admin"]
  }, [normalizedPath])
  
  // Update visible components when page changes
  useEffect(() => {
    const components = [
      ...pageConfig.defaultComponents,
      ...(options.additionalComponents || []),
    ]
    
    updateVisibleComponents(components)
    registerSignal("viewed_page")
  }, [pageConfig, options.additionalComponents, updateVisibleComponents, registerSignal])
  
  // Provide methods to track user signals
  const trackClick = (target?: string) => {
    if (target === "skip") {
      registerSignal("clicked_skip")
    } else if (target === "continue") {
      registerSignal("clicked_continue")
    } else {
      registerSignal("viewed_page")
    }
  }
  
  const trackInput = (type: "focus" | "blur" | "type") => {
    switch (type) {
      case "focus":
        registerSignal("focused_input")
        break
      case "blur":
        registerSignal("blurred_input")
        break
      case "type":
        registerSignal("typed_text")
        break
    }
  }
  
  const trackLanguageChange = () => {
    registerSignal("changed_language")
  }
  
  const trackScroll = () => {
    registerSignal("scrolled_down")
  }
  
  return {
    pageConfig,
    locale,
    isRtl: locale === "ar",
    context,
    
    // Signal trackers
    trackClick,
    trackInput,
    trackLanguageChange,
    trackScroll,
    
    // Page info
    pageName: pageConfig.pageName,
    onboardingStep: options.onboardingStep || pageConfig.onboardingStep,
    capabilities: pageConfig.capabilities,
  }
}

// =============================================================================
// UTILITY: Add component to visible list
// =============================================================================

export function createVisibleComponent(
  type: VisibleComponent["type"],
  options: Partial<Omit<VisibleComponent, "type">> = {}
): VisibleComponent {
  return {
    type,
    ...options,
  }
}
