import { generateStructured } from "@/lib/ai/gateway"
import { models } from "@/lib/ai/gateway"
import { z } from "zod"
import { BaseAgent } from "./base-agent"
import type { AgentResult } from "./types"

// Output schema for platform-specific posts
const PlatformPostSchema = z.object({
  caption: z.string().describe("Engaging caption for the platform"),
  hashtags: z.array(z.string()).describe("Relevant hashtags without # symbol"),
  cta: z.string().describe("Call-to-action phrase"),
  suggestedTime: z.string().describe("Best time to post (e.g., '6:00 PM - 8:00 PM')"),
  tips: z.string().optional().describe("Platform-specific posting tips"),
})

const MultiPlatformPostSchema = z.object({
  facebook: PlatformPostSchema,
  instagram: PlatformPostSchema,
  tiktok: PlatformPostSchema,
})

export type PlatformPost = z.infer<typeof PlatformPostSchema>
export type MultiPlatformPost = z.infer<typeof MultiPlatformPostSchema>

interface GeneratePostsParams {
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
}

/**
 * Marketing Social Agent - Generates platform-specific social media posts
 * Specializes in creating tailored content for Facebook, Instagram, and TikTok
 */
export class MarketingSocialAgent extends BaseAgent {
  constructor(userId: string) {
    super(userId, "marketer")
  }

  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    switch (action) {
      case "generate_social_posts":
        return this.generateSocialPosts(params as GeneratePostsParams)
      
      case "generate_single_platform":
        return this.generateSinglePlatform(
          params.platform as "facebook" | "instagram" | "tiktok",
          params as Omit<GeneratePostsParams, "platform">
        )
      
      default:
        return this.formatError(`Unknown action: ${action}`, action)
    }
  }

  /**
   * Generate posts for all three platforms at once
   */
  async generateSocialPosts(params: GeneratePostsParams): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput({ action: "generate_social_posts", params, context: { merchantId: this.userId } })) {
        return this.formatError("Invalid input parameters", "generate_social_posts")
      }

      if (!params.products || params.products.length === 0) {
        return this.formatError("At least one product is required", "generate_social_posts")
      }

      if (!params.imageUrls || params.imageUrls.length === 0) {
        return this.formatError("At least one image is required", "generate_social_posts")
      }

      const model = this.getModel()

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
Your task is to create engaging, platform-specific marketing posts that drive sales and engagement.

Brand Voice:
- Authentic and urban
- Fashion-forward and trendy
- Bold but not aggressive
- Inclusive and diverse
- Quality-focused

Target Audience: ${params.targetAudience || "Fashion-conscious millennials and Gen Z (18-35) interested in streetwear, urban fashion, and contemporary style"}

Tone: ${params.tone || "casual"} - maintain this consistently across platforms while adapting to each platform's style.`

      const userPrompt = `Create social media posts for the following products:

${productContext}

${params.campaignGoal ? `Campaign Goal: ${params.campaignGoal}\n` : ""}
Number of Product Images: ${params.imageUrls.length}

Generate posts for ALL THREE platforms: Facebook, Instagram, and TikTok.

PLATFORM-SPECIFIC REQUIREMENTS:

**Facebook:**
- Longer-form content (100-150 words max)
- More informative and conversational
- Include story-telling elements
- Encourage comments/discussion
- Hashtags: 3-5 relevant ones
- Best posting time: Evening (6-8 PM)
- CTA should encourage store visits or link clicks

**Instagram:**
- Concise but impactful (80-120 words)
- Heavy emoji usage for visual appeal
- Use line breaks for readability
- Hashtags: 10-15 mix of popular and niche
- Best posting time: Lunchtime (11 AM-1 PM) or Evening (7-9 PM)
- CTA should encourage profile visits or DMs

**TikTok:**
- Short, punchy, and energetic (40-80 words)
- Speak to trends and culture
- More casual and relatable language
- Hashtags: 5-8 trending + product-specific
- Best posting time: Morning (6-9 AM) or Evening (7-10 PM)
- CTA should encourage video engagement (likes, shares, duets)

IMPORTANT:
- Each platform should have UNIQUE content (not just variations)
- Hashtags should be provided WITHOUT the # symbol
- Consider the visual nature of the posts (user will attach images)
- Make captions sell the lifestyle, not just the product
- Include relevant calls-to-action that fit each platform's behavior`

      const result = await generateStructured(MultiPlatformPostSchema, {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Higher creativity for marketing content
        maxTokens: 2000,
      })

      // Validate output
      if (!this.validateOutput({ success: true, message: "Posts generated", data: result })) {
        return this.formatError("Generated output failed validation", "generate_social_posts")
      }

      return this.formatSuccess(
        `Generated posts for ${params.products.length} product(s) across 3 platforms`,
        result,
        2000 // Estimated tokens
      )
    } catch (error) {
      console.error("Error generating social posts:", error)
      return this.formatError(error as Error, "generate_social_posts")
    }
  }

  /**
   * Generate post for a single platform
   */
  async generateSinglePlatform(
    platform: "facebook" | "instagram" | "tiktok",
    params: Omit<GeneratePostsParams, "platform">
  ): Promise<AgentResult> {
    try {
      if (!params.products || params.products.length === 0) {
        return this.formatError("At least one product is required", "generate_single_platform")
      }

      if (!params.imageUrls || params.imageUrls.length === 0) {
        return this.formatError("At least one image is required", "generate_single_platform")
      }

      const model = this.getModel()

      const productContext = params.products
        .map(
          (p) =>
            `- ${p.name}${p.price ? ` ($${p.price})` : ""}${
              p.category ? ` - ${p.category}` : ""
            }${p.description ? `\n  Description: ${p.description}` : ""}`
        )
        .join("\n")

      const platformGuides = {
        facebook: {
          style: "longer-form, conversational, story-telling",
          length: "100-150 words",
          hashtags: "3-5 relevant hashtags",
          time: "Evening (6-8 PM)",
          cta: "Encourage store visits or link clicks",
        },
        instagram: {
          style: "concise, visual, emoji-rich",
          length: "80-120 words",
          hashtags: "10-15 mix of popular and niche",
          time: "Lunchtime (11 AM-1 PM) or Evening (7-9 PM)",
          cta: "Encourage profile visits or DMs",
        },
        tiktok: {
          style: "short, punchy, trendy, energetic",
          length: "40-80 words",
          hashtags: "5-8 trending + product-specific",
          time: "Morning (6-9 AM) or Evening (7-10 PM)",
          cta: "Encourage video engagement (likes, shares, duets)",
        },
      }

      const guide = platformGuides[platform]

      const systemPrompt = `You are a ${platform} marketing specialist for a premium streetwear brand.
Create an engaging post that follows ${platform}'s best practices and drives engagement.

Brand Voice: Authentic, urban, fashion-forward, bold, inclusive, quality-focused
Target Audience: ${params.targetAudience || "Fashion-conscious millennials and Gen Z (18-35)"}
Tone: ${params.tone || "casual"}`

      const userPrompt = `Create a ${platform} post for:

${productContext}

${params.campaignGoal ? `Campaign Goal: ${params.campaignGoal}\n` : ""}

Platform Guidelines:
- Style: ${guide.style}
- Length: ${guide.length}
- Hashtags: ${guide.hashtags} (without # symbol)
- Best time: ${guide.time}
- CTA: ${guide.cta}

Make it authentic, engaging, and true to ${platform}'s culture.`

      const result = await generateStructured(PlatformPostSchema, {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        maxTokens: 800,
      })

      return this.formatSuccess(
        `Generated ${platform} post for ${params.products.length} product(s)`,
        { [platform]: result },
        800
      )
    } catch (error) {
      console.error(`Error generating ${platform} post:`, error)
      return this.formatError(error as Error, "generate_single_platform")
    }
  }
}
