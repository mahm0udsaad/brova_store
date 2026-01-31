// Agent Types and Interfaces for the AI Manager Assistant

export type AgentType = "manager" | "product" | "photographer" | "marketer" | "analyst" | "video" | "ui_controller"

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled"

export interface PageContext {
  pageName: string
  pageType: "dashboard" | "products" | "orders" | "media" | "marketing" | "bulk-deals" | "insights" | "appearance" | "settings"
  selectedItems: string[]
  filters: Record<string, any>
  capabilities: string[]
  // Available images that the user has uploaded or processed on this page
  availableImages?: string[]
  // Additional context data (e.g., processed results, batch info)
  contextData?: Record<string, any>
}

export interface AgentTask {
  id: string
  agent: AgentType
  taskType: string
  status: TaskStatus
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  parentTaskId?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  metadata?: Record<string, any>
}

export interface AgentMessage {
  role: "user" | "assistant" | "system" | "tool"
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
}

export interface ToolResult {
  toolCallId: string
  result: any
  error?: string
}

export interface AgentCapabilities {
  canRead: string[]      // Tables/resources it can read
  canWrite: string[]     // Tables/resources it can write
  canExecute: string[]   // Actions it can perform
  forbidden: string[]    // Explicitly forbidden actions
}

export interface AgentConfig {
  type: AgentType
  name: string
  description: string
  systemPrompt: string
  capabilities: AgentCapabilities
  tools: string[]
  maxOutputTokens?: number
}

// Agent-specific tool types
export interface ProductSearchParams {
  query?: string
  category?: string
  priceMin?: number
  priceMax?: number
  published?: boolean
  limit?: number
}

export interface ProductCreateParams {
  name: string
  description?: string
  price?: number
  categoryId?: string
  images?: string[]
  sizes?: string[]
  published?: boolean
}

export interface ProductUpdateParams {
  id?: string
  productId?: string
  name?: string
  description?: string
  price?: number
  categoryId?: string
  images?: string[]
  sizes?: string[]
  published?: boolean
}

export interface ImageGenerateParams {
  prompt: string
  sourceImages?: string[]
  style?: "clean" | "lifestyle" | "studio" | "urban"
  imageSize?: string
}

export interface BackgroundRemoveParams {
  imageUrl: string
}

export interface CampaignCreateParams {
  name: string
  type: "email" | "sms" | "instagram" | "facebook" | "general"
  content: {
    subject?: string
    body?: string
    caption?: string
  }
  products?: string[]
  schedule?: {
    scheduledAt?: string
    timezone?: string
  }
}

export interface AnalyticsQueryParams {
  metric: "orders" | "revenue" | "products" | "customers"
  period: "day" | "week" | "month" | "year"
  startDate?: string
  endDate?: string
  groupBy?: string
}

// Execution plan for complex tasks
export interface ExecutionStep {
  id: string
  agent: AgentType
  action: string
  params: Record<string, any>
  dependsOn: string[]  // IDs of steps this depends on
  status: TaskStatus
  result?: any
  error?: string
}

export interface ExecutionPlan {
  id: string
  request: string
  steps: ExecutionStep[]
  currentStep: number
  status: TaskStatus
  startedAt: Date
  completedAt?: Date
}

// Cost control types
export interface UsageLimits {
  imageGeneration: number
  textTokens: number
  screenshotAnalysis: number
  bulkBatches: number
}

export interface UsageTracking {
  operation: string
  count: number
  tokensUsed: number
  costEstimate: number
  date: string
}

// Confirmation requirements
export interface ConfirmationRequest {
  action: string
  description: string
  impact: string
  requiresConfirmation: boolean
  estimatedCost?: number
  affectedItems?: number
}

// Result types
export interface AgentResult {
  success: boolean
  message: string
  data?: any
  error?: string
  tokensUsed?: number
  toolsUsed?: string[]
  confirmationRequired?: ConfirmationRequest
}

export interface BulkProgressUpdate {
  type: "bulk_progress"
  operationId: string
  operationLabel: string
  current: number
  total: number
  item: {
    id: string
    name: string
    status: "pending" | "updating" | "done" | "failed"
    error?: string
  }
  completedItems: Array<{ id: string; name: string; status: "done" | "failed"; error?: string }>
}

export interface StepUpdate {
  type: "planning" | "executing" | "synthesizing" | "complete"
  step?: number
  totalSteps?: number
  agentName?: string
  action?: string
  message: string
  data?: any
  bulkProgress?: BulkProgressUpdate // Real-time bulk operation progress
  uiCommand?: UICommandResult // UI command to execute immediately on client
}

// UI Commands that can be sent to the client
export interface UICommandResult {
  type: string
  action?: string
  path?: string
  message?: string
  variant?: string
  params?: Record<string, any>
  [key: string]: any
}

export interface OrchestratorResult {
  success: boolean
  response: string
  tasks: AgentTask[]
  totalTokens: number
  executionTime: number
  confirmationRequired?: ConfirmationRequest
  steps?: StepUpdate[] // For visualizing the thinking process
  uiCommands?: UICommandResult[] // Commands for client-side UI updates
}
