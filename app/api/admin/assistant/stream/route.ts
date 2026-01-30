import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createOrchestrator } from "@/lib/agents"
import type { PageContext, StepUpdate } from "@/lib/agents/types"

// Ensure the route is dynamic and not cached
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// SSE Message types
interface SSEMessage {
  type: 'step' | 'response' | 'error' | 'done'
  data: any
}

function formatSSE(message: SSEMessage): string {
  return `data: ${JSON.stringify(message)}\n\n`
}

export async function POST(request: NextRequest) {
  // Create a TransformStream for SSE
  const encoder = new TextEncoder()
  
  // Create a readable stream that we'll use to send SSE messages
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null
  
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
    },
    cancel() {
      // Cleanup if client disconnects
      streamController = null
    }
  })

  // Helper to send SSE messages
  const sendSSE = (message: SSEMessage) => {
    if (streamController) {
      try {
        streamController.enqueue(encoder.encode(formatSSE(message)))
      } catch (e) {
        console.error('Failed to send SSE message:', e)
      }
    }
  }

  // Helper to close the stream
  const closeStream = () => {
    if (streamController) {
      try {
        streamController.close()
      } catch (e) {
        // Already closed
      }
      streamController = null
    }
  }

  // Start processing in the background
  ;(async () => {
    try {
      // Check for required environment variables
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set")
        sendSSE({ type: 'error', data: { error: "API configuration error", details: "AI service is not properly configured" } })
        closeStream()
        return
      }

      // Verify authentication
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth error:", authError)
        sendSSE({ type: 'error', data: { error: "Authentication failed", details: authError?.message || "No active session" } })
        closeStream()
        return
      }

      // Check if user is admin and get their name
      const { data: profile, error: adminError } = await supabase
        .from("profiles")
        .select("is_admin, full_name")
        .eq("id", user.id)
        .single()

      if (adminError) {
        console.error("Admin check error:", adminError)
      }

      if (!profile?.is_admin) {
        console.error("User is not an admin:", user.id)
        sendSSE({ type: 'error', data: { error: "Admin access required" } })
        closeStream()
        return
      }

      const adminName = profile.full_name || null

      // Parse request body
      const body = await request.json()
      const { messages, pageContext, images, storedImageUrls } = body as {
        messages: { role: string; content: string }[]
        pageContext: PageContext | null
        images?: string[]
        storedImageUrls?: string[] // Previously uploaded image URLs for reference
      }

      if (!messages || !Array.isArray(messages)) {
        sendSSE({ type: 'error', data: { error: "Invalid messages format" } })
        closeStream()
        return
      }

      // Get the latest user message
      const userMessage = messages[messages.length - 1]
      if (!userMessage || userMessage.role !== "user") {
        sendSSE({ type: 'error', data: { error: "No user message found" } })
        closeStream()
        return
      }

      console.log("Processing streaming request from admin:", user.id, adminName ? `(${adminName})` : "")
      console.log("User message:", userMessage.content)
      if (images && images.length > 0) console.log(`${images.length} new images attached`)
      if (storedImageUrls && storedImageUrls.length > 0) console.log(`${storedImageUrls.length} stored images available`)

      // Create orchestrator with step callback for real-time updates
      const orchestrator = createOrchestrator(user.id, adminName)
      
      // Set up real-time step updates
      orchestrator.setStepUpdateCallback((step: StepUpdate) => {
        sendSSE({ type: 'step', data: step })
      })

      // Convert messages to conversation history format
      const conversationHistory = messages.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Determine which images to use:
      // 1. New base64 images if provided (will be uploaded)
      // 2. Stored image URLs from previous uploads (already hosted)
      // 3. Available images from page context
      const imagesToProcess = images && images.length > 0 
        ? images // New base64 images - will be uploaded by orchestrator
        : storedImageUrls && storedImageUrls.length > 0
          ? storedImageUrls // Use stored URLs directly (already uploaded)
          : pageContext?.availableImages // Use page context images as fallback

      // Execute the request (steps will be streamed via callback)
      const result = await orchestrator.executeRequest(
        userMessage.content,
        pageContext,
        conversationHistory,
        imagesToProcess
      )

      console.log("Streaming orchestrator result:", {
        success: result.success,
        tasksCount: result.tasks.length,
        tokensUsed: result.totalTokens,
        executionTime: result.executionTime,
        stepsCount: result.steps?.length || 0,
      })

      // Send the final response with UI commands
      sendSSE({
        type: 'response',
        data: {
          success: result.success,
          content: result.response,
          message: result.response,
          tasks: result.tasks,
          tokensUsed: result.totalTokens,
          executionTime: result.executionTime,
          confirmationRequired: result.confirmationRequired,
          steps: result.steps,
          uiCommands: result.uiCommands, // Include UI commands for client-side execution
        }
      })

      // Log the request for analytics
      try {
        await supabase.from("ai_tasks").insert({
          merchant_id: user.id,
          agent: "manager",
          task_type: "chat_request_stream",
          status: result.success ? "completed" : "failed",
          input: { message: userMessage.content, pageContext },
          output: { response: result.response },
          error: result.success ? null : "Processing failed",
          metadata: {
            tokensUsed: result.totalTokens,
            executionTime: result.executionTime,
            tasksExecuted: result.tasks.length,
            streaming: true,
          },
        })
      } catch (logError) {
        console.error("Failed to log to ai_tasks:", logError)
      }

      // Send done message
      sendSSE({ type: 'done', data: {} })
      closeStream()

    } catch (error) {
      console.error("Admin assistant streaming API error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      sendSSE({ type: 'error', data: { error: "Internal server error", details: errorMessage } })
      closeStream()
    }
  })()

  // Return the SSE response immediately
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
