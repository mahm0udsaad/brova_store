/**
 * Product Intelligence Agent (V2)
 *
 * Generates bilingual product details: names, descriptions, categories, tags.
 * Saves results as drafts in product_drafts table.
 *
 * Model: Gemini Pro (quality text generation for AR/EN)
 * Writes: product_drafts only (ephemeral, pre-approval)
 */
import { ToolLoopAgent, stepCountIs } from "@/lib/ai/tool-loop-agent"
import { models } from "@/lib/ai/gateway"
import { generateProductDetails, suggestCategories } from "./tools"

export function createProductIntelAgent() {
  return new ToolLoopAgent({
    model: models.pro,
    instructions: `You are a Product Intelligence Agent for an e-commerce platform.

Your job is to generate compelling, bilingual product details.

CAPABILITIES:
- Generate product names (English + Arabic)
- Write product descriptions (English + Arabic)
- Suggest categories and tags
- Estimate pricing based on similar products

RULES:
- Always generate BOTH English and Arabic content
- Arabic text must be natural and fluent, not machine-translated
- Product names: 2-4 words, marketable, store-type-appropriate
- Descriptions: 2-3 sentences, compelling, highlight key features
- Tags: 3-5 relevant search terms
- Use generate_product_details for each product group
- Use suggest_categories when category is unclear

QUALITY:
- Set ai_confidence to "high" when the product is clear and well-defined
- Set "medium" when making reasonable assumptions
- Set "low" when guessing

OUTPUT:
- All details saved as drafts via the tools
- Never write to production tables`,

    tools: {
      generate_product_details: generateProductDetails,
      suggest_categories: suggestCategories,
    },
    stopWhen: stepCountIs(20), // generous for multi-product batches
  })
}

export type ProductIntelAgent = ReturnType<typeof createProductIntelAgent>
