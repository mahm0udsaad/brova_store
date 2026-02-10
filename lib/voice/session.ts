// APUS Layer - Voice Commerce Session Management
// Owner: APUS (Claude Opus - AI & Integrations Engineer)

import { createClient } from "@/lib/supabase/server"
import type { VoiceSessionState, STTResponse, TTSResponse } from "@/types/ai"
import { transcribeAudio } from "./stt"
import { synthesizeSpeech } from "./tts"

// ============================================================================
// Voice Session Manager
// ============================================================================

export class VoiceSessionManager {
  private storeId: string
  private sessionId: string
  private customerId?: string

  constructor(storeId: string, sessionId: string, customerId?: string) {
    this.storeId = storeId
    this.sessionId = sessionId
    this.customerId = customerId
  }

  /**
   * Get or create voice session
   */
  async getOrCreateSession() {
    const supabase = await createClient()

    // Try to find existing active session
    const { data: existing } = await supabase
      .from("voice_sessions")
      .select("*")
      .eq("store_id", this.storeId)
      .eq("customer_session_id", this.sessionId)
      .eq("is_active", true)
      .single()

    if (existing) {
      return existing
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from("voice_sessions")
      .insert({
        store_id: this.storeId,
        customer_session_id: this.sessionId,
        customer_id: this.customerId,
        language: "ar", // Default to Arabic
        messages: [],
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create voice session: ${error.message}`)
    }

    return newSession
  }

  /**
   * Process voice input (STT + AI + TTS pipeline)
   */
  async processVoiceInput(
    audio: Blob | ArrayBuffer,
    options?: {
      minConfidence?: number
    }
  ): Promise<VoiceSessionState> {
    const session = await this.getOrCreateSession()

    // Step 1: Transcribe audio
    let transcription: STTResponse
    try {
      transcription = await transcribeAudio(audio, {
        language: session.language as "ar" | "en",
        detectDialect: true,
        minConfidence: options?.minConfidence || 0.7,
      })
    } catch (error) {
      return {
        sessionId: session.id,
        storeId: this.storeId,
        isRecording: false,
        isProcessing: false,
        isSpeaking: false,
        error: error instanceof Error ? error.message : "Transcription failed",
      }
    }

    // Update session with transcription
    await this.addMessage(session.id, {
      role: "user",
      content: transcription.text,
      timestamp: new Date(),
      language: transcription.language,
    })

    // Step 2: Process with AI Shopping Assistant
    // TODO(@APUS): Implement AI Shopping Assistant
    const aiResponse = "مرحباً! كيف يمكنني مساعدتك اليوم؟" // Placeholder

    // Step 3: Synthesize speech
    let ttsResponse: TTSResponse
    try {
      ttsResponse = await synthesizeSpeech(aiResponse, {
        language: transcription.language,
      })
    } catch (error) {
      return {
        sessionId: session.id,
        storeId: this.storeId,
        isRecording: false,
        isProcessing: false,
        isSpeaking: false,
        transcription: transcription.text,
        aiResponse,
        error: error instanceof Error ? error.message : "TTS failed",
      }
    }

    // Update session with AI response
    await this.addMessage(session.id, {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      language: transcription.language,
    })

    // Update session metrics
    await this.updateMetrics(session.id, transcription)

    return {
      sessionId: session.id,
      storeId: this.storeId,
      isRecording: false,
      isProcessing: false,
      isSpeaking: true,
      transcription: transcription.text,
      aiResponse,
    }
  }

  /**
   * Add message to session history
   */
  private async addMessage(
    sessionId: string,
    message: {
      role: "user" | "assistant"
      content: string
      timestamp: Date
      language: "ar" | "en"
    }
  ) {
    const supabase = await createClient()

    const { data: session } = await supabase
      .from("voice_sessions")
      .select("messages")
      .eq("id", sessionId)
      .single()

    if (!session) return

    const messages = (session.messages as any[]) || []
    messages.push(message)

    await supabase
      .from("voice_sessions")
      .update({
        messages,
        last_interaction_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
  }

  /**
   * Update session metrics
   */
  private async updateMetrics(sessionId: string, transcription: STTResponse) {
    const supabase = await createClient()

    const { data: session } = await supabase
      .from("voice_sessions")
      .select("total_interactions, avg_confidence, total_duration_seconds")
      .eq("id", sessionId)
      .single()

    if (!session) return

    const totalInteractions = (session.total_interactions || 0) + 1
    const currentAvgConfidence = session.avg_confidence || 0
    const newAvgConfidence =
      (currentAvgConfidence * (totalInteractions - 1) + transcription.confidence) /
      totalInteractions

    await supabase
      .from("voice_sessions")
      .update({
        total_interactions: totalInteractions,
        avg_confidence: newAvgConfidence,
        total_duration_seconds:
          (session.total_duration_seconds || 0) + Math.ceil(transcription.duration),
        detected_dialect: transcription.dialect,
      })
      .eq("id", sessionId)
  }

  /**
   * Get session history
   */
  async getHistory(limit: number = 50) {
    const supabase = await createClient()

    const { data: session } = await supabase
      .from("voice_sessions")
      .select("messages")
      .eq("store_id", this.storeId)
      .eq("customer_session_id", this.sessionId)
      .eq("is_active", true)
      .single()

    if (!session) return []

    const messages = (session.messages as any[]) || []
    return messages.slice(-limit)
  }

  /**
   * End voice session
   */
  async endSession() {
    const supabase = await createClient()

    await supabase
      .from("voice_sessions")
      .update({ is_active: false })
      .eq("store_id", this.storeId)
      .eq("customer_session_id", this.sessionId)
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create voice session manager
 */
export function createVoiceSession(
  storeId: string,
  sessionId: string,
  customerId?: string
): VoiceSessionManager {
  return new VoiceSessionManager(storeId, sessionId, customerId)
}

/**
 * Get active voice sessions for store
 */
export async function getActiveVoiceSessions(storeId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("voice_sessions")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("last_interaction_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Failed to get active sessions:", error)
    return []
  }

  return data
}

/**
 * Get voice session analytics
 */
export async function getVoiceAnalytics(storeId: string) {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("voice_sessions")
    .select("total_interactions, avg_confidence, total_duration_seconds, language")
    .eq("store_id", storeId)

  if (!sessions) {
    return {
      totalSessions: 0,
      totalInteractions: 0,
      avgConfidence: 0,
      totalDurationMinutes: 0,
      languageBreakdown: {},
    }
  }

  const totalSessions = sessions.length
  const totalInteractions = sessions.reduce(
    (sum, s) => sum + (s.total_interactions || 0),
    0
  )
  const avgConfidence =
    sessions.reduce((sum, s) => sum + (s.avg_confidence || 0), 0) / totalSessions
  const totalDurationMinutes =
    sessions.reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0) / 60

  const languageBreakdown = sessions.reduce(
    (acc, s) => {
      const lang = s.language || "unknown"
      acc[lang] = (acc[lang] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    totalSessions,
    totalInteractions,
    avgConfidence,
    totalDurationMinutes,
    languageBreakdown,
  }
}
