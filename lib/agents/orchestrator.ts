import { generateText, tool } from "ai"
import { z } from "zod"
import type { AIContext } from "@/lib/ai/context-builder"
import { executeParallelSteps, resolveParameterReferences, type StepResult } from "./parallel-executor"
import type {
  AgentType,
  PageContext,
  ExecutionPlan,
  ExecutionStep,
  OrchestratorResult,
  AgentTask,
  ConfirmationRequest,
  StepUpdate,
} from "./types"
import { ManagerAgent } from "./manager-agent"
import { ProductAgent } from "./product-agent"
import { PhotographerAgent } from "./photographer-agent"
import { MarketerAgent } from "./marketer-agent"
import { AnalystAgent } from "./analyst-agent"
import { VideoAgent } from "./video-agent"
import { UIControllerAgent } from "./ui-controller-agent"
import { createClient } from "@/lib/supabase/server"

// Actions that require user confirmation
const CONFIRMATION_REQUIRED_ACTIONS = [
  "delete_product",
  "delete_products_bulk",
  "update_prices_bulk",
  "publish_campaign",
  "send_notification",
  "publish_products_bulk",
]

// Cost thresholds for confirmation
const COST_THRESHOLDS = {
  imageCount: 10,
  tokenCount: 50000,
}

// Callback type for real-time step updates
export type StepUpdateCallback = (step: StepUpdate) => void

export class TaskOrchestrator {
  private managerAgent: ManagerAgent
  private productAgent: ProductAgent
  private photographerAgent: PhotographerAgent
  private marketerAgent: MarketerAgent
  private analystAgent: AnalystAgent
  private videoAgent: VideoAgent
  private uiControllerAgent: UIControllerAgent
  private userId: string
  private adminName: string | null = null
  private stepUpdates: StepUpdate[] = []
  private onStepUpdate: StepUpdateCallback | null = null

  constructor(userId: string, adminName?: string) {
    this.userId = userId
    this.adminName = adminName || null
    this.managerAgent = new ManagerAgent(userId, adminName)
    this.productAgent = new ProductAgent(userId)
    this.photographerAgent = new PhotographerAgent(userId)
    this.marketerAgent = new MarketerAgent(userId)
    this.analystAgent = new AnalystAgent(userId)
    this.videoAgent = new VideoAgent(userId)
    this.uiControllerAgent = new UIControllerAgent(userId)
  }

  /**
   * Set a callback for real-time step updates (used for streaming)
   */
  setStepUpdateCallback(callback: StepUpdateCallback | null) {
    this.onStepUpdate = callback
  }

  private addStepUpdate(update: StepUpdate) {
    this.stepUpdates.push(update)
    console.log(`[AI Step] ${update.message}`)
    // Call the callback if set (for real-time streaming)
    if (this.onStepUpdate) {
      this.onStepUpdate(update)
    }
  }

  /**
   * Main entry point for processing user requests
   */
  async executeRequest(
    request: string,
    context: PageContext | null,
    conversationHistory: { role: string; content: string }[] = [],
    images?: string[]
  ): Promise<OrchestratorResult> {
    const startTime = Date.now()
    const tasks: AgentTask[] = []
    let totalTokens = 0
    this.stepUpdates = [] // Reset step updates

    try {
      // Handle images - either upload new base64 images or use existing URLs
      let uploadedImageUrls: string[] | undefined
      if (images && images.length > 0) {
        // Check if images are base64 (need upload) or already URLs (use directly)
        const isBase64 = images.some(img => img.startsWith('data:') || !img.startsWith('http'))
        
        if (isBase64) {
          // Upload new base64 images to storage
          this.addStepUpdate({
            type: "planning",
            message: `Uploading ${images.length} image${images.length > 1 ? 's' : ''} to secure storage...`,
          })
          console.log(`Uploading ${images.length} images to storage...`)
          uploadedImageUrls = await this.uploadImages(images)
          console.log(`Uploaded ${uploadedImageUrls.length} images successfully`)
          this.addStepUpdate({
            type: "planning",
            message: `✓ Uploaded ${uploadedImageUrls.length} image${uploadedImageUrls.length > 1 ? 's' : ''} successfully`,
            data: { imageUrls: uploadedImageUrls },
          })
        } else {
          // Images are already URLs - use them directly
          uploadedImageUrls = images.filter(url => url.startsWith('http'))
          console.log(`Using ${uploadedImageUrls.length} previously uploaded images`)
          this.addStepUpdate({
            type: "planning",
            message: `Using ${uploadedImageUrls.length} image${uploadedImageUrls.length > 1 ? 's' : ''} from previous uploads`,
            data: { imageUrls: uploadedImageUrls },
          })
        }
      } else if (context?.availableImages && context.availableImages.length > 0) {
        // Use images from page context if no new images attached
        uploadedImageUrls = context.availableImages
        console.log(`Using ${uploadedImageUrls.length} images from page context`)
        this.addStepUpdate({
          type: "planning",
          message: `Using ${uploadedImageUrls.length} image${uploadedImageUrls.length > 1 ? 's' : ''} from current page`,
          data: { imageUrls: uploadedImageUrls },
        })
      }

      // Step 1: Manager analyzes the request and creates execution plan
      this.addStepUpdate({
        type: "planning",
        message: "Analyzing your request and creating execution plan...",
      })
      console.log("Step 1: Manager analyzing request:", request)
      const analysis = await this.managerAgent.analyzeRequest(
        request, 
        context, 
        conversationHistory, 
        uploadedImageUrls // Pass uploaded URLs instead of base64
      )
      console.log("Analysis complete:", { 
        hasResponse: !!analysis.response, 
        hasPlan: !!analysis.plan,
        tokensUsed: analysis.tokensUsed 
      })
      
      totalTokens += analysis.tokensUsed || 0

      // If no plan and we have a response, return it directly
      if (!analysis.plan || analysis.plan.steps.length === 0) {
        console.log("No execution plan needed, returning direct response")
        this.addStepUpdate({
          type: "complete",
          message: "✓ Response ready",
        })
        return {
          success: true,
          response: analysis.response || "I'm here to help! What would you like me to do?",
          tasks,
          totalTokens,
          executionTime: Date.now() - startTime,
          steps: this.stepUpdates,
        }
      }

      this.addStepUpdate({
        type: "planning",
        message: `✓ Plan created with ${analysis.plan.steps.length} step${analysis.plan.steps.length > 1 ? 's' : ''}`,
        data: { planSteps: analysis.plan.steps.length },
      })

      // Check if confirmation is required
      const confirmationCheck = this.checkConfirmationRequired(analysis.plan)
      if (confirmationCheck) {
        return {
          success: true,
          response: analysis.response,
          tasks,
          totalTokens,
          executionTime: Date.now() - startTime,
          confirmationRequired: confirmationCheck,
          steps: this.stepUpdates,
        }
      }

      // Step 2: Execute the plan
      console.log("Step 2: Executing plan with", analysis.plan.steps.length, "steps")
      const executionResult = await this.executePlan(analysis.plan, uploadedImageUrls, context)
      tasks.push(...executionResult.tasks)
      totalTokens += executionResult.tokensUsed

      // Step 3: Manager synthesizes final response
      this.addStepUpdate({
        type: "synthesizing",
        message: "Preparing final response...",
      })
      console.log("Step 3: Synthesizing final response")
      const finalResponse = await this.managerAgent.synthesizeResponse(
        request,
        tasks,
        context
      )
      totalTokens += finalResponse.tokensUsed || 0

      const finalResponseText = finalResponse.response || analysis.response || "Task completed successfully."

      this.addStepUpdate({
        type: "complete",
        message: "✓ All tasks completed successfully",
      })

      // Collect any UI commands from the UI controller agent
      const uiCommands = this.uiControllerAgent.getPendingCommands()

      return {
        success: true,
        response: finalResponseText,
        tasks,
        totalTokens,
        executionTime: Date.now() - startTime,
        steps: this.stepUpdates,
        uiCommands: uiCommands.length > 0 ? uiCommands : undefined,
      }
    } catch (error) {
      console.error("Orchestrator error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("Error details:", errorMessage)
      
      this.addStepUpdate({
        type: "complete",
        message: `✗ Error: ${errorMessage}`,
      })

      // Still collect any UI commands even on error
      const uiCommands = this.uiControllerAgent.getPendingCommands()
      
      return {
        success: false,
        response: "I apologize, but I encountered an error while processing your request. Please try again.",
        tasks,
        totalTokens,
        uiCommands: uiCommands.length > 0 ? uiCommands : undefined,
        executionTime: Date.now() - startTime,
        steps: this.stepUpdates,
      }
    }
  }

  /**
   * Upload base64 images to Supabase storage
   */
  private async uploadImages(base64Images: string[]): Promise<string[]> {
    const supabase = await createClient()
    const uploadedUrls: string[] = []

    for (let i = 0; i < base64Images.length; i++) {
      try {
        const base64Data = base64Images[i].includes("base64,")
          ? base64Images[i].split(",")[1]
          : base64Images[i]

        // Detect image type from base64 prefix
        const mimeMatch = base64Images[i].match(/data:image\/(\w+);/)
        const ext = mimeMatch ? mimeMatch[1] : "png"

        const buffer = Buffer.from(base64Data, "base64")
        const fileName = `assistant-upload-${Date.now()}-${i}.${ext}`
        const filePath = `${this.userId}/${fileName}`

        const { data, error } = await supabase.storage
          .from("products")
          .upload(filePath, buffer, {
            contentType: `image/${ext}`,
            upsert: false,
          })

        if (error) {
          console.error("Failed to upload image:", error)
          continue
        }

        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath)

        uploadedUrls.push(urlData.publicUrl)
      } catch (error) {
        console.error("Error uploading image:", error)
      }
    }

    return uploadedUrls
  }

  /**
   * Execute an execution plan, handling dependencies
   */
  private async executePlan(
    plan: ExecutionPlan,
    imageUrls?: string[],
    pageContext?: any
  ): Promise<{ tasks: AgentTask[]; tokensUsed: number }> {
    const tasks: AgentTask[] = []
    let tokensUsed = 0
    const results: Map<string, any> = new Map()

    // Group steps by their dependencies
    const pendingSteps = [...plan.steps]
    const completedSteps: Set<string> = new Set()
    const totalSteps = plan.steps.length
    let currentStepNum = 0

    while (pendingSteps.length > 0) {
      // Find steps that can be executed (all dependencies met)
      const readySteps = pendingSteps.filter((step) =>
        step.dependsOn.every((depId) => completedSteps.has(depId))
      )

      if (readySteps.length === 0 && pendingSteps.length > 0) {
        // Circular dependency or missing dependency
        throw new Error("Unable to resolve step dependencies")
      }

      // Execute ready steps in parallel
      const stepResults = await Promise.all(
        readySteps.map(async (step) => {
          currentStepNum++
          this.addStepUpdate({
            type: "executing",
            step: currentStepNum,
            totalSteps,
            agentName: step.agent,
            action: step.action,
            message: `Executing ${step.agent} agent: ${this.getActionDescription(step.action)}`,
          })

          const agent = this.getAgent(step.agent)

          // Set up progress callback for bulk operations
          if (step.action.startsWith("bulk_")) {
            // Check if agent has setProgressCallback method (only BaseAgent subclasses have it)
            if ('setProgressCallback' in agent && typeof agent.setProgressCallback === 'function') {
              agent.setProgressCallback((progress) => {
                this.addStepUpdate({
                  type: "executing",
                  step: currentStepNum,
                  totalSteps,
                  agentName: step.agent,
                  action: step.action,
                  message: `${progress.item.name}: ${progress.item.status === "done" ? "✓" : progress.item.status === "failed" ? "✗" : "⟳"} (${progress.current}/${progress.total})`,
                  bulkProgress: progress,
                })
              })
            }
          }

          // Inject results from dependencies and context
          let enrichedParams = this.enrichParams(step.params, results, pageContext)

          // Inject uploaded images if needed - ALWAYS override placeholder values
          if (imageUrls && imageUrls.length > 0) {
            // Check if this action needs images
            const needsImages = 
              step.action.includes("image") || 
              step.action.includes("analyze") || 
              step.action.includes("generate") || 
              step.action.includes("process") || 
              step.action.includes("background") ||
              step.action.includes("lifestyle") ||
              step.action.includes("bulk") ||
              step.action.includes("social");

            if (needsImages) {
              // Check if existing imageUrls are valid URLs or just placeholders
              const existingUrls = enrichedParams.imageUrls
              const hasValidUrls = Array.isArray(existingUrls) && 
                existingUrls.length > 0 && 
                existingUrls.every((url: string) => typeof url === 'string' && url.startsWith('http'))

              // Always use the actual uploaded URLs, not placeholders
              enrichedParams = {
                ...enrichedParams,
                imageUrls: hasValidUrls ? existingUrls : imageUrls,
                sourceImages: hasValidUrls ? existingUrls : imageUrls,
              }
            }
          }

          const result = await agent.execute(step.action, enrichedParams)

          // Clean up progress callback (only for agents that have it)
          if ('setProgressCallback' in agent && typeof agent.setProgressCallback === 'function') {
            agent.setProgressCallback(null)
          }

          // If this is a UI controller action, get the command for immediate streaming
          const uiCommand = step.agent === "ui_controller" 
            ? this.uiControllerAgent.getLastCommand() 
            : undefined

          this.addStepUpdate({
            type: "executing",
            step: currentStepNum,
            totalSteps,
            agentName: step.agent,
            action: step.action,
            message: result.success 
              ? `✓ ${this.getActionDescription(step.action)} completed` 
              : `✗ ${this.getActionDescription(step.action)} failed: ${result.error}`,
            data: result.success ? result.data : undefined,
            uiCommand, // Include UI command for immediate client-side execution
          })

          return {
            step,
            result,
          }
        })
      )

      // Process results
      for (const { step, result } of stepResults) {
        results.set(step.id, result.data)
        completedSteps.add(step.id)
        tokensUsed += result.tokensUsed || 0

        // Remove from pending
        const idx = pendingSteps.findIndex((s) => s.id === step.id)
        if (idx !== -1) pendingSteps.splice(idx, 1)

        // If this was a batch_process action that succeeded, emit UI command with results
        if (step.action === 'batch_process' && result.success && result.data?.results) {
          await this.uiControllerAgent.execute('update_processing_results', {
            results: result.data.results,
            errors: result.data.errors || [],
          })
          // Stream the update_processing_results command immediately
          const updateCommand = this.uiControllerAgent.getLastCommand()
          if (updateCommand) {
            this.addStepUpdate({
              type: "executing",
              agentName: "ui_controller",
              action: "update_processing_results",
              message: "Updating processing results in UI",
              uiCommand: updateCommand,
            })
          }
        }

        // Create task record
        tasks.push({
          id: step.id,
          agent: step.agent,
          taskType: step.action,
          status: result.success ? "completed" : "failed",
          input: step.params,
          output: result.data,
          error: result.error,
          createdAt: new Date(),
          completedAt: new Date(),
        })
      }
    }

    return { tasks, tokensUsed }
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      batch_process: "Batch processing images",
      remove_background: "Removing backgrounds",
      generate_image: "Generating image",
      generate_lifestyle: "Creating lifestyle shot",
      generate_model_shot: "Creating model shot",
      generate_showcase: "Generating showcase variations",
      show_notification: "Showing notification",
      navigate_to: "Navigating",
      upload_images: "Uploading images",
      update_product_details: "Updating product details",
      create_product: "Creating product",
      search_products: "Searching products",
      start_bulk_processing: "Starting bulk processing",
      open_modal: "Opening modal",
      refresh_page: "Refreshing page",
      select_images: "Selecting images",
    }
    return descriptions[action] || action.replace(/_/g, " ")
  }

  /**
   * Get the appropriate agent for a task
   */
  private getAgent(agentType: AgentType) {
    switch (agentType) {
      case "manager":
        return this.managerAgent
      case "product":
        return this.productAgent
      case "photographer":
        return this.photographerAgent
      case "marketer":
        return this.marketerAgent
      case "analyst":
        return this.analystAgent
      case "video":
        return this.videoAgent
      case "ui_controller":
        return this.uiControllerAgent
      default:
        throw new Error(`Unknown agent type: ${agentType}`)
    }
  }

  /**
   * Enrich parameters with results from previous steps and context
   */
  private enrichParams(
    params: Record<string, any>,
    results: Map<string, any>,
    context?: any
  ): Record<string, any> {
    const enriched = { ...params }

    for (const [key, value] of Object.entries(enriched)) {
      // Handle $context: references (from page context)
      if (typeof value === "string" && value.startsWith("$context:")) {
        const path = value.substring(9) // Remove "$context:" prefix
        if (context) {
          const resolvedValue = this.getNestedValue(context, path)
          if (resolvedValue !== undefined) {
            enriched[key] = resolvedValue
          }
        }
      }
      // Handle $step: references (from previous step results)
      else if (typeof value === "string" && value.startsWith("$step:")) {
        const [, stepId, path] = value.match(/^\$step:(\w+)\.(.+)$/) || []
        if (stepId && results.has(stepId)) {
          const stepResult = results.get(stepId)
          let resolvedValue = this.getNestedValue(stepResult, path)
          
          // Special handling for 'images' key - extract URLs from image objects
          if (key === "images" && Array.isArray(resolvedValue)) {
            resolvedValue = resolvedValue.map((img: any) => 
              typeof img === "string" ? img : img.url || img.generated_url || img
            )
          }
          
          enriched[key] = resolvedValue
        }
      } else if (Array.isArray(value)) {
        // Handle arrays that might contain $step or $context references
        enriched[key] = value.map((item: any) => {
          if (typeof item === "string" && item.startsWith("$context:")) {
            const path = item.substring(9)
            if (context) {
              const resolved = this.getNestedValue(context, path)
              return resolved !== undefined ? resolved : item
            }
          } else if (typeof item === "string" && item.startsWith("$step:")) {
            const [, stepId, path] = item.match(/^\$step:(\w+)\.(.+)$/) || []
            if (stepId && results.has(stepId)) {
              const stepResult = results.get(stepId)
              return this.getNestedValue(stepResult, path)
            }
          }
          return item
        })
      }
    }

    return enriched
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  /**
   * Check if any action requires user confirmation
   */
  private checkConfirmationRequired(
    plan: ExecutionPlan | null
  ): ConfirmationRequest | null {
    if (!plan) return null

    for (const step of plan.steps) {
      // Check for confirmation-required actions
      if (CONFIRMATION_REQUIRED_ACTIONS.includes(step.action)) {
        return {
          action: step.action,
          description: this.getStepDescription(step),
          impact: this.getActionImpact(step),
          requiresConfirmation: true,
          affectedItems: this.getAffectedItemsCount(step),
        }
      }

      // Check for cost thresholds
      if (step.action === "generate_images" && step.params.count > COST_THRESHOLDS.imageCount) {
        return {
          action: step.action,
          description: `Generate ${step.params.count} images`,
          impact: `This will use ${step.params.count} image generation credits`,
          requiresConfirmation: true,
          estimatedCost: step.params.count * 0.01, // Estimated cost per image
        }
      }
    }

    return null
  }

  private getStepDescription(step: ExecutionStep): string {
    const descriptions: Record<string, string> = {
      delete_product: "Delete a product",
      delete_products_bulk: `Delete ${step.params?.productIds?.length || "multiple"} products`,
      update_prices_bulk: `Update prices for ${step.params?.productIds?.length || "multiple"} products`,
      publish_campaign: "Publish a marketing campaign",
      send_notification: "Send a notification to customers",
      publish_products_bulk: `Publish ${step.params?.productIds?.length || "multiple"} products`,
    }
    return descriptions[step.action] || step.action
  }

  private getActionImpact(step: ExecutionStep): string {
    const impacts: Record<string, string> = {
      delete_product: "This action cannot be undone",
      delete_products_bulk: "This action cannot be undone and will remove all associated data",
      update_prices_bulk: "This will change prices visible to customers",
      publish_campaign: "This will send content to your audience",
      send_notification: "This will send messages to customers",
      publish_products_bulk: "Products will become visible in your store",
    }
    return impacts[step.action] || "This action may have significant effects"
  }

  private getAffectedItemsCount(step: ExecutionStep): number | undefined {
    if (step.params?.productIds) {
      return step.params.productIds.length
    }
    if (step.params?.ids) {
      return step.params.ids.length
    }
    return undefined
  }
}

// Factory function for creating orchestrator
export function createOrchestrator(userId: string, adminName?: string): TaskOrchestrator {
  return new TaskOrchestrator(userId, adminName)
}
