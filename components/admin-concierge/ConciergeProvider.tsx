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
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import {
  type DraftStoreState,
  type OnboardingStatus,
  type OnboardingStep,
  type StoreState,
  createEmptyDraftState,
} from "@/lib/ai/concierge-context"
import {
  updateOnboardingStatus as persistOnboardingStatus,
} from "@/lib/actions/setup"

// =============================================================================
// TYPES
// =============================================================================

interface ConciergeState {
  isOnboardingActive: boolean
  onboardingStatus: OnboardingStatus
  currentStep: OnboardingStep
  draftState: DraftStoreState
  storeState: StoreState
  storeId: string | null
}

interface ConciergeActions {
  startOnboarding: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  setCurrentStep: (step: OnboardingStep) => void
  updateDraft: (updates: Partial<DraftStoreState>) => void
  clearDraft: () => void
  refreshPreview: () => Promise<void>
  publishStore: () => Promise<boolean>
}

interface ConciergeContextType extends ConciergeState, ConciergeActions {}

// =============================================================================
// CONTEXT
// =============================================================================

const ConciergeCtx = createContext<ConciergeContextType | null>(null)

export function useConcierge() {
  const context = useContext(ConciergeCtx)
  if (!context) {
    throw new Error("useConcierge must be used within ConciergeProvider")
  }
  return context
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ConciergeProviderProps {
  children: ReactNode
  initialStoreState?: StoreState
  initialOnboardingStatus?: OnboardingStatus
  storeId?: string | null
}

export function ConciergeProvider({
  children,
  initialStoreState = "empty",
  initialOnboardingStatus = "not_started",
  storeId: initialStoreId = null,
}: ConciergeProviderProps) {
  const router = useRouter()
  const locale = useLocale() as "ar" | "en"

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isOnboardingActive, setIsOnboardingActive] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(initialOnboardingStatus)
  const [currentStep, setCurrentStepState] = useState<OnboardingStep>("welcome")
  const [draftState, setDraftState] = useState<DraftStoreState>(createEmptyDraftState())
  const [storeState, setStoreState] = useState<StoreState>(initialStoreState)
  const [storeId] = useState<string | null>(initialStoreId)

  // ==========================================================================
  // REFRESH PREVIEW FROM DB
  // ==========================================================================

  const refreshPreview = useCallback(async () => {
    if (!storeId) return

    try {
      const supabase = createClient()

      const [storeResult, productsResult, settingsResult, componentsResult, bannersResult] = await Promise.all([
        supabase
          .from("stores")
          .select("name, store_type")
          .eq("id", storeId)
          .single(),
        supabase
          .from("store_products")
          .select("id, name, name_ar, price, image_url")
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("store_settings")
          .select("appearance, theme_config")
          .eq("store_id", storeId)
          .single(),
        supabase
          .from("store_components")
          .select("id, component_type, config, position, status")
          .eq("store_id", storeId)
          .eq("status", "active")
          .order("position", { ascending: true }),
        supabase
          .from("store_banners")
          .select("id, image_url, title, title_ar, subtitle, subtitle_ar, position")
          .eq("store_id", storeId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ])

      // Store name
      const storeName = storeResult.data?.name
        ? {
            value: storeResult.data.name,
            confidence: "user_provided" as const,
            source: "ai" as const,
          }
        : undefined

      // Store type
      const storeType = storeResult.data?.store_type || undefined

      // Appearance
      const rawAppearance = (settingsResult.data?.appearance || {}) as Record<string, any>
      const rawThemeConfig = (settingsResult.data?.theme_config || {}) as Record<string, any>
      const logoUrl = rawAppearance.logo_url || undefined
      const appearance =
        rawAppearance.primary_color || rawAppearance.accent_color || logoUrl
          ? {
              primary_color: rawAppearance.primary_color || rawThemeConfig?.colors?.primary,
              accent_color: rawAppearance.accent_color || rawThemeConfig?.colors?.accent,
              font_family: rawAppearance.font_family,
              logo_preview_url: logoUrl,
            }
          : rawThemeConfig?.colors
            ? {
                primary_color: rawThemeConfig.colors.primary,
                accent_color: rawThemeConfig.colors.accent,
                font_family: rawThemeConfig.typography?.fontBody,
                logo_preview_url: logoUrl,
              }
            : logoUrl
              ? { logo_preview_url: logoUrl }
              : undefined

      // Products (replace, not append)
      const products = (productsResult.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        price: p.price,
        image_url: p.image_url,
        confidence: "ai_generated" as const,
      }))

      // Page sections
      const pageSections = (componentsResult.data || []).map((c: any) => ({
        id: c.id,
        type: c.component_type,
        config: (c.config || {}) as Record<string, unknown>,
        position: c.position,
      }))

      // Banners
      const banners = (bannersResult.data || []).map((b: any) => ({
        id: b.id,
        image_url: b.image_url,
        title: b.title,
        title_ar: b.title_ar,
        subtitle: b.subtitle,
        subtitle_ar: b.subtitle_ar,
        position: b.position,
      }))

      setDraftState({
        store_name: storeName,
        store_type: storeType,
        products,
        appearance,
        page_sections: pageSections,
        banners,
        last_updated: new Date().toISOString(),
        is_dirty: false,
      })
    } catch (error) {
      console.error("[ConciergeProvider] Failed to refresh preview:", error)
    }
  }, [storeId])

  // Initial preview load
  useEffect(() => {
    if (storeId) {
      refreshPreview()
    }
  }, [storeId, refreshPreview])

  // ==========================================================================
  // ONBOARDING ACTIONS
  // ==========================================================================

  const startOnboarding = useCallback(() => {
    setIsOnboardingActive(true)
    setOnboardingStatus("in_progress")
    setCurrentStepState("welcome")

    persistOnboardingStatus("in_progress").catch((error) => {
      console.error("Failed to persist in_progress status:", error)
    })
  }, [])

  const skipOnboarding = useCallback(async () => {
    setIsOnboardingActive(false)
    setOnboardingStatus("skipped")

    try {
      await persistOnboardingStatus("skipped")
    } catch (error) {
      console.error("Failed to persist skipped status:", error)
    }

    setTimeout(() => {
      router.push(`/${locale}/admin`)
    }, 0)
  }, [locale, router])

  const completeOnboarding = useCallback(async () => {
    setIsOnboardingActive(false)
    setOnboardingStatus("completed")

    try {
      await persistOnboardingStatus("completed")
    } catch (error) {
      console.error("Failed to persist completed status:", error)
    }
  }, [])

  const setCurrentStep = useCallback((step: OnboardingStep) => {
    setCurrentStepState(step)
  }, [])

  // ==========================================================================
  // DRAFT ACTIONS
  // ==========================================================================

  const updateDraft = useCallback((updates: Partial<DraftStoreState>) => {
    setDraftState((prev) => ({
      ...prev,
      ...updates,
      products: updates.products
        ? [...prev.products, ...updates.products]
        : prev.products,
      last_updated: new Date().toISOString(),
      is_dirty: true,
    }))
  }, [])

  const clearDraft = useCallback(() => {
    setDraftState(createEmptyDraftState())
  }, [])

  // ==========================================================================
  // PUBLISH STORE
  // ==========================================================================

  const publishStore = useCallback(async (): Promise<boolean> => {
    if (!storeId) return false

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("stores")
        .update({
          status: "active",
          onboarding_completed: "completed",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeId)

      if (error) throw error

      await completeOnboarding()
      setStoreState("active")
      return true
    } catch (error) {
      console.error("Failed to publish store:", error)
      return false
    }
  }, [storeId, completeOnboarding])

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value = useMemo<ConciergeContextType>(
    () => ({
      isOnboardingActive,
      onboardingStatus,
      currentStep,
      draftState,
      storeState,
      storeId,
      startOnboarding,
      skipOnboarding,
      completeOnboarding,
      setCurrentStep,
      updateDraft,
      clearDraft,
      refreshPreview,
      publishStore,
    }),
    [
      isOnboardingActive,
      onboardingStatus,
      currentStep,
      draftState,
      storeState,
      storeId,
      startOnboarding,
      skipOnboarding,
      completeOnboarding,
      setCurrentStep,
      updateDraft,
      clearDraft,
      refreshPreview,
      publishStore,
    ]
  )

  return (
    <ConciergeCtx.Provider value={value}>{children}</ConciergeCtx.Provider>
  )
}
