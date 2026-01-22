import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin/is-admin"
import InventoryPageClient from "./inventory-page-client"

type AdminProductRow = {
  id: string
  name: string
  price: number | null
  category_id: string | null
  image_url: string | null
  published: boolean | null
  sizes: string[] | null
}

export default async function AdminInventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isAdmin(user)) {
    redirect("/")
  }

  const admin = createAdminClient()
  const { data: products } = await admin
    .from("products")
    .select("id,name,price,category_id,image_url,published,sizes")
    .order("created_at", { ascending: false })

  return <InventoryPageClient initialProducts={(products as AdminProductRow[]) || []} />
}
