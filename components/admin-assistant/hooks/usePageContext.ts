"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import type { PageContext } from "../AdminAssistantProvider"

/**
 * Hook to automatically derive page context from the current route
 */
export function usePageContext(): PageContext {
  const pathname = usePathname()

  return useMemo(() => {
    const context = getContextFromPathname(pathname)
    return context
  }, [pathname])
}

function getContextFromPathname(pathname: string): PageContext {
  // Default context
  const defaultContext: PageContext = {
    pageName: "Admin",
    pageType: "dashboard",
    selectedItems: [],
    filters: {},
    capabilities: [],
  }

  if (!pathname.startsWith("/admin")) {
    return defaultContext
  }

  // Parse the pathname to determine page type
  const path = pathname.replace("/admin", "").split("/").filter(Boolean)
  const page = path[0] || "dashboard"

  const pageConfigs: Record<string, Partial<PageContext>> = {
    "": {
      pageName: "Dashboard",
      pageType: "dashboard",
      capabilities: [
        "View store overview",
        "Check recent activity",
        "Quick stats",
      ],
    },
    inventory: {
      pageName: "Products",
      pageType: "products",
      capabilities: [
        "Search products",
        "Generate descriptions",
        "Suggest pricing",
        "Update inventory",
        "Publish/unpublish products",
      ],
    },
    products: {
      pageName: "Product Editor",
      pageType: "products",
      capabilities: [
        "Edit product details",
        "Generate description",
        "Manage images",
        "Set pricing",
      ],
    },
    orders: {
      pageName: "Orders",
      pageType: "orders",
      capabilities: [
        "View order details",
        "Update order status",
        "Generate follow-up messages",
        "Get order summaries",
      ],
    },
    media: {
      pageName: "Media Library",
      pageType: "media",
      capabilities: [
        "Remove backgrounds",
        "Generate lifestyle shots",
        "Create model try-on images",
        "Batch process images",
        "Organize by product",
      ],
    },
    marketing: {
      pageName: "Marketing",
      pageType: "marketing",
      capabilities: [
        "Write Instagram captions",
        "Draft email campaigns",
        "Generate product descriptions",
        "Create promotional content",
        "Suggest hashtags",
      ],
    },
    "bulk-deals": {
      pageName: "Bulk Deals",
      pageType: "bulk-deals",
      capabilities: [
        "Process multiple images",
        "Remove backgrounds in batch",
        "Generate lifestyle shots",
        "Auto-create draft products",
        "Group similar images",
      ],
    },
    insights: {
      pageName: "Insights",
      pageType: "insights",
      capabilities: [
        "Best sellers this month",
        "Compare periods",
        "Revenue trends",
        "Customer insights",
        "Product performance",
      ],
    },
    appearance: {
      pageName: "Appearance",
      pageType: "appearance",
      capabilities: [
        "Suggest color schemes",
        "Recommend fonts",
        "Create brand palette",
        "Preview changes",
      ],
    },
    settings: {
      pageName: "Settings",
      pageType: "settings",
      capabilities: [
        "Show AI usage",
        "Explain settings",
        "Optimize limits",
        "Check usage quota",
      ],
    },
  }

  const config = pageConfigs[page] || defaultContext

  return {
    ...defaultContext,
    ...config,
  } as PageContext
}

/**
 * Get capabilities for a specific action type
 */
export function getCapabilitiesForAction(action: string): string[] {
  const actionCapabilities: Record<string, string[]> = {
    search: ["Find products", "Search inventory", "Filter results"],
    create: ["Add new product", "Upload images", "Set details"],
    edit: ["Update product", "Change images", "Modify details"],
    delete: ["Remove product", "Delete images"],
    generate: ["Generate descriptions", "Create images", "Write content"],
    analyze: ["Get insights", "View trends", "Compare data"],
  }

  return actionCapabilities[action] || []
}
