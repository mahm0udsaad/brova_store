// APUS Layer - Text-to-Speech (TTS) Implementation
// Owner: APUS (Claude Opus - AI & Integrations Engineer)
// Provider: ElevenLabs Flash v2.5 (Primary), Lahajati (Dialect specialist)

import type { TTSRequest, TTSResponse } from "@/types/ai"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? ""
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

// Default Arabic voices (configure per store)
const DEFAULT_VOICES = {
  ar: "FjJJxwBrv1I5sk34AdgP", // Arabic voice (from env config)
  en: "21m00Tcm4TlvDq8ikWAM", // English male voice (Rachel)
}

// ============================================================================
// ElevenLabs TTS Client
// ============================================================================

export class ElevenLabsTTS {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ELEVENLABS_API_KEY
    this.baseUrl = ELEVENLABS_BASE_URL

    if (!this.apiKey) {
      throw new Error("ELEVENLABS_API_KEY is required for text-to-speech")
    }
  }

  /**
   * Convert text to speech using ElevenLabs Flash v2.5
   * 75ms latency, optimized for real-time conversations
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const startTime = Date.now()

    try {
      const {
        text,
        voiceId,
        model = "eleven_flash_v2_5",
        speed = 1.0,
        stability = 0.5,
        similarityBoost = 0.75,
      } = request

      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error("Text is required for TTS")
      }

      if (text.length > 5000) {
        throw new Error("Text too long. Maximum 5000 characters.")
      }

      // Make request to ElevenLabs API
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: model,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
              style: 0,
              use_speaker_boost: true,
            },
            optimize_streaming_latency: 3, // Maximum optimization
            output_format: "mp3_44100_128",
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          `ElevenLabs API error: ${error.detail?.message || response.statusText}`
        )
      }

      // Get audio data
      const arrayBuffer = await response.arrayBuffer()
      const duration = (Date.now() - startTime) / 1000

      return {
        audio: arrayBuffer,
        contentType: "audio/mpeg",
        duration,
      }
    } catch (error) {
      console.error("TTS Error:", error)
      throw new Error(
        `Text-to-speech failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error("Failed to get voices:", error)
      return []
    }
  }
}

// ============================================================================
// Voice Types
// ============================================================================

export interface Voice {
  voice_id: string
  name: string
  category: string
  labels: Record<string, string>
  description?: string
  preview_url?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default voice ID for language
 */
export function getDefaultVoice(language: "ar" | "en"): string {
  return DEFAULT_VOICES[language]
}

/**
 * Validate TTS request
 */
export function validateTTSRequest(request: TTSRequest): {
  valid: boolean
  error?: string
} {
  if (!request.text || request.text.trim().length === 0) {
    return { valid: false, error: "Text is required" }
  }

  if (request.text.length > 5000) {
    return { valid: false, error: "Text too long. Maximum 5000 characters." }
  }

  if (!request.voiceId) {
    return { valid: false, error: "Voice ID is required" }
  }

  return { valid: true }
}

/**
 * Split long text into chunks for TTS
 * ElevenLabs limit: 5000 characters
 */
export function splitTextForTTS(text: string, maxLength: number = 4500): string[] {
  if (text.length <= maxLength) {
    return [text]
  }

  const chunks: string[] = []
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  let currentChunk = ""

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = sentence
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// ============================================================================
// Singleton Instance
// ============================================================================

let ttsInstance: ElevenLabsTTS | null = null

export function getTTSClient(apiKey?: string): ElevenLabsTTS {
  if (!ttsInstance) {
    ttsInstance = new ElevenLabsTTS(apiKey)
  }
  return ttsInstance
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Synthesize speech from text (convenience wrapper)
 */
export async function synthesizeSpeech(
  text: string,
  options?: {
    language?: "ar" | "en"
    voiceId?: string
    model?: string
    speed?: number
  }
): Promise<TTSResponse> {
  const validation = validateTTSRequest({
    text,
    voiceId: options?.voiceId || getDefaultVoice(options?.language || "ar"),
  })

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const client = getTTSClient()

  const request: TTSRequest = {
    text,
    voiceId: options?.voiceId || getDefaultVoice(options?.language || "ar"),
    model: options?.model,
    speed: options?.speed,
  }

  return client.synthesize(request)
}

/**
 * Synthesize long text by splitting into chunks
 */
export async function synthesizeLongText(
  text: string,
  options?: {
    language?: "ar" | "en"
    voiceId?: string
    model?: string
  }
): Promise<ArrayBuffer[]> {
  const chunks = splitTextForTTS(text)
  const audioChunks: ArrayBuffer[] = []

  for (const chunk of chunks) {
    const response = await synthesizeSpeech(chunk, options)
    audioChunks.push(response.audio)
  }

  return audioChunks
}

/**
 * Calculate TTS cost based on character count
 * ElevenLabs pricing: ~$0.00003 per character
 */
export function calculateTTSCost(characterCount: number): number {
  const COST_PER_CHAR = 0.00003
  return characterCount * COST_PER_CHAR
}

/**
 * Estimate audio duration based on text length
 * Rough estimate: ~150 words per minute, ~5 chars per word
 */
export function estimateAudioDuration(text: string): number {
  const wordsPerMinute = 150
  const charsPerWord = 5
  const words = text.length / charsPerWord
  const minutes = words / wordsPerMinute
  return minutes * 60 // Return in seconds
}
