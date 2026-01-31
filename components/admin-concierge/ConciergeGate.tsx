"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ConciergeProvider, ConciergeOnboarding } from "./index"
import { AI } from "@/app/actions"
import type { OnboardingStatus, StoreState } from "@/lib/ai/concierge-context"

/**
 * ConciergeGate
 * 
 * Checks if the user should see the AI Concierge onboarding experience.
 * Wraps children with ConciergeProvider when onboarding is active.
 * 
 * Entry conditions:
 * - Store exists
 * - Store status = draft (or empty)
 * - Onboarding status ≠ completed
 */

interface ConciergeGateProps {
  children: React.ReactNode
}

export function ConciergeGate({ children }: ConciergeGateProps) {
  const pathname = usePathname()
  const [storeState, setStoreState] = useState<StoreState>("empty")
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("not_started")
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false)
  
  // Check if we're already on the onboarding page
  const isOnboardingPage = pathname.includes("/admin/onboarding")
  
  // Check store state and onboarding status
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsLoading(false)
          return
        }
        
        // Check session storage first (ephemeral state)
        const sessionStatus = sessionStorage.getItem("concierge-onboarding-status")
        if (sessionStatus === "completed" || sessionStatus === "skipped") {
          setOnboardingStatus(sessionStatus as OnboardingStatus)
          setIsLoading(false)
          return
        }
        
        // Check store_settings for onboarding_completed flag
        const { data: settings } = await supabase
          .from("store_settings")
          .select("ai_preferences")
          .eq("merchant_id", user.id)
          .single()
        
        // Check if onboarding is marked as completed in settings
        const onboardingCompleted = settings?.ai_preferences?.onboarding_completed
        if (onboardingCompleted) {
          setOnboardingStatus("completed")
          setIsLoading(false)
          return
        }
        
        // Check if user has any products (indicates they've set up the store)
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("merchant_id", user.id)
        
        if (productsCount && productsCount > 0) {
          // Has products, consider store as "draft" or "active"
          setStoreState("draft")
          // But still show onboarding if not completed
          if (!onboardingCompleted) {
            setShouldShowOnboarding(true)
            setOnboardingStatus("in_progress")
          }
        } else {
          // No products, store is empty
          setStoreState("empty")
          setShouldShowOnboarding(true)
          setOnboardingStatus("not_started")
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking onboarding status:", error)
        setIsLoading(false)
      }
    }
    
    checkOnboardingStatus()
  }, [])
  
  // Don't show anything while loading
  if (isLoading) {
    return <>{children}</>
  }
  
  // If already on onboarding page, just render children
  if (isOnboardingPage) {
    return <>{children}</>
  }
  
  // If onboarding is completed or skipped, just render children
  if (onboardingStatus === "completed" || onboardingStatus === "skipped") {
    return <>{children}</>
  }
  
  // If we should show onboarding, wrap with provider and show the modal
  if (shouldShowOnboarding) {
    return (
      <AI>
        <ConciergeProvider
          initialStoreState={storeState}
          initialOnboardingStatus={onboardingStatus}
        >
          {children}
          <ConciergeOnboarding />
        </ConciergeProvider>
      </AI>
    )
  }
  
  return <>{children}</>
}
