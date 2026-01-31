import { createAgentUIStreamResponse } from "ai"
import { storeBuilderAgent } from "@/lib/agents/store-builder-agent"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const { messages, storeId, sessionId } = await request.json()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  return createAgentUIStreamResponse({
    agent: storeBuilderAgent,
    uiMessages: messages,
    options: {
      storeId,
      sessionId,
      userId: user.id,
      locale: "ar",
    },
  })
}
