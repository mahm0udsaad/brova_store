import { createClient } from "@supabase/supabase-js"

let adminClient: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL")
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })

  return adminClient
}
