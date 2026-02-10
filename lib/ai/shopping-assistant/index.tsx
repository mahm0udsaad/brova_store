// APUS Layer - AI Shopping Assistant
// Owner: APUS (Claude Opus - AI & Integrations Engineer)

import { streamText } from "ai"
import { getGatewayModel, SHOPPING_ASSISTANT_PROMPT } from "@/lib/ai/config"
import { shoppingAssistantTools } from "./tools"
import type { ShoppingAssistantContext } from "@/types/ai"

// ============================================================================
// AI Shopping Assistant
// ============================================================================

export async function runShoppingAssistant(
  message: string,
  context: ShoppingAssistantContext
) {
  const model = getGatewayModel("claude-sonnet-4-5")

  const result = streamText({
    model,
    system: SHOPPING_ASSISTANT_PROMPT(context.storeName, context.storeLocale),
    messages: [
      ...context.conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ],
    tools: {
      showProducts: shoppingAssistantTools.showProducts,
      addToCart: shoppingAssistantTools.addToCart,
      compareProducts: shoppingAssistantTools.compareProducts,
      showCategories: shoppingAssistantTools.showCategories,
    },
    maxRetries: 3,
  })

  return result
}

// ============================================================================
// Context Helper
// ============================================================================

export function createShoppingContext(
  storeId: string,
  storeName: string,
  storeLocale: "ar" | "en" = "ar",
  sessionId?: string,
  customerId?: string
): ShoppingAssistantContext {
  return {
    storeId,
    storeName,
    storeLocale,
    currency: storeLocale === "ar" ? "SAR" : "USD",
    customerSessionId: sessionId,
    customerId,
    conversationHistory: [],
  }
}
