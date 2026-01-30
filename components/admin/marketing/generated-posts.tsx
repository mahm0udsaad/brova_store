"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Send,
  Bookmark,
  MessageSquare,
  Eye,
  Music2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buildMarketingDrafts, type MarketingPostUI } from "@/lib/marketing/post-ui"
import { useTranslations } from "next-intl"

interface GeneratedPostsProps {
  posts: Record<string, any>
  mediaUrls: string[]
  onGenerateNew: () => void
}

const BRAND = {
  name: "Store Name",
  handle: "store",
  avatarUrl: "/placeholder-logo.svg",
}

const formatCount = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(value)

const formatPostCopy = (ui: MarketingPostUI) => {
  const hashtags = ui.hashtags.map((tag) => `#${tag}`).join(" ")
  return `${ui.caption}\n\n${hashtags}\n\n${ui.cta}`.trim()
}

export function GeneratedPosts({ posts, mediaUrls, onGenerateNew }: GeneratedPostsProps) {
  const t = useTranslations("admin")
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)

  const drafts = useMemo(
    () => buildMarketingDrafts(posts, mediaUrls, BRAND),
    [posts, mediaUrls]
  )

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("marketingGenerator.generated.title")}</h3>
        <Button onClick={onGenerateNew} variant="outline" size="sm">
          {t("marketingGenerator.generated.generateNew")}
        </Button>
      </div>

      {drafts.map((draft) => {
        const ui = draft.uiStructure
        const isCopied = copiedPlatform === ui.platform

        return (
          <motion.div
            key={ui.platform}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold capitalize">{ui.platform}</h4>
                <p className="text-xs text-muted-foreground">{t("marketingGenerator.generated.preview")}</p>
              </div>
              <Button
                onClick={() => copyToClipboard(formatPostCopy(ui), ui.platform)}
                variant="outline"
                size="sm"
                className={cn(
                  "transition",
                  isCopied ? "bg-green-500/10 border-green-500 text-green-600" : ""
                )}
              >
                {isCopied
                  ? t("marketingGenerator.generated.copied")
                  : t("marketingGenerator.generated.copyCaption")}
              </Button>
            </div>

            {ui.platform === "facebook" && <FacebookPostPreview ui={ui} />}
            {ui.platform === "instagram" && <InstagramPostPreview ui={ui} />}
            {ui.platform === "tiktok" && <TikTokPostPreview ui={ui} />}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function FacebookPostPreview({ ui }: { ui: MarketingPostUI }) {
  const t = useTranslations("admin")
  return (
    <div className="max-w-md w-full rounded-2xl border bg-background shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <img
            src={ui.header.avatarUrl}
            alt={`${ui.header.name} avatar`}
            className="h-10 w-10 rounded-full border object-cover"
          />
          <div>
            <p className="text-sm font-semibold leading-tight">{ui.header.name}</p>
            <p className="text-xs text-muted-foreground">{ui.header.timestamp} · 🌍</p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="px-4 pt-3 text-sm text-foreground">
        <p>{ui.caption}</p>
      </div>

      <div className="px-4 pt-3">
        <img
          src={ui.media.urls[0]}
          alt={t("marketingGenerator.preview.facebookMediaAlt")}
          className="w-full rounded-xl object-cover aspect-[4/3]"
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
            👍
          </span>
          <span>{formatCount(ui.metrics.likes)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{t("marketingGenerator.preview.commentsCount", { count: formatCount(ui.metrics.comments) })}</span>
          <span>{t("marketingGenerator.preview.sharesCount", { count: formatCount(ui.metrics.shares) })}</span>
        </div>
      </div>

      <div className="mt-3 border-t px-4 py-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <button className="flex items-center gap-2 hover:text-foreground transition">
            <ThumbsUp className="h-4 w-4" />
            {t("marketingGenerator.preview.like")}
          </button>
          <button className="flex items-center gap-2 hover:text-foreground transition">
            <MessageCircle className="h-4 w-4" />
            {t("marketingGenerator.preview.comment")}
          </button>
          <button className="flex items-center gap-2 hover:text-foreground transition">
            <Share2 className="h-4 w-4" />
            {t("marketingGenerator.preview.share")}
          </button>
        </div>
      </div>
    </div>
  )
}

function InstagramPostPreview({ ui }: { ui: MarketingPostUI }) {
  const t = useTranslations("admin")
  return (
    <div className="max-w-md w-full rounded-2xl border bg-background shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <img
            src={ui.header.avatarUrl}
            alt={`${ui.header.name} avatar`}
            className="h-9 w-9 rounded-full border object-cover"
          />
          <div>
            <p className="text-sm font-semibold leading-tight">{ui.header.handle}</p>
            <p className="text-[11px] text-muted-foreground">{t("marketingGenerator.preview.originalAudio")}</p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="relative mt-3">
        <img
          src={ui.media.urls[0]}
          alt={t("marketingGenerator.preview.instagramMediaAlt")}
          className="w-full object-cover aspect-square"
        />
        {ui.media.urls.length > 1 && (
        <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
          1/{ui.media.urls.length}
        </div>
      )}
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          <Heart className="h-5 w-5" />
          <MessageSquare className="h-5 w-5" />
          <Send className="h-5 w-5" />
        </div>
        <Bookmark className="h-5 w-5" />
      </div>

      <div className="px-4 pt-2 text-sm font-semibold">
        {t("marketingGenerator.preview.likesCount", { count: formatCount(ui.metrics.likes) })}
      </div>

      <div className="px-4 pt-1 text-sm">
        <span className="font-semibold">{ui.header.handle}</span>{" "}
        <span>{ui.caption}</span>
      </div>

      {ui.hashtags.length > 0 && (
        <div className="px-4 pt-1 text-sm text-blue-600">
          {ui.hashtags.map((tag) => `#${tag}`).join(" ")}
        </div>
      )}

      <div className="px-4 pt-2 pb-4 text-xs text-muted-foreground">
        {t("marketingGenerator.preview.viewAllComments", {
          count: formatCount(ui.metrics.comments),
          timestamp: ui.header.timestamp,
        })}
      </div>
    </div>
  )
}

function TikTokPostPreview({ ui }: { ui: MarketingPostUI }) {
  const t = useTranslations("admin")
  return (
    <div className="max-w-md w-full rounded-2xl border bg-black text-white shadow-sm overflow-hidden">
      <div className="relative">
        <img
          src={ui.media.urls[0]}
          alt={t("marketingGenerator.preview.tiktokMediaAlt")}
          className="w-full object-cover aspect-[9/16]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute left-4 top-4 rounded-full bg-black/60 px-2 py-1 text-[10px] flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {formatCount(ui.metrics.views)}
        </div>

        <div className="absolute bottom-4 left-4 right-14 space-y-2 text-sm">
          <p className="font-semibold">@{ui.header.handle}</p>
          <p className="text-sm">{ui.caption}</p>
          {ui.hashtags.length > 0 && (
            <p className="text-xs text-white/80">
              {ui.hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Music2 className="h-4 w-4" />
            <span>{t("marketingGenerator.preview.originalSound")}</span>
          </div>
        </div>

        <div className="absolute bottom-6 right-3 flex flex-col items-center gap-4 text-xs">
          <img
            src={ui.header.avatarUrl}
            alt={`${ui.header.name} avatar`}
            className="h-10 w-10 rounded-full border-2 border-white object-cover"
          />
          <div className="flex flex-col items-center gap-1">
            <Heart className="h-7 w-7" />
            <span>{formatCount(ui.metrics.likes)}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="h-7 w-7" />
            <span>{formatCount(ui.metrics.comments)}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Share2 className="h-7 w-7" />
            <span>{formatCount(ui.metrics.shares)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 text-xs text-white/70">
        <span>{ui.cta}</span>
        <span>{ui.header.timestamp}</span>
      </div>
    </div>
  )
}
