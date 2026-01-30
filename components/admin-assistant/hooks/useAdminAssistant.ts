"use client"

import { useCallback, useEffect } from "react"
import { useAdminAssistant as useAdminAssistantContext } from "../AdminAssistantProvider"
import { usePageContext } from "./usePageContext"

/**
 * Extended hook that combines assistant context with page context
 */
export function useAdminAssistantWithContext() {
  const assistant = useAdminAssistantContext()
  const pageContext = usePageContext()

  // Automatically update page context when it changes
  useEffect(() => {
    assistant.setPageContext(pageContext)
  }, [pageContext, assistant.setPageContext])

  // Helper to send a message with a specific action
  const sendActionMessage = useCallback(
    async (action: string, params?: Record<string, any>) => {
      const message = params
        ? `${action}: ${JSON.stringify(params)}`
        : action
      await assistant.sendMessage(message)
    },
    [assistant.sendMessage]
  )

  // Quick action helpers
  const quickActions = {
    searchProducts: (query: string) =>
      sendActionMessage(`Search for products: ${query}`),

    generateDescription: (productName: string) =>
      sendActionMessage(`Generate a description for: ${productName}`),

    suggestPricing: (productName: string, category?: string) =>
      sendActionMessage(
        `Suggest pricing for: ${productName}${category ? ` in ${category}` : ""}`
      ),

    generateCaption: (productName: string, platform?: string) =>
      sendActionMessage(
        `Write an ${platform || "Instagram"} caption for: ${productName}`
      ),

    analyzeImage: (imageUrl: string) =>
      sendActionMessage(`Analyze this image: ${imageUrl}`),

    getSalesSummary: (period?: string) =>
      sendActionMessage(`Show me sales summary for ${period || "this month"}`),

    getTopProducts: () =>
      sendActionMessage("What are my best selling products?"),

    removeBackground: (imageUrl: string) =>
      sendActionMessage(`Remove background from: ${imageUrl}`),

    generateLifestyle: (imageUrl: string) =>
      sendActionMessage(`Generate a lifestyle shot from: ${imageUrl}`),
  }

  return {
    ...assistant,
    pageContext,
    quickActions,
    sendActionMessage,
  }
}

// Re-export the base hook for direct access
export { useAdminAssistant as useAdminAssistantBase } from "../AdminAssistantProvider"
