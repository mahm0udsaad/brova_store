import type { ExecutionStep, StepUpdate, AgentTask } from "./types"
import { executionConfig } from "@/lib/ai/execution-config"

export interface StepResult {
  stepId: string
  success: boolean
  data?: any
  error?: string
  tokensUsed?: number
}

/**
 * Group steps by dependency level for parallel execution
 */
export function groupByDependencyLevel(steps: ExecutionStep[]): ExecutionStep[][] {
  const levels: ExecutionStep[][] = []
  const completed = new Set<string>()
  const remaining = [...steps]

  while (remaining.length > 0) {
    // Find steps that can be executed (all dependencies met)
    const currentLevel = remaining.filter((step) =>
      step.dependsOn.every((dep) => completed.has(dep))
    )

    if (currentLevel.length === 0) {
      // Circular dependency or invalid dependencies
      console.error("Circular dependency detected or invalid dependencies")
      break
    }

    levels.push(currentLevel)

    // Mark as completed and remove from remaining
    currentLevel.forEach((step) => {
      completed.add(step.id)
      const index = remaining.indexOf(step)
      if (index > -1) {
        remaining.splice(index, 1)
      }
    })
  }

  return levels
}

/**
 * Execute steps in parallel based on dependency levels
 */
export async function executeParallelSteps(
  steps: ExecutionStep[],
  executeStep: (step: ExecutionStep, results: Map<string, StepResult>) => Promise<StepResult>,
  onProgress: (update: StepUpdate) => void
): Promise<Map<string, StepResult>> {
  const levels = groupByDependencyLevel(steps)
  const results = new Map<string, StepResult>()
  let completedSteps = 0
  const totalSteps = steps.length

  onProgress({
    type: "planning",
    message: `Created execution plan with ${totalSteps} steps across ${levels.length} levels`,
    data: { totalSteps, levels: levels.length },
  })

  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const level = levels[levelIndex]
    const { maxParallelAgents } = executionConfig.concurrency

    // Split level into chunks based on concurrency limit
    for (let i = 0; i < level.length; i += maxParallelAgents) {
      const chunk = level.slice(i, Math.min(i + maxParallelAgents, level.length))

      // Execute chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(async (step) => {
          completedSteps++

          onProgress({
            type: "executing",
            step: completedSteps,
            totalSteps,
            agentName: step.agent,
            action: step.action,
            message: `[${completedSteps}/${totalSteps}] Executing ${step.agent}.${step.action}`,
          })

          try {
            const result = await executeStep(step, results)
            results.set(step.id, result)

            onProgress({
              type: "executing",
              step: completedSteps,
              totalSteps,
              agentName: step.agent,
              action: step.action,
              message: `[${completedSteps}/${totalSteps}] ✓ ${step.action} completed`,
              data: result.data,
            })

            return result
          } catch (error) {
            const errorResult: StepResult = {
              stepId: step.id,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            }
            results.set(step.id, errorResult)

            onProgress({
              type: "executing",
              step: completedSteps,
              totalSteps,
              agentName: step.agent,
              action: step.action,
              message: `[${completedSteps}/${totalSteps}] ✗ ${step.action} failed: ${errorResult.error}`,
            })

            return errorResult
          }
        })
      )
    }
  }

  onProgress({
    type: "complete",
    message: `All ${totalSteps} steps completed`,
    data: { totalSteps, successCount: Array.from(results.values()).filter(r => r.success).length },
  })

  return results
}

/**
 * Resolve parameter references from previous step results
 * Example: "$step:step_1.images" -> actual image array from step_1
 */
export function resolveParameterReferences(
  params: Record<string, any>,
  results: Map<string, StepResult>
): Record<string, any> {
  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.startsWith("$step:")) {
      // Parse reference: $step:step_id.path.to.data
      const parts = value.substring(6).split(".")
      const stepId = parts[0]
      const path = parts.slice(1)

      const stepResult = results.get(stepId)
      if (stepResult && stepResult.success && stepResult.data) {
        let data = stepResult.data
        for (const pathPart of path) {
          if (data && typeof data === "object") {
            data = data[pathPart]
          } else {
            break
          }
        }
        resolved[key] = data
      } else {
        console.warn(`Step reference not found or failed: ${value}`)
        resolved[key] = value
      }
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        typeof item === "object" ? resolveParameterReferences(item, results) : item
      )
    } else if (typeof value === "object" && value !== null) {
      resolved[key] = resolveParameterReferences(value, results)
    } else {
      resolved[key] = value
    }
  }

  return resolved
}
