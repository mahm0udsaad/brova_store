/**
 * Conversation Memory & Summarization
 *
 * Manages long-running conversations by creating summaries and snapshots.
 * Prevents context overflow and enables context refresh.
 */
import { createAdminClient } from "@/lib/supabase/admin"
import { generateText } from "ai"
import { models } from "@/lib/ai/gateway"

export type SnapshotType = "workflow_checkpoint" | "session_summary" | "context_refresh"

export interface MemorySnapshot {
  id: string
  conversation_id: string
  merchant_id: string
  snapshot_type: SnapshotType
  summary: string
  entities: Record<string, any>
  created_at: string
  message_count: number
  token_count: number
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  metadata?: Record<string, any>
}

/**
 * Create a conversation summary snapshot
 */
export async function createMemorySnapshot(params: {
  conversation_id: string
  merchant_id: string
  snapshot_type: SnapshotType
  messages: ConversationMessage[]
}): Promise<MemorySnapshot | null> {
  try {
    // Generate summary
    const summary = await summarizeConversation(params.messages)

    // Extract entities (product IDs, batch IDs, draft IDs, etc.)
    const entities = extractEntities(params.messages)

    // Estimate token count (rough approximation)
    const totalText = params.messages.map((m) => m.content).join(" ")
    const tokenCount = Math.ceil(totalText.length / 4) // ~4 chars per token

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("ai_memory_snapshots")
      .insert({
        conversation_id: params.conversation_id,
        merchant_id: params.merchant_id,
        snapshot_type: params.snapshot_type,
        summary,
        entities,
        message_count: params.messages.length,
        token_count: tokenCount,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create memory snapshot:", error)
      return null
    }

    return data as MemorySnapshot
  } catch (err) {
    console.error("Memory snapshot creation error:", err)
    return null
  }
}

/**
 * Generate a concise summary of conversation messages
 */
async function summarizeConversation(
  messages: ConversationMessage[]
): Promise<string> {
  if (messages.length === 0) {
    return "No messages to summarize."
  }

  if (messages.length <= 3) {
    // Too short to summarize
    return messages.map((m) => `${m.role}: ${m.content}`).join("\n")
  }

  try {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n")

    const prompt = `Summarize this AI assistant conversation concisely. Focus on:
- Key actions taken (products created, images analyzed, etc.)
- Important decisions made by the user
- Current workflow stage
- Pending tasks or next steps

Conversation:
${conversationText}

Summary (2-4 sentences):`

    const result = await generateText({
      model: models.flash,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 200,
    })

    return result.text.trim()
  } catch (err) {
    console.error("Summarization error:", err)
    // Fallback: return first and last messages
    return `Started with: "${messages[0]?.content}"\nEnded with: "${messages[messages.length - 1]?.content}"`
  }
}

/**
 * Extract key entities from messages (IDs, names, etc.)
 */
function extractEntities(messages: ConversationMessage[]): Record<string, any> {
  const entities: Record<string, any> = {
    product_ids: new Set<string>(),
    draft_ids: new Set<string>(),
    batch_ids: new Set<string>(),
    image_urls: new Set<string>(),
    product_names: new Set<string>(),
  }

  // UUID pattern
  const uuidPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

  // URL pattern (simplified)
  const urlPattern = /https?:\/\/[^\s]+/gi

  for (const msg of messages) {
    // Extract UUIDs
    const uuids = msg.content.match(uuidPattern) || []
    uuids.forEach((id) => {
      // Try to categorize based on context
      if (msg.content.includes("draft")) {
        entities.draft_ids.add(id)
      } else if (msg.content.includes("batch")) {
        entities.batch_ids.add(id)
      } else if (msg.content.includes("product")) {
        entities.product_ids.add(id)
      }
    })

    // Extract URLs
    const urls = msg.content.match(urlPattern) || []
    urls.forEach((url) => {
      if (url.includes("image") || url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        entities.image_urls.add(url)
      }
    })

    // Extract metadata entities
    if (msg.metadata) {
      if (msg.metadata.draft_ids) {
        msg.metadata.draft_ids.forEach((id: string) => entities.draft_ids.add(id))
      }
      if (msg.metadata.product_ids) {
        msg.metadata.product_ids.forEach((id: string) => entities.product_ids.add(id))
      }
      if (msg.metadata.batch_id) {
        entities.batch_ids.add(msg.metadata.batch_id)
      }
    }
  }

  // Convert Sets to Arrays for JSON storage
  return {
    product_ids: Array.from(entities.product_ids),
    draft_ids: Array.from(entities.draft_ids),
    batch_ids: Array.from(entities.batch_ids),
    image_urls: Array.from(entities.image_urls).slice(0, 10), // Limit to 10
    total_images: entities.image_urls.size,
  }
}

/**
 * Get recent snapshots for a conversation
 */
export async function getRecentSnapshots(
  conversationId: string,
  limit: number = 5
): Promise<MemorySnapshot[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("ai_memory_snapshots")
      .select()
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Failed to fetch snapshots:", error)
      return []
    }

    return data as MemorySnapshot[]
  } catch (err) {
    console.error("Snapshot fetch error:", err)
    return []
  }
}

/**
 * Should we create a summary?
 * - Every 10 messages for session summaries
 * - At workflow checkpoints (after each major stage)
 * - When message count exceeds 50 (context refresh)
 */
export function shouldCreateSummary(
  messageCount: number,
  lastSnapshotMessageCount: number
): { should: boolean; type: SnapshotType } | null {
  // Context refresh needed (conversation getting too long)
  if (messageCount >= 50 && messageCount - lastSnapshotMessageCount >= 20) {
    return { should: true, type: "context_refresh" }
  }

  // Periodic session summary
  if (messageCount - lastSnapshotMessageCount >= 10) {
    return { should: true, type: "session_summary" }
  }

  return null
}

/**
 * Build condensed context from snapshots + recent messages
 *
 * Used to refresh the agent's context when conversation gets too long
 */
export async function buildCondensedContext(
  conversationId: string,
  recentMessageLimit: number = 10
): Promise<{ summary: string; entities: Record<string, any>; recentMessages: ConversationMessage[] }> {
  try {
    const admin = createAdminClient()

    // Get all snapshots
    const snapshots = await getRecentSnapshots(conversationId, 3)

    // Get recent messages
    const { data: messages } = await admin
      .from("ai_messages")
      .select()
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(recentMessageLimit)

    const recentMessages = (messages || []).reverse() as ConversationMessage[]

    // Combine snapshot summaries
    const summary = snapshots.length > 0
      ? `Previous conversation summary:\n${snapshots.map((s) => s.summary).join("\n\n")}\n\nRecent conversation continues below...`
      : "No previous summary available."

    // Merge entities from all snapshots
    const entities = snapshots.reduce((acc, snapshot) => {
      Object.keys(snapshot.entities).forEach((key) => {
        if (!acc[key]) acc[key] = []
        acc[key] = [...new Set([...acc[key], ...(snapshot.entities[key] || [])])]
      })
      return acc
    }, {} as Record<string, any>)

    return { summary, entities, recentMessages }
  } catch (err) {
    console.error("Context building error:", err)
    return { summary: "", entities: {}, recentMessages: [] }
  }
}
