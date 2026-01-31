"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Minimize2, Sparkles, Bot, GripVertical, Paperclip, X, MessageSquarePlus } from "lucide-react"
import { useAdminAssistant } from "./AdminAssistantProvider"
import { AdminAssistantMessage } from "./AdminAssistantMessage"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"

interface AdminAssistantSidePanelProps {
  staticMode?: boolean
}

export function AdminAssistantSidePanel({ staticMode = false }: AdminAssistantSidePanelProps) {
  const locale = useLocale()
  const t = useTranslations("admin")
  const isRtl = locale === "ar"
  const {
    messages,
    sendMessage,
    isLoading,
    setDisplayMode,
    pageContext,
    startNewChat,
  } = useAdminAssistant()

  const [input, setInput] = useState("")
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [width, setWidth] = useState(400)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isResizing = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = isRtl ? e.clientX : window.innerWidth - e.clientX
      setWidth(Math.min(Math.max(320, newWidth), 600))
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const handleResizeStart = () => {
    isResizing.current = true
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: string[] = []
    let filesProcessed = 0
    const maxImages = 10 // Limit to 10 images

    if (selectedImages.length >= maxImages) {
      alert(t("assistantPanel.alertMaxImages", { max: maxImages }))
      return
    }

    const filesToProcess = Math.min(files.length, maxImages - selectedImages.length)

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i]
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit per file
        alert(t("assistantPanel.alertFileTooLarge", { name: file.name }))
        filesProcessed++
        if (filesProcessed === filesToProcess && newImages.length > 0) {
          setSelectedImages(prev => [...prev, ...newImages])
        }
        continue
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result as string)
        filesProcessed++
        
        if (filesProcessed === filesToProcess) {
          setSelectedImages(prev => [...prev, ...newImages])
        }
      }
      reader.onerror = () => {
        filesProcessed++
        if (filesProcessed === filesToProcess && newImages.length > 0) {
          setSelectedImages(prev => [...prev, ...newImages])
        }
      }
      reader.readAsDataURL(file)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return

    const message = input.trim()
    const images = selectedImages.length > 0 ? selectedImages : undefined
    setInput("")
    setSelectedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    await sendMessage(message, images)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const panelContent = (
    <div
      style={{ width: staticMode ? width : width }}
      className={cn(
        "flex h-full flex-col bg-background transition-all border-l rtl:border-r rtl:border-l-0 shadow-none",
        staticMode 
          ? "fixed inset-y-0 right-0 z-50 w-full md:w-[400px] lg:relative lg:z-0 lg:h-screen lg:w-auto" 
          : "fixed ltr:right-0 rtl:left-0 top-0 z-40 shadow-2xl h-full"
      )}
    >
      {/* Resize Handle - Only show on desktop when static */}
      {staticMode && (
        <div
          onMouseDown={handleResizeStart}
          className="hidden lg:flex absolute ltr:-left-1 rtl:-right-1 top-0 z-10 h-full w-2 cursor-ew-resize items-center justify-center hover:bg-primary/10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-white shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{t("assistantPanel.title")}</h3>
            {pageContext && (
              <p className="text-xs text-white/90 font-medium">
                {t("assistantPanel.contextLabel")}: {pageContext.pageName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/20 rounded-lg"
            onClick={startNewChat}
            title="Start new chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/20 rounded-lg"
            onClick={() => setDisplayMode(staticMode ? "collapsed" : "panel")}
            title={staticMode ? "Close" : "Minimize"}
          >
            {staticMode ? <X className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Capabilities Info */}
      {pageContext?.capabilities && pageContext.capabilities.length > 0 && (
        <div className="border-b px-4 py-2 bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground">
            {t("assistantPanel.availableActions")}: {pageContext.capabilities.slice(0, 3).join(", ")}
            {pageContext.capabilities.length > 3 &&
              t("assistantPanel.moreActions", { count: pageContext.capabilities.length - 3 })}
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <AdminAssistantMessage key={message.id} message={message} expanded />
        ))}

        {/* Only show loading dots if there's no thinking message with steps already showing */}
        {isLoading && !messages.some(m => m.isThinking && m.steps && m.steps.length > 0) && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t("assistantPanel.assistantName")}
              </p>
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3 w-fit">
                <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 shrink-0 bg-background">
        {selectedImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative">
                <img 
                  src={image} 
                  alt={t("assistantPanel.selectedImageAlt", { index: index + 1 })} 
                  className="h-20 w-20 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute ltr:-right-2 rtl:-left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("assistantPanel.placeholder")}
            rows={3}
            className="w-full resize-none rounded-xl border bg-muted/50 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || selectedImages.length >= 10}
              >
                <Paperclip className="h-4 w-4" />
                {selectedImages.length > 0 && (
                  <span className="ms-1 text-[10px] font-medium">
                    {selectedImages.length}
                  </span>
                )}
              </Button>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t("assistantPanel.pressEnterToSend")}
              </p>
            </div>
            <Button
              type="submit"
              disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
              className={cn(
                "rounded-xl transition-all",
                (input.trim() || selectedImages.length > 0) && !isLoading
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  : ""
              )}
            >
              <Send className="h-4 w-4 me-2" />
              {t("assistantPanel.send")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )

  if (staticMode) {
    return panelContent
  }

  return (
    <motion.div
      initial={{ x: isRtl ? "-100%" : "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: isRtl ? "-100%" : "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{ width }}
      className="fixed ltr:right-0 rtl:left-0 top-0 z-40 h-full"
    >
      {panelContent}
    </motion.div>
  )
}
