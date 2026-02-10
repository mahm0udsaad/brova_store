// APUS Layer - AI Types and Schemas
// Owner: APUS (Claude Opus - AI & Integrations Engineer)

import { z } from "zod"

// ============================================================================
// Model Configuration Types
// ============================================================================

export type AIProvider = "anthropic" | "openai" | "google" | "groq" | "elevenlabs" | "kling" | "runway"

export type ModelCapability =
  | "reasoning"      // Complex tasks, store builder, shopping assistant
  | "fast"           // Bulk operations, quick responses
  | "structured"     // JSON output, structured data
  | "embeddings"     // Vector embeddings for search
  | "image_gen"      // Image generation
  | "vision"         // Image understanding
  | "speech_to_text" // STT
  | "text_to_speech" // TTS
  | "video_gen"      // Video generation

export interface ModelConfig {
  id: string
  provider: AIProvider
  name: string
  capabilities: ModelCapability[]
  maxTokens: number
  costPer1kInput: number
  costPer1kOutput: number
  supportsStreaming: boolean
  supportsTools: boolean
  arabicQuality: "excellent" | "good" | "fair" | "poor"
}

export interface ModelRoutingConfig {
  default: string
  reasoning: string
  fast: string
  structured: string
  embeddings: string
  imageGen: string
  vision: string
  stt: string
  tts: string
  videoGen: string
  fallbackChain: string[]
}

// ============================================================================
// AI Shopping Assistant Types
// ============================================================================

export interface ShoppingAssistantContext {
  storeId: string
  storeName: string
  storeLocale: "ar" | "en"
  currency: string
  customerSessionId?: string
  customerId?: string
  conversationHistory: ConversationMessage[]
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  language: "ar" | "en"
  toolCalls?: AIToolCall[]
  toolResults?: AIToolResult[]
}

export interface AIToolCall {
  id: string
  name: AIToolName
  arguments: Record<string, unknown>
}

export interface AIToolResult {
  toolCallId: string
  success: boolean
  data?: unknown
  error?: string
}

// Shopping Assistant Tool Names
export type AIToolName =
  | "showProducts"
  | "addToCart"
  | "removeFromCart"
  | "updateCartQuantity"
  | "compareProducts"
  | "showCategories"
  | "getOrderStatus"
  | "suggestProducts"
  | "searchProducts"
  | "getProductDetails"
  | "applyDiscount"
  | "calculateShipping"
  | "getStoreInfo"

// Tool Schemas
export const showProductsSchema = z.object({
  query: z.string().optional().describe("Search query in Arabic or English"),
  categoryId: z.string().optional().describe("Category ID to filter by"),
  limit: z.number().min(1).max(20).default(6).describe("Number of products to show"),
  sortBy: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
})

export const addToCartSchema = z.object({
  productId: z.string().describe("Product ID to add"),
  quantity: z.number().min(1).default(1).describe("Quantity to add"),
  variantId: z.string().optional().describe("Variant ID if applicable"),
  size: z.string().optional().describe("Size selection"),
  color: z.string().optional().describe("Color selection"),
})

export const compareProductsSchema = z.object({
  productIds: z.array(z.string()).min(2).max(4).describe("Product IDs to compare"),
})

export const getOrderStatusSchema = z.object({
  orderId: z.string().optional().describe("Order ID to check"),
  phoneNumber: z.string().optional().describe("Phone number to lookup orders"),
})

export const suggestProductsSchema = z.object({
  context: z.string().describe("Context for suggestions (e.g., 'looking for a gift')"),
  budget: z.number().optional().describe("Maximum budget"),
  preferences: z.array(z.string()).optional().describe("User preferences"),
})

// Tool Response Types (what UI components receive)
export interface ProductCardData {
  id: string
  name: string
  nameAr?: string
  price: number
  originalPrice?: number
  currency: string
  image: string
  images?: string[]
  rating?: number
  reviewCount?: number
  inStock: boolean
  sizes?: string[]
  colors?: string[]
  category: string
  description?: string
  descriptionAr?: string
}

export interface CartConfirmationData {
  success: boolean
  message: string
  messageAr: string
  cartItemCount: number
  cartTotal: number
  addedProduct: ProductCardData
}

export interface ComparisonTableData {
  products: ProductCardData[]
  attributes: ComparisonAttribute[]
}

export interface ComparisonAttribute {
  name: string
  nameAr: string
  values: Record<string, string | number | boolean>
}

export interface OrderTrackerData {
  orderId: string
  status: OrderStatus
  statusHistory: OrderStatusEvent[]
  estimatedDelivery?: Date
  trackingNumber?: string
  carrier?: string
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"

export interface OrderStatusEvent {
  status: OrderStatus
  timestamp: Date
  location?: string
  note?: string
}

// ============================================================================
// AI Store Builder Types
// ============================================================================

export interface StoreBuilderContext {
  storeId: string
  merchantId: string
  locale: "ar" | "en"
  currentTheme?: ThemeConfiguration
  availableTemplates: TemplateInfo[]
}

export interface ThemeConfiguration {
  id: string
  name: string
  templateId: string
  colors: ThemeColors
  typography: ThemeTypography
  components: ComponentNode[]
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  error: string
  success: string
  warning: string
}

export interface ThemeTypography {
  headingFont: string
  bodyFont: string
  arabicFont: string
  baseFontSize: number
  headingWeight: number
  bodyWeight: number
}

export interface ComponentNode {
  id: string
  type: ComponentType
  config: Record<string, unknown>
  children?: ComponentNode[]
  order: number
  visible: boolean
}

export type ComponentType =
  | "HeroBanner"
  | "ProductGrid"
  | "ProductCarousel"
  | "ProductDetail"
  | "CategoryBrowser"
  | "Testimonials"
  | "NewsletterSignup"
  | "FeaturedCollections"
  | "StoreInfo"
  | "ShippingCalculator"
  | "CartDrawer"
  | "CheckoutFlow"
  | "StoreHeader"
  | "StoreFooter"
  | "AIShoppingAssistant"
  | "CustomHTML"
  | "ImageBanner"
  | "TextSection"
  | "VideoSection"
  | "SocialFeed"
  | "CountdownTimer"
  | "TrustBadges"

export interface TemplateInfo {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  category: "fashion" | "electronics" | "general" | "food" | "beauty" | "home"
  thumbnail: string
  previewUrl: string
}

// Store Builder Tool Names
export type StoreBuilderToolName =
  | "addComponent"
  | "removeComponent"
  | "updateComponent"
  | "reorderComponents"
  | "updateThemeColors"
  | "updateTypography"
  | "selectTemplate"
  | "previewStore"
  | "publishStore"

// Store Builder Tool Schemas
export const addComponentSchema = z.object({
  sectionId: z.string().describe("Section to add component to"),
  type: z.string().describe("Component type"),
  config: z.record(z.unknown()).default({}).describe("Component configuration"),
  position: z.number().optional().describe("Position in section"),
})

export const updateComponentSchema = z.object({
  componentId: z.string().describe("Component ID to update"),
  updates: z.record(z.unknown()).describe("Configuration updates"),
})

export const reorderComponentsSchema = z.object({
  sectionId: z.string().describe("Section containing components"),
  newOrder: z.array(z.string()).describe("New order of component IDs"),
})

export const updateThemeColorsSchema = z.object({
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    surface: z.string().optional(),
    text: z.string().optional(),
  }).describe("Color updates"),
})

// ============================================================================
// Voice Commerce Types
// ============================================================================

export interface VoiceConfig {
  sttProvider: "groq"
  sttModel: "whisper-large-v3" | "whisper-large-v3-turbo"
  ttsProvider: "elevenlabs" | "lahajati"
  ttsVoiceId: string
  ttsModel: "eleven_flash_v2_5" | "eleven_multilingual_v2"
  language: "ar" | "en" | "auto"
  dialectSupport: boolean
}

export interface STTRequest {
  audio: Blob | ArrayBuffer
  language?: "ar" | "en" | "auto"
  detectDialect?: boolean
}

export interface STTResponse {
  text: string
  language: "ar" | "en"
  confidence: number
  dialect?: string
  segments?: STTSegment[]
  duration: number
}

export interface STTSegment {
  start: number
  end: number
  text: string
  confidence: number
}

export interface TTSRequest {
  text: string
  voiceId: string
  model?: string
  language?: "ar" | "en"
  speed?: number
  stability?: number
  similarityBoost?: number
}

export interface TTSResponse {
  audio: ArrayBuffer
  contentType: string
  duration: number
}

export interface VoiceSessionState {
  sessionId: string
  storeId: string
  isRecording: boolean
  isProcessing: boolean
  isSpeaking: boolean
  transcription?: string
  aiResponse?: string
  error?: string
}

// ============================================================================
// Video Generation Types
// ============================================================================

export type VideoProvider = "kling" | "runway"

export interface VideoGenerationConfig {
  provider: VideoProvider
  model: string
  maxDuration: number
  supportedAspectRatios: AspectRatio[]
}

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3"

export interface VideoGenerationRequest {
  storeId: string
  type: "text_to_video" | "image_to_video"
  prompt: string
  promptAr?: string
  sourceImage?: string
  aspectRatio: AspectRatio
  duration: number // seconds
  style?: VideoStyle
  addTextOverlay?: TextOverlayConfig
}

export type VideoStyle =
  | "cinematic"
  | "commercial"
  | "minimal"
  | "dynamic"
  | "elegant"
  | "playful"

export interface TextOverlayConfig {
  text: string
  textAr?: string
  position: "top" | "center" | "bottom"
  font: string
  fontSize: number
  color: string
  backgroundColor?: string
  animation?: "fade" | "slide" | "none"
}

export interface VideoGenerationTask {
  id: string
  storeId: string
  status: VideoTaskStatus
  provider: VideoProvider
  request: VideoGenerationRequest
  progress?: number
  resultUrl?: string
  thumbnailUrl?: string
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  expiresAt?: Date
}

export type VideoTaskStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "expired"

// ============================================================================
// Social Media Integration Types
// ============================================================================

export type SocialPlatform = "tiktok" | "instagram" | "facebook" | "twitter"

export interface SocialMediaConnection {
  id: string
  storeId: string
  platform: SocialPlatform
  accountId: string
  accountName: string
  accessToken: string // Encrypted
  refreshToken?: string // Encrypted
  tokenExpiresAt: Date
  scopes: string[]
  isActive: boolean
  connectedAt: Date
  lastSyncAt?: Date
}

export interface SocialMediaPost {
  id: string
  storeId: string
  connectionId: string
  platform: SocialPlatform
  content: PostContent
  mediaUrls: string[]
  status: PostStatus
  scheduledAt?: Date
  publishedAt?: Date
  platformPostId?: string
  platformUrl?: string
  metrics?: PostMetrics
  error?: string
  createdAt: Date
}

export interface PostContent {
  caption: string
  captionAr?: string
  hashtags: string[]
  ctaText?: string
  ctaUrl?: string
}

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"

export interface PostMetrics {
  views: number
  likes: number
  comments: number
  shares: number
  clicks: number
  reach: number
  engagement: number
  fetchedAt: Date
}

export interface OAuthConfig {
  platform: SocialPlatform
  clientId: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  redirectUri: string
}

export interface OAuthCallbackParams {
  code: string
  state: string
  platform: SocialPlatform
}

// ============================================================================
// Bulk AI Operations Types
// ============================================================================

export type BulkOperationType =
  | "description_generation"
  | "translation"
  | "seo_generation"
  | "alt_text_generation"
  | "categorization"
  | "price_suggestion"

export interface BulkOperationRequest {
  storeId: string
  type: BulkOperationType
  itemIds: string[]
  options: BulkOperationOptions
}

export interface BulkOperationOptions {
  model?: string
  batchSize?: number
  targetLanguage?: "ar" | "en"
  tone?: "professional" | "casual" | "luxurious" | "friendly"
  includeEmojis?: boolean
  maxLength?: number
}

export interface BulkOperationTask {
  id: string
  storeId: string
  type: BulkOperationType
  status: BulkOperationStatus
  totalItems: number
  processedItems: number
  successCount: number
  failedCount: number
  results: BulkItemResult[]
  error?: string
  startedAt: Date
  completedAt?: Date
}

export type BulkOperationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"

export interface BulkItemResult {
  itemId: string
  success: boolean
  result?: unknown
  error?: string
  tokensUsed?: number
}

// ============================================================================
// Web Scraping / Store Migration Types
// ============================================================================

export interface StoreMigrationRequest {
  storeId: string
  sourceUrl: string
  sourcePlatform?: "salla" | "shopify" | "woocommerce" | "other"
  options: MigrationOptions
}

export interface MigrationOptions {
  importProducts: boolean
  importCategories: boolean
  importImages: boolean
  preserveArabic: boolean
  enhanceDescriptions: boolean
  translateMissing: boolean
}

export interface StoreMigrationTask {
  id: string
  storeId: string
  sourceUrl: string
  status: MigrationStatus
  progress: MigrationProgress
  results?: MigrationResults
  error?: string
  startedAt: Date
  completedAt?: Date
}

export type MigrationStatus =
  | "analyzing"
  | "scraping"
  | "processing"
  | "importing"
  | "completed"
  | "failed"

export interface MigrationProgress {
  stage: MigrationStatus
  current: number
  total: number
  message: string
  messageAr: string
}

export interface MigrationResults {
  productsImported: number
  categoriesImported: number
  imagesImported: number
  errors: MigrationError[]
}

export interface MigrationError {
  type: "product" | "category" | "image"
  itemId?: string
  message: string
}

// ============================================================================
// AI Usage & Billing Types
// ============================================================================

export interface AIUsageLog {
  id: string
  storeId: string
  merchantId: string
  model: string
  provider: AIProvider
  operation: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  cost: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface AIUsageSummary {
  storeId: string
  period: "day" | "week" | "month"
  totalCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  byModel: Record<string, ModelUsage>
  byOperation: Record<string, OperationUsage>
}

export interface ModelUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  cost: number
}

export interface OperationUsage {
  calls: number
  avgLatencyMs: number
  successRate: number
  cost: number
}

export interface MerchantAIConfig {
  storeId: string
  useBYOK: boolean
  apiKeys?: {
    anthropic?: string
    openai?: string
    google?: string
  }
  usageLimits: {
    dailyTokenLimit: number
    monthlyTokenLimit: number
    dailyCostLimit: number
    monthlyCostLimit: number
  }
  preferences: {
    preferredModel?: string
    preferLocalModels?: boolean
    enableVoice: boolean
    enableVideo: boolean
  }
}

// ============================================================================
// Export all schemas for runtime validation
// ============================================================================

export const AISchemas = {
  showProducts: showProductsSchema,
  addToCart: addToCartSchema,
  compareProducts: compareProductsSchema,
  getOrderStatus: getOrderStatusSchema,
  suggestProducts: suggestProductsSchema,
  addComponent: addComponentSchema,
  updateComponent: updateComponentSchema,
  reorderComponents: reorderComponentsSchema,
  updateThemeColors: updateThemeColorsSchema,
}
