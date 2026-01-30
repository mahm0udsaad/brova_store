import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { CampaignDetailClient } from "./campaign-detail-client"

interface PageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id, locale } = await params
  const campaignId = decodeURIComponent(id)
  const admin = createAdminClient()

  // Parse the timestamp from the campaign ID
  const timestamp = new Date(campaignId)
  timestamp.setSeconds(0, 0)

  // Fetch all drafts created within the same minute (campaign batch)
  const startTime = new Date(timestamp)
  const endTime = new Date(timestamp)
  endTime.setMinutes(endTime.getMinutes() + 1)

  const { data: drafts, error } = await admin
    .from("marketing_post_drafts")
    .select("*")
    .gte("created_at", startTime.toISOString())
    .lt("created_at", endTime.toISOString())
    .order("platform", { ascending: true })

  if (error || !drafts || drafts.length === 0) {
    notFound()
  }

  return <CampaignDetailClient drafts={drafts} campaignId={campaignId} locale={locale} />
}
