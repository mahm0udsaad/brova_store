import { describe, it, expect, jest, beforeEach } from "@jest/globals"

// Mock all external dependencies
jest.mock("@/lib/ai/gateway", () => ({
  models: { pro: "gemini-pro", flash: "gemini-flash" },
}))

jest.mock("ai", () => {
  const actualTool = jest.fn((config: any) => config)
  return {
    tool: actualTool,
    generateText: jest.fn(() => Promise.resolve({ text: "{}" })),
  }
})

jest.mock("@/lib/ai/tool-loop-agent", () => ({
  ToolLoopAgent: jest.fn().mockImplementation((config: any) => ({
    ...config,
    generate: jest.fn(() =>
      Promise.resolve({
        text: "Test response",
        steps: [],
        toolCalls: [],
        toolResults: [],
      })
    ),
    stream: jest.fn(() =>
      Promise.resolve({
        textStream: (async function* () {
          yield "Test "
          yield "stream"
        })(),
      })
    ),
  })),
  stepCountIs: jest.fn((n: number) => ({ type: "stepCount", maxSteps: n })),
}))

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: { id: "d1" }, error: null })),
        })),
      })),
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => ({ data: [], error: null })),
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({ data: [], error: null })),
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({ error: null })),
        })),
        in: jest.fn(() => ({
          eq: jest.fn(() => ({ error: null })),
        })),
      })),
    })),
  })),
}))

jest.mock("@/lib/bulk-processing/image-grouper", () => ({
  groupImagesByVisualSimilarity: jest.fn(() => Promise.resolve([])),
}))

jest.mock("@/lib/bulk-processing/product-creator", () => ({
  suggestPricing: jest.fn(() => Promise.resolve(null)),
}))

describe("V2 Manager Agent", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create a manager agent with correct context", async () => {
    const { createManagerAgent } = await import("@/lib/agents/v2/manager-agent")
    const { ToolLoopAgent } = await import("@/lib/ai/tool-loop-agent")

    const agent = createManagerAgent({
      merchant_id: "m1",
      store_id: "s1",
      locale: "en",
      store_type: "clothing",
    })

    expect(ToolLoopAgent).toHaveBeenCalledTimes(1)
    const config = (ToolLoopAgent as jest.Mock).mock.calls[0][0]

    // System prompt contains context
    expect(config.system).toContain("m1")
    expect(config.system).toContain("s1")
    expect(config.system).toContain("fashion/streetwear")
  })

  it("should include all required tools", async () => {
    const { createManagerAgent } = await import("@/lib/agents/v2/manager-agent")
    const { ToolLoopAgent } = await import("@/lib/ai/tool-loop-agent")

    createManagerAgent({
      merchant_id: "m1",
      store_id: "s1",
      locale: "ar",
      store_type: "car_care",
    })

    const config = (ToolLoopAgent as jest.Mock).mock.calls[0][0]
    const toolNames = Object.keys(config.tools)

    expect(toolNames).toContain("delegate_to_vision")
    expect(toolNames).toContain("delegate_to_product_intel")
    expect(toolNames).toContain("delegate_to_editor")
    expect(toolNames).toContain("ask_user")
    expect(toolNames).toContain("render_draft_cards")
    expect(toolNames).toContain("confirm_and_persist")
    expect(toolNames).toContain("update_draft")
    expect(toolNames).toContain("discard_drafts")
    expect(toolNames).toContain("rewrite_text")
  })

  it("should set Arabic locale in system prompt", async () => {
    const { createManagerAgent } = await import("@/lib/agents/v2/manager-agent")
    const { ToolLoopAgent } = await import("@/lib/ai/tool-loop-agent")

    createManagerAgent({
      merchant_id: "m1",
      store_id: "s1",
      locale: "ar",
      store_type: "clothing",
    })

    const config = (ToolLoopAgent as jest.Mock).mock.calls[0][0]
    expect(config.system).toContain("Arabic")
  })

  it("should set car_care store type in system prompt", async () => {
    const { createManagerAgent } = await import("@/lib/agents/v2/manager-agent")
    const { ToolLoopAgent } = await import("@/lib/ai/tool-loop-agent")

    createManagerAgent({
      merchant_id: "m1",
      store_id: "s1",
      locale: "en",
      store_type: "car_care",
    })

    const config = (ToolLoopAgent as jest.Mock).mock.calls[0][0]
    expect(config.system).toContain("car care")
  })

  it("should include batch_id in system prompt when provided", async () => {
    const { createManagerAgent } = await import("@/lib/agents/v2/manager-agent")
    const { ToolLoopAgent } = await import("@/lib/ai/tool-loop-agent")

    createManagerAgent({
      merchant_id: "m1",
      store_id: "s1",
      locale: "en",
      store_type: "clothing",
      batch_id: "batch-xyz",
    })

    const config = (ToolLoopAgent as jest.Mock).mock.calls[0][0]
    expect(config.system).toContain("batch-xyz")
  })

  it("should set stepCountIs(30) as stop condition", async () => {
    const { createManagerAgent } = await import("@/lib/agents/v2/manager-agent")
    const { stepCountIs } = await import("@/lib/ai/tool-loop-agent")

    createManagerAgent({
      merchant_id: "m1",
      store_id: "s1",
      locale: "en",
      store_type: "clothing",
    })

    expect(stepCountIs).toHaveBeenCalledWith(30)
  })
})
