import { NextRequest, NextResponse } from "next/server"
import { convertToModelMessages } from "ai"
import { createClient } from "@/lib/supabase/server"
import { streamStoreBuilder } from "@/lib/ai/store-builder"
import { getAdminStoreContext } from "@/lib/supabase/queries/admin-store"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
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

    // Get store context from authenticated user
    const context = await getAdminStoreContext()
    if (!context) {
      return NextResponse.json(
        { error: "No store found for user" },
        { status: 404 }
      )
    }

    // Parse request body - useChat sends UI messages (parts-based format)
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Convert UI messages (parts-based) to model messages (content-based)
    const modelMessages = await convertToModelMessages(messages)

    // Stream store builder response with storeId from user context
    const result = await streamStoreBuilder({
      messages: modelMessages,
      storeId: context.store.id,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Store builder API error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
