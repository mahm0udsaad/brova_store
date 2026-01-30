"use client"

import { Heart, MessageCircle, Share2, Bookmark, Send, MoreHorizontal, Play } from "lucide-react"
import { useTranslations } from "next-intl"

interface Draft {
  id: string
  platform: string
  ui_structure: any
  media_assets: any
  copy_text: any
  status: string
  created_at: string
}

interface SocialPostPreviewProps {
  draft: Draft
}

export function SocialPostPreview({ draft }: SocialPostPreviewProps) {
  const t = useTranslations("admin")
  const { platform, ui_structure, media_assets } = draft

  switch (platform) {
    case "facebook":
      return <FacebookPostPreview uiStructure={ui_structure} mediaAssets={media_assets} />
    case "instagram":
      return <InstagramPostPreview uiStructure={ui_structure} mediaAssets={media_assets} />
    case "tiktok":
      return <TikTokPostPreview uiStructure={ui_structure} mediaAssets={media_assets} />
    default:
      return <div className="text-sm text-muted-foreground">{t("campaignDetail.previewUnavailable")}</div>
  }
}

function FacebookPostPreview({ uiStructure, mediaAssets }: any) {
  const t = useTranslations("admin")
  const imageUrl = mediaAssets.images[0]

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
            B
          </div>
          <div>
            <p className="font-semibold text-sm">{uiStructure.header?.name || "Store Name"}</p>
            <p className="text-xs text-gray-500">{uiStructure.header?.timestamp || t("campaignDetail.justNow")} · 🌎</p>
          </div>
        </div>
        <button className="text-gray-500 hover:bg-gray-100 rounded-full p-2">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">
          {uiStructure.caption}
        </p>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="w-full aspect-[4/3] bg-gray-100">
          <img src={imageUrl} alt={t("campaignDetail.postAlt")} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Metrics */}
      <div className="px-4 py-3 border-t border-b border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-[10px]">👍</span>
              </div>
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-[10px]">❤️</span>
              </div>
            </div>
            <span>{uiStructure.metrics?.likes || 0}</span>
          </div>
          <div className="flex gap-3">
            <span>{t("campaignDetail.commentsCount", { count: uiStructure.metrics?.comments || 0 })}</span>
            <span>{t("campaignDetail.sharesCount", { count: uiStructure.metrics?.shares || 0 })}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around p-2">
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors flex-1 justify-center">
          <Heart className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">{t("campaignDetail.like")}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors flex-1 justify-center">
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">{t("campaignDetail.comment")}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors flex-1 justify-center">
          <Share2 className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">{t("campaignDetail.share")}</span>
        </button>
      </div>
    </div>
  )
}

function InstagramPostPreview({ uiStructure, mediaAssets }: any) {
  const t = useTranslations("admin")
  const imageUrl = mediaAssets.images[0]

  return (
    <div className="w-full max-w-md mx-auto rounded-lg border bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                B
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm">{uiStructure.header?.handle || "store"}</p>
            <p className="text-xs text-gray-500">{uiStructure.header?.timestamp || t("campaignDetail.justNow")}</p>
          </div>
        </div>
        <button className="text-gray-700">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="w-full aspect-square bg-gray-100">
          <img src={imageUrl} alt={t("campaignDetail.postAlt")} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="hover:opacity-70 transition-opacity">
              <Heart className="w-6 h-6" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button className="hover:opacity-70 transition-opacity">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold">{t("campaignDetail.likesCount", { count: uiStructure.metrics?.likes || 0 })}</p>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold mr-2">{uiStructure.header?.handle || "store"}</span>
          <span className="text-gray-800 whitespace-pre-wrap line-clamp-3">
            {uiStructure.caption}
          </span>
        </div>

        {/* View comments */}
        <button className="text-sm text-gray-500">
          {t("campaignDetail.viewAllComments", { count: uiStructure.metrics?.comments || 0 })}
        </button>
      </div>
    </div>
  )
}

function TikTokPostPreview({ uiStructure, mediaAssets }: any) {
  const t = useTranslations("admin")
  const imageUrl = mediaAssets.images[0]

  return (
    <div className="w-full max-w-md mx-auto rounded-lg bg-black overflow-hidden shadow-sm relative aspect-[9/16]">
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0">
          <img src={imageUrl} alt={t("campaignDetail.postAlt")} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
        </div>
      )}

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-8 h-8 text-white ml-1" fill="white" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 z-10">
        {/* Creator Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
            B
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">
              @{uiStructure.header?.handle || "store"}
            </p>
          </div>
          <button className="px-6 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-sm transition-colors">
            {t("campaignDetail.follow")}
          </button>
        </div>

        {/* Caption */}
        <p className="text-white text-sm whitespace-pre-wrap line-clamp-3">
          {uiStructure.caption}
        </p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-2">
          {uiStructure.hashtags?.slice(0, 3).map((tag: string, idx: number) => (
            <span key={idx} className="text-white text-xs font-semibold">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-20 space-y-6 z-10">
        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-gray-700/50 transition-colors">
            <Heart className="w-6 h-6" />
          </button>
          <span className="text-white text-xs font-semibold">
            {uiStructure.metrics?.likes ? `${(uiStructure.metrics.likes / 1000).toFixed(1)}K` : 0}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-gray-700/50 transition-colors">
            <MessageCircle className="w-6 h-6" />
          </button>
          <span className="text-white text-xs font-semibold">{uiStructure.metrics?.comments || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-gray-800/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-gray-700/50 transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
          <span className="text-white text-xs font-semibold">{uiStructure.metrics?.shares || 0}</span>
        </div>
      </div>
    </div>
  )
}
