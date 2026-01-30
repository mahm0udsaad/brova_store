/**
 * AI Concierge Components
 * 
 * Page-aware, bilingual (AR/EN), draft-only onboarding experience.
 * The AI is aware, not watching.
 */

export { ConciergeProvider, useConcierge } from "./ConciergeProvider"
export { ConciergeOnboarding, ProgressIndicator } from "./ConciergeOnboarding"
export { ConciergeWelcome } from "./ConciergeWelcome"
export { ConciergeConversation } from "./ConciergeConversation"
export { DraftPreview } from "./DraftPreview"
export { 
  useConciergePageContext, 
  createVisibleComponent,
} from "./hooks/useConciergePageContext"
export { ConciergeGate } from "./ConciergeGate"
