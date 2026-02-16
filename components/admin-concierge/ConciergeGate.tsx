"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ConciergeProvider } from "./ConciergeProvider"
import { ConciergeOnboarding } from "./ConciergeOnboarding"
import type { OnboardingStatus, StoreState } from "@/lib/ai/concierge-context"

/**
 * ConciergeGate
 *
 * Checks if the user should see the AI Concierge onboarding experience.
 * Wraps children with ConciergeProvider when onboarding is active.
 *
 * Entry conditions:
 * - Store exists (organization + store created via /start)
 * - Onboarding status is not_started or in_progress
 */

interface ConciergeGateProps {
  children: React.ReactNode
}

export function ConciergeGate({ children }: ConciergeGateProps) {
  const pathname = usePathname()
  const [storeState, setStoreState] = useState<StoreState>("empty")
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus>("not_started")
  const [storeId, setStoreId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false)

  const isOnboardingPage = pathname.includes("/admin/onboarding")

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Check session storage first (ephemeral state)
        if (typeof window !== "undefined") {
          const sessionStatus = sessionStorage.getItem(
            "concierge-onboarding-status"
          )
          if (sessionStatus === "completed" || sessionStatus === "skipped") {
            setOnboardingStatus(sessionStatus as OnboardingStatus)
            setIsLoading(false)
            return
          }
        }

        // Query the user's store through organization → stores join
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select(
            "id, stores(id, name, status, onboarding_completed, store_type)"
          )
          .eq("owner_id", user.id)
          .single()

        if (orgError || !orgData) {
          // No organization yet — the /start page handles creation
          setIsLoading(false)
          return
        }

        // Get the store (Supabase joins return arrays)
        const stores = Array.isArray(orgData.stores)
          ? orgData.stores
          : orgData.stores
            ? [orgData.stores]
            : []

        if (stores.length === 0) {
          setIsLoading(false)
          return
        }

        const store = stores[0] as any
        setStoreId(store.id)

        // Check onboarding status from the store record
        const storeOnboardingStatus = (store.onboarding_completed ||
          "not_started") as OnboardingStatus

        if (
          storeOnboardingStatus === "completed" ||
          storeOnboardingStatus === "skipped"
        ) {
          setOnboardingStatus(storeOnboardingStatus)
          setIsLoading(false)
          return
        }

        // Determine store state based on products
        const { count: productsCount } = await supabase
          .from("store_products")
          .select("*", { count: "exact", head: true })
          .eq("store_id", store.id)

        if (productsCount && productsCount > 0) {
          setStoreState("draft")
        } else {
          setStoreState("empty")
        }

        setOnboardingStatus(storeOnboardingStatus)
        setShouldShowOnboarding(true)
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking onboarding status:", error)
        setIsLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  if (isLoading) {
    return <>{children}</>
  }

  if (isOnboardingPage) {
    return <>{children}</>
  }

  if (onboardingStatus === "completed" || onboardingStatus === "skipped") {
    return <>{children}</>
  }

  if (shouldShowOnboarding && storeId) {
    return (
      <ConciergeProvider
        initialStoreState={storeState}
        initialOnboardingStatus={onboardingStatus}
        storeId={storeId}
      >
        {children}
        <ConciergeOnboarding />
      </ConciergeProvider>
    )
  }

  return <>{children}</>
}
