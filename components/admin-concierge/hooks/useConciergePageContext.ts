"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import type {
  VisibleComponent,
  OnboardingStep,
} from "@/lib/ai/concierge-context"

/**
 * Page context hook for AI Concierge (legacy — kept for API compat)
 *
 * The new onboarding flow writes directly to the DB via tools
 * and no longer needs the structured context/signal system.
 */

interface PageConfig {
  pageName: string
  onboardingStep?: OnboardingStep
  defaultComponents: VisibleComponent[]
  capabilities: string[]
}

const DEFAULT_CONFIG: PageConfig = {
  pageName: "AdminDashboard",
  onboardingStep: undefined,
  defaultComponents: [],
  capabilities: [],
}

interface UseConciergePageContextOptions {
  additionalComponents?: VisibleComponent[]
  onboardingStep?: OnboardingStep
}

export function useConciergePageContext(
  options: UseConciergePageContextOptions = {}
) {
  const pathname = usePathname()
  const locale = useLocale() as "ar" | "en"

  const pageConfig = useMemo(() => DEFAULT_CONFIG, [])

  return {
    pageConfig,
    locale,
    isRtl: locale === "ar",
    context: null,
    trackClick: (_target?: string) => {},
    trackInput: (_type: "focus" | "blur" | "type") => {},
    trackLanguageChange: () => {},
    trackScroll: () => {},
    pageName: pageConfig.pageName,
    onboardingStep: options.onboardingStep || pageConfig.onboardingStep,
    capabilities: pageConfig.capabilities,
  }
}

export function createVisibleComponent(
  type: VisibleComponent["type"],
  options: Partial<Omit<VisibleComponent, "type">> = {}
): VisibleComponent {
  return { type, ...options }
}
