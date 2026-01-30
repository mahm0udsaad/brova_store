/**
 * V2 AI Assistant API - Manager Agent with Generative UI
 *
 * Uses Vercel AI SDK's agent streaming with tool-based workflow orchestration.
 * Returns Generative UI components alongside text responses.
 */
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createManagerAgent, extractUIComponents } from "@/lib/agents/v2"
import type { AgentContext } from "@/lib/agents/v2/schemas"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: "Authentication failed" },
        { status: 401 }
      )
    }

    // Check admin access
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, full_name")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return Response.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      messages,
      store_id,
      store_type = "clothing",
      locale = "en",
      batch_id,
      conversation_id,
    } = body as {
      messages: { role: string; content: string }[]
      store_id?: string
      store_type?: "clothing" | "car_care"
      locale?: "en" | "ar"
      batch_id?: string
      conversation_id?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Invalid messages format" },
        { status: 400 }
      )
    }

    const userMessage = messages[messages.length - 1]
    if (!userMessage || userMessage.role !== "user") {
      return Response.json(
        { error: "Last message must be from user" },
        { status: 400 }
      )
    }

    // Get or create conversation
    const admin = createAdminClient()
    let activeConversationId = conversation_id

    if (!activeConversationId) {
      const { data: conv, error: convError } = await admin
        .from("ai_conversations")
        .insert({
          merchant_id: user.id,
          title: userMessage.content.slice(0, 50),
          metadata: { store_id, store_type, locale },
        })
        .select("id")
        .single()

      if (convError) {
        console.error("Failed to create conversation:", convError)
      } else {
        activeConversationId = conv.id
      }
    }

    // Get default store if not provided
    let effectiveStoreId = store_id
    let effectiveStoreType = store_type

    if (!effectiveStoreId) {
      const { data: org } = await admin
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      if (org) {
        const { data: store } = await admin
          .from("stores")
          .select("id, store_type")
          .eq("organization_id", org.id)
          .single()

        if (store) {
          effectiveStoreId = store.id
          effectiveStoreType = (store.store_type as "clothing" | "car_care") || "clothing"
        }
      }
    }

    if (!effectiveStoreId) {
      return Response.json(
        { error: "No store found for user" },
        { status: 400 }
      )
    }

    // Build agent context
    const context: AgentContext = {
      merchant_id: user.id,
      store_id: effectiveStoreId,
      store_type: effectiveStoreType,
      locale,
      batch_id,
      conversation_id: activeConversationId,
    }

    // Create Manager Agent
    const manager = createManagerAgent(context)

    // Generate response
    console.log("V2 Manager Agent processing request:", userMessage.content)
    const result = await manager.generate({
      prompt: userMessage.content,
      messages: messages.slice(0, -1), // conversation history
    })

    console.log("V2 Manager Agent completed:", {
      steps: result.steps.length,
      text: result.text?.slice(0, 100),
    })

    // Extract UI components from tool calls
    const uiComponents = extractUIComponents(result.steps)

    // Save messages to database
    if (activeConversationId) {
      // Save user message
      await admin.from("ai_messages").insert({
        conversation_id: activeConversationId,
        role: "user",
        content: userMessage.content,
      })

      // Save assistant message
      await admin.from("ai_messages").insert({
        conversation_id: activeConversationId,
        role: "assistant",
        content: result.text || "",
        steps: result.steps.map((s) => ({
          toolCalls: s.toolCalls?.map((tc) => ({
            toolName: tc.toolName,
            args: tc.args,
          })),
          toolResults: s.toolResults?.map((tr) => ({
            result: tr.result,
          })),
        })),
      })

      // Update conversation timestamp
      await admin
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConversationId)
    }

    // Log to ai_tasks
    await admin.from("ai_tasks").insert({
      merchant_id: user.id,
      agent: "manager",
      task_type: "v2_agent_request",
      status: "completed",
      input: { message: userMessage.content, context },
      output: { response: result.text, ui_components: uiComponents },
      metadata: {
        conversation_id: activeConversationId,
        steps_count: result.steps.length,
        tools_used: result.steps.flatMap((s) =>
          s.toolCalls?.map((tc) => tc.toolName) || []
        ),
      },
    })

    return Response.json({
      success: true,
      message: result.text || "",
      ui_components: uiComponents,
      conversation_id: activeConversationId,
      steps: result.steps.map((s) => ({
        toolCalls: s.toolCalls?.map((tc) => ({
          toolName: tc.toolName,
          args: tc.args,
        })),
        toolResults: s.toolResults?.map((tr) => ({
          result: tr.result,
        })),
      })),
    })
  } catch (error) {
    console.error("V2 Assistant API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    )
  }
}
