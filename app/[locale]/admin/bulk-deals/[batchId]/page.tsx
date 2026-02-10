import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import { BatchDetailClient } from "./batch-detail-client"

export const metadata = {
  title: "Batch Details",
  description: "View details of bulk processing batch",
}

interface BatchDetailPageProps {
  params: Promise<{
    batchId: string
  }>
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { batchId } = await params
  const admin = createAdminClient()

  // Fetch batch details
  const { data: batch, error: batchError } = await admin
    .from("bulk_deal_batches")
    .select("*")
    .eq("id", batchId)
    .single()

  if (batchError || !batch) {
    notFound()
  }

  // Fetch batch images
  const { data: images } = await admin
    .from("bulk_deal_images")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })

  return <BatchDetailClient batch={batch as any} initialImages={(images || []) as any} />
}
