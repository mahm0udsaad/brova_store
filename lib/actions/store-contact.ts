"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getStoreContact() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Resolve store_id from organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!org) return null

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("organization_id", org.id)
    .single()

  if (!store) return null

  const { data: contact } = await supabase
    .from("store_contact")
    .select("*")
    .eq("store_id", store.id)
    .single()

  return contact
}

export async function updateStoreContact(data: {
  store_name?: string
  email?: string
  phone?: string
  address?: string
  country?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Resolve store_id
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).single()
  if (!org) throw new Error("No organization found")
  const { data: store } = await supabase.from("stores").select("id").eq("organization_id", org.id).single()
  if (!store) throw new Error("No store found")

  const { error } = await supabase
    .from("store_contact")
    .upsert({
      store_id: store.id,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'store_id' })

  if (error) throw error
  revalidatePath("/admin/settings")
}
