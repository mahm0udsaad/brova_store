"use client"

import { useTranslations } from "next-intl"

interface CampaignStatsProps {
  total: number
  active: number
  scheduled: number
  draft: number
}

export function CampaignStats({ total, active, scheduled, draft }: CampaignStatsProps) {
  const t = useTranslations("admin")

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("marketingPage.stats.total")}</p>
        <p className="text-2xl font-bold mt-1">{total}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("marketingPage.stats.active")}</p>
        <p className="text-2xl font-bold mt-1 text-green-500">{active}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("marketingPage.stats.scheduled")}</p>
        <p className="text-2xl font-bold mt-1 text-yellow-500">{scheduled}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("marketingPage.stats.draft")}</p>
        <p className="text-2xl font-bold mt-1 text-muted-foreground">{draft}</p>
      </div>
    </div>
  )
}
