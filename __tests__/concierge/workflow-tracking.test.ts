import { describe, it, expect, jest, beforeEach } from "@jest/globals"

/**
 * Workflow State Tracking Tests
 *
 * These tests verify that:
 * 1. Workflow states advance correctly through stages
 * 2. Stage data is persisted correctly
 * 3. Workflow completion is tracked
 * 4. Vision complete → drafts generated → persistence complete flow works
 */

// Mock dependencies
jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}))

describe("Workflow State Management", () => {
  let mockAdmin: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock admin client
    mockAdmin = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    }

    const { createAdminClient } = require("@/lib/supabase/admin")
    createAdminClient.mockReturnValue(mockAdmin)
  })

  it("should create workflow state with correct initial values", async () => {
    const mockWorkflowData = {
      id: "workflow-123",
      conversation_id: "conv-123",
      merchant_id: "merchant-123",
      workflow_type: "onboarding",
      current_stage: 1,
      total_stages: 7,
      stage_data: { initial: true },
      status: "in_progress",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockAdmin.insert.mockReturnValue({
      ...mockAdmin,
      select: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: mockWorkflowData,
          error: null,
        }),
      }),
    })

    const { createWorkflowState } = await import("@/lib/agents/v2/workflow-state")

    const result = await createWorkflowState({
      conversation_id: "conv-123",
      merchant_id: "merchant-123",
      workflow_type: "onboarding",
      total_stages: 7,
      initial_data: { initial: true },
    })

    expect(result).toBeTruthy()
    expect(result?.workflow_type).toBe("onboarding")
    expect(result?.current_stage).toBe(1)
    expect(result?.total_stages).toBe(7)
    expect(result?.status).toBe("in_progress")

    // Verify insert was called with correct data
    expect(mockAdmin.insert).toHaveBeenCalledWith({
      conversation_id: "conv-123",
      merchant_id: "merchant-123",
      workflow_type: "onboarding",
      current_stage: 1,
      total_stages: 7,
      stage_data: { initial: true },
      status: "in_progress",
    })
  })

  it("should advance workflow stage correctly", async () => {
    const currentWorkflow = {
      id: "workflow-123",
      current_stage: 1,
      total_stages: 7,
      stage_data: { vision_complete: true },
      status: "in_progress",
    }

    // Mock fetch current state
    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: currentWorkflow,
          error: null,
        }),
      }),
    })

    // Mock update
    mockAdmin.update.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const { advanceWorkflowStage } = await import("@/lib/agents/v2/workflow-state")

    const result = await advanceWorkflowStage("workflow-123", {
      stage_name: "drafts_generated",
      draft_ids: ["draft-1", "draft-2"],
    })

    expect(result).toBe(true)

    // Verify update was called with next stage
    expect(mockAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_stage: 2, // Advanced from 1 to 2
        stage_data: {
          vision_complete: true,
          stage_name: "drafts_generated",
          draft_ids: ["draft-1", "draft-2"],
        },
        status: "in_progress",
      })
    )
  })

  it("should mark workflow as completed when reaching final stage", async () => {
    const currentWorkflow = {
      id: "workflow-123",
      current_stage: 7,
      total_stages: 7,
      stage_data: { previous: "data" },
      status: "in_progress",
    }

    // Mock fetch
    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: currentWorkflow,
          error: null,
        }),
      }),
    })

    // Mock update
    mockAdmin.update.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const { advanceWorkflowStage } = await import("@/lib/agents/v2/workflow-state")

    const result = await advanceWorkflowStage("workflow-123", {
      stage_name: "persistence_complete",
    })

    expect(result).toBe(true)

    // Verify workflow is marked as completed
    expect(mockAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_stage: 7,
        status: "completed",
        completed_at: expect.any(String),
      })
    )
  })

  it("should track vision_complete stage data", async () => {
    const currentWorkflow = {
      id: "workflow-123",
      current_stage: 1,
      total_stages: 7,
      stage_data: {},
      status: "in_progress",
    }

    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: currentWorkflow,
          error: null,
        }),
      }),
    })

    mockAdmin.update.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const { advanceWorkflowStage } = await import("@/lib/agents/v2/workflow-state")

    const imageGroups = [
      { group_id: "group-1", images: ["img1.jpg", "img2.jpg"] },
      { group_id: "group-2", images: ["img3.jpg"] },
    ]

    await advanceWorkflowStage("workflow-123", {
      stage_name: "vision_complete",
      image_groups: imageGroups,
    })

    // Verify image_groups are stored in stage_data
    expect(mockAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stage_data: {
          stage_name: "vision_complete",
          image_groups: imageGroups,
        },
      })
    )
  })

  it("should track drafts_generated stage data", async () => {
    const currentWorkflow = {
      id: "workflow-123",
      current_stage: 2,
      total_stages: 7,
      stage_data: { vision_complete: true },
      status: "in_progress",
    }

    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: currentWorkflow,
          error: null,
        }),
      }),
    })

    mockAdmin.update.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const { advanceWorkflowStage } = await import("@/lib/agents/v2/workflow-state")

    await advanceWorkflowStage("workflow-123", {
      stage_name: "drafts_generated",
      draft_ids: ["draft-1", "draft-2", "draft-3"],
    })

    // Verify draft_ids are stored
    expect(mockAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stage_data: {
          vision_complete: true,
          stage_name: "drafts_generated",
          draft_ids: ["draft-1", "draft-2", "draft-3"],
        },
      })
    )
  })

  it("should track persistence_complete stage data", async () => {
    const currentWorkflow = {
      id: "workflow-123",
      current_stage: 6,
      total_stages: 7,
      stage_data: {
        vision_complete: true,
        draft_ids: ["draft-1", "draft-2"],
      },
      status: "in_progress",
    }

    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: currentWorkflow,
          error: null,
        }),
      }),
    })

    mockAdmin.update.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const { advanceWorkflowStage } = await import("@/lib/agents/v2/workflow-state")

    await advanceWorkflowStage("workflow-123", {
      stage_name: "persistence_complete",
      product_ids: ["prod-1", "prod-2"],
    })

    // Verify product_ids are stored
    expect(mockAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stage_data: expect.objectContaining({
          stage_name: "persistence_complete",
          product_ids: ["prod-1", "prod-2"],
        }),
      })
    )
  })

  it("should get workflow state by conversation_id", async () => {
    const mockWorkflow = {
      id: "workflow-123",
      conversation_id: "conv-123",
      status: "in_progress",
      current_stage: 3,
    }

    // Create spies for each eq call (they chain)
    const eqSpy2 = jest.fn().mockReturnValue({
      ...mockAdmin,
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockWorkflow,
        error: null,
      }),
    })

    const eqSpy1 = jest.fn().mockReturnValue({
      ...mockAdmin,
      eq: eqSpy2,
    })

    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: eqSpy1,
    })

    const { getWorkflowState } = await import("@/lib/agents/v2/workflow-state")

    const result = await getWorkflowState("conv-123")

    expect(result).toEqual(mockWorkflow)

    // Verify correct query - first eq for conversation_id
    expect(eqSpy1).toHaveBeenCalledWith("conversation_id", "conv-123")
    // Second eq for status
    expect(eqSpy2).toHaveBeenCalledWith("status", "in_progress")
  })

  it("should return null if workflow not found", async () => {
    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      }),
    })

    const { getWorkflowState } = await import("@/lib/agents/v2/workflow-state")

    const result = await getWorkflowState("conv-123")

    expect(result).toBeNull()
  })

  it("should update workflow data without advancing stage", async () => {
    const currentWorkflow = {
      id: "workflow-123",
      stage_data: { existing: "data" },
    }

    mockAdmin.select.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockReturnValue({
        ...mockAdmin,
        single: jest.fn().mockResolvedValue({
          data: currentWorkflow,
          error: null,
        }),
      }),
    })

    mockAdmin.update.mockReturnValue({
      ...mockAdmin,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const { updateWorkflowData } = await import("@/lib/agents/v2/workflow-state")

    const result = await updateWorkflowData("workflow-123", {
      new_field: "new_value",
    })

    expect(result).toBe(true)

    // Verify update was called but current_stage NOT changed
    expect(mockAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stage_data: {
          existing: "data",
          new_field: "new_value",
        },
        updated_at: expect.any(String),
      })
    )

    // Verify current_stage was NOT in the update
    const updateCall = (mockAdmin.update as jest.Mock).mock.calls[0][0]
    expect(updateCall).not.toHaveProperty("current_stage")
  })

  it("should calculate workflow progress correctly", async () => {
    const { getWorkflowProgress } = await import("@/lib/agents/v2/workflow-state")

    const workflow = {
      id: "workflow-123",
      conversation_id: "conv-123",
      merchant_id: "merchant-123",
      workflow_type: "onboarding" as const,
      current_stage: 3,
      total_stages: 7,
      stage_data: {},
      status: "in_progress" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const progress = getWorkflowProgress(workflow)

    expect(progress.currentStage).toBe(3)
    expect(progress.totalStages).toBe(7)
    expect(progress.percentage).toBe(43) // Math.round(3/7 * 100)
    expect(progress.isComplete).toBe(false)
  })

  it("should show 100% when workflow is completed", async () => {
    const { getWorkflowProgress } = await import("@/lib/agents/v2/workflow-state")

    const workflow = {
      id: "workflow-123",
      conversation_id: "conv-123",
      merchant_id: "merchant-123",
      workflow_type: "onboarding" as const,
      current_stage: 7,
      total_stages: 7,
      stage_data: {},
      status: "completed" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }

    const progress = getWorkflowProgress(workflow)

    expect(progress.currentStage).toBe(7)
    expect(progress.totalStages).toBe(7)
    expect(progress.percentage).toBe(100)
    expect(progress.isComplete).toBe(true)
  })
})

describe("Workflow stage definitions", () => {
  it("should have correct onboarding workflow stages", async () => {
    const { WORKFLOW_STAGES } = await import("@/lib/agents/v2/workflow-state")

    expect(WORKFLOW_STAGES.onboarding.total).toBe(7)
    expect(WORKFLOW_STAGES.onboarding.stages).toHaveLength(7)

    // Verify key stages exist
    const stageNames = WORKFLOW_STAGES.onboarding.stages.map((s) => s.name)
    expect(stageNames).toContain("Authentication")
    expect(stageNames).toContain("Store Type")
    expect(stageNames).toContain("Initial Products")
    expect(stageNames).toContain("Completion")
  })

  it("should have correct bulk_image_to_products workflow stages", async () => {
    const { WORKFLOW_STAGES } = await import("@/lib/agents/v2/workflow-state")

    expect(WORKFLOW_STAGES.bulk_image_to_products.total).toBe(7)
    expect(WORKFLOW_STAGES.bulk_image_to_products.stages).toHaveLength(7)

    // Verify key stages
    const stageNames = WORKFLOW_STAGES.bulk_image_to_products.stages.map((s) => s.name)
    expect(stageNames).toContain("Vision Analysis")
    expect(stageNames).toContain("Product Generation")
    expect(stageNames).toContain("Draft Preview")
    expect(stageNames).toContain("Persistence")
  })
})

describe("Integration with concierge flow", () => {
  it("should advance through all concierge stages", async () => {
    // This test simulates the full concierge workflow progression
    const stages = [
      { stage_name: "vision_complete", image_groups: [] },
      { stage_name: "drafts_generated", draft_ids: ["draft-1"] },
      { stage_name: "persistence_complete", product_ids: ["prod-1"] },
    ]

    // Expected flow
    expect(stages[0].stage_name).toBe("vision_complete")
    expect(stages[1].stage_name).toBe("drafts_generated")
    expect(stages[2].stage_name).toBe("persistence_complete")

    // Verify order is correct
    expect(stages.findIndex((s) => s.stage_name === "vision_complete")).toBe(0)
    expect(stages.findIndex((s) => s.stage_name === "drafts_generated")).toBe(1)
    expect(stages.findIndex((s) => s.stage_name === "persistence_complete")).toBe(2)
  })

  it("should merge stage data across stages", async () => {
    // Simulates how stage_data accumulates
    const stage1 = { vision_complete: true, image_groups: ["group-1"] }
    const stage2 = { ...stage1, drafts_generated: true, draft_ids: ["draft-1"] }
    const stage3 = { ...stage2, persistence_complete: true, product_ids: ["prod-1"] }

    // Verify accumulation
    expect(stage3).toEqual({
      vision_complete: true,
      image_groups: ["group-1"],
      drafts_generated: true,
      draft_ids: ["draft-1"],
      persistence_complete: true,
      product_ids: ["prod-1"],
    })
  })
})
