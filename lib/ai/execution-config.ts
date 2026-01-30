import type { AgentType } from "@/lib/agents/types"

export const executionConfig = {
  // Timeouts per agent type (in milliseconds)
  timeouts: {
    manager: 120_000, // 2min for planning (needs more time with image analysis)
    product: 15_000, // 15s for CRUD
    photographer: 120_000, // 2min for image gen
    marketer: 20_000, // 20s for content
    analyst: 30_000, // 30s for analytics
    video: 15_000, // 15s for video concepts
    ui_controller: 5_000, // 5s for UI commands
    bulk_deals: 300_000, // 5min for batch processing
  } as Record<AgentType | "bulk_deals", number>,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoff: [1000, 2000, 4000], // Exponential backoff in ms
    retryableErrors: ["RATE_LIMIT", "TIMEOUT", "TIMED OUT", "NETWORK", "ECONNRESET"],
  },

  // Concurrency limits
  concurrency: {
    maxParallelAgents: 5,
    maxParallelImages: 3,
  },
}

/**
 * Get timeout for a specific agent type
 */
export function getAgentTimeout(agentType: AgentType | "bulk_deals"): number {
  return executionConfig.timeouts[agentType] || 30_000
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toUpperCase()
  return executionConfig.retry.retryableErrors.some((retryableError) =>
    errorMessage.includes(retryableError)
  )
}

/**
 * Get backoff delay for a specific retry attempt
 */
export function getBackoffDelay(attempt: number): number {
  const delays = executionConfig.retry.backoff
  return delays[Math.min(attempt, delays.length - 1)]
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ])
}

/**
 * Execute with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  agentType: AgentType | "bulk_deals"
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < executionConfig.retry.maxAttempts; attempt++) {
    try {
      return await withTimeout(
        fn(),
        getAgentTimeout(agentType),
        `${agentType} agent timed out after ${getAgentTimeout(agentType)}ms`
      )
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt + 1} failed for ${agentType}:`, error)

      if (!isRetryableError(lastError)) {
        throw lastError
      }

      if (attempt < executionConfig.retry.maxAttempts - 1) {
        const delay = getBackoffDelay(attempt)
        console.log(`Retrying ${agentType} after ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error(`All retry attempts failed for ${agentType}`)
}
