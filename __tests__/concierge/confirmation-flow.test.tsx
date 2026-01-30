import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ClientDraftGrid } from "@/components/admin/generative-ui/client-draft-grid"
import type { ProductDraft, AgentContext } from "@/lib/agents/v2/schemas"

/**
 * Confirmation Flow Tests
 *
 * These tests verify that the confirmation gate works correctly:
 * 1. NO persistence happens without user clicking confirm
 * 2. Confirmation card is shown before any database operations
 * 3. User can cancel without side effects
 * 4. Persistence only occurs after explicit confirmation
 */

// Mock the AI SDK hooks
jest.mock("ai/rsc", () => ({
  useActions: jest.fn(),
}))

// Mock the child components
jest.mock("@/components/admin/generative-ui/draft-grid", () => ({
  DraftGrid: ({ onApprove, onEdit, onDiscard }: any) => (
    <div data-testid="draft-grid">
      <button data-testid="approve-btn" onClick={() => onApprove(["draft-1", "draft-2"])}>
        Approve
      </button>
      <button data-testid="edit-btn" onClick={() => onEdit("draft-1", "name")}>
        Edit
      </button>
      <button data-testid="discard-btn" onClick={() => onDiscard(["draft-1"])}>
        Discard
      </button>
    </div>
  ),
}))

jest.mock("@/components/admin/generative-ui/confirmation-card", () => ({
  ConfirmationCard: ({ onConfirm, onCancel, draftIds }: any) => (
    <div data-testid="confirmation-card">
      <p>Confirm {draftIds.length} products</p>
      <button data-testid="confirm-btn" onClick={() => onConfirm(draftIds)}>
        Confirm
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}))

jest.mock("@/components/admin/generative-ui/status-card", () => ({
  StatusCard: ({ success, message }: any) => (
    <div data-testid="status-card">
      <p>{success ? "Success" : "Failed"}</p>
      <p>{message}</p>
    </div>
  ),
}))

jest.mock("@/components/admin/generative-ui/progress-card", () => ({
  ProgressCard: ({ message }: any) => (
    <div data-testid="progress-card">
      <p>{message}</p>
    </div>
  ),
}))

describe("ConfirmationCard Flow", () => {
  let mockConfirmAndPersistDrafts: jest.Mock
  let mockDiscardDraftsAction: jest.Mock
  let mockUpdateDraftAction: jest.Mock

  const mockDrafts: ProductDraft[] = [
    {
      draft_id: "draft-1",
      name: "Product 1",
      description: "Test product 1",
      ai_confidence: "high",
      status: "draft",
    } as ProductDraft,
    {
      draft_id: "draft-2",
      name: "Product 2",
      description: "Test product 2",
      ai_confidence: "medium",
      status: "draft",
    } as ProductDraft,
  ]

  const mockContext: AgentContext = {
    merchant_id: "test-merchant",
    store_id: "test-store",
    locale: "en",
    mode: "onboarding",
  }

  beforeEach(() => {
    // Reset all mocks before each test
    mockConfirmAndPersistDrafts = jest.fn()
    mockDiscardDraftsAction = jest.fn()
    mockUpdateDraftAction = jest.fn()

    const { useActions } = require("ai/rsc")
    useActions.mockReturnValue({
      confirmAndPersistDrafts: mockConfirmAndPersistDrafts,
      discardDraftsAction: mockDiscardDraftsAction,
      updateDraftAction: mockUpdateDraftAction,
    })
  })

  it("should NOT persist drafts without user confirmation", async () => {
    render(<ClientDraftGrid drafts={mockDrafts} context={mockContext} />)

    // Initially, the draft grid should be shown
    expect(screen.getByTestId("draft-grid")).toBeInTheDocument()

    // Click approve button
    const approveBtn = screen.getByTestId("approve-btn")
    fireEvent.click(approveBtn)

    // Confirmation card should now be shown
    await waitFor(() => {
      expect(screen.getByTestId("confirmation-card")).toBeInTheDocument()
    })

    // CRITICAL: confirmAndPersistDrafts should NOT have been called yet
    expect(mockConfirmAndPersistDrafts).not.toHaveBeenCalled()

    // Draft grid should no longer be visible
    expect(screen.queryByTestId("draft-grid")).not.toBeInTheDocument()
  })

  it("should allow user to cancel without persisting", async () => {
    render(<ClientDraftGrid drafts={mockDrafts} context={mockContext} />)

    // Click approve
    fireEvent.click(screen.getByTestId("approve-btn"))

    // Wait for confirmation card
    await waitFor(() => {
      expect(screen.getByTestId("confirmation-card")).toBeInTheDocument()
    })

    // Click cancel
    const cancelBtn = screen.getByTestId("cancel-btn")
    fireEvent.click(cancelBtn)

    // Should return to draft grid
    await waitFor(() => {
      expect(screen.getByTestId("draft-grid")).toBeInTheDocument()
    })

    // confirmAndPersistDrafts should NEVER have been called
    expect(mockConfirmAndPersistDrafts).not.toHaveBeenCalled()

    // Confirmation card should be gone
    expect(screen.queryByTestId("confirmation-card")).not.toBeInTheDocument()
  })

  it("should persist drafts only after user confirms", async () => {
    // Mock successful persistence
    mockConfirmAndPersistDrafts.mockResolvedValue({
      success: true,
      product_ids: ["prod-1", "prod-2"],
      count: 2,
      message: "Successfully added 2 products",
    })

    render(<ClientDraftGrid drafts={mockDrafts} context={mockContext} />)

    // Click approve
    fireEvent.click(screen.getByTestId("approve-btn"))

    // Wait for confirmation card
    await waitFor(() => {
      expect(screen.getByTestId("confirmation-card")).toBeInTheDocument()
    })

    // Verify no calls yet
    expect(mockConfirmAndPersistDrafts).not.toHaveBeenCalled()

    // Click confirm button
    const confirmBtn = screen.getByTestId("confirm-btn")
    fireEvent.click(confirmBtn)

    // NOW confirmAndPersistDrafts should be called
    await waitFor(() => {
      expect(mockConfirmAndPersistDrafts).toHaveBeenCalledTimes(1)
    })

    // Verify correct arguments
    expect(mockConfirmAndPersistDrafts).toHaveBeenCalledWith(
      ["draft-1", "draft-2"],
      mockContext
    )

    // Should show progress card while persisting
    expect(screen.getByTestId("progress-card")).toBeInTheDocument()

    // After persistence completes, should show status card
    await waitFor(() => {
      expect(screen.getByTestId("status-card")).toBeInTheDocument()
    })

    // Status card should show success
    expect(screen.getByText("Success")).toBeInTheDocument()
    expect(screen.getByText("Successfully added 2 products")).toBeInTheDocument()
  })

  it("should handle persistence errors gracefully", async () => {
    // Mock failed persistence
    mockConfirmAndPersistDrafts.mockResolvedValue({
      success: false,
      error: "Database connection failed",
    })

    render(<ClientDraftGrid drafts={mockDrafts} context={mockContext} />)

    // Go through approval flow
    fireEvent.click(screen.getByTestId("approve-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-card")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId("confirm-btn"))

    // Wait for status card
    await waitFor(() => {
      expect(screen.getByTestId("status-card")).toBeInTheDocument()
    })

    // Should show failure status
    expect(screen.getByText("Failed")).toBeInTheDocument()
    expect(screen.getByText("Database connection failed")).toBeInTheDocument()
  })

  it("should NOT call discard or update during approval flow", async () => {
    render(<ClientDraftGrid drafts={mockDrafts} context={mockContext} />)

    // Click approve
    fireEvent.click(screen.getByTestId("approve-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-card")).toBeInTheDocument()
    })

    // Verify ONLY the state changed, no server actions called
    expect(mockConfirmAndPersistDrafts).not.toHaveBeenCalled()
    expect(mockDiscardDraftsAction).not.toHaveBeenCalled()
    expect(mockUpdateDraftAction).not.toHaveBeenCalled()
  })

  it("should pass correct draft IDs through the flow", async () => {
    mockConfirmAndPersistDrafts.mockResolvedValue({
      success: true,
      product_ids: ["prod-1", "prod-2"],
      count: 2,
      message: "Success",
    })

    render(<ClientDraftGrid drafts={mockDrafts} context={mockContext} />)

    // Approve triggers with specific IDs
    fireEvent.click(screen.getByTestId("approve-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-card")).toBeInTheDocument()
    })

    // Confirmation card should show correct count
    expect(screen.getByText("Confirm 2 products")).toBeInTheDocument()

    // Confirm and verify IDs passed correctly
    fireEvent.click(screen.getByTestId("confirm-btn"))

    await waitFor(() => {
      expect(mockConfirmAndPersistDrafts).toHaveBeenCalledWith(
        ["draft-1", "draft-2"],
        mockContext
      )
    })
  })
})
