"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Facebook, Instagram, Music2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface CampaignDraft {
  id: string
  platform: string
  ui_structure: any
  media_assets: any
  copy_text: any
  status: string
  created_at: string
}

interface CampaignDetailModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: {
    id: string
    date: string
    drafts: CampaignDraft[]
  }
}

export function CampaignDetailModal({ isOpen, onClose, campaign }: CampaignDetailModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(campaign.drafts[0]?.platform || "facebook")
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const selectedDraft = campaign.drafts.find(d => d.platform === selectedPlatform)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatHashtags = (hashtags: string[]) => {
    return hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')
  }

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

  if (!selectedDraft) return null

  const caption = selectedDraft.ui_structure?.caption || ''
  const hashtags = selectedDraft.copy_text?.hashtags || []
  const cta = selectedDraft.ui_structure?.cta || ''
  const suggestedTime = selectedDraft.ui_structure?.suggestedTime || 'Anytime'
  const tips = selectedDraft.ui_structure?.tips || ''
  const imageUrl = selectedDraft.media_assets?.images?.[0] || ''

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 className="text-xl font-bold">Campaign Details</h2>
                  <p className="text-sm text-muted-foreground">{campaign.date}</p>
                </div>
                <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Platform Tabs */}
              <div className="flex items-center gap-2 px-6 py-4 border-b bg-muted/30">
                {campaign.drafts.map((draft) => (
                  <button
                    key={draft.platform}
                    onClick={() => setSelectedPlatform(draft.platform)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                      selectedPlatform === draft.platform
                        ? "bg-gradient-to-r text-white shadow-md" + " " + getPlatformColor(draft.platform)
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {getPlatformIcon(draft.platform)}
                    <span className="capitalize">{draft.platform}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="grid md:grid-cols-2 gap-6 p-6">
                  {/* Preview */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">POST PREVIEW</h3>
                      <div className="rounded-xl border bg-card p-4 space-y-4">
                        {/* Platform Header */}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white",
                            getPlatformColor(selectedPlatform)
                          )}>
                            {getPlatformIcon(selectedPlatform)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Store Name</p>
                            <p className="text-xs text-muted-foreground">Just now</p>
                          </div>
                        </div>

                        {/* Image */}
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt="Post preview"
                            className="w-full rounded-lg object-cover aspect-square"
                          />
                        )}

                        {/* Caption */}
                        <div className="space-y-2">
                          <p className="text-sm whitespace-pre-wrap">{caption}</p>
                          {hashtags.length > 0 && (
                            <p className="text-sm text-blue-600 font-medium">
                              {formatHashtags(hashtags)}
                            </p>
                          )}
                        </div>

                        {/* CTA */}
                        {cta && (
                          <div className="pt-3 border-t">
                            <p className="text-sm font-medium">{cta}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Copy & Details */}
                  <div className="space-y-4">
                    {/* Caption Copy */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">CAPTION</h3>
                        <Button
                          onClick={() => copyToClipboard(caption, 'caption')}
                          variant="ghost"
                          size="sm"
                          className="h-8"
                        >
                          {copiedText === 'caption' ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <p className="text-sm whitespace-pre-wrap">{caption}</p>
                      </div>
                    </div>

                    {/* Hashtags Copy */}
                    {hashtags.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            HASHTAGS ({hashtags.length})
                          </h3>
                          <Button
                            onClick={() => copyToClipboard(formatHashtags(hashtags), 'hashtags')}
                            variant="ghost"
                            size="sm"
                            className="h-8"
                          >
                            {copiedText === 'hashtags' ? (
                              <>
                                <Check className="w-4 h-4 mr-2 text-green-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                          <div className="flex flex-wrap gap-2">
                            {hashtags.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-medium"
                              >
                                #{tag.replace(/^#/, '')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CTA Copy */}
                    {cta && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-muted-foreground">CALL TO ACTION</h3>
                          <Button
                            onClick={() => copyToClipboard(cta, 'cta')}
                            variant="ghost"
                            size="sm"
                            className="h-8"
                          >
                            {copiedText === 'cta' ? (
                              <>
                                <Check className="w-4 h-4 mr-2 text-green-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                          <p className="text-sm font-medium">{cta}</p>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="rounded-lg border bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">BEST TIME TO POST</p>
                        <p className="text-sm font-medium">{suggestedTime}</p>
                      </div>
                      {tips && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">TIPS</p>
                          <p className="text-sm">{tips}</p>
                        </div>
                      )}
                    </div>

                    {/* Copy All Button */}
                    <Button
                      onClick={() => copyToClipboard(
                        `${caption}\n\n${formatHashtags(hashtags)}\n\n${cta}`,
                        'all'
                      )}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                      {copiedText === 'all' ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied Everything
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Everything
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
