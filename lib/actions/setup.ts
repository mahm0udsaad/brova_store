'use server'

import { createClient } from '@/lib/supabase/server'

type StoreType = 'clothing' | 'car_care'

export async function saveStoreType(storeType: StoreType) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, errorCode: 'unauthorized' }
  }

  const { error } = await supabase.from('onboarding_intent').upsert(
    {
      user_id: user.id,
      store_type: storeType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Error saving store type:', error)
    return { success: false, errorCode: 'generic' }
  }

  return { success: true }
}

// =============================================================================
// CREATE ORGANIZATION FROM ONBOARDING INTENT
// =============================================================================
// This is the CRITICAL STEP that turns intent into reality.
// Called from /start route when user has intent but no organization yet.
//
// Safety guarantees:
// - Idempotent: Safe to call multiple times
// - Atomic: Uses Supabase function with transaction semantics
// - RLS-aware: Only creates for authenticated user
// - No partial state: Either everything succeeds or nothing happens

export type CreateOrganizationResult =
  | { success: true; organizationId: string; storeId: string; alreadyExisted: boolean }
  | { success: false; errorCode: 'unauthorized' | 'no_intent' | 'database_error'; message?: string }

export async function createOrganizationFromIntent(): Promise<CreateOrganizationResult> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Auth error in createOrganizationFromIntent:', authError)
    return { success: false, errorCode: 'unauthorized' }
  }

  try {
    // Call the database function that handles everything transactionally
    const { data, error } = await supabase.rpc('create_organization_from_intent')

    if (error) {
      console.error('Error creating organization from intent:', error)

      // Check for specific error types
      if (error.message?.includes('No onboarding intent')) {
        return {
          success: false,
          errorCode: 'no_intent',
          message: 'No onboarding intent found. Please select a store type first.',
        }
      }

      return {
        success: false,
        errorCode: 'database_error',
        message: error.message || 'Failed to create organization',
      }
    }

    // The function returns a single row with the results
    const result = Array.isArray(data) ? data[0] : data

    if (!result) {
      console.error('No result returned from create_organization_from_intent')
      return {
        success: false,
        errorCode: 'database_error',
        message: 'No result returned from database function',
      }
    }

    return {
      success: true,
      organizationId: result.organization_id,
      storeId: result.store_id,
      alreadyExisted: result.already_existed || false,
    }
  } catch (error) {
    console.error('Unexpected error in createOrganizationFromIntent:', error)
    return {
      success: false,
      errorCode: 'database_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// GET USER'S ORGANIZATION
// =============================================================================
// Helper function to check if user has an organization and retrieve it.
// Used for routing logic in /start and other pages.

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

export type UserOrganization = {
  organizationId: string
  organizationSlug: string
  storeId: string | null
  storeSlug: string | null
  storeType: 'clothing' | 'car_care' | null
  storeStatus: 'draft' | 'active' | 'suspended' | 'archived' | null
  themeId: string | null
  onboardingCompleted: OnboardingStatus | null
}

export async function getUserOrganization(): Promise<UserOrganization | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  try {
    const { data, error } = await supabase.rpc('get_user_organization')

    if (error) {
      console.error('Error getting user organization:', error)
      return null
    }

    // The function returns a single row or empty
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null

    if (!result || !result.organization_id) {
      return null
    }

    return {
      organizationId: result.organization_id,
      organizationSlug: result.organization_slug,
      storeId: result.store_id,
      storeSlug: result.store_slug,
      storeType: result.store_type,
      storeStatus: result.store_status,
      themeId: result.theme_id,
      onboardingCompleted: result.onboarding_completed,
    }
  } catch (error) {
    console.error('Unexpected error in getUserOrganization:', error)
    return null
  }
}

// =============================================================================
// CHECK ONBOARDING INTENT
// =============================================================================
// Helper to check if user has an onboarding intent that hasn't been consumed

export async function hasOnboardingIntent(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('onboarding_intent')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}

// =============================================================================
// ASSIGN STORE THEME
// =============================================================================
// Automatically assigns a theme to the store based on store_type.
// This is a "silent" operation - the user never sees a theme picker in V1.
//
// Theme Mapping (V1 - Hardcoded):
// - clothing  → clothing_v1
// - car_care  → car_care_v1
//
// Safety guarantees:
// - Idempotent: If theme_id already exists, does nothing
// - Single UPDATE query
// - Respects RLS
// - Does NOT modify store status or other fields

const THEME_MAPPING: Record<StoreType, string> = {
  clothing: 'clothing_v1',
  car_care: 'car_care_v1',
}

export type AssignThemeResult =
  | { success: true; themeId: string; alreadyAssigned: boolean }
  | { success: false; errorCode: 'unauthorized' | 'no_store' | 'no_store_type' | 'database_error'; message?: string }

export async function assignStoreTheme(): Promise<AssignThemeResult> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Auth error in assignStoreTheme:', authError)
    return { success: false, errorCode: 'unauthorized' }
  }

  try {
    // Get user's organization and store info
    const organization = await getUserOrganization()

    if (!organization || !organization.storeId) {
      return {
        success: false,
        errorCode: 'no_store',
        message: 'No store found for user',
      }
    }

    // If theme is already assigned, do nothing (idempotent)
    if (organization.themeId) {
      return {
        success: true,
        themeId: organization.themeId,
        alreadyAssigned: true,
      }
    }

    // Validate store_type exists
    if (!organization.storeType) {
      return {
        success: false,
        errorCode: 'no_store_type',
        message: 'Store type not set',
      }
    }

    // Map store_type to theme_id
    const themeId = THEME_MAPPING[organization.storeType]

    if (!themeId) {
      return {
        success: false,
        errorCode: 'no_store_type',
        message: `Unknown store type: ${organization.storeType}`,
      }
    }

    // Update store with theme_id (single UPDATE query)
    const { error: updateError } = await supabase
      .from('stores')
      .update({ theme_id: themeId })
      .eq('id', organization.storeId)

    if (updateError) {
      console.error('Error updating store theme:', updateError)
      return {
        success: false,
        errorCode: 'database_error',
        message: updateError.message,
      }
    }

    return {
      success: true,
      themeId,
      alreadyAssigned: false,
    }
  } catch (error) {
    console.error('Unexpected error in assignStoreTheme:', error)
    return {
      success: false,
      errorCode: 'database_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// UPDATE ONBOARDING STATUS
// =============================================================================
// Updates the onboarding_completed status for the user's store.
// This is called when:
// - User completes onboarding
// - User skips onboarding
// - User is in progress (optional tracking)
//
// Safety guarantees:
// - Idempotent: Safe to call multiple times
// - Single UPDATE query
// - Respects RLS
// - Does NOT modify store status or other fields

export type UpdateOnboardingResult =
  | { success: true; status: OnboardingStatus }
  | { success: false; errorCode: 'unauthorized' | 'no_store' | 'database_error'; message?: string }

export async function updateOnboardingStatus(
  status: OnboardingStatus
): Promise<UpdateOnboardingResult> {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Auth error in updateOnboardingStatus:', authError)
    return { success: false, errorCode: 'unauthorized' }
  }

  try {
    // Get user's organization and store info
    const organization = await getUserOrganization()

    if (!organization || !organization.storeId) {
      return {
        success: false,
        errorCode: 'no_store',
        message: 'No store found for user',
      }
    }

    // Update store with onboarding status (single UPDATE query)
    const { error: updateError } = await supabase
      .from('stores')
      .update({ onboarding_completed: status })
      .eq('id', organization.storeId)

    if (updateError) {
      console.error('Error updating onboarding status:', updateError)
      return {
        success: false,
        errorCode: 'database_error',
        message: updateError.message,
      }
    }

    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('Unexpected error in updateOnboardingStatus:', error)
    return {
      success: false,
      errorCode: 'database_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// MARK ONBOARDING COMPLETE
// =============================================================================
// Convenience function to mark onboarding as completed

export async function completeOnboarding(): Promise<UpdateOnboardingResult> {
  return updateOnboardingStatus('completed')
}

// =============================================================================
// SKIP ONBOARDING
// =============================================================================
// Convenience function to mark onboarding as skipped

export async function skipOnboarding(): Promise<UpdateOnboardingResult> {
  return updateOnboardingStatus('skipped')
}
