import { createAdminClient } from "@/lib/supabase/admin"
import { BulkDealsPageClient } from "./bulk-deals-page-client"

export const metadata = {
  title: "Bulk Deals",
  description: "Manage bulk operations and batch processing",
}

export default async function BulkDealsPage() {
  const admin = createAdminClient()

  // Fetch bulk batches
  const { data: batches } = await admin
    .from("bulk_deal_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  return <BulkDealsPageClient initialBatches={batches || []} />
}
