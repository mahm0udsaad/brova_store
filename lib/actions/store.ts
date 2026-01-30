"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function publishStore() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).single()
  if (!org) throw new Error("No organization found")

  // Update store status to active
  const { error } = await supabase
    .from("stores")
    .update({ 
      status: "active",
      published_at: new Date().toISOString()
    })
    .eq("organization_id", org.id)

  if (error) throw error
  revalidatePath("/")
}

export async function getStoreStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).single()
  if (!org) return null

  const { data: store } = await supabase
    .from("stores")
    .select("status, slug")
    .eq("organization_id", org.id)
    .single()

  return store
}
