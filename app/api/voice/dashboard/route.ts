import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { transcribeAudio } from "@/lib/voice/stt"
import { synthesizeSpeech } from "@/lib/voice/tts"
import { createManagerAgent } from "@/lib/agents/v2"
import type { AgentContext } from "@/lib/agents/v2/schemas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse FormData
    const formData = await req.formData()
    const audio = formData.get("audio") as Blob | null
    const text = formData.get("text") as string | null
    const storeId = formData.get("storeId") as string | null

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      )
    }

    if (!audio && !text) {
      return NextResponse.json(
        { error: "audio or text is required" },
        { status: 400 }
      )
    }

    // Step 1: Get transcription (STT for audio, or use text directly)
    let transcription: string
    let detectedLanguage: "ar" | "en" = "ar"

    if (audio) {
      try {
        const sttResult = await transcribeAudio(audio, {
          language: "auto",
          detectDialect: true,
        })
        transcription = sttResult.text
        detectedLanguage = sttResult.language
      } catch (sttError) {
        console.error("STT failed:", sttError)
        return NextResponse.json(
          { error: "Failed to transcribe audio. Please try again or use text input." },
          { status: 500 }
        )
      }
    } else {
      transcription = text!
      // Simple language detection: if mostly Arabic chars, it's Arabic
      const arabicChars = transcription.match(/[\u0600-\u06FF]/g)
      detectedLanguage = arabicChars && arabicChars.length > transcription.length * 0.3 ? "ar" : "en"
    }

    // Step 2: Resolve store context for the manager agent
    const admin = createAdminClient()
    const { data: store } = await admin
      .from("stores")
      .select("id, store_type, organization_id")
      .eq("id", storeId)
      .single()

    const storeType = (store?.store_type as "clothing" | "car_care") || "clothing"

    const context: AgentContext = {
      merchant_id: user.id,
      store_id: storeId,
      store_type: storeType,
      locale: detectedLanguage,
    }

    // Step 3: Run the AI Manager Agent (same agent as the admin assistant)
    let aiResponse: string
    let agentActions: Array<{ type: string; title: string; description: string }> = []

    try {
      const manager = createManagerAgent(context)
      const result = await manager.generate({
        prompt: transcription,
        messages: [],
      })

      aiResponse = result.text || (detectedLanguage === "ar"
        ? "تم تنفيذ الطلب."
        : "Request processed.")

      // Extract actions from tool calls for UI display
      const toolsUsed = result.steps.flatMap(
        (s) => s.toolCalls?.map((tc) => tc.toolName) || []
      )
      if (toolsUsed.length > 0) {
        agentActions = toolsUsed.map((toolName) => ({
          type: "success" as const,
          title: toolName.replace(/_/g, " "),
          description: `Executed ${toolName}`,
        }))
      }
    } catch (agentError) {
      console.error("Manager agent failed:", agentError)
      // Fallback response if agent fails
      aiResponse = detectedLanguage === "ar"
        ? "عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى."
        : "Sorry, an error occurred while processing your request. Please try again."
    }

    // Step 4: Synthesize speech (TTS)
    let audioBase64: string | null = null
    try {
      const ttsResult = await synthesizeSpeech(aiResponse, {
        language: detectedLanguage,
      })
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(ttsResult.audio)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      audioBase64 = btoa(binary)
    } catch (ttsError) {
      console.error("TTS failed:", ttsError)
      // Non-fatal: response will just not have audio
    }

    const latencyMs = Date.now() - startTime

    // Log to ai_usage_logs (fire-and-forget)
    admin
      .from("ai_usage_logs")
      .insert({
        store_id: storeId,
        merchant_id: user.id,
        model: "voice-dashboard",
        provider: "groq+gemini+elevenlabs",
        operation: "voice_dashboard_command",
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: latencyMs,
        cost: 0,
        metadata: {
          ...(audio ? { audio_size: audio.size, audio_type: audio.type } : { input_type: "text" }),
          transcription,
          detected_language: detectedLanguage,
          has_tts: !!audioBase64,
        },
      } as any)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to log AI usage:", error)
        }
      })

    return NextResponse.json({
      transcription,
      response: aiResponse,
      actions: agentActions,
      audio: audioBase64,
      audioContentType: audioBase64 ? "audio/mpeg" : null,
    })
  } catch (error) {
    console.error("Voice dashboard API error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
