import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/utils'
import {
  getUserOrganization,
  hasOnboardingIntent,
  createOrganizationFromIntent,
  assignStoreTheme,
} from '@/lib/actions/setup'

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Require authentication - will redirect to login if not authenticated
  await requireAuth(locale)

  // =============================================================================
  // STEP 1: Check if user has an organization
  // =============================================================================
  const organization = await getUserOrganization()

  if (organization) {
    // Organization exists! Check theme assignment.
    
    // =========================================================================
    // STEP 1.5: Ensure theme is assigned (Task 5)
    // =========================================================================
    // This is a "silent" operation - the user never sees a theme picker.
    // Theme is automatically assigned based on store_type.
    
    if (!organization.themeId) {
      // Theme not assigned yet - assign it now
      const themeResult = await assignStoreTheme()
      
      if (!themeResult.success) {
        // Theme assignment failed - log error but continue
        // This shouldn't block the user from proceeding
        console.error('Failed to assign theme:', themeResult)
      }
      
      // Redirect back to /start to continue the flow with theme now assigned
      redirect(`/${locale}/start`)
    }

    // =========================================================================
    // STEP 2: Check AI Concierge onboarding status (Task 6)
    // =========================================================================
    // If onboarding is not completed or skipped, redirect to AI onboarding.
    // The onboarding is conversational, optional, and draft-only.
    
    const onboardingStatus = organization.onboardingCompleted || 'not_started'
    
    if (onboardingStatus === 'not_started' || onboardingStatus === 'in_progress') {
      // Onboarding not completed - redirect to AI concierge
      redirect(`/${locale}/admin/onboarding`)
    }

    // =========================================================================
    // STEP 3: Onboarding complete - proceed to admin dashboard
    // =========================================================================
    // User has either completed or skipped onboarding.
    // TODO (Task 7): If everything is done, redirect to dashboard/storefront

    redirect(`/${locale}/admin`)
  }

  // =============================================================================
  // STEP 2: Check if user has onboarding intent
  // =============================================================================
  const hasIntent = await hasOnboardingIntent()

  if (!hasIntent) {
    // No intent and no organization - user needs to select store type first
    redirect(`/${locale}/setup/store-type`)
  }

  // =============================================================================
  // STEP 3: User has intent but no organization - CREATE IT NOW
  // =============================================================================
  // This is THE critical step - turns intent into reality.
  // Safe to call because it's idempotent (won't create duplicates)

  const result = await createOrganizationFromIntent()

  if (!result.success) {
    // Creation failed - log and redirect to error recovery
    console.error('Failed to create organization:', result)

    // If no intent found (edge case: deleted between checks), go back to setup
    if (result.errorCode === 'no_intent') {
      redirect(`/${locale}/setup/store-type`)
    }

    // For other errors, you might want a dedicated error page
    // For now, redirect to setup so user can retry
    redirect(`/${locale}/setup/store-type?error=creation_failed`)
  }

  // =============================================================================
  // SUCCESS - Organization and Store Created!
  // =============================================================================
  // Now redirect back to /start which will detect the organization
  // and route to the next step (theme selection / AI onboarding)

  redirect(`/${locale}/start`)
}
