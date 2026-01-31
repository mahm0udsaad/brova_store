/**
 * Re-export ToolLoopAgent and related utilities from the AI SDK.
 *
 * Previously this file contained a custom thin wrapper around generateText/streamText.
 * AI SDK v6 provides a full-featured ToolLoopAgent class natively, so we now
 * re-export directly from the SDK to get all v6 features:
 * - callOptionsSchema / prepareCall
 * - InferAgentUIMessage type inference
 * - createAgentUIStreamResponse for streaming
 * - stopWhen / stepCountIs for loop control
 * - Native tool approval (needsApproval)
 */
export { ToolLoopAgent, stepCountIs } from "ai"
export type { InferAgentUIMessage } from "ai"
