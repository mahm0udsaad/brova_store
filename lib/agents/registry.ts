import { type ZodSchema, z } from "zod"
import type { AgentType } from "./types"

/**
 * Agent descriptor with metadata and schemas
 */
export interface AgentDescriptor {
  type: AgentType | "bulk_deals"
  name: string
  description: string
  model: "pro" | "flash" | "vision"
  inputSchema: ZodSchema
  outputSchema: ZodSchema
  capabilities: string[]
}

/**
 * Agent registry - plugin system for agents
 */
class AgentRegistry {
  private agents = new Map<AgentType | "bulk_deals", AgentDescriptor>()

  /**
   * Register an agent
   */
  register(descriptor: AgentDescriptor): void {
    this.agents.set(descriptor.type, descriptor)
    console.log(`Registered agent: ${descriptor.type}`)
  }

  /**
   * Get agent descriptor
   */
  get(type: AgentType | "bulk_deals"): AgentDescriptor | undefined {
    return this.agents.get(type)
  }

  /**
   * Check if agent exists
   */
  has(type: AgentType | "bulk_deals"): boolean {
    return this.agents.has(type)
  }

  /**
   * Get all registered agents
   */
  getAll(): AgentDescriptor[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get agents by capability
   */
  getByCapability(capability: string): AgentDescriptor[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.capabilities.includes(capability)
    )
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry()

// Base schemas for common structures
export const baseInputSchema = z.object({
  action: z.string(),
  params: z.record(z.any()),
  context: z.object({
    merchantId: z.string(),
    locale: z.enum(["en", "ar"]).optional(),
  }),
})

export const baseOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
})

// Register default agents
const defaultAgents: Omit<AgentDescriptor, "inputSchema" | "outputSchema">[] = [
  {
    type: "manager",
    name: "Manager Agent",
    description: "Orchestrates tasks and delegates to worker agents",
    model: "pro",
    capabilities: ["analyze", "plan", "delegate", "synthesize"],
  },
  {
    type: "product",
    name: "Product Agent",
    description: "Manages products, inventory, and descriptions",
    model: "flash",
    capabilities: [
      "search_products",
      "get_product",
      "create_product",
      "update_product",
      "delete_product",
      "generate_description",
      "suggest_pricing",
      "update_inventory",
      "update_stock_quantity",
      "bulk_update_stock_quantity",
    ],
  },
  {
    type: "photographer",
    name: "Photographer Agent",
    description: "Generates and processes product images",
    model: "flash",
    capabilities: [
      "generate_image",
      "remove_background",
      "generate_showcase",
      "generate_lifestyle",
      "generate_model_shot",
      "batch_process",
    ],
  },
  {
    type: "marketer",
    name: "Marketer Agent",
    description: "Creates marketing content and campaigns",
    model: "flash",
    capabilities: ["generate_caption", "generate_email", "generate_hashtags", "create_campaign"],
  },
  {
    type: "analyst",
    name: "Analyst Agent",
    description: "Analyzes sales, products, and customer data",
    model: "flash",
    capabilities: ["get_sales_summary", "get_top_products", "analyze_trends"],
  },
  {
    type: "video",
    name: "Video Agent",
    description: "Suggests video concepts and scripts",
    model: "flash",
    capabilities: ["suggest_concept", "generate_script", "recommend_style"],
  },
  {
    type: "ui_controller",
    name: "UI Controller Agent",
    description: "Controls UI interactions and navigation",
    model: "flash",
    capabilities: ["navigate", "show_notification", "open_modal", "upload_images"],
  },
]

// Register agents with base schemas
defaultAgents.forEach((agent) => {
  agentRegistry.register({
    ...agent,
    inputSchema: baseInputSchema,
    outputSchema: baseOutputSchema,
  })
})

// Register bulk deals agent
agentRegistry.register({
  type: "bulk_deals",
  name: "Bulk Deals Agent",
  description: "Handles batch image processing and product creation",
  model: "flash",
  capabilities: ["process_batch", "group_images", "create_products_from_batch"],
  inputSchema: baseInputSchema,
  outputSchema: baseOutputSchema,
})
