import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/assistant/conversation
 * Load the user's last active conversation with messages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the most recent conversation for this user
    const { data: conversation, error: convError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("merchant_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (convError) {
      console.error("Error fetching conversation:", convError)
      return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
    }

    if (!conversation) {
      // No conversation found, return empty
      return NextResponse.json({ conversation: null, messages: [] })
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })

    if (msgError) {
      console.error("Error fetching messages:", msgError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
    })
  } catch (error) {
    console.error("Error in GET /api/admin/assistant/conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/assistant/conversation
 * Save or update a conversation with messages
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, messages, title } = body

    let finalConversationId = conversationId

    // If no conversation ID, create a new conversation
    if (!finalConversationId) {
      const { data: newConv, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          merchant_id: user.id,
          title: title || "New Conversation",
          metadata: {},
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating conversation:", createError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      finalConversationId = newConv.id
    } else {
      // Update existing conversation timestamp
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", finalConversationId)
    }

    // Save messages (skip if no messages to save)
    if (messages && messages.length > 0) {
      const messagesToInsert = messages.map((msg: any) => ({
        conversation_id: finalConversationId,
        role: msg.role,
        content: msg.content,
        images: msg.images || null,
        steps: msg.steps || null,
        thinking: msg.isThinking || false,
        metadata: {
          toolInvocations: msg.toolInvocations,
          isError: msg.isError,
          retryable: msg.retryable,
        },
      }))

      const { error: insertError } = await supabase
        .from("ai_messages")
        .insert(messagesToInsert)

      if (insertError) {
        console.error("Error inserting messages:", insertError)
        return NextResponse.json({ error: "Failed to save messages" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      conversationId: finalConversationId,
    })
  } catch (error) {
    console.error("Error in POST /api/admin/assistant/conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
