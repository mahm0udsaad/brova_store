"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Send,
  Sparkles,
  Loader2,
  ImagePlus,
  X,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { createClient } from "@/lib/supabase/client"
import { useConcierge } from "./ConciergeProvider"

// =============================================================================
// TYPES
// =============================================================================

interface ConciergeConversationProps {
  onRequestReview: () => void
  storeId: string
}

interface StagedImage {
  id: string
  file: File
  previewUrl: string // local blob URL for display
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConciergeConversation({
  onRequestReview,
  storeId,
}: ConciergeConversationProps) {
  const locale = useLocale()
  const t = useTranslations("concierge")
  const router = useRouter()
  const isRtl = locale === "ar"
  const { refreshPreview } = useConcierge()

  const [inputValue, setInputValue] = useState("")
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const welcomeText = isRtl
    ? "مرحبا! أنا مساعد إعداد متجرك في بروفا. سأساعدك خطوة بخطوة لإعداد متجرك.\n\nأرسل لي شعار متجرك للبدء! 📸"
    : "Hi there! I'm your Brova store setup assistant. I'll help you set up your store step by step.\n\nSend me your store logo to get started! 📸"

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/onboarding/chat",
      body: { storeId, locale },
    }),
    messages: [
      {
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: welcomeText }],
      },
    ],
    onError: (error) => {
      console.error("Onboarding chat error:", error)
    },
    onFinish: () => {
      refreshPreview()
    },
  })

  const isStreaming = status === "streaming" || status === "submitted"
  const isBusy = isStreaming || isUploading
  const prevStatusRef = useRef(status)

  // Refresh preview when AI response completes (status goes from streaming → ready)
  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status
    if ((prev === "streaming" || prev === "submitted") && status === "ready") {
      const timer = setTimeout(() => refreshPreview(), 300)
      return () => clearTimeout(timer)
    }
  }, [status, refreshPreview])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      stagedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===========================================================================
  // File picker → stage images (no upload yet)
  // ===========================================================================
  const handleFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (!fileList || fileList.length === 0) return

      // Copy files BEFORE resetting input — FileList is a live object
      // that gets emptied when value is cleared
      const files = Array.from(fileList)
      e.target.value = "" // reset so same file can be re-selected

      const newImages: StagedImage[] = files
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          id: Math.random().toString(36).slice(2, 8),
          file,
          previewUrl: URL.createObjectURL(file),
        }))

      setStagedImages((prev) => [...prev, ...newImages])
      // Focus input so user can type a message alongside
      setTimeout(() => inputRef.current?.focus(), 100)
    },
    []
  )

  // Remove a staged image
  const removeStagedImage = useCallback((id: string) => {
    setStagedImages((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img) URL.revokeObjectURL(img.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }, [])

  // ===========================================================================
  // Submit: upload staged images (if any) + send message
  // ===========================================================================
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const text = inputValue.trim()
      const hasImages = stagedImages.length > 0

      // Need at least text or images
      if ((!text && !hasImages) || isBusy) return

      setInputValue("")

      // No images → plain text send
      if (!hasImages) {
        sendMessage({ text })
        return
      }

      // Upload images first, then send
      setIsUploading(true)
      const imagesToUpload = [...stagedImages]
      setStagedImages([]) // clear previews immediately

      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user?.id) {
          console.error("User not authenticated")
          return
        }

        const uploadedUrls: string[] = []
        const batchId = crypto.randomUUID()

        for (const img of imagesToUpload) {
          const ext = img.file.name.split(".").pop()
          const path = `onboarding/${userData.user.id}/${batchId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

          const { error } = await supabase.storage
            .from("uploads")
            .upload(path, img.file)

          if (error) {
            console.error("Upload error:", error)
            continue
          }

          const { data: publicUrl } = supabase.storage
            .from("uploads")
            .getPublicUrl(path)
          uploadedUrls.push(publicUrl.publicUrl)

          // Cleanup blob URL
          URL.revokeObjectURL(img.previewUrl)
        }

        if (uploadedUrls.length > 0) {
          const urlList = uploadedUrls.join("\n")
          const userText = text || (locale === "ar"
            ? `رفعت ${uploadedUrls.length} صورة للمنتجات`
            : `I've uploaded ${uploadedUrls.length} product images`)
          const fullText = `${userText}\n\n${locale === "ar" ? "روابط الصور" : "Image URLs"}:\n${urlList}`

          sendMessage({
            text: fullText,
            files: uploadedUrls.map((url) => ({
              type: "file" as const,
              mediaType: "image/jpeg",
              url,
            })),
          })
        } else if (text) {
          // Images failed but there was text — send text only
          sendMessage({ text })
        }
      } catch (err) {
        console.error("Image upload failed:", err)
        // Fall back to text-only if we had text
        if (text) sendMessage({ text })
      } finally {
        setIsUploading(false)
      }
    },
    [inputValue, stagedImages, isBusy, locale, sendMessage]
  )

  const lastMessage = messages[messages.length - 1]
  const showCursor = isStreaming && lastMessage?.role === "assistant"

  // Strip image URLs from display text (keep only the human-readable part)
  const stripImageUrls = (text: string) => {
    return text.replace(/\n\n(روابط الصور|Image URLs):\n[\s\S]*$/, "").trim()
  }

  const hasStagedImages = stagedImages.length > 0
  const canSend = (!isBusy) && (inputValue.trim() || hasStagedImages)

  // Detect if store setup is complete (complete_setup tool was called successfully)
  const isSetupComplete = useMemo(
    () =>
      messages.some((msg) =>
        msg.parts.some(
          (p: any) =>
            p.type === "tool-complete_setup" &&
            p.state === "output-available"
        )
      ),
    [messages]
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Compact Header */}
      <div
        className={cn(
          "shrink-0 px-4 py-2.5 border-b border-border",
          "flex items-center gap-2"
        )}
      >
        <div
          className={cn(
            "w-7 h-7 rounded-lg",
            "bg-gradient-to-br from-primary/20 to-primary/10",
            "flex items-center justify-center"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">{t("name")}</h2>
          <p className="text-[11px] text-muted-foreground">{t("role")}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((message, index) => {
          const isAssistant = message.role === "assistant"
          const isLastAssistant = isAssistant && index === messages.length - 1

          const rawText = message.parts
            .filter(
              (p): p is { type: "text"; text: string } => p.type === "text"
            )
            .map((p) => p.text)
            .join("")

          const textContent = !isAssistant ? stripImageUrls(rawText) : rawText

          const fileParts = (message.parts as any[]).filter(
            (p) => p.type === "file"
          ) as Array<{ type: "file"; mediaType: string; url: string }>

          if (!textContent && fileParts.length === 0) return null

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfigs.smooth}
              className={cn(
                "flex",
                isAssistant ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%]",
                  isAssistant ? "space-y-1" : ""
                )}
              >
                {isAssistant && (
                  <div className="flex items-center gap-1.5 px-1">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary">
                      <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {t("name")}
                    </span>
                  </div>
                )}
                {fileParts.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-1">
                    {fileParts.map((fp, i) => (
                      <img
                        key={i}
                        src={fp.url}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover border border-border"
                      />
                    ))}
                  </div>
                )}
                {textContent && (
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
                      isAssistant
                        ? "bg-muted/50 text-foreground"
                        : "bg-primary text-primary-foreground",
                      isRtl && "text-right"
                    )}
                  >
                    {textContent}
                    {isLastAssistant && showCursor && (
                      <span className="ms-0.5 inline-block h-[1.2em] w-[2px] animate-pulse bg-foreground" />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* Thinking / uploading indicator */}
        {(isStreaming || isUploading) && lastMessage?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 px-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary animate-pulse">
                <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {isUploading
                  ? (isRtl ? "يرفع الصور..." : "Uploading...")
                  : (isRtl ? "يفكر..." : "Thinking...")}
              </span>
            </div>
          </div>
        )}

        {/* Completion action buttons */}
        {isSetupComplete && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfigs.smooth}
            className="flex gap-2 justify-center py-2"
          >
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 rounded-lg text-xs"
              onClick={() => onRequestReview()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isRtl ? "معاينة المتجر" : "Preview Store"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg text-xs"
              onClick={() => router.push(`/${locale}/admin`)}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {isRtl ? "لوحة التحكم" : "Admin Panel"}
            </Button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border">
        {/* Staged image previews */}
        <AnimatePresence>
          {hasStagedImages && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none">
                {stagedImages.map((img) => (
                  <div key={img.id} className="relative shrink-0 group">
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeStagedImage(img.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="px-3 py-2">
          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilePick}
              className="hidden"
            />

            {/* Image button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <ImagePlus className="w-4 h-4" />
            </Button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  hasStagedImages
                    ? (isRtl ? "أضف وصف (اختياري)..." : "Add a caption (optional)...")
                    : (isRtl ? "اكتب رسالة..." : "Type a message...")
                }
                className={cn(
                  "w-full h-10 px-3 rounded-lg",
                  "bg-muted border border-border",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "text-sm placeholder:text-muted-foreground",
                  isRtl && "text-right"
                )}
                disabled={isBusy}
              />
            </div>

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-lg shrink-0"
              disabled={!canSend}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className={cn("w-4 h-4", isRtl && "rotate-180")} />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
