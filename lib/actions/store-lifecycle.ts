"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

// =============================================================================
// Types
// =============================================================================

export type PublishResult =
  | { success: true }
  | { success: false; error: string; missing?: string[] }

export type ValidationResult = {
  valid: boolean
  missing: string[]
}

export type PreviewTokenResult =
  | { success: true; token: string; expiresAt: string }
  | { success: false; error: string }

// =============================================================================
// Helpers
// =============================================================================

async function getAuthenticatedStore() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  if (!org) return null

  const { data: store } = await supabase
    .from("stores")
    .select("id, status, name, store_type")
    .eq("organization_id", org.id)
    .single()
  if (!store) return null

  return { supabase, store, userId: user.id, organizationId: org.id }
}

// =============================================================================
// Validate Store for Publishing
// =============================================================================

export async function validateStoreForPublishing(): Promise<ValidationResult> {
  const ctx = await getAuthenticatedStore()
  if (!ctx) return { valid: false, missing: ["authentication"] }

  const missing: string[] = []

  // Check for at least one active product
  const { count } = await ctx.supabase
    .from("store_products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", ctx.store.id)
    .eq("status", "active")

  if (!count || count === 0) {
    missing.push("active_products")
  }

  if (!ctx.store.name) {
    missing.push("store_name")
  }

  if (!ctx.store.store_type) {
    missing.push("store_type")
  }

  return { valid: missing.length === 0, missing }
}

// =============================================================================
// Publish Store
// =============================================================================

export async function publishStore(): Promise<PublishResult> {
  const ctx = await getAuthenticatedStore()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const validation = await validateStoreForPublishing()
  if (!validation.valid) {
    return {
      success: false,
      error: "Store does not meet publishing requirements",
      missing: validation.missing,
    }
  }

  const { error } = await ctx.supabase
    .from("stores")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
    })
    .eq("id", ctx.store.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/")
  return { success: true }
}

// =============================================================================
// Unpublish Store
// =============================================================================

export async function unpublishStore(): Promise<PublishResult> {
  const ctx = await getAuthenticatedStore()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("stores")
    .update({ status: "draft" })
    .eq("id", ctx.store.id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/")
  return { success: true }
}

// =============================================================================
// Preview Tokens
// =============================================================================

export async function createPreviewToken(): Promise<PreviewTokenResult> {
  const ctx = await getAuthenticatedStore()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Clean up expired tokens for this store
  await ctx.supabase
    .from("store_preview_tokens")
    .delete()
    .eq("store_id", ctx.store.id)
    .lt("expires_at", new Date().toISOString())

  const { error } = await ctx.supabase
    .from("store_preview_tokens")
    .insert({
      store_id: ctx.store.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) return { success: false, error: error.message }

  return { success: true, token, expiresAt: expiresAt.toISOString() }
}

export async function validatePreviewToken(token: string): Promise<{ valid: boolean; storeId?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("store_preview_tokens")
    .select("store_id, expires_at")
    .eq("token", token)
    .single()

  if (error || !data) return { valid: false }

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("store_preview_tokens").delete().eq("token", token)
    return { valid: false }
  }

  return { valid: true, storeId: data.store_id }
}

// =============================================================================
// Delete Store (Restart Onboarding)
// =============================================================================

export async function deleteStoreAndRestartOnboarding(): Promise<{ success: true } | { success: false; error: string }> {
  const ctx = await getAuthenticatedStore()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Use admin client to bypass RLS for the delete itself, but only after
  // ownership was verified through getAuthenticatedStore().
  const admin = createAdminClient()
  const { data: deleted, error: deleteStoreError } = await admin
    .from("stores")
    .delete()
    .eq("id", ctx.store.id)
    .select("id")
    .maybeSingle()

  if (deleteStoreError) {
    return { success: false, error: deleteStoreError.message }
  }
  if (!deleted?.id) {
    return { success: false, error: "Store deletion did not affect any rows" }
  }

  revalidatePath("/")
  revalidatePath("/start")
  revalidatePath("/admin")

  return { success: true }
}
