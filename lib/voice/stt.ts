// APUS Layer - Speech-to-Text (STT) Implementation
// Owner: APUS (Claude Opus - AI & Integrations Engineer)
// Provider: Groq Whisper (Direct API - NOT through AI Gateway)

import type { STTRequest, STTResponse, STTSegment } from "@/types/ai"

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ""
const GROQ_BASE_URL = "https://api.groq.com/openai/v1"

// ============================================================================
// Groq Whisper STT Client
// ============================================================================

export class GroqWhisperSTT {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GROQ_API_KEY
    this.baseUrl = GROQ_BASE_URL

    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is required for speech-to-text")
    }
  }

  /**
   * Transcribe audio to text using Groq Whisper
   * Uses whisper-large-v3 for better Arabic dialect support
   */
  async transcribe(request: STTRequest): Promise<STTResponse> {
    const startTime = Date.now()

    try {
      // Prepare form data
      const formData = new FormData()

      // Convert audio to Blob if it's ArrayBuffer
      const audioBlob =
        request.audio instanceof Blob
          ? request.audio
          : new Blob([request.audio], { type: "audio/webm" })

      formData.append("file", audioBlob, "audio.webm")
      formData.append("model", "whisper-large-v3") // Better for Arabic dialects

      // Language detection
      if (request.language && request.language !== "auto") {
        formData.append("language", request.language)
      }

      // Request detailed timestamps for segments
      formData.append("response_format", "verbose_json")
      formData.append("timestamp_granularities[]", "segment")

      // Make request to Groq API
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `Groq Whisper API error: ${error.error?.message || response.statusText}`
        )
      }

      const result = await response.json()

      // Parse segments
      const segments: STTSegment[] = (result.segments || []).map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        confidence: seg.no_speech_prob ? 1 - seg.no_speech_prob : 0.9,
      }))

      // Calculate overall confidence
      const avgConfidence =
        segments.length > 0
          ? segments.reduce((sum, seg) => sum + seg.confidence, 0) /
            segments.length
          : 0.9

      // Detect dialect for Arabic (Saudi/Gulf most common in target market)
      let dialect: string | undefined
      if (result.language === "ar" || result.language === "ara") {
        dialect = detectArabicDialect(result.text)
      }

      const duration = (Date.now() - startTime) / 1000

      return {
        text: result.text.trim(),
        language: normalizeLanguageCode(result.language),
        confidence: avgConfidence,
        dialect,
        segments,
        duration,
      }
    } catch (error) {
      console.error("STT Error:", error)
      throw new Error(
        `Speech-to-text failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Transcribe with confidence check
   * Returns null if confidence is too low
   */
  async transcribeWithConfidence(
    request: STTRequest,
    minConfidence: number = 0.7
  ): Promise<STTResponse | null> {
    const result = await this.transcribe(request)

    if (result.confidence < minConfidence) {
      console.warn(
        `Low confidence transcription (${result.confidence.toFixed(2)}): ${result.text}`
      )
      return null
    }

    return result
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize language codes to 2-letter ISO codes
 */
function normalizeLanguageCode(lang: string): "ar" | "en" {
  const normalized = lang.toLowerCase().substring(0, 2)
  if (normalized === "ar" || normalized === "en") {
    return normalized
  }
  return "en"
}

/**
 * Detect Arabic dialect based on common patterns
 */
function detectArabicDialect(text: string): string | undefined {
  // Saudi/Gulf dialect indicators
  const saudiPatterns = [
    /\bيا\s*خوي\b/,
    /\bوش\b/,
    /\bكيف\s*حالك\b/,
    /\bإن\s*شاء\s*الله\b/,
    /\bماشي\b/,
  ]

  // Egyptian dialect indicators
  const egyptianPatterns = [
    /\bإزيك\b/,
    /\bعامل\s*إيه\b/,
    /\bده\b/,
  ]

  // Levantine dialect indicators
  const levantinePatterns = [/\bشو\b/, /\bكيفك\b/, /\bهلأ\b/]

  const saudiScore = saudiPatterns.filter((p) => p.test(text)).length
  const egyptianScore = egyptianPatterns.filter((p) => p.test(text)).length
  const levantineScore = levantinePatterns.filter((p) => p.test(text)).length

  if (saudiScore > 0) return "saudi"
  if (egyptianScore > 0) return "egyptian"
  if (levantineScore > 0) return "levantine"

  return "msa" // Modern Standard Arabic
}

/**
 * Validate audio input
 */
export function validateAudioInput(audio: Blob | ArrayBuffer): {
  valid: boolean
  error?: string
} {
  const maxSizeMB = 25 // Groq limit
  const supportedFormats = [
    "audio/webm",
    "audio/mp3",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
  ]

  const size = audio instanceof Blob ? audio.size : audio.byteLength

  if (size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `Audio file too large. Maximum size is ${maxSizeMB}MB`,
    }
  }

  if (audio instanceof Blob && !supportedFormats.includes(audio.type)) {
    return {
      valid: false,
      error: `Unsupported audio format. Supported: ${supportedFormats.join(", ")}`,
    }
  }

  return { valid: true }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sttInstance: GroqWhisperSTT | null = null

export function getSTTClient(apiKey?: string): GroqWhisperSTT {
  if (!sttInstance) {
    sttInstance = new GroqWhisperSTT(apiKey)
  }
  return sttInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function transcribeAudio(
  audio: Blob | ArrayBuffer,
  options?: {
    language?: "ar" | "en" | "auto"
    detectDialect?: boolean
    minConfidence?: number
  }
): Promise<STTResponse> {
  const validation = validateAudioInput(audio)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const client = getSTTClient()
  const request: STTRequest = {
    audio,
    language: options?.language || "auto",
    detectDialect: options?.detectDialect ?? true,
  }

  if (options?.minConfidence !== undefined) {
    const result = await client.transcribeWithConfidence(
      request,
      options.minConfidence
    )
    if (!result) {
      throw new Error("Transcription confidence too low. Please try again.")
    }
    return result
  }

  return client.transcribe(request)
}

export function calculateSTTCost(durationSeconds: number): number {
  const COST_PER_SECOND = 0.0001
  return durationSeconds * COST_PER_SECOND
}
