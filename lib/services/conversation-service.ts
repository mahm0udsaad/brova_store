import { createClient } from "@/lib/supabase/server"
import type { Message } from "@/components/admin/ai-sidebar"

export interface Conversation {
  id: string
  merchant_id: string
  title: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface StoredMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  images: string[]
  steps: any[]
  thinking: boolean
  created_at: string
  metadata: Record<string, any>
}

/**
 * Service for managing AI conversation persistence in Supabase
 */
export class ConversationService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<Conversation | null> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          merchant_id: this.userId,
          title: title || "New Conversation",
          metadata: {},
        })
        .select()
        .single()

      if (error) {
        console.error("Failed to create conversation:", error)
        return null
      }

      return data as Conversation
    } catch (error) {
      console.error("Error creating conversation:", error)
      return null
    }
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(limit = 50): Promise<Conversation[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("merchant_id", this.userId)
        .order("updated_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Failed to fetch conversations:", error)
        return []
      }

      return (data as Conversation[]) || []
    } catch (error) {
      console.error("Error fetching conversations:", error)
      return []
    }
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("merchant_id", this.userId)
        .single()

      if (error) {
        console.error("Failed to fetch conversation:", error)
        return null
      }

      return data as Conversation
    } catch (error) {
      console.error("Error fetching conversation:", error)
      return null
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Failed to fetch messages:", error)
        return []
      }

      return (data || []).map((msg: StoredMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        images: msg.images,
        steps: msg.steps,
        thinking: msg.thinking,
      }))
    } catch (error) {
      console.error("Error fetching messages:", error)
      return []
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    message: Omit<Message, "id" | "timestamp">
  ): Promise<StoredMessage | null> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from("ai_messages")
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          images: message.images || [],
          steps: message.steps || [],
          thinking: message.thinking || false,
          metadata: {},
        })
        .select()
        .single()

      if (error) {
        console.error("Failed to add message:", error)
        return null
      }

      return data as StoredMessage
    } catch (error) {
      console.error("Error adding message:", error)
      return null
    }
  }

  /**
   * Update a message (useful for streaming updates)
   */
  async updateMessage(
    messageId: string,
    updates: Partial<Pick<Message, "content" | "steps" | "thinking">>
  ): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from("ai_messages")
        .update(updates)
        .eq("id", messageId)

      if (error) {
        console.error("Failed to update message:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating message:", error)
      return false
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from("ai_conversations")
        .update({ title })
        .eq("id", conversationId)
        .eq("merchant_id", this.userId)

      if (error) {
        console.error("Failed to update conversation title:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating conversation title:", error)
      return false
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", conversationId)
        .eq("merchant_id", this.userId)

      if (error) {
        console.error("Failed to delete conversation:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error deleting conversation:", error)
      return false
    }
  }

  /**
   * Generate a title from the first message
   */
  generateTitle(firstMessage: string): string {
    const maxLength = 50
    const cleaned = firstMessage.trim().replace(/\n/g, " ")
    
    if (cleaned.length <= maxLength) {
      return cleaned
    }
    
    return cleaned.substring(0, maxLength).trim() + "..."
  }
}
