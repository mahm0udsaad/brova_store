import { describe, it, expect, jest, beforeEach } from "@jest/globals"

/**
 * Integration tests for the V2 bulk image → product workflow.
 *
 * Tests the full flow: vision grouping → product intel → draft review → persist.
 * Uses mocked AI models but real tool schemas.
 */

// Mock chain
jest.mock("@/lib/ai/gateway", () => ({
  models: { pro: "gemini-pro", flash: "gemini-flash" },
}))

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}))

jest.mock("ai", () => ({
  tool: jest.fn((config: any) => config),
  generateText: jest.fn(() => Promise.resolve({ text: "Rewritten Text" })),
  generateObject: jest.fn(),
}))

jest.mock("@/lib/ai/tool-loop-agent", () => ({
  ToolLoopAgent: jest.fn().mockImplementation((config: any) => config),
  stepCountIs: jest.fn((n: number) => ({ type: "stepCount", maxSteps: n })),
}))

describe("Bulk Workflow V2 Integration", () => {
  const mockDraft = {
    id: "draft-1",
    store_id: "s1",
    merchant_id: "m1",
    name: "Premium Tee",
    name_ar: "تيشيرت فاخر",
    description: "A great product",
    description_ar: "منتج رائع",
    category: "T-Shirts",
    category_ar: "تيشيرتات",
    tags: ["streetwear"],
    suggested_price: 150,
    image_urls: ["https://img.com/1.jpg"],
    primary_image_url: "https://img.com/1.jpg",
    ai_confidence: "high",
    status: "draft",
  }

  const mockStoreInsert = jest.fn(() => ({
    select: jest.fn(() => ({ data: [{ id: "product-new-1" }], error: null })),
  }))

  const mockSupabase = {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: "m1" } }, error: null })
      ),
    },
    from: jest.fn((table: string) => {
      if (table === "product_drafts") {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              eq: jest.fn(() => ({ data: [mockDraft], error: null })),
              order: jest.fn(() => ({ data: [mockDraft], error: null })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ data: { id: "draft-1" }, error: null })),
            })),
          })),
          update: jest.fn(() => ({
            in: jest.fn(() => ({ error: null })),
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { ...mockDraft, name: "New Name" },
                  error: null,
                })),
              })),
            })),
          })),
        }
      }

      if (table === "store_products") {
        return { insert: mockStoreInsert }
      }

      if (table === "ai_tasks") {
        return { insert: jest.fn(() => ({ error: null })) }
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

  describe("Step 1: Vision Agent groups images", () => {
    it("should group images via analyzeImages tool", async () => {
      const { analyzeImages } = await import("@/lib/agents/v2/tools")
      const { generateObject } = await import("ai")

      generateObject.mockResolvedValueOnce({
        object: {
          groups: [
            {
              id: "group-1",
              name: "Black T-Shirt",
              image_urls: ["https://img.com/1.jpg", "https://img.com/2.jpg"],
              primary_image_url: "https://img.com/1.jpg",
              category_hint: "t-shirts",
              confidence: "high",
            },
          ],
        },
      })
      const result = await analyzeImages.execute!(
        {
          image_urls: ["https://img.com/1.jpg", "https://img.com/2.jpg"],
          batch_id: "batch-1",
        },
        { toolCallId: "tc1", messages: [], abortSignal: undefined as any }
      )

      expect(result.total_groups).toBe(1)
      expect(result.groups[0].id).toBe("group-1")
      expect(result.groups[0].image_urls).toHaveLength(2)
      expect(result.batch_id).toBe("batch-1")
    })
  })

  describe("Step 2: Product Intel Agent generates drafts", () => {
    it("should generate bilingual details and save draft", async () => {
      const { generateProductDetails } = await import("@/lib/agents/v2/tools")
      const { generateObject } = await import("ai")

      generateObject.mockResolvedValueOnce({
        object: {
          name: "Premium Tee",
          name_ar: "تيشيرت فاخر",
          description: "A great product",
          description_ar: "منتج رائع",
          category: "T-Shirts",
          category_ar: "تيشيرتات",
          tags: ["streetwear"],
          suggested_price: 150,
          ai_confidence: "high",
        },
      })
      const result = await generateProductDetails.execute!(
        {
          group_id: "group-1",
          group_name: "Black T-Shirt",
          image_urls: ["https://img.com/1.jpg"],
          primary_image_url: "https://img.com/1.jpg",
          category_hint: "t-shirts",
          locale: "en" as const,
          store_type: "clothing" as const,
          store_id: "s1",
          merchant_id: "m1",
          batch_id: "batch-1",
          group_index: 0,
        },
        { toolCallId: "tc2", messages: [], abortSignal: undefined as any }
      )

      expect(result.success).toBe(true)
      expect(result.draft_id).toBeDefined()
      expect(result.details.name).toBe("Premium Tee")
      expect(result.details.name_ar).toBe("تيشيرت فاخر")
      expect(result.details.suggested_price).toBe(150)
    })
  })

  describe("Step 3: Render draft cards for review", () => {
    it("should fetch and format drafts", async () => {
      const { renderDraftCards } = await import("@/lib/agents/v2/tools")
      const result = await renderDraftCards.execute!(
        { draft_ids: ["draft-1"] },
        { toolCallId: "tc3", messages: [], abortSignal: undefined as any }
      )

      expect(result.type).toBe("render_draft_cards")
      expect(result.drafts).toHaveLength(1)
      expect(result.drafts[0].name).toBe("Premium Tee")
    })
  })

  describe("Step 4: Confirm and persist", () => {
    it("should copy drafts to store_products", async () => {
      const { confirmAndPersist } = await import("@/lib/agents/v2/tools")
      const result = await confirmAndPersist.execute!(
        {
          draft_ids: ["draft-1"],
        },
        { toolCallId: "tc4", messages: [], abortSignal: undefined as any }
      )

      expect(result.success).toBe(true)
      expect(result.count).toBe(1)
      expect(result.product_ids).toContain("product-new-1")

      // Verify insert was called with correct data
      expect(mockStoreInsert).toHaveBeenCalled()
    })
  })

  describe("Step 5: Discard unwanted drafts", () => {
    it("should mark drafts as discarded", async () => {
      const { discardDrafts } = await import("@/lib/agents/v2/tools")
      const result = await discardDrafts.execute!(
        { draft_ids: ["draft-1"] },
        { toolCallId: "tc5", messages: [], abortSignal: undefined as any }
      )

      expect(result.success).toBe(true)
      expect(result.discarded_count).toBe(1)
    })
  })

  describe("Edit workflow", () => {
    it("should rewrite text via editing tool", async () => {
      const { rewriteText } = await import("@/lib/agents/v2/tools")
      const result = await rewriteText.execute!(
        {
          text: "Premium Tee",
          instruction: "make it shorter",
          field: "name" as const,
          locale: "en" as const,
        },
        { toolCallId: "tc6", messages: [], abortSignal: undefined as any }
      )

      expect(result.original).toBe("Premium Tee")
      expect(result.rewritten).toBeDefined()
    })

    it("should update a draft field", async () => {
      const { updateDraft } = await import("@/lib/agents/v2/tools")
      const result = await updateDraft.execute!(
        {
          draft_id: "draft-1",
          updates: { name: "New Name" },
        },
        { toolCallId: "tc7", messages: [], abortSignal: undefined as any }
      )

      expect(result.success).toBe(true)
      expect(result.updated_fields).toContain("name")
      expect(result.draft.name).toBe("New Name")
    })
  })

  describe("Data isolation", () => {
    it("should require draft_ids for confirm_and_persist", async () => {
      const { confirmAndPersist } = await import("@/lib/agents/v2/tools")
      const parsed = confirmAndPersist.parameters.safeParse({
        // missing draft_ids
      })
      expect(parsed.success).toBe(false)
    })

    it("should require draft_ids for discard_drafts", async () => {
      const { discardDrafts } = await import("@/lib/agents/v2/tools")
      const parsed = discardDrafts.parameters.safeParse({
        // missing draft_ids
      })
      expect(parsed.success).toBe(false)
    })

    it("should require draft_id and updates for update_draft", async () => {
      const { updateDraft } = await import("@/lib/agents/v2/tools")
      const parsed = updateDraft.parameters.safeParse({
        // missing draft_id and updates
      })
      expect(parsed.success).toBe(false)
    })
  })
})
