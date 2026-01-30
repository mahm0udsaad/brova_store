import { describe, it, expect } from "@jest/globals"
import { extractUIComponents } from "@/lib/agents/v2/ui-renderer"

describe("UI Renderer - extractUIComponents", () => {
  it("should return empty array for steps with no tool calls", () => {
    const result = extractUIComponents([{ toolCalls: undefined }])
    expect(result).toEqual([])
  })

  it("should extract question_card from ask_user tool call", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "ask_user",
            args: {
              question: "Are these grouped correctly?",
              options: [
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ],
              allow_multiple: false,
            },
          },
        ],
        toolResults: [{ result: undefined }],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("question_card")
    expect(result[0].data.question).toBe("Are these grouped correctly?")
    expect(result[0].data.options).toHaveLength(2)
  })

  it("should extract draft_grid from render_draft_cards", () => {
    const drafts = [
      {
        draft_id: "d1",
        name: "Test",
        image_urls: ["url"],
        primary_image_url: "url",
        status: "draft",
      },
    ]

    const result = extractUIComponents([
      {
        toolCalls: [{ toolName: "render_draft_cards", args: { draft_ids: ["d1"] } }],
        toolResults: [{ result: { success: true, drafts } }],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("draft_grid")
    expect(result[0].data.drafts).toEqual(drafts)
  })

  it("should extract status_card from confirm_and_persist", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "confirm_and_persist",
            args: { draft_ids: ["d1"], store_id: "s1", merchant_id: "m1" },
          },
        ],
        toolResults: [
          {
            result: {
              success: true,
              created_count: 1,
              failed_count: 0,
              created_product_ids: ["p1"],
              failed_draft_ids: [],
            },
          },
        ],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("status_card")
    expect(result[0].data.success).toBe(true)
    expect(result[0].data.title).toBe("Products Created")
  })

  it("should extract failure status_card from confirm_and_persist", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "confirm_and_persist",
            args: { draft_ids: ["d1"], store_id: "s1", merchant_id: "m1" },
          },
        ],
        toolResults: [
          {
            result: {
              success: false,
              created_count: 0,
              failed_count: 1,
              created_product_ids: [],
              failed_draft_ids: ["d1"],
            },
          },
        ],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].data.success).toBe(false)
    expect(result[0].data.title).toBe("Some Products Failed")
  })

  it("should extract question from delegate_to_vision with groups", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "delegate_to_vision",
            args: { image_urls: ["a.jpg", "b.jpg"] },
          },
        ],
        toolResults: [
          {
            result: {
              groups: [{ id: "g1", name: "Shirt" }],
              total_images: 2,
              total_groups: 1,
            },
          },
        ],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("question_card")
    expect(result[0].data.question).toContain("1 product group")
  })

  it("should extract confirmation from delegate_to_product_intel", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "delegate_to_product_intel",
            args: { groups: [] },
          },
        ],
        toolResults: [
          {
            result: {
              drafts: [{ draft_id: "d1", success: true }],
              failed: [],
              total: 1,
            },
          },
        ],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("confirmation_card")
    expect(result[0].data.draft_ids).toEqual(["d1"])
  })

  it("should extract status from discard_drafts", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "discard_drafts",
            args: { draft_ids: ["d1", "d2"], merchant_id: "m1" },
          },
        ],
        toolResults: [{ result: { success: true, discarded_count: 2 } }],
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("status_card")
    expect(result[0].data.title).toBe("Drafts Discarded")
  })

  it("should handle multiple steps with mixed tool calls", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          {
            toolName: "delegate_to_vision",
            args: { image_urls: ["a.jpg"] },
          },
        ],
        toolResults: [
          { result: { groups: [{ id: "g1" }], total_images: 1, total_groups: 1 } },
        ],
      },
      {
        toolCalls: [
          {
            toolName: "ask_user",
            args: {
              question: "Continue?",
              options: [{ label: "Yes", value: "yes" }],
            },
          },
        ],
        toolResults: [{ result: undefined }],
      },
    ])

    expect(result).toHaveLength(2)
    expect(result[0].type).toBe("question_card")
    expect(result[1].type).toBe("question_card")
  })

  it("should skip render_draft_cards when result is unsuccessful", () => {
    const result = extractUIComponents([
      {
        toolCalls: [
          { toolName: "render_draft_cards", args: { draft_ids: ["d1"] } },
        ],
        toolResults: [{ result: { success: false, error: "Not found" } }],
      },
    ])

    expect(result).toHaveLength(0)
  })
})
