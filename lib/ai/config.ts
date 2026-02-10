// APUS Layer - AI Configuration and Model Routing
// Owner: APUS (Claude Opus - AI & Integrations Engineer)

import { createGateway } from "@ai-sdk/gateway"
import type {
  ModelConfig,
  ModelRoutingConfig,
  AIProvider,
  ModelCapability,
} from "@/types/ai"

// ============================================================================
// Environment Configuration
// ============================================================================

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY ?? ""
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL ?? "https://ai-gateway.vercel.sh/v3/ai"
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ""
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? ""
const KLING_API_KEY = process.env.KLING_API_KEY ?? ""
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY ?? ""

// ============================================================================
// AI Gateway Setup
// ============================================================================

export const gateway = createGateway({
  apiKey: AI_GATEWAY_API_KEY,
  baseURL: AI_GATEWAY_URL,
})

// ============================================================================
// Model Registry
// ============================================================================

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // Anthropic Models
  "claude-sonnet-4-5": {
    id: "anthropic/claude-sonnet-4-5",
    provider: "anthropic",
    name: "Claude Sonnet 4.5",
    capabilities: ["reasoning", "structured", "vision"],
    maxTokens: 8192,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "excellent",
  },
  "claude-haiku-4-5": {
    id: "anthropic/claude-haiku-4-5",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    capabilities: ["fast", "structured"],
    maxTokens: 8192,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "good",
  },
  "claude-opus-4-5": {
    id: "anthropic/claude-opus-4-5",
    provider: "anthropic",
    name: "Claude Opus 4.5",
    capabilities: ["reasoning", "structured", "vision"],
    maxTokens: 8192,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "excellent",
  },

  // OpenAI Models
  "gpt-4o": {
    id: "openai/gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    capabilities: ["reasoning", "structured", "vision"],
    maxTokens: 4096,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "good",
  },
  "gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o Mini",
    capabilities: ["fast", "structured"],
    maxTokens: 4096,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "fair",
  },

  // Google Models
  "gemini-2.0-flash": {
    id: "google/gemini-2.0-flash",
    provider: "google",
    name: "Gemini 2.0 Flash",
    capabilities: ["fast", "structured", "vision"],
    maxTokens: 8192,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "good",
  },
  "gemini-2.5-pro": {
    id: "google/gemini-2.5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    capabilities: ["reasoning", "structured", "vision"],
    maxTokens: 8192,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
    supportsStreaming: true,
    supportsTools: true,
    arabicQuality: "good",
  },

  // Embedding Models
  "text-embedding-3-small": {
    id: "openai/text-embedding-3-small",
    provider: "openai",
    name: "Text Embedding 3 Small",
    capabilities: ["embeddings"],
    maxTokens: 8191,
    costPer1kInput: 0.00002,
    costPer1kOutput: 0,
    supportsStreaming: false,
    supportsTools: false,
    arabicQuality: "good",
  },

  // Image Generation Models
  "flux-pro-1.1-ultra": {
    id: "bfl/flux-pro-1.1-ultra",
    provider: "openai", // Routed through gateway
    name: "Flux Pro 1.1 Ultra",
    capabilities: ["image_gen"],
    maxTokens: 0,
    costPer1kInput: 0,
    costPer1kOutput: 0.06, // Per image
    supportsStreaming: false,
    supportsTools: false,
    arabicQuality: "fair", // Text in images
  },
  "imagen-4": {
    id: "google/imagen-4.0",
    provider: "google",
    name: "Imagen 4.0",
    capabilities: ["image_gen"],
    maxTokens: 0,
    costPer1kInput: 0,
    costPer1kOutput: 0.04, // Per image
    supportsStreaming: false,
    supportsTools: false,
    arabicQuality: "fair",
  },

  // Speech Models (Direct API, not through gateway)
  "whisper-large-v3": {
    id: "groq/whisper-large-v3",
    provider: "groq",
    name: "Whisper Large V3",
    capabilities: ["speech_to_text"],
    maxTokens: 0,
    costPer1kInput: 0.0001, // Per second of audio
    costPer1kOutput: 0,
    supportsStreaming: false,
    supportsTools: false,
    arabicQuality: "excellent",
  },
  "eleven-flash-v2.5": {
    id: "elevenlabs/eleven_flash_v2_5",
    provider: "elevenlabs",
    name: "ElevenLabs Flash v2.5",
    capabilities: ["text_to_speech"],
    maxTokens: 0,
    costPer1kInput: 0.00003, // Per character
    costPer1kOutput: 0,
    supportsStreaming: true,
    supportsTools: false,
    arabicQuality: "excellent",
  },

  // Video Generation Models (Direct API)
  "kling-1.6": {
    id: "kling/v1.6",
    provider: "kling" as AIProvider,
    name: "Kling AI 1.6",
    capabilities: ["video_gen"],
    maxTokens: 0,
    costPer1kInput: 0,
    costPer1kOutput: 0.1, // Per second of video
    supportsStreaming: false,
    supportsTools: false,
    arabicQuality: "poor", // Text overlay needed
  },
  "runway-gen4": {
    id: "runway/gen-4",
    provider: "runway" as AIProvider,
    name: "Runway Gen-4",
    capabilities: ["video_gen"],
    maxTokens: 0,
    costPer1kInput: 0,
    costPer1kOutput: 0.15, // Per second of video
    supportsStreaming: false,
    supportsTools: false,
    arabicQuality: "poor",
  },
}

// ============================================================================
// Model Routing Configuration
// ============================================================================

export const DEFAULT_ROUTING: ModelRoutingConfig = {
  default: "claude-sonnet-4-5",
  reasoning: "claude-sonnet-4-5",
  fast: "gemini-2.0-flash",
  structured: "gpt-4o",
  embeddings: "text-embedding-3-small",
  imageGen: "flux-pro-1.1-ultra",
  vision: "gemini-2.0-flash",
  stt: "whisper-large-v3",
  tts: "eleven-flash-v2.5",
  videoGen: "kling-1.6",
  fallbackChain: ["claude-sonnet-4-5", "gpt-4o", "gemini-2.5-pro"],
}

// ============================================================================
// Model Selection Functions
// ============================================================================

export function getModelForCapability(
  capability: ModelCapability,
  routing: ModelRoutingConfig = DEFAULT_ROUTING
): ModelConfig {
  const modelKey = routing[capability as keyof ModelRoutingConfig]
  if (typeof modelKey === "string" && MODEL_REGISTRY[modelKey]) {
    return MODEL_REGISTRY[modelKey]
  }
  return MODEL_REGISTRY[routing.default]
}

export function getModelById(modelId: string): ModelConfig | undefined {
  return MODEL_REGISTRY[modelId]
}

export function getGatewayModel(modelKey: string) {
  const config = MODEL_REGISTRY[modelKey]
  if (!config) {
    throw new Error(`Unknown model: ${modelKey}`)
  }
  return gateway(config.id)
}

export function getFallbackModels(
  primaryModel: string,
  routing: ModelRoutingConfig = DEFAULT_ROUTING
): ModelConfig[] {
  return routing.fallbackChain
    .filter((m) => m !== primaryModel)
    .map((m) => MODEL_REGISTRY[m])
    .filter(Boolean)
}

// ============================================================================
// Cost Calculation
// ============================================================================

export function calculateCost(
  modelKey: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_REGISTRY[modelKey]
  if (!config) return 0

  const inputCost = (inputTokens / 1000) * config.costPer1kInput
  const outputCost = (outputTokens / 1000) * config.costPer1kOutput

  return inputCost + outputCost
}

// ============================================================================
// Provider-specific API Clients
// ============================================================================

export const providerClients = {
  groq: {
    apiKey: GROQ_API_KEY,
    baseUrl: "https://api.groq.com/openai/v1",
  },
  elevenlabs: {
    apiKey: ELEVENLABS_API_KEY,
    baseUrl: "https://api.elevenlabs.io/v1",
  },
  kling: {
    apiKey: KLING_API_KEY,
    baseUrl: "https://api.klingai.com/v1",
  },
  runway: {
    apiKey: RUNWAY_API_KEY,
    baseUrl: "https://api.runwayml.com/v1",
  },
}

// ============================================================================
// Arabic-optimized System Prompts
// ============================================================================

export const ARABIC_SYSTEM_CONTEXT = `
أنت مساعد ذكاء اصطناعي متخصص في التجارة الإلكترونية في منطقة الشرق الأوسط وشمال أفريقيا.

قواعد اللغة:
- اكتشف لغة المستخدم من أول رسالة واستمر بنفس اللغة
- إذا كان المستخدم يكتب بالعربية، أجب بالعربية الفصحى أو العامية حسب أسلوبه
- الأرقام والأسعار تُعرض بالأرقام الهندية (٠١٢٣) أو العربية (0123) حسب إعدادات المتجر
- أسماء المنتجات قد تكون ثنائية اللغة - اعرض كلاهما عند الإمكان

التنسيق:
- استخدم تنسيق RTL (من اليمين لليسار) للنص العربي
- العملة تُعرض بعد الرقم: "150 ر.س" وليس "ر.س 150"
- التواريخ بالتنسيق: يوم/شهر/سنة
`

export const SHOPPING_ASSISTANT_PROMPT = (
  storeName: string,
  locale: "ar" | "en"
) => `
${locale === "ar" ? ARABIC_SYSTEM_CONTEXT : ""}

You are a helpful shopping assistant for ${storeName}.

Your capabilities:
- Help customers find products using natural language
- Add items to cart when requested
- Compare products side by side
- Track order status
- Answer questions about store policies
- Provide personalized recommendations

Guidelines:
- Be concise and helpful
- Always confirm before adding items to cart
- Suggest alternatives if a product is out of stock
- Use the customer's language (Arabic or English)
- Format prices with the store's currency
- Be culturally aware of MENA shopping preferences
`

export const STORE_BUILDER_PROMPT = (locale: "ar" | "en") => `
${locale === "ar" ? ARABIC_SYSTEM_CONTEXT : ""}

You are an AI store builder assistant helping merchants create their online store.

Your role:
- Guide merchants through store setup conversationally
- Recommend templates based on their business type
- Help customize colors, fonts, and layout
- Add, remove, and configure store components
- Explain design choices in simple terms

Process:
1. Ask about their business (what they sell, target audience)
2. Recommend a suitable template
3. Guide through customization step by step
4. Preview changes in real-time
5. Finalize and publish when ready

Always:
- Use the merchant's preferred language
- Explain technical terms simply
- Offer 2-3 options rather than overwhelming with choices
- Save progress automatically
`
