"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { RefreshCw, Calendar, Facebook, Instagram, Music2, ChevronRight, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface SavedDraft {
  id: string
  platform: string
  ui_structure: any
  media_assets: any
  copy_text: any
  status: string
  created_at: string
}

interface SavedDraftsProps {
  drafts: SavedDraft[]
  isLoading: boolean
  onRefresh: () => void
}

interface Campaign {
  id: string
  date: string
  drafts: SavedDraft[]
  timestamp: number
}

export function SavedDrafts({ drafts, isLoading, onRefresh }: SavedDraftsProps) {
  const t = useTranslations("admin")
  const router = useRouter()

  // Group drafts by campaign (same minute = same campaign)
  const campaigns = useMemo(() => {
    const campaignMap: Record<string, SavedDraft[]> = {}
    
    drafts.forEach((draft) => {
      // Group by minute to catch drafts created in the same batch
      const timestamp = new Date(draft.created_at)
      timestamp.setSeconds(0, 0) // Reset seconds and milliseconds
      const campaignKey = timestamp.toISOString()
      
      if (!campaignMap[campaignKey]) {
        campaignMap[campaignKey] = []
      }
      campaignMap[campaignKey].push(draft)
    })

    // Convert to campaign objects
    const campaignList: Campaign[] = Object.entries(campaignMap).map(([key, drafts]) => ({
      id: key,
      date: new Date(key).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      drafts,
      timestamp: new Date(key).getTime(),
    }))

    // Sort by most recent first
    return campaignList.sort((a, b) => b.timestamp - a.timestamp)
  }, [drafts])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-4 h-4" />
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'tiktok':
        return <Music2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'from-blue-500 to-blue-600'
      case 'instagram':
        return 'from-pink-500 via-purple-500 to-orange-500'
      case 'tiktok':
        return 'from-black to-gray-800'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (drafts.length === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("marketingGenerator.saved.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("marketingGenerator.saved.counts", {
                campaigns: campaigns.length,
                posts: drafts.length,
              })}
            </p>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {t("marketingGenerator.saved.refresh")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign, index) => {
            const firstDraft = campaign.drafts[0]
            const imageUrl = firstDraft.media_assets?.images?.[0]
            const caption = firstDraft.ui_structure?.caption || firstDraft.copy_text?.caption || t("marketingGenerator.saved.noCaption")
            
            return (
              <motion.button
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/en/admin/marketing/campaign/${encodeURIComponent(campaign.id)}`)}
                className="group rounded-xl border bg-card hover:shadow-lg transition-all duration-300 overflow-hidden text-left w-full"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t("marketingGenerator.saved.previewAlt")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Platform badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {campaign.drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className={`h-8 w-8 rounded-full bg-gradient-to-br ${getPlatformColor(draft.platform)} flex items-center justify-center text-white shadow-lg`}
                      >
                        {getPlatformIcon(draft.platform)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {caption}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{campaign.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-600 font-medium">
                        {t("marketingGenerator.saved.platformCount", { count: campaign.drafts.length })}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        firstDraft.status === "draft"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-green-500/10 text-green-600"
                      }`}>
                        {t(`marketingGenerator.saved.status.${firstDraft.status}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
