// Admin Assistant Component Exports

export { AdminAssistantProvider, useAdminAssistant, useAdminAssistantDisplayMode, useAdminAssistantActivity, useAdminAssistantActions, useAdminAssistantState } from "./AdminAssistantProvider"
export { AdminAssistantFab } from "./AdminAssistantFab"
export { AdminAssistantPanel } from "./AdminAssistantPanel"
export { AdminAssistantSidePanel } from "./AdminAssistantSidePanel"
export { AdminAssistantMessage } from "./AdminAssistantMessage"

// AI Presence Components - Embedded AI experience
export {
  AIStatusIndicator,
  AISuggestionChips,
  AIQuickActionsBar,
  AIInlineInput,
  AIContextHelper,
} from "./AIPresence"

// Hooks
export { usePageContext } from "./hooks/usePageContext"
export { useAdminAssistantWithContext } from "./hooks/useAdminAssistant"

// Types
export type {
  AssistantDisplayMode,
  PageContext,
  Message,
} from "./AdminAssistantProvider"
