// Store Builder AI Agent - Entry Point
// Streams a conversational store builder agent that can modify the merchant's
// storefront theme components, colors, and typography.

import { streamText, type ModelMessage } from "ai"
import { getGatewayModel } from "@/lib/ai/config"
import { STORE_BUILDER_PROMPT } from "./prompts"
import { storeBuilderTools } from "./tools"

// =============================================================================
// Stream Store Builder
// =============================================================================

export async function streamStoreBuilder(params: {
  messages: ModelMessage[]
  storeId: string
}) {
  const { messages, storeId } = params

  const model = getGatewayModel("claude-sonnet-4-5")

  // Inject storeId into the system prompt context so tools can use it
  const systemPrompt = `${STORE_BUILDER_PROMPT}

---
## Current Session Context
- Store ID: ${storeId}
- Always pass the storeId "${storeId}" to every tool call that requires it.
`

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: storeBuilderTools,
    maxRetries: 2,
  })

  return result
}
