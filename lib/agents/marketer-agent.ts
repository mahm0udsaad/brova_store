import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { models } from "@/lib/ai/gateway"
import type { AgentResult, CampaignCreateParams } from "./types"

export class MarketerAgent {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Execute a marketing-related action
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    switch (action) {
      case "generate_caption":
        return this.generateCaption(params as { productName: string; productDescription?: string; platform: "instagram" | "facebook" | "general"; tone?: string })
      case "generate_email":
        return this.generateEmail(params as { type: "promotional" | "announcement" | "follow-up" | "welcome"; productName?: string; context?: string; customerName?: string })
      case "generate_hashtags":
        return this.generateHashtags(params as { productName: string; category?: string; count?: number })
      case "generate_social_posts":
        return this.generateSocialPosts(params)
      case "create_campaign":
        return this.createCampaign(params as CampaignCreateParams)
      case "get_campaigns":
        return this.getCampaigns(params)
      case "suggest_content":
        return this.suggestContent(params)
      default:
        return {
          success: false,
          message: `Unknown action: ${action}`,
          error: "Invalid action",
        }
    }
  }

  /**
   * Generate multi-platform social media posts
   */
  private async generateSocialPosts(params: {
    products: Array<{
      id: string
      name: string
      description?: string
      price?: number
      category?: string
    }>
    imageUrls: string[]
    campaignGoal?: string
    tone?: "casual" | "professional" | "playful" | "luxurious" | "edgy"
    targetAudience?: string
  }): Promise<AgentResult> {
    try {
      // Validate input
      if (!params.products || params.products.length === 0) {
        return {
          success: false,
          message: "At least one product is required",
          error: "No products provided",
        }
      }

      if (!params.imageUrls || params.imageUrls.length === 0) {
        return {
          success: false,
          message: "At least one image is required",
          error: "No images provided",
        }
      }

      // Build product context
      const productContext = params.products
        .map(
          (p) =>
            `- ${p.name}${p.price ? ` ($${p.price})` : ""}${
              p.category ? ` - ${p.category}` : ""
            }${p.description ? `\n  Description: ${p.description}` : ""}`
        )
        .join("\n")

      const systemPrompt = `You are an expert social media marketing specialist for a premium streetwear brand. 
Create engaging, platform-specific marketing posts that drive sales and engagement.

Brand Voice: Authentic, urban, fashion-forward, bold, inclusive, quality-focused
Target Audience: ${params.targetAudience || "Fashion-conscious millennials and Gen Z (18-35) interested in streetwear"}
Tone: ${params.tone || "casual"} - maintain this consistently while adapting to each platform's style.

Return JSON ONLY with this exact structure (no markdown, no code blocks):
{
  "facebook": {
    "caption": "string (100-150 words, conversational, story-telling)",
    "hashtags": ["string", "string"], // 3-5 hashtags WITHOUT # symbol
    "cta": "string (encourage store visits or link clicks)",
    "suggestedTime": "Evening (6-8 PM)",
    "tips": "string (optional platform-specific tips)"
  },
  "instagram": {
    "caption": "string (80-120 words, concise, emoji-rich)",
    "hashtags": ["string", "string"], // 10-15 hashtags WITHOUT # symbol  
    "cta": "string (encourage profile visits or DMs)",
    "suggestedTime": "Lunchtime (11 AM-1 PM) or Evening (7-9 PM)",
    "tips": "string (optional)"
  },
  "tiktok": {
    "caption": "string (40-80 words, short, punchy, trendy)",
    "hashtags": ["string", "string"], // 5-8 hashtags WITHOUT # symbol
    "cta": "string (encourage video engagement)",
    "suggestedTime": "Morning (6-9 AM) or Evening (7-10 PM)",
    "tips": "string (optional)"
  }
}`

      const userPrompt = `Create social media posts for:

${productContext}

${params.campaignGoal ? `Campaign Goal: ${params.campaignGoal}\n` : ""}
Number of Product Images: ${params.imageUrls.length}

Generate UNIQUE content for each platform. Return ONLY valid JSON, no additional text.`

      const result = await generateText({
        model: models.flash,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        maxTokens: 2000,
      })

      // Parse the JSON response
      let postsData
      try {
        // Try to extract JSON from response (might be wrapped in markdown)
        const jsonMatch = result.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          postsData = JSON.parse(jsonMatch[0])
        } else {
          postsData = JSON.parse(result.text)
        }
      } catch (parseError) {
        console.error("Failed to parse social posts JSON:", parseError)
        return {
          success: false,
          message: "Failed to parse generated posts",
          error: "Invalid JSON response from AI",
        }
      }

      await this.trackUsage("marketing_social_posts", result.usage?.totalTokens || 0)

      // Save generated posts to database as drafts
      const supabase = await createClient()
      const productIds = params.products.map(p => p.id)
      
      const draftsToSave = [
        {
          merchant_id: this.userId,
          platform: "facebook",
          ui_structure: {
            caption: postsData.facebook.caption,
            cta: postsData.facebook.cta,
            suggestedTime: postsData.facebook.suggestedTime,
            tips: postsData.facebook.tips,
          },
          media_assets: {
            images: params.imageUrls,
          },
          copy_text: {
            hashtags: postsData.facebook.hashtags,
          },
          status: "draft",
          version: 1,
          product_ids: productIds,
        },
        {
          merchant_id: this.userId,
          platform: "instagram",
          ui_structure: {
            caption: postsData.instagram.caption,
            cta: postsData.instagram.cta,
            suggestedTime: postsData.instagram.suggestedTime,
            tips: postsData.instagram.tips,
          },
          media_assets: {
            images: params.imageUrls,
          },
          copy_text: {
            hashtags: postsData.instagram.hashtags,
          },
          status: "draft",
          version: 1,
          product_ids: productIds,
        },
        {
          merchant_id: this.userId,
          platform: "tiktok",
          ui_structure: {
            caption: postsData.tiktok.caption,
            cta: postsData.tiktok.cta,
            suggestedTime: postsData.tiktok.suggestedTime,
            tips: postsData.tiktok.tips,
          },
          media_assets: {
            images: params.imageUrls,
          },
          copy_text: {
            hashtags: postsData.tiktok.hashtags,
          },
          status: "draft",
          version: 1,
          product_ids: productIds,
        },
      ]

      const { data: savedDrafts, error: saveError } = await supabase
        .from("marketing_post_drafts")
        .insert(draftsToSave)
        .select("id, platform")

      if (saveError) {
        console.error("Failed to save marketing drafts:", saveError)
        // Don't fail the entire operation, but log the error
      }

      return {
        success: true,
        message: `Generated and saved ${savedDrafts?.length || 3} posts for ${params.products.length} product(s) across 3 platforms`,
        data: {
          ...postsData,
          savedDrafts: savedDrafts || [],
        },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      console.error("Error generating social posts:", error)
      return {
        success: false,
        message: "Failed to generate social posts",
        error: error.message,
      }
    }
  }

  /**
   * Generate social media caption
   */
  private async generateCaption(params: {
    productName: string
    productDescription?: string
    platform: "instagram" | "facebook" | "general"
    tone?: string
  }): Promise<AgentResult> {
    try {
      const platformGuides: Record<string, string> = {
        instagram: "Keep it engaging with emojis, include a call to action, use line breaks for readability. Max 2200 characters but keep it punchy.",
        facebook: "More conversational, can be longer. Include a question to encourage engagement.",
        general: "Versatile caption that works across platforms.",
      }

      const prompt = `Write a social media caption for a streetwear product:

Product: ${params.productName}
Description: ${params.productDescription || "Premium streetwear item"}
Platform: ${params.platform}
Tone: ${params.tone || "casual and trendy"}

Guidelines:
${platformGuides[params.platform] || platformGuides.general}
- Target audience: young fashion-forward individuals
- Brand voice: authentic, urban, stylish
- Include a subtle call to action

Output just the caption text, nothing else.`

      const result = await generateText({
        model: models.flash,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 500,
      })

      await this.trackUsage("text_generation", result.usage?.totalTokens || 0)

      return {
        success: true,
        message: "Caption generated",
        data: { caption: result.text.trim() },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate caption",
        error: error.message,
      }
    }
  }

  /**
   * Generate email content
   */
  private async generateEmail(params: {
    type: "promotional" | "announcement" | "follow-up" | "welcome"
    productName?: string
    context?: string
    customerName?: string
  }): Promise<AgentResult> {
    try {
      const emailTypes: Record<string, string> = {
        promotional: "Create an enticing promotional email for a sale or new arrival",
        announcement: "Announce a new product or collection launch",
        "follow-up": "Follow up with a customer after their purchase",
        welcome: "Welcome a new customer to the brand",
      }

      const prompt = `Write an email for a streetwear brand:

Type: ${emailTypes[params.type]}
Product: ${params.productName || "General brand content"}
Context: ${params.context || "Standard communication"}
Customer: ${params.customerName || "Valued customer"}

Requirements:
- Subject line (compelling, under 50 characters)
- Body (concise, engaging, on-brand)
- Call to action
- Streetwear/urban brand voice
- Keep it authentic, not salesy

Format as:
SUBJECT: [subject line]

[email body]`

      const result = await generateText({
        model: models.flash,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 800,
      })

      // Parse subject and body
      const text = result.text.trim()
      const subjectMatch = text.match(/SUBJECT:\s*(.+)/i)
      const subject = subjectMatch?.[1]?.trim() || "New Arrival"
      const body = text.replace(/SUBJECT:\s*.+\n?/i, "").trim()

      await this.trackUsage("text_generation", result.usage?.totalTokens || 0)

      return {
        success: true,
        message: "Email generated",
        data: { subject, body, fullText: result.text },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate email",
        error: error.message,
      }
    }
  }

  /**
   * Generate hashtags for social media
   */
  private async generateHashtags(params: {
    productName: string
    category?: string
    count?: number
  }): Promise<AgentResult> {
    try {
      const prompt = `Generate Instagram hashtags for a streetwear product:

Product: ${params.productName}
Category: ${params.category || "Streetwear"}
Count: ${params.count || 15} hashtags

Requirements:
- Mix of popular and niche hashtags
- Relevant to streetwear/fashion
- Include brand-relevant tags
- No spaces, just # followed by the tag

Output as a space-separated list of hashtags only.`

      const result = await generateText({
        model: models.flash,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 200,
      })

      const hashtags = result.text
        .trim()
        .split(/\s+/)
        .filter((h) => h.startsWith("#"))

      await this.trackUsage("text_generation", result.usage?.totalTokens || 0)

      return {
        success: true,
        message: `Generated ${hashtags.length} hashtags`,
        data: { hashtags, text: hashtags.join(" ") },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate hashtags",
        error: error.message,
      }
    }
  }

  /**
   * Create a marketing campaign
   */
  private async createCampaign(params: CampaignCreateParams): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          merchant_id: this.userId,
          name: params.name,
          type: params.type,
          status: "draft",
          content: params.content,
          products: params.products || [],
          schedule: params.schedule || {},
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: `Campaign "${params.name}" created as draft`,
        data: { campaign },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to create campaign",
        error: error.message,
      }
    }
  }

  /**
   * Get campaigns
   */
  private async getCampaigns(params: {
    status?: string
    type?: string
    limit?: number
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      let query = supabase
        .from("campaigns")
        .select("*")
        .eq("merchant_id", this.userId)

      if (params.status) {
        query = query.eq("status", params.status)
      }

      if (params.type) {
        query = query.eq("type", params.type)
      }

      query = query
        .order("created_at", { ascending: false })
        .limit(params.limit || 20)

      const { data, error } = await query

      if (error) throw error

      return {
        success: true,
        message: `Found ${data.length} campaigns`,
        data: { campaigns: data, count: data.length },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get campaigns",
        error: error.message,
      }
    }
  }

  /**
   * Suggest content ideas
   */
  private async suggestContent(params: {
    type?: "product" | "brand" | "seasonal" | "engagement"
    products?: string[]
  }): Promise<AgentResult> {
    try {
      const prompt = `Suggest 5 content ideas for a streetwear brand's social media:

Content type: ${params.type || "general"}
${params.products?.length ? `Featured products: ${params.products.join(", ")}` : ""}

For each idea, provide:
1. Content type (reel, post, story, carousel)
2. Brief description
3. Best platform
4. Hook/caption starter

Keep suggestions authentic to streetwear culture.`

      const result = await generateText({
        model: models.flash,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 600,
      })

      await this.trackUsage("text_generation", result.usage?.totalTokens || 0)

      return {
        success: true,
        message: "Content ideas generated",
        data: { suggestions: result.text },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to suggest content",
        error: error.message,
      }
    }
  }

  /**
   * Track usage for billing/limits
   */
  private async trackUsage(operation: string, tokens: number): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.rpc("increment_ai_usage", {
        p_merchant_id: this.userId,
        p_operation: operation,
        p_count: 1,
        p_tokens: tokens,
        p_cost: (tokens / 1000) * 0.001, // Estimated cost per 1K tokens
      })
    } catch (error) {
      console.error("Failed to track usage:", error)
    }
  }
}
