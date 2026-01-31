import { streamText, tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { mapProductRow, type ProductRow } from "@/lib/supabase/queries/products"
import { models } from "@/lib/ai/gateway"

const SYSTEM_PROMPT = `You are a shopping assistant, an intelligent agent for a streetwear store.

Your personality:
- Natural, conversational, and helpful like a knowledgeable friend
- Enthusiastic about fashion and streetwear culture
- Concise but personable - keep responses brief and mobile-friendly
- Use casual language, not robotic or overly formal

Your capabilities:
- Help customers discover products that match their style
- Answer questions about sizing, fit, and product details
- Make personalized recommendations based on preferences
- Search the product catalog when users ask about specific items or categories

When users ask about products:
1. Use the searchProducts tool to find relevant items
2. Present findings naturally in your response
3. Highlight key features or why items match their request
4. Be conversational - don't just list specs

Remember: You're an agent, not a bot. Chat naturally and help customers find what they love.`

const productSelect =
  "id,name,price,category_id,gender,sizes,image_url,images,description,published"

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return new Response("Missing GEMINI_API_KEY", { status: 500 })
  }

  const { messages } = await request.json()
  try {
    const result = streamText({
      model: models.flash,
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        searchProducts: tool({
          description: "Search storefront products by name or description.",
          inputSchema: z.object({
            query: z.string().min(1, "Query is required."),
            limit: z.number().int().min(1).max(8).optional(),
          }),
          execute: async ({ query, limit }) => {
            const supabase = await createClient()
            const safeQuery = query.trim()

            const { data, error } = await supabase
              .from("products")
              .select(productSelect)
              .or("published.is.true,price.not.is.null")
              .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
              .order("created_at", { ascending: false })
              .limit(limit ?? 5)

            if (error) {
              return { products: [], error: error.message }
            }

            const products = (data as ProductRow[]).map(mapProductRow)
            return { products }
          },
        }),
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant failed to respond."
    return new Response(message, { status: 500 })
  }
}
