"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getDomains() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Resolve store_id from organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!org) return []

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("organization_id", org.id)
    .single()

  if (!store) return []

  const { data: domains } = await supabase
        .from("store_domains")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return domains || []
}

export async function addDomain(domain: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Resolve store_id
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).single()
  if (!org) throw new Error("No organization found")
  const { data: store } = await supabase.from("stores").select("id").eq("organization_id", org.id).single()
  if (!store) throw new Error("No store found")

  // Mock DNS records for instruction
  const dnsRecords = {
    type: "CNAME",
    name: "www",
    value: "ingress.brova.app",
    verification_code: `brova-verification-${Math.random().toString(36).substring(7)}`
  }

  const { error } = await supabase    .from("store_domains").insert({
    store_id: store.id,
    domain,
    status: "pending",
    dns_records: dnsRecords,
    is_primary: false
  })

  if (error) throw error
  revalidatePath("/admin/domains")
}

export async function deleteDomain(id: string) {
  const supabase = await createClient()
  const { error } = await supabase    .from("store_domains").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/admin/domains")
}

export async function verifyDomain(id: string) {
  // Simulate verification
  const supabase = await createClient()
  const { error } = await supabase
        .from("store_domains")
    .update({ status: "verified" })
    .eq("id", id)

  if (error) throw error
  revalidatePath("/admin/domains")
}

export async function setPrimaryDomain(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  
   // Resolve store_id
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).single()
  if (!org) throw new Error("No organization found")
  const { data: store } = await supabase.from("stores").select("id").eq("organization_id", org.id).single()
  if (!store) throw new Error("No store found")

  // Reset all to not primary
  await supabase
        .from("store_domains")
    .update({ is_primary: false })
    .eq("store_id", store.id)

  // Set selected to primary
  const { error } = await supabase
        .from("store_domains")
    .update({ is_primary: true })
    .eq("id", id)

  if (error) throw error
  revalidatePath("/admin/domains")
}
