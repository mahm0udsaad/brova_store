import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createOrchestrator } from "@/lib/agents"
import type { PageContext } from "@/lib/agents/types"

// Ensure the route is dynamic and not cached
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set")
      return NextResponse.json(
        { error: "API configuration error", details: "AI service is not properly configured" },
        { status: 500 }
      )
    }

    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      console.error("No user found in session")
      return NextResponse.json(
        { error: "Unauthorized - No active session" },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const adminName = profile.full_name || null

    // Parse request body
    const body = await request.json()
    const { messages, pageContext, images } = body as {
      messages: { role: string; content: string }[]
      pageContext: PageContext | null
      images?: string[]
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      )
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1]
    if (!userMessage || userMessage.role !== "user") {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      )
    }

    console.log("Processing request from admin:", user.id, adminName ? `(${adminName})` : "")
    console.log("User message:", userMessage.content)
    if (images && images.length > 0) console.log(`${images.length} images attached`)

    // Create orchestrator and process request
    const orchestrator = createOrchestrator(user.id, adminName)

    // Convert messages to conversation history format
    const conversationHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const result = await orchestrator.executeRequest(
      userMessage.content,
      pageContext,
      conversationHistory,
      images
    )

    console.log("Orchestrator result:", {
      success: result.success,
      response: result.response,
      tasksCount: result.tasks.length,
      tokensUsed: result.totalTokens,
      executionTime: result.executionTime,
      stepsCount: result.steps?.length || 0,
    })

    // Ensure we have a valid response
    if (!result.response) {
      console.error("Orchestrator returned no response")
      return NextResponse.json(
        { error: "No response generated", details: "The AI did not generate a response" },
        { status: 500 }
      )
    }

    // Log step updates for debugging
    if (result.steps && result.steps.length > 0) {
      console.log("Execution steps:")
      result.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. [${step.type}] ${step.message}`)
      })
    }

    // Log the request for analytics
    try {
      await supabase.from("ai_tasks").insert({
        merchant_id: user.id,
        agent: "manager",
        task_type: "chat_request",
        status: result.success ? "completed" : "failed",
        input: { message: userMessage.content, pageContext },
        output: { response: result.response },
        error: result.success ? null : "Processing failed",
        metadata: {
          tokensUsed: result.totalTokens,
          executionTime: result.executionTime,
          tasksExecuted: result.tasks.length,
        },
      })
    } catch (logError) {
      console.error("Failed to log to ai_tasks:", logError)
      // Don't fail the request if logging fails
    }

    // Return response with UI commands
    return NextResponse.json({
      success: result.success,
      content: result.response,
      message: result.response,
      tasks: result.tasks,
      tokensUsed: result.totalTokens,
      executionTime: result.executionTime,
      confirmationRequired: result.confirmationRequired,
      steps: result.steps, // Include step updates for visualization
      uiCommands: result.uiCommands, // Include UI commands for client-side execution
    })

  } catch (error) {
    console.error("Admin assistant API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    )
  }
}
