import { describe, it, expect, jest, beforeEach } from "@jest/globals"

// Mock dependencies before imports
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}))

jest.mock("@/lib/bulk-processing/image-grouper", () => ({
  groupImagesByVisualSimilarity: jest.fn(() =>
    Promise.resolve([
      {
        id: "group-1",
        name: "Black T-Shirt",
        images: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
        mainImage: "https://example.com/1.jpg",
        category: "t-shirts",
      },
    ])
  ),
}))

jest.mock("@/lib/bulk-processing/product-creator", () => ({
  suggestPricing: jest.fn(() =>
    Promise.resolve({ suggested: 150, range: { min: 100, max: 200 } })
  ),
}))

jest.mock("ai", () => ({
  tool: jest.fn((config: any) => config),
  generateText: jest.fn(() =>
    Promise.resolve({
      text: "Rewritten Text",
    })
  ),
  generateObject: jest.fn(),
}))

jest.mock("@/lib/ai/gateway", () => ({
  models: { pro: "gemini-pro", flash: "gemini-flash" },
}))

describe("V2 Agent Tools", () => {
  const mockDraft = {
    id: "draft-123",
    name: "Test Product",
    name_ar: "منتج تجريبي",
    description: "A test product",
    image_urls: ["https://example.com/img.jpg"],
    primary_image_url: "https://example.com/img.jpg",
    suggested_price: 100,
    tags: ["test"],
    ai_confidence: "high",
    status: "draft",
  }

  const mockSupabase = {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: "user-1" } }, error: null })
      ),
    },
    from: jest.fn((table: string) => {
      if (table === "product_drafts") {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn(() => ({ data: [mockDraft], error: null })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ data: { id: "draft-123" }, error: null })),
            })),
          })),
          update: jest.fn(() => ({
            in: jest.fn(() => ({ error: null })),
          })),
        }
      }

      if (table === "ai_tasks") {
        return {
          insert: jest.fn(() => ({ error: null })),
        }
      }

      return {
        select: jest.fn(() => ({ data: [], error: null })),
      }
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const { createClient } = require("@/lib/supabase/server")
    createClient.mockResolvedValue(mockSupabase)
  })

  describe("analyzeImages", () => {
    it("should have correct parameter schema", async () => {
      const { analyzeImages } = await import("@/lib/agents/v2/tools")
      expect(analyzeImages.parameters).toBeDefined()

      const parsed = analyzeImages.parameters.safeParse({
        image_urls: ["https://example.com/1.jpg"],
      })
      expect(parsed.success).toBe(true)
    })

    it("should reject empty image_urls", async () => {
      const { analyzeImages } = await import("@/lib/agents/v2/tools")
      const parsed = analyzeImages.parameters.safeParse({ image_urls: "not-array" })
      expect(parsed.success).toBe(false)
    })

    it("should execute and return grouped images", async () => {
      const { analyzeImages } = await import("@/lib/agents/v2/tools")
      const { generateObject } = await import("ai")

      generateObject.mockResolvedValueOnce({
        object: {
          groups: [
            {
              id: "group-1",
              name: "Black T-Shirt",
              image_urls: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
              primary_image_url: "https://example.com/1.jpg",
              category_hint: "t-shirts",
              confidence: "high",
            },
          ],
        },
      })

      const result = await analyzeImages.execute!(
        { image_urls: ["https://example.com/1.jpg", "https://example.com/2.jpg"] },
        { toolCallId: "test", messages: [], abortSignal: undefined as any }
      )
      expect(result.total_groups).toBe(1)
      expect(result.groups[0].name).toBe("Black T-Shirt")
    })
  })

  describe("generateProductDetails", () => {
    it("should have correct parameter schema", async () => {
      const { generateProductDetails } = await import("@/lib/agents/v2/tools")
      const parsed = generateProductDetails.parameters.safeParse({
        group_id: "g1",
        group_name: "Test",
        image_urls: ["https://example.com/1.jpg"],
        primary_image_url: "https://example.com/1.jpg",
        locale: "en" as const,
        store_type: "clothing",
        store_id: "store-1",
        merchant_id: "merchant-1",
      })
      expect(parsed.success).toBe(true)
    })

    it("should execute and return draft with ID", async () => {
      const { generateProductDetails } = await import("@/lib/agents/v2/tools")
      const { generateObject } = await import("ai")

      generateObject.mockResolvedValueOnce({
        object: {
          name: "Premium Tee",
          name_ar: "تيشيرت فاخر",
          description: "A premium t-shirt.",
          description_ar: "تيشيرت فاخر.",
          category: "T-Shirts",
          category_ar: "تيشيرتات",
          tags: ["tee", "premium"],
          suggested_price: 150,
          ai_confidence: "high",
        },
      })

      const result = await generateProductDetails.execute!(
        {
          group_id: "g1",
          group_name: "Test",
          image_urls: ["https://example.com/1.jpg"],
          primary_image_url: "https://example.com/1.jpg",
          locale: "en" as const,
          store_type: "clothing" as const,
          store_id: "store-1",
          merchant_id: "merchant-1",
        },
        { toolCallId: "test", messages: [], abortSignal: undefined as any }
      )
      expect(result.success).toBe(true)
      expect(result.draft_id).toBe("draft-123")
      expect(result.details.name).toBe("Premium Tee")
    })
  })

  describe("renderDraftCards", () => {
    it("should fetch and return drafts", async () => {
      const { renderDraftCards } = await import("@/lib/agents/v2/tools")
      const result = await renderDraftCards.execute!(
        { draft_ids: ["draft-123"] },
        { toolCallId: "test", messages: [], abortSignal: undefined as any }
      )
      expect(result.type).toBe("render_draft_cards")
      expect(result.drafts).toHaveLength(1)
      expect(result.drafts[0].id).toBe("draft-123")
    })
  })

  describe("rewriteText", () => {
    it("should validate parameters", async () => {
      const { rewriteText } = await import("@/lib/agents/v2/tools")
      const parsed = rewriteText.parameters.safeParse({
        text: "Hello",
        instruction: "make shorter",
        field: "name",
        locale: "en",
      })
      expect(parsed.success).toBe(true)
    })

    it("should reject invalid field", async () => {
      const { rewriteText } = await import("@/lib/agents/v2/tools")
      const parsed = rewriteText.parameters.safeParse({
        text: "Hello",
        instruction: "shorter",
        field: "invalid_field",
        locale: "en",
      })
      expect(parsed.success).toBe(false)
    })
  })

  describe("askUser", () => {
    it("should return ask_user payload", async () => {
      const { askUser } = await import("@/lib/agents/v2/tools")
      const result = await askUser.execute!(
        {
          question: "Proceed?",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        { toolCallId: "test", messages: [], abortSignal: undefined as any }
      )

      expect(result.type).toBe("ask_user")
      expect(result.options).toHaveLength(2)
    })
  })

  describe("discardDrafts", () => {
    it("should mark drafts as discarded", async () => {
      const { discardDrafts } = await import("@/lib/agents/v2/tools")
      const result = await discardDrafts.execute!(
        { draft_ids: ["d1", "d2"] },
        { toolCallId: "test", messages: [], abortSignal: undefined as any }
      )
      expect(result.success).toBe(true)
      expect(result.discarded_count).toBe(2)
    })
  })
})
