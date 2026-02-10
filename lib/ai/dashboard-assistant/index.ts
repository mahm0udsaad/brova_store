import { streamText } from "ai"
import { models } from "@/lib/ai/gateway"
import { DASHBOARD_ASSISTANT_PROMPT } from "./prompts"
import * as dashboardTools from "./tools"
import type { DashboardAssistantContext } from "./types"

export async function streamDashboardAssistant(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  context: DashboardAssistantContext
}) {
  const result = streamText({
    model: models.pro,
    system: DASHBOARD_ASSISTANT_PROMPT,
    messages: params.messages,
    tools: dashboardTools,
    maxRetries: 3,
  })

  return result
}

export type { DashboardAssistantContext, DashboardSummary, AnalyticsSummary } from "./types"
