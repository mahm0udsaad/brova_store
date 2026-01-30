# Workflow A Integration Guide

## Summary

All core components for Workflow A have been built. This document shows how to integrate them with the existing ConciergeProvider and ConciergeConversation.

## Files Created

### 1. Database & State (✅ Complete)
- `product_drafts` table (already exists in DB)
- `ai_workflow_state` table (already exists in DB)
- `lib/agents/v2/workflow-stages.ts` - Stage definitions

### 2. Hooks (✅ Complete)
- `components/admin-concierge/hooks/useDraftState.ts` - SessionStorage draft management
- `components/admin-concierge/hooks/useWorkflowState.ts` - Database workflow tracking
- `components/admin-concierge/hooks/useToolHandlers.ts` - Tool invocation routing

### 3. Components (✅ Complete)
- `components/admin-concierge/ImageUploadZone.tsx` - Image upload with Supabase
- `components/admin-concierge/WorkflowProgress.tsx` - Visual progress tracking

## Key Integration Points

### ConciergeProvider Updates Needed

**Replace API Calls:**
```typescript
// OLD: /api/admin/concierge (read-only service)
const response = await fetch("/api/admin/concierge", { ... })

// NEW: useAgentStream (Manager Agent with Generative UI)
const agentStream = useAgentStream({
  context: currentContext,
  onDraftCreated: (draftIds) => {
    // Handle draft creation
  },
  onProductsPersisted: (productIds) => {
    // Handle product persistence
  },
})
```

**Add Image Upload Handler:**
```typescript
const handleImageUpload = useCallback(async (urls: string[], batchId: string) => {
  // Create workflow state
  const workflow = await workflowState.createWorkflow({
    workflow_type: "onboarding",
    total_stages: getTotalWorkflowStages(),
  })

  // Trigger bulk workflow via agent
  agentStream.startBulkWorkflow(urls, batchId)
}, [agentStream, workflowState])
```

### ConciergeConversation Updates Needed

**Render Generative UI Components:**
```typescript
{messages.map((msg) => {
  const toolInvocations = msg.toolInvocations || []

  return (
    <>
      {/* Text message */}
      <MessageBubble>{msg.content}</MessageBubble>

      {/* Tool invocations → Generative UI */}
      {toolInvocations.map((tool) => {
        switch (tool.toolName) {
          case "ask_user":
            return (
              <QuestionCard
                question={tool.args.question}
                options={tool.args.options}
                onSelect={(value) => {
                  agentStream.respondToQuestion(tool.toolCallId, value)
                }}
              />
            )

          case "render_draft_cards":
            return (
              <DraftGrid
                drafts={tool.result?.drafts}
                onEdit={(draftId, field, instruction) => {
                  agentStream.requestEdit(draftId, field, instruction)
                }}
                onApprove={(draftIds) => {
                  agentStream.confirmDrafts(draftIds)
                }}
              />
            )

          case "confirm_and_persist":
            return (
              <ConfirmationCard
                productCount={tool.args.draft_ids?.length}
                onConfirm={() => {
                  // Agent handles persistence automatically
                }}
              />
            )

          // Similar for ProgressCard, BeforeAfterPreview, etc.
        }
      })}
    </>
  )
})}
```

### Manager Agent Updates Needed

**Add Onboarding Context:**
```typescript
// In manager-agent.ts system prompt, add:
${context.workflow_type === "onboarding" ? `
ONBOARDING WORKFLOW (User's first product creation):
- Current stage: ${context.current_stage}/7
- This is critical UX: User's first impression of your AI
- Be encouraging and patient
- Never auto-apply suggestions - always ask for confirmation
- If user hesitates, offer to skip to manual setup
` : ""}
```

## Workflow Stages

1. **Image Upload** - User uploads product images via ImageUploadZone
2. **Vision Analysis** - ProgressCard: "Analyzing images..."
3. **Group Confirmation** - QuestionCard: "Are these groups correct?"
4. **Product Generation** - ProgressCard: "Generating products..."
5. **Draft Preview** - DraftGrid: Shows draft product cards
6. **Draft Editing** (optional) - BeforeAfterPreview: Shows proposed changes
7. **Persistence** - ConfirmationCard: "Ready to create X products?"

## Testing Steps

1. Navigate to `/[locale]/admin/onboarding`
2. Click "Upload Images" or drag images into ImageUploadZone
3. Verify images upload to Supabase Storage
4. Verify ProgressCard shows "Analyzing images..."
5. Verify Vision Agent groups images (should see "Groups identified")
6. Verify QuestionCard renders with grouping confirmation
7. Select "Yes" → Verify product generation starts
8. Verify DraftGrid renders with draft products (EN + AR)
9. Click "Edit" on a draft → Verify BeforeAfterPreview shows changes
10. Click "Create Products" → Verify ConfirmationCard appears
11. Click "Confirm" → Verify products saved to store_products table

## Security Notes

- All drafts stored in SessionStorage (ephemeral, cleared on tab close)
- Workflow state persisted in database for resumability
- RLS policies on both tables (users can only access their own)
- No auto-apply: User approval required for all database writes
- Images uploaded to Supabase Storage with merchant_id path

## Next Steps

1. Update ConciergeProvider.tsx:
   - Replace /api/admin/concierge calls with useAgentStream
   - Add useWorkflowState and useDraftState hooks
   - Wire handleImageUpload

2. Update ConciergeConversation.tsx:
   - Parse msg.toolInvocations
   - Render Generative UI components based on tool type
   - Wire user interactions back to agent

3. Update manager-agent.ts:
   - Add onboarding-specific system prompt
   - Inject workflow stage context

4. Update DraftPreview.tsx:
   - Show WorkflowProgress component
   - Display draft state and status

5. Test end-to-end workflow with sample images
