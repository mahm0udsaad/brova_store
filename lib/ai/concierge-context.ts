/**
 * AI Concierge Context Types
 * 
 * Structured, semantic UI context for page-aware AI interactions.
 * The AI understands context because the UI tells it - not because it spies.
 * 
 * Philosophy:
 * - Structured data, never raw screenshots
 * - Semantic names, not DOM selectors
 * - Privacy-respecting metadata only
 * - Bilingual-first (AR/EN)
 */

// =============================================================================
// STORE STATE TYPES
// =============================================================================

export type StoreState = 
  | "empty"      // No products, no store configuration
  | "draft"      // Has some setup but not published
  | "active"     // Store is live with products

export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "skipped"
  | "completed"

export type OnboardingStep =
  | "welcome"
  | "brand"
  | "products"
  | "appearance"
  | "review"

// =============================================================================
// UI COMPONENT TYPES (Semantic, not DOM)
// =============================================================================

export type VisibleComponentType =
  | "EmptyState"
  | "ActionCard"
  | "ProductGrid"
  | "ProductCard"
  | "StorePreview"
  | "DraftBadge"
  | "WelcomeMessage"
  | "QuestionPrompt"
  | "SkipButton"
  | "ContinueButton"
  | "ProgressIndicator"
  | "LanguageSwitcher"
  | "InputField"
  | "ImageUploader"
  | "BrandPreview"

export interface VisibleComponent {
  type: VisibleComponentType
  variant?: string
  action?: string
  label?: string
  state?: "active" | "inactive" | "loading" | "completed"
  metadata?: Record<string, unknown>
}

// =============================================================================
// USER SIGNAL TYPES
// =============================================================================

export type UserSignal =
  | "viewed_page"
  | "clicked_skip"
  | "clicked_skip_once"
  | "clicked_continue"
  | "typed_text"
  | "selected_option"
  | "uploaded_image"
  | "hovered_help"
  | "changed_language"
  | "idle_long"
  | "scrolled_down"
  | "focused_input"
  | "blurred_input"

// =============================================================================
// LEVEL 1: STRUCTURED UI CONTEXT (Required)
// =============================================================================

export interface StructuredUIContext {
  // Route & Page Identity
  page: string                    // Semantic page name (e.g., "OnboardingWelcome")
  route: string                   // Current URL path
  
  // Localization
  locale: "ar" | "en"
  direction: "rtl" | "ltr"
  
  // Store Context
  store_state: StoreState
  store_name?: string
  
  // Onboarding Context
  onboarding_status: OnboardingStatus
  onboarding_step?: OnboardingStep
  onboarding_progress?: number    // 0-100
  
  // Visible Components (semantic, not DOM)
  visible_components: VisibleComponent[]
  
  // User Interaction Signals
  user_signals: UserSignal[]
  
  // Session Context
  session_start?: string          // ISO timestamp
  messages_count?: number
  has_made_selections?: boolean

  // Workflow Context (for specialized AI behavior)
  workflow_type?: 'onboarding' | 'editing' | 'bulk_upload'
  is_initial_greeting?: boolean

  // Bulk Upload Context
  uploaded_images?: string[]
  batch_id?: string
}

// =============================================================================
// LEVEL 2: VISUAL METADATA (Optional, Safe)
// =============================================================================

export interface VisualMetadata {
  // Focus & Attention
  primary_focus?: 
    | "center_empty_state"
    | "left_sidebar"
    | "main_content"
    | "modal_dialog"
    | "bottom_sheet"
    | "welcome_card"
    | "input_field"
    | "preview_area"
  
  // CTA Visibility
  cta_visible: boolean
  cta_label?: string
  cta_position?: "bottom" | "center" | "inline"
  
  // Layout Density
  layout_density: "minimal" | "calm" | "moderate" | "busy"
  
  // Motion State
  motion?: 
    | "none"
    | "subtle_pulse"
    | "fade_in"
    | "slide_up"
    | "typing_indicator"
  
  // Theme
  color_scheme?: "light" | "dark"
}

// =============================================================================
// COMBINED CONTEXT (Full AI Context Package)
// =============================================================================

export interface ConciergeContext {
  // Required: Structured UI Context
  ui_context: StructuredUIContext
  
  // Optional: Visual Metadata
  visual_context?: VisualMetadata
  
  // Timestamp
  timestamp: string
}

// =============================================================================
// DRAFT STATE TYPES
// =============================================================================

export interface DraftStoreName {
  value: string
  confidence: "suggestion" | "user_provided"
  source: "ai" | "user"
}

export interface DraftProduct {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  price?: number
  category?: string
  image_url?: string
  confidence: "ai_generated" | "user_edited"
}

export interface DraftAppearance {
  primary_color?: string
  accent_color?: string
  font_family?: string
  logo_preview_url?: string
}

export interface DraftStoreState {
  store_name?: DraftStoreName
  products: DraftProduct[]
  appearance?: DraftAppearance
  
  // Meta
  last_updated: string
  is_dirty: boolean
}

// =============================================================================
// AI RESPONSE TYPES
// =============================================================================

export interface ConciergeQuestion {
  id: string
  text: string
  text_ar: string
  type: "open" | "choice" | "yes_no" | "optional_detail"
  options?: Array<{
    id: string
    text: string
    text_ar: string
  }>
  skippable: boolean
  metadata?: Record<string, unknown>
}

export interface ConciergeResponse {
  // The AI's message
  message: string
  
  // Optional: Next question to ask
  next_question?: ConciergeQuestion
  
  // Optional: Draft updates to preview
  draft_updates?: Partial<DraftStoreState>
  
  // Optional: Suggested UI actions (display only, no side effects)
  ui_hints?: Array<{
    type: "highlight" | "scroll_to" | "show_preview"
    target?: string
  }>
  
  // Context acknowledgment
  context_acknowledged?: {
    page: string
    understood_action?: string
  }
}

// =============================================================================
// CONCIERGE CONVERSATION TYPES
// =============================================================================

export interface ConciergeMessage {
  id: string
  role: "concierge" | "user"
  content: string
  timestamp: string
  
  // For concierge messages
  question?: ConciergeQuestion
  draft_updates?: Partial<DraftStoreState>
  
  // For user messages
  skipped?: boolean
  selected_option_id?: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create initial context for a given page/locale
 */
export function createInitialContext(
  page: string,
  route: string,
  locale: "ar" | "en",
  store_state: StoreState = "empty",
  onboarding_status: OnboardingStatus = "not_started"
): ConciergeContext {
  return {
    ui_context: {
      page,
      route,
      locale,
      direction: locale === "ar" ? "rtl" : "ltr",
      store_state,
      onboarding_status,
      visible_components: [],
      user_signals: ["viewed_page"],
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Add a user signal to the context
 */
export function addUserSignal(
  context: ConciergeContext,
  signal: UserSignal
): ConciergeContext {
  const signals = context.ui_context.user_signals
  
  // Avoid duplicate consecutive signals
  if (signals[signals.length - 1] !== signal) {
    return {
      ...context,
      ui_context: {
        ...context.ui_context,
        user_signals: [...signals, signal].slice(-10), // Keep last 10 signals
      },
      timestamp: new Date().toISOString(),
    }
  }
  
  return context
}

/**
 * Update visible components
 */
export function setVisibleComponents(
  context: ConciergeContext,
  components: VisibleComponent[]
): ConciergeContext {
  return {
    ...context,
    ui_context: {
      ...context.ui_context,
      visible_components: components,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create empty draft state
 */
export function createEmptyDraftState(): DraftStoreState {
  return {
    products: [],
    last_updated: new Date().toISOString(),
    is_dirty: false,
  }
}

/**
 * Merge draft updates into existing draft state
 */
export function mergeDraftUpdates(
  current: DraftStoreState,
  updates: Partial<DraftStoreState>
): DraftStoreState {
  return {
    ...current,
    ...updates,
    products: updates.products 
      ? [...current.products, ...updates.products]
      : current.products,
    last_updated: new Date().toISOString(),
    is_dirty: true,
  }
}
