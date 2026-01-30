import type { AgentResult, AgentType, BulkProgressUpdate } from "./types"
import { models } from "@/lib/ai/gateway"
import { agentRegistry } from "./registry"

export type ProgressCallback = (update: BulkProgressUpdate) => void

/**
 * Abstract base class for all agents
 * Provides common functionality and enforces structure
 */
export abstract class BaseAgent {
  protected userId: string
  protected agentType: AgentType | "bulk_deals"
  protected onProgress: ProgressCallback | null = null

  constructor(userId: string, agentType: AgentType | "bulk_deals") {
    this.userId = userId
    this.agentType = agentType
  }

  /**
   * Set a progress callback for bulk operations
   */
  setProgressCallback(callback: ProgressCallback | null) {
    this.onProgress = callback
  }

  /**
   * Get the model to use for this agent
   */
  protected getModel() {
    const descriptor = agentRegistry.get(this.agentType)
    const modelType = descriptor?.model || "flash"

    return models[modelType]
  }

  /**
   * Validate input against agent's input schema
   */
  protected validateInput(input: any): boolean {
    const descriptor = agentRegistry.get(this.agentType)
    if (!descriptor) {
      console.warn(`No descriptor found for agent: ${this.agentType}`)
      return true
    }

    try {
      descriptor.inputSchema.parse(input)
      return true
    } catch (error) {
      console.error(`Input validation failed for ${this.agentType}:`, error)
      return false
    }
  }

  /**
   * Validate output against agent's output schema
   */
  protected validateOutput(output: any): boolean {
    const descriptor = agentRegistry.get(this.agentType)
    if (!descriptor) {
      console.warn(`No descriptor found for agent: ${this.agentType}`)
      return true
    }

    try {
      descriptor.outputSchema.parse(output)
      return true
    } catch (error) {
      console.error(`Output validation failed for ${this.agentType}:`, error)
      return false
    }
  }

  /**
   * Check if agent has a specific capability
   */
  protected hasCapability(capability: string): boolean {
    const descriptor = agentRegistry.get(this.agentType)
    return descriptor?.capabilities.includes(capability) || false
  }

  /**
   * Execute an action - must be implemented by subclasses
   */
  abstract execute(action: string, params: Record<string, any>): Promise<AgentResult>

  /**
   * Get agent metadata
   */
  getMetadata() {
    return agentRegistry.get(this.agentType)
  }

  /**
   * Format error response
   */
  protected formatError(error: Error | string, action?: string): AgentResult {
    const message = typeof error === "string" ? error : error.message
    return {
      success: false,
      message: `Failed to ${action || "execute action"}`,
      error: message,
    }
  }

  /**
   * Format success response
   */
  protected formatSuccess(
    message: string,
    data?: any,
    tokensUsed?: number
  ): AgentResult {
    return {
      success: true,
      message,
      data,
      tokensUsed,
    }
  }
}
