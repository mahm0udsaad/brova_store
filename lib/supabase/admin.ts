import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

let adminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Creates a Supabase admin client that bypasses Row Level Security (RLS)
 *
 * IMPORTANT: Only use this for:
 * - Webhook handlers (Stripe, payment providers)
 * - Background jobs that run without user context
 * - Administrative operations that require elevated privileges
 *
 * DO NOT use for regular user operations - use the regular client instead
 */
export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
      "Get the service_role key from Supabase Dashboard → Settings → API"
    )
  }

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
