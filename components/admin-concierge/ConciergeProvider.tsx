"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import {
  type ConciergeContext,
  type DraftStoreState,
  type OnboardingStatus,
  type OnboardingStep,
  type StoreState,
  type UserSignal,
  type VisibleComponent,
  createInitialContext,
  createEmptyDraftState,
  mergeDraftUpdates,
  addUserSignal,
  setVisibleComponents,
} from "@/lib/ai/concierge-context"
import {
  updateOnboardingStatus as persistOnboardingStatus,
} from "@/lib/actions/setup"
import { AI } from "@/app/actions"
// Removed: import { useAgentStream } from "@/hooks/use-agent-stream"
// Removed: import { useWorkflowState } from "./hooks/useWorkflowState"
// Removed: import { useToolHandlers } from "./hooks/useToolHandlers"
// Removed: import { getTotalWorkflowStages } from "@/lib/agents/v2/workflow-stages"

// =============================================================================
// TYPES
// =============================================================================

interface ConciergeState {
  // Onboarding state
  isOnboardingActive: boolean
  onboardingStatus: OnboardingStatus
  currentStep: OnboardingStep
  
  // Draft state (ephemeral, never persisted without approval)
  draftState: DraftStoreState
  
  // UI Context
  context: ConciergeContext
  
  // Store state
  storeState: StoreState
}

interface ConciergeActions {
  // Onboarding control
  startOnboarding: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  setCurrentStep: (step: OnboardingStep) => void

  // Removed: Conversation actions (now handled by AI.Provider)
  // sendMessage: (content: string, selectedOptionId?: string) => Promise<void>
  // skipQuestion: () => void
  // clearMessages: () => void

  // Image upload and workflow
  handleImageUpload: (urls: string[], batchId: string) => Promise<void>

  // Draft updates (preview only, no persistence)
  updateDraft: (updates: Partial<DraftStoreState>) => void
  clearDraft: () => void

  // Context updates
  registerSignal: (signal: UserSignal) => void
  updateVisibleComponents: (components: VisibleComponent[]) => void

  // Final actions (require explicit user approval)
  approveDraft: () => Promise<boolean>
  publishStore: () => Promise<boolean>
}

interface ConciergeContextType extends ConciergeState, ConciergeActions {}

// =============================================================================
// CONTEXT
// =============================================================================

const ConciergeContext = createContext<ConciergeContextType | null>(null)

export function useConcierge() {
  const context = useContext(ConciergeContext)
  if (!context) {
    throw new Error("useConcierge must be used within ConciergeProvider")
  }
  return context
}

// =============================================================================
// STORAGE KEYS (for session storage only - ephemeral)
// =============================================================================

const STORAGE_KEYS = {
  DRAFT_STATE: "concierge-draft-state",
  ONBOARDING_STATUS: "concierge-onboarding-status",
  CURRENT_STEP: "concierge-current-step",
  // Removed: MESSAGES: "concierge-messages",
} as const

// =============================================================================
// PROVIDER
// =============================================================================

interface ConciergeProviderProps {
  children: ReactNode
  initialStoreState?: StoreState
  initialOnboardingStatus?: OnboardingStatus
}

export function ConciergeProvider({
  children,
  initialStoreState = "empty",
  initialOnboardingStatus = "not_started",
}: ConciergeProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale() as "ar" | "en"
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  const [isOnboardingActive, setIsOnboardingActive] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(initialOnboardingStatus)
  const [currentStep, setCurrentStepState] = useState<OnboardingStep>("welcome")
  // Removed: const [messages, setMessages] = useState<ConciergeMessage[]>([])
  // Removed: const [isThinking, setIsThinking] = useState(false)
  const [draftState, setDraftState] = useState<DraftStoreState>(createEmptyDraftState())
  const [storeState, setStoreState] = useState<StoreState>(initialStoreState)
  
  // Context derived from current state
  const context = useMemo(() => {
    const baseContext = createInitialContext(
      getPageNameFromPath(pathname),
      pathname,
      locale,
      storeState,
      onboardingStatus
    )

    // Add workflow type for specialized AI behavior during onboarding
    return {
      ...baseContext,
      workflow_type: onboardingStatus === 'in_progress' ? 'onboarding' as const : undefined,
    }
  }, [pathname, locale, storeState, onboardingStatus])
  
  const [currentContext, setCurrentContext] = useState<ConciergeContext>(context)

  // Removed: Initialize workflow and draft state
  // Removed: const workflowState = useWorkflowState(null)
  // Removed: const draftStateHook = useDraftState()
  // Removed: Initialize agent stream with Manager Agent
  // Removed: const agentStream = useAgentStream({...})

  // ==========================================================================
  // HYDRATION FROM SESSION STORAGE (ephemeral only)
  // ==========================================================================
  
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      // Restore draft state from session storage (not localStorage - ephemeral!)
      const storedDraft = sessionStorage.getItem(STORAGE_KEYS.DRAFT_STATE)
      if (storedDraft) {
        const parsed = JSON.parse(storedDraft)
        setDraftState(parsed)
      }
      
      // Removed: Restore messages
      // const storedMessages = sessionStorage.getItem(STORAGE_KEYS.MESSAGES)
      // if (storedMessages) {
      //   setMessages(JSON.parse(storedMessages))
      // }
      
      // Restore onboarding status
      const storedStatus = sessionStorage.getItem(STORAGE_KEYS.ONBOARDING_STATUS)
      if (storedStatus) {
        setOnboardingStatus(storedStatus as OnboardingStatus)
      }
      
      // Restore current step
      const storedStep = sessionStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
      if (storedStep) {
        setCurrentStepState(storedStep as OnboardingStep)
      }
    } catch (error) {
      console.error("Failed to hydrate concierge state:", error)
    }
  }, [])
  
  // Persist draft state to session storage
  useEffect(() => {
    if (typeof window === "undefined") return
    if (draftState.is_dirty) {
      sessionStorage.setItem(STORAGE_KEYS.DRAFT_STATE, JSON.stringify(draftState))
    }
  }, [draftState])
  
  // Removed: Persist messages to session storage
  // useEffect(() => {
  //   if (typeof window === "undefined") return
  //   if (messages.length > 0) {
  //     sessionStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  //   }
  // }, [messages])
  
  // ==========================================================================
  // ONBOARDING ACTIONS
  // ==========================================================================
  
  const startOnboarding = useCallback(async () => {
    setIsOnboardingActive(true)
    setOnboardingStatus("in_progress")
    setCurrentStepState("welcome")
    sessionStorage.setItem(STORAGE_KEYS.ONBOARDING_STATUS, "in_progress")
    
    // Persist to database (non-blocking)
    persistOnboardingStatus("in_progress").catch((error) => {
      console.error("Failed to persist in_progress status:", error)
    })
    
    // Removed: Add initial welcome message (now streamed by AI)
    // const welcomeMessage: ConciergeMessage = {...}
    // setMessages([welcomeMessage])
  }, [locale])
  
  const skipOnboarding = useCallback(async () => {
    setIsOnboardingActive(false)
    setOnboardingStatus("skipped")
    sessionStorage.setItem(STORAGE_KEYS.ONBOARDING_STATUS, "skipped")
    // Clear draft state when skipping
    setDraftState(createEmptyDraftState())
    sessionStorage.removeItem(STORAGE_KEYS.DRAFT_STATE)
    
    // Persist to database
    try {
      await persistOnboardingStatus("skipped")
    } catch (error) {
      console.error("Failed to persist skipped status:", error)
    }
    
    // Redirect to admin dashboard
    router.push(`/${locale}/admin`)
  }, [locale, router])
  
  const completeOnboarding = useCallback(async () => {
    setIsOnboardingActive(false)
    setOnboardingStatus("completed")
    sessionStorage.setItem(STORAGE_KEYS.ONBOARDING_STATUS, "completed")
    
    // Persist to database
    try {
      await persistOnboardingStatus("completed")
    } catch (error) {
      console.error("Failed to persist completed status:", error)
    }
  }, [])
  
  const setCurrentStep = useCallback((step: OnboardingStep) => {
    setCurrentStepState(step)
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_STEP, step)
  }, [])
  
  // ==========================================================================
  // CONVERSATION ACTIONS (Now handled by AI.Provider)
  // ==========================================================================
  
  // Removed: sendMessage
  // Removed: skipQuestion
  
  const handleImageUpload = useCallback(
    async (urls: string[], batchId: string) => {
      try {
        // Update context with uploaded images so AI conversation can access them
        setCurrentContext((prev) => ({
          ...prev,
          uploaded_images: urls,
          batch_id: batchId,
          workflow_type: 'bulk_upload' as const,
        }))

        console.log('[ConciergeProvider] Images uploaded and added to context', { urls, batchId })

        // Note: The actual AI processing will be triggered by ConciergeConversation
        // component which has access to the AI server actions via useActions hook
      } catch (error) {
        console.error('[ConciergeProvider] Image upload failed:', error)
      }
    },
    []
  )

  // Removed: clearMessages
  // const clearMessages = useCallback(() => { ... }, [])
  
  // ==========================================================================
  // DRAFT ACTIONS (Preview only, never persisted without approval)
  // ==========================================================================
  
  const updateDraft = useCallback((updates: Partial<DraftStoreState>) => {
    setDraftState(prev => mergeDraftUpdates(prev, updates))
  }, [])
  
  const clearDraft = useCallback(() => {
    setDraftState(createEmptyDraftState())
    sessionStorage.removeItem(STORAGE_KEYS.DRAFT_STATE)
  }, [])
  
  // ==========================================================================
  // CONTEXT ACTIONS
  // ==========================================================================
  
  const registerSignal = useCallback((signal: UserSignal) => {
    setCurrentContext(prev => addUserSignal(prev, signal))
  }, [])
  
  const updateVisibleComponents = useCallback((components: VisibleComponent[]) => {
    setCurrentContext(prev => setVisibleComponents(prev, components))
  }, [])
  
  // ==========================================================================
  // FINAL ACTIONS (Require explicit user approval)
  // ==========================================================================
  
  /**
   * Save draft to database - ONLY when user explicitly approves
   */
  const approveDraft = useCallback(async (): Promise<boolean> => {
    // This is the ONLY place where we write to the database
    // And only after explicit user approval
    try {
      const response = await fetch("/api/admin/concierge/approve-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          draftState,
          // Send context to verify this is a legitimate save
          context: currentContext,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to save draft")
      }
      
      // Clear draft after successful save
      clearDraft()
      return true
    } catch (error) {
      console.error("Failed to approve draft:", error)
      return false
    }
  }, [draftState, currentContext, clearDraft])
  
  /**
   * Publish store - ONLY when user explicitly confirms
   */
  const publishStore = useCallback(async (): Promise<boolean> => {
    // This requires double confirmation in the UI
    try {
      const response = await fetch("/api/admin/concierge/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          draftState,
          context: currentContext,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to publish")
      }
      
      completeOnboarding()
      setStoreState("active")
      clearDraft()
      return true
    } catch (error) {
      console.error("Failed to publish store:", error)
      return false
    }
  }, [draftState, currentContext, completeOnboarding, clearDraft])
  
  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  
  const value = useMemo<ConciergeContextType>(() => ({
    // State
    isOnboardingActive,
    onboardingStatus,
    currentStep,
    // Removed: messages,
    // Removed: isThinking,
    draftState,
    context: currentContext,
    storeState,

    // Actions
    startOnboarding,
    skipOnboarding,
    completeOnboarding,
    setCurrentStep,
    // Removed: sendMessage,
    // Removed: skipQuestion,
    // Removed: clearMessages,
    handleImageUpload,
    updateDraft,
    clearDraft,
    registerSignal,
    updateVisibleComponents,
    approveDraft,
    publishStore,
  }), [
    isOnboardingActive,
    onboardingStatus,
    currentStep,
    // Removed: messages,
    // Removed: isThinking,
    draftState,
    currentContext,
    storeState,
    startOnboarding,
    skipOnboarding,
    completeOnboarding,
    setCurrentStep,
    // Removed: sendMessage,
    // Removed: skipQuestion,
    // Removed: clearMessages,
    handleImageUpload,
    updateDraft,
    clearDraft,
    registerSignal,
    updateVisibleComponents,
    approveDraft,
    publishStore,
  ])
  
  return (
    <AI>
      <ConciergeContext.Provider value={value}>
        {children}
      </ConciergeContext.Provider>
    </AI>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function getPageNameFromPath(pathname: string): string {
  // Remove locale prefix
  const path = pathname.replace(/^\/(ar|en)/, "")
  
  if (path === "" || path === "/") return "Home"
  if (path.startsWith("/admin/onboarding")) return "OnboardingFlow"
  if (path.startsWith("/admin/inventory")) return "ProductsInventory"
  if (path.startsWith("/admin/products")) return "ProductEditor"
  if (path.startsWith("/admin/orders")) return "OrdersManagement"
  if (path.startsWith("/admin/media")) return "MediaLibrary"
  if (path.startsWith("/admin/settings")) return "StoreSettings"
  if (path.startsWith("/admin/appearance")) return "StoreAppearance"
  if (path.startsWith("/admin/insights")) return "StoreInsights"
  if (path.startsWith("/admin")) return "AdminDashboard"
  
  return "UnknownPage"
}