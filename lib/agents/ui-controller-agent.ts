import type { AgentResult, UICommandResult } from "./types"
import type { AICommand } from "./ui-commands"

export class UIControllerAgent {
  private userId: string
  private pendingCommands: AICommand[] = []

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Get pending UI commands (to be sent to client)
   */
  getPendingCommands(): AICommand[] {
    const commands = [...this.pendingCommands]
    this.pendingCommands = []
    return commands
  }

  /**
   * Get the last command created (for immediate streaming)
   */
  getLastCommand(): UICommandResult | undefined {
    return this.pendingCommands[this.pendingCommands.length - 1]
  }

  /**
   * Execute a UI control action
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    switch (action) {
      case "navigate_to":
        return this.navigateTo(params.path, params.options)
      case "upload_images":
        return this.uploadImages(params.imageUrls)
      case "start_showcase_generation":
        return this.startShowcaseGeneration(params.imageUrls)
      case "start_bulk_processing":
        return this.startBulkProcessing(params.imageUrls, params.operations)
      case "update_processing_results":
        return this.updateProcessingResults(params.results, params.errors)
      case "update_product_details":
        return this.updateProductDetails(params)
      case "show_notification":
        return this.showNotification(params.message, params.variant)
      case "open_modal":
        return this.openModal(params.modalType, params.data)
      case "select_images":
        return this.selectImages(params.imageIds)
      case "refresh_page":
        return this.refreshPage(params.dataType)
      default:
        return {
          success: false,
          message: `Unknown action: ${action}`,
          error: "Invalid action",
        }
    }
  }

  /**
   * Navigate to a page
   */
  private async navigateTo(path: string, params?: Record<string, any>): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "navigate",
        path,
        params,
      })

      return {
        success: true,
        message: `Navigating to ${path}`,
        data: { path, params },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to navigate",
        error: error.message,
      }
    }
  }

  /**
   * Trigger image upload UI
   */
  private async uploadImages(imageUrls: string[]): Promise<AgentResult> {
    try {
      // This would typically trigger a file upload dialog or process pre-provided URLs
      await this.createCommand({
        type: "trigger_action",
        action: "upload_images",
        params: { imageUrls },
      })

      return {
        success: true,
        message: `Uploading ${imageUrls.length} images`,
        data: { imageUrls, count: imageUrls.length },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to upload images",
        error: error.message,
      }
    }
  }

  /**
   * Start showcase generation for images
   */
  private async startShowcaseGeneration(imageUrls: string[]): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "trigger_action",
        action: "generate_showcase",
        params: { imageUrls },
      })

      return {
        success: true,
        message: `Starting showcase generation for ${imageUrls.length} images`,
        data: { imageUrls, count: imageUrls.length },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to start showcase generation",
        error: error.message,
      }
    }
  }

  /**
   * Start bulk processing with UI visualization
   */
  private async startBulkProcessing(imageUrls: string[], operations: string[]): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "trigger_action",
        action: "start_bulk_processing",
        params: { imageUrls, operations },
      })

      return {
        success: true,
        message: `Starting bulk processing for ${imageUrls.length} images with operations: ${operations.join(", ")}`,
        data: { imageUrls, operations, count: imageUrls.length },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to start bulk processing",
        error: error.message,
      }
    }
  }

  /**
   * Update processing results with actual processed image URLs
   */
  private async updateProcessingResults(results: any[], errors: any[]): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "trigger_action",
        action: "update_processing_results",
        params: { results, errors },
      })

      return {
        success: true,
        message: `Updated processing results: ${results.length} successful, ${errors.length} failed`,
        data: { results, errors },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update processing results",
        error: error.message,
      }
    }
  }

  /**
   * Update product details in the UI
   */
  private async updateProductDetails(params: {
    title?: string
    description?: string
    price?: number
    category?: string
  }): Promise<AgentResult> {
    try {
      const commands: AICommand[] = []

      if (params.title) {
        commands.push({
          type: "fill",
          selector: 'input[name="title"], input[placeholder*="title"]',
          value: params.title,
        })
      }

      if (params.description) {
        commands.push({
          type: "fill",
          selector: 'textarea[name="description"], textarea[placeholder*="description"]',
          value: params.description,
        })
      }

      if (params.price !== undefined) {
        commands.push({
          type: "fill",
          selector: 'input[name="price"], input[type="number"]',
          value: params.price.toString(),
        })
      }

      if (params.category) {
        commands.push({
          type: "fill",
          selector: 'input[name="category"], input[placeholder*="category"]',
          value: params.category,
        })
      }

      // Create all commands
      for (const command of commands) {
        await this.createCommand(command)
      }

      return {
        success: true,
        message: "Product details updated",
        data: params,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update product details",
        error: error.message,
      }
    }
  }

  /**
   * Show a notification/toast message
   */
  private async showNotification(
    message: string,
    variant: "success" | "error" | "info" = "info"
  ): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "show_toast",
        message,
        variant,
      })

      return {
        success: true,
        message: "Notification shown",
        data: { message, variant },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to show notification",
        error: error.message,
      }
    }
  }

  /**
   * Open a modal
   */
  private async openModal(modalType: string, data?: any): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "open_modal",
        modalType,
        data,
      })

      return {
        success: true,
        message: `Opening ${modalType} modal`,
        data: { modalType, data },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to open modal",
        error: error.message,
      }
    }
  }

  /**
   * Select images in the UI
   */
  private async selectImages(imageIds: string[]): Promise<AgentResult> {
    try {
      for (const imageId of imageIds) {
        await this.createCommand({
          type: "select_image",
          imageId,
        })
      }

      return {
        success: true,
        message: `Selected ${imageIds.length} images`,
        data: { imageIds, count: imageIds.length },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to select images",
        error: error.message,
      }
    }
  }

  /**
   * Refresh page data
   */
  private async refreshPage(dataType?: string): Promise<AgentResult> {
    try {
      await this.createCommand({
        type: "refresh_data",
        dataType: dataType || "all",
      })

      return {
        success: true,
        message: "Refreshing page data",
        data: { dataType },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to refresh page",
        error: error.message,
      }
    }
  }

  /**
   * Queue a command to be sent to the client
   * Commands are collected and returned in the response for client-side execution
   */
  private async createCommand(command: AICommand): Promise<void> {
    // Queue the command for client-side execution
    this.pendingCommands.push(command)
  }
}
