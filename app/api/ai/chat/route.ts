import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { runShoppingAssistant, createShoppingContext } from "@/lib/ai/shopping-assistant"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { messages, storeId, sessionId } = body as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>
      storeId?: string
      sessionId?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      )
    }

    // Look up store name and locale using admin client (public endpoint, no user auth)
    const admin = createAdminClient()
    const { data: store, error: storeError } = await admin
      .from("stores")
      .select("id, name, default_locale")
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    const storeLocale = (store.default_locale === "ar" ? "ar" : "en") as "ar" | "en"

    // Build shopping assistant context with conversation history (excluding last message)
    const context = createShoppingContext(
      storeId,
      store.name ?? "Store",
      storeLocale,
      sessionId
    )

    // Populate conversation history from prior messages
    context.conversationHistory = messages.slice(0, -1).map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: new Date(),
      language: storeLocale,
    }))

    // Run the shopping assistant (returns a streamText result)
    const result = await runShoppingAssistant(lastMessage.content, context)

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Shopping assistant chat API error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
