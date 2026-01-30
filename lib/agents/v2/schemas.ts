/**
 * Shared Zod schemas for V2 agent tools
 */
import { z } from "zod"

// ─── Image Grouping ────────────────────────────────────────────
export const ImageGroupSchema = z.object({
  id: z.string().describe("Unique group identifier"),
  name: z.string().describe("Suggested product name"),
  name_ar: z.string().optional().describe("Arabic product name"),
  image_urls: z.array(z.string()).describe("URLs of images in this group"),
  primary_image_url: z.string().describe("Best image to use as primary"),
  category_hint: z.string().optional().describe("Suggested category"),
})

export type ImageGroup = z.infer<typeof ImageGroupSchema>

// ─── Product Draft ─────────────────────────────────────────────
export const ProductDraftSchema = z.object({
  name: z.string(),
  name_ar: z.string().optional(),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  category: z.string().optional(),
  category_ar: z.string().optional(),
  tags: z.array(z.string()).optional(),
  suggested_price: z.number().optional(),
  image_urls: z.array(z.string()),
  primary_image_url: z.string(),
  ai_confidence: z.enum(["high", "medium", "low"]).optional(),
})

export type ProductDraft = z.infer<typeof ProductDraftSchema>

// ─── Generative UI Schemas ─────────────────────────────────────
export const UIQuestionSchema = z.object({
  question: z.string(),
  options: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  ),
  allow_multiple: z.boolean().optional(),
})

export const UIDraftCardSchema = z.object({
  draft_id: z.string(),
  name: z.string(),
  name_ar: z.string().optional(),
  description: z.string().optional(),
  image_urls: z.array(z.string()),
  primary_image_url: z.string(),
  suggested_price: z.number().optional(),
  category: z.string().optional(),
  ai_confidence: z.enum(["high", "medium", "low"]).optional(),
})

export const UIConfirmationSchema = z.object({
  action: z.string(),
  description: z.string(),
  draft_ids: z.array(z.string()),
  total_products: z.number(),
})

// ─── Agent Context ─────────────────────────────────────────────
export const AgentContextSchema = z.object({
  merchant_id: z.string(),
  store_id: z.string(),
  locale: z.enum(["en", "ar"]),
  store_type: z.enum(["clothing", "car_care"]),
  batch_id: z.string().optional(),
})

export type AgentContext = z.infer<typeof AgentContextSchema>
