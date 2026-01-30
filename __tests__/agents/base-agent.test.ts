import { describe, it, expect, beforeEach } from "@jest/globals"
import { BaseAgent } from "@/lib/agents/base-agent"
import { agentRegistry } from "@/lib/agents/registry"
import type { AgentResult } from "@/lib/agents/types"

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  constructor(userId: string) {
    super(userId, "product")
  }

  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    if (action === "test_action") {
      return this.formatSuccess("Test successful", { params })
    }
    return this.formatError("Unknown action", action)
  }
}

describe("BaseAgent", () => {
  let agent: TestAgent

  beforeEach(() => {
    agent = new TestAgent("test-user-id")
  })

  it("should create an agent with correct type", () => {
    expect(agent).toBeInstanceOf(BaseAgent)
  })

  it("should get model from registry", () => {
    const model = agent["getModel"]()
    expect(model).toBeDefined()
  })

  it("should check capabilities", () => {
    const hasCapability = agent["hasCapability"]("create")
    expect(typeof hasCapability).toBe("boolean")
  })

  it("should get agent metadata", () => {
    const metadata = agent.getMetadata()
    expect(metadata).toBeDefined()
    expect(metadata?.type).toBe("product")
  })

  it("should format success response", () => {
    const result = agent["formatSuccess"]("Operation successful", { id: "123" }, 100)
    expect(result.success).toBe(true)
    expect(result.message).toBe("Operation successful")
    expect(result.data).toEqual({ id: "123" })
    expect(result.tokensUsed).toBe(100)
  })

  it("should format error response", () => {
    const error = new Error("Test error")
    const result = agent["formatError"](error, "test_action")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Test error")
  })

  it("should execute action successfully", async () => {
    const result = await agent.execute("test_action", { param1: "value1" })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ params: { param1: "value1" } })
  })

  it("should handle unknown action", async () => {
    const result = await agent.execute("unknown_action", {})
    expect(result.success).toBe(false)
    expect(result.error).toBe("Unknown action")
  })
})
