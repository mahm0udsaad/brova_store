import { describe, it, expect } from "@jest/globals"
import {
  groupByDependencyLevel,
  resolveParameterReferences,
  type StepResult,
} from "@/lib/agents/parallel-executor"
import type { ExecutionStep } from "@/lib/agents/types"

describe("Parallel Executor", () => {
  describe("groupByDependencyLevel", () => {
    it("should group independent steps at the same level", () => {
      const steps: ExecutionStep[] = [
        { id: "step1", agent: "product", action: "create", params: {}, dependsOn: [], status: "pending" },
        { id: "step2", agent: "product", action: "update", params: {}, dependsOn: [], status: "pending" },
        { id: "step3", agent: "marketer", action: "generate", params: {}, dependsOn: [], status: "pending" },
      ]

      const levels = groupByDependencyLevel(steps)

      expect(levels).toHaveLength(1)
      expect(levels[0]).toHaveLength(3)
    })

    it("should group dependent steps at different levels", () => {
      const steps: ExecutionStep[] = [
        { id: "step1", agent: "product", action: "create", params: {}, dependsOn: [], status: "pending" },
        { id: "step2", agent: "product", action: "update", params: {}, dependsOn: ["step1"], status: "pending" },
        { id: "step3", agent: "marketer", action: "generate", params: {}, dependsOn: ["step2"], status: "pending" },
      ]

      const levels = groupByDependencyLevel(steps)

      expect(levels).toHaveLength(3)
      expect(levels[0]).toHaveLength(1)
      expect(levels[0][0].id).toBe("step1")
      expect(levels[1][0].id).toBe("step2")
      expect(levels[2][0].id).toBe("step3")
    })

    it("should handle mixed dependencies", () => {
      const steps: ExecutionStep[] = [
        { id: "step1", agent: "product", action: "create", params: {}, dependsOn: [], status: "pending" },
        { id: "step2", agent: "product", action: "create", params: {}, dependsOn: [], status: "pending" },
        { id: "step3", agent: "marketer", action: "generate", params: {}, dependsOn: ["step1", "step2"], status: "pending" },
      ]

      const levels = groupByDependencyLevel(steps)

      expect(levels).toHaveLength(2)
      expect(levels[0]).toHaveLength(2)
      expect(levels[1]).toHaveLength(1)
      expect(levels[1][0].id).toBe("step3")
    })
  })

  describe("resolveParameterReferences", () => {
    it("should resolve step references", () => {
      const results = new Map<string, StepResult>([
        ["step1", { stepId: "step1", success: true, data: { images: ["url1", "url2"] } }],
      ])

      const params = {
        imageUrls: "$step:step1.images",
      }

      const resolved = resolveParameterReferences(params, results)

      expect(resolved.imageUrls).toEqual(["url1", "url2"])
    })

    it("should resolve nested references", () => {
      const results = new Map<string, StepResult>([
        ["step1", { stepId: "step1", success: true, data: { product: { id: "123", name: "Test" } } }],
      ])

      const params = {
        productId: "$step:step1.product.id",
        productName: "$step:step1.product.name",
      }

      const resolved = resolveParameterReferences(params, results)

      expect(resolved.productId).toBe("123")
      expect(resolved.productName).toBe("Test")
    })

    it("should handle array references", () => {
      const results = new Map<string, StepResult>([
        ["step1", { stepId: "step1", success: true, data: { urls: ["a", "b", "c"] } }],
      ])

      const params = {
        items: [
          { url: "$step:step1.urls.0" },
          { url: "$step:step1.urls.1" },
        ],
      }

      const resolved = resolveParameterReferences(params, results)

      expect(resolved.items[0].url).toBe("a")
      expect(resolved.items[1].url).toBe("b")
    })

    it("should keep non-reference values unchanged", () => {
      const results = new Map<string, StepResult>()

      const params = {
        name: "Product Name",
        price: 100,
        active: true,
      }

      const resolved = resolveParameterReferences(params, results)

      expect(resolved).toEqual(params)
    })

    it("should handle missing step references gracefully", () => {
      const results = new Map<string, StepResult>()

      const params = {
        imageUrls: "$step:nonexistent.images",
      }

      const resolved = resolveParameterReferences(params, results)

      expect(resolved.imageUrls).toBe("$step:nonexistent.images")
    })
  })
})
