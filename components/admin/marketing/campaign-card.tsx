"use client"

import { motion } from "framer-motion"
import { Clock, Eye, Edit, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

interface Campaign {
  id: string
  name: string
  type: "email" | "sms" | "instagram" | "facebook" | "general"
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled"
  content: any
  products: string[]
  metrics: any
  created_at: string
}

interface TypeConfig {
  icon: LucideIcon
  label: string
  color: string
}

interface StatusConfig {
  icon: LucideIcon
  label: string
  color: string
}

interface CampaignCardProps {
  campaign: Campaign
  typeConfig: TypeConfig
  statusConfig: StatusConfig
  index: number
}

export function CampaignCard({ campaign, typeConfig, statusConfig, index }: CampaignCardProps) {
  const t = useTranslations("admin")
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", typeConfig.color)}>
          <TypeIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{campaign.name}</h3>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
              statusConfig.color
            )}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.content?.body || campaign.content?.caption || t("marketingPage.card.noContent")}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(campaign.created_at).toLocaleDateString()}
            </span>
            {campaign.products?.length > 0 && (
              <span>{t("marketingPage.card.productsCount", { count: campaign.products.length })}</span>
            )}
            {campaign.metrics?.views && (
              <span>{t("marketingPage.card.viewsCount", { count: campaign.metrics.views })}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Edit className="w-4 h-4" />
          </Button>
          {campaign.status === "draft" && (
            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-600">
              <Send className="w-4 h-4 mr-1" />
              {t("marketingPage.card.publish")}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
