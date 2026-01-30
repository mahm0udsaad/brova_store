import type { PageContext } from "@/lib/agents/types"

export interface AIContext {
  // Page context (auto-derived)
  page: {
    name: string
    type: PageType
    route: string
  }

  // Merchant context (from session)
  merchant: {
    id: string
    name: string
    locale: "en" | "ar"
  }

  // Selection context (from UI state)
  selection: {
    productIds: string[]
    imageUrls: string[]
    batchId?: string
  }

  // Optional: last response for continuity
  continuity?: {
    lastResponse: string
    pendingConfirmation?: ConfirmationRequest
  }
}

export type PageType =
  | "dashboard"
  | "products"
  | "orders"
  | "media"
  | "marketing"
  | "bulk-deals"
  | "insights"
  | "appearance"
  | "settings"

export interface ConfirmationRequest {
  action: string
  description: string
  impact: string
  requiresConfirmation: boolean
  estimatedCost?: number
  affectedItems?: number
}

export interface UIState {
  selectedProducts: string[]
  uploadedImages: string[]
  currentBatchId?: string
}

export interface Session {
  user: {
    id: string
    name?: string
  }
  locale: "en" | "ar"
}

/**
 * Build structured context from page, session, and UI state
 * This replaces reliance on chat history
 */
export function buildContext(
  pageContext: PageContext | null,
  session: Session,
  uiState: UIState,
  lastResponse?: string,
  pendingConfirmation?: ConfirmationRequest
): AIContext {
  return {
    page: {
      name: pageContext?.pageName || "unknown",
      type: (pageContext?.pageType as PageType) || "dashboard",
      route: typeof window !== "undefined" ? window.location.pathname : "/admin",
    },
    merchant: {
      id: session.user.id,
      name: session.user.name || "Merchant",
      locale: session.locale,
    },
    selection: {
      productIds: uiState.selectedProducts,
      imageUrls: uiState.uploadedImages,
      batchId: uiState.currentBatchId,
    },
    continuity: lastResponse || pendingConfirmation
      ? {
          lastResponse: lastResponse || "",
          pendingConfirmation,
        }
      : undefined,
  }
}

/**
 * Convert AIContext to a concise text description for LLM
 */
export function contextToPrompt(context: AIContext): string {
  const parts: string[] = []

  parts.push(`Current page: ${context.page.name} (${context.page.type})`)
  parts.push(`Merchant: ${context.merchant.name} (${context.merchant.id})`)
  parts.push(`Locale: ${context.merchant.locale}`)

  if (context.selection.productIds.length > 0) {
    parts.push(`Selected products: ${context.selection.productIds.join(", ")}`)
  }

  if (context.selection.imageUrls.length > 0) {
    parts.push(`Available images: ${context.selection.imageUrls.length} image(s)`)
  }

  if (context.selection.batchId) {
    parts.push(`Current batch: ${context.selection.batchId}`)
  }

  if (context.continuity?.pendingConfirmation) {
    parts.push(
      `Pending confirmation: ${context.continuity.pendingConfirmation.action}`
    )
  }

  return parts.join("\n")
}
