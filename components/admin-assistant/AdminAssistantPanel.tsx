"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Maximize2, Sparkles, Bot, Paperclip, X, Image as ImageIcon, MessageSquarePlus } from "lucide-react"
import { useAdminAssistant } from "./AdminAssistantProvider"
import { AdminAssistantMessage } from "./AdminAssistantMessage"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminAssistantPanel() {
  const {
    messages,
    sendMessage,
    isLoading,
    close,
    setDisplayMode,
    pageContext,
    startNewChat,
  } = useAdminAssistant()

  const [input, setInput] = useState("")
  const [attachedImages, setAttachedImages] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedImages.length === 0) || isLoading) return

    const message = input.trim() || "Process these images"
    setInput("")
    const imagesToSend = [...attachedImages]
    setAttachedImages([])
    await sendMessage(message, imagesToSend)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const maxImages = 10
    const remainingSlots = Math.max(0, maxImages - attachedImages.length)

    if (remainingSlots === 0) {
      alert("You can attach up to 10 images.")
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const readAsDataURL = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

    const processFiles = async () => {
      const results: string[] = []
      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue
        if (file.size > 5 * 1024 * 1024) {
          alert(`"${file.name}" is larger than 5MB and was skipped.`)
          continue
        }
        try {
          const base64 = await readAsDataURL(file)
          results.push(base64)
        } catch (error) {
          console.error("Failed to read image file:", file.name, error)
        }
      }
      if (results.length > 0) {
        setAttachedImages((prev) => [...prev, ...results])
      }
    }

    void processFiles()

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Manager Assistant</h3>
            {pageContext && (
              <p className="text-xs text-white/90 font-medium">
                Context: {pageContext.pageName}
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
            onClick={() => setDisplayMode("side-panel")}
            title="Expand to side panel"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && messages[0].id === "welcome" && pageContext?.pageType === "bulk-deals" && (
          <div className="space-y-3 mt-2">
            <p className="text-xs font-medium text-muted-foreground">Available actions:</p>
            <div className="grid gap-2">
              <button
                onClick={() => {
                  setInput("Process multiple product images")
                  inputRef.current?.focus()
                }}
                className="text-left text-xs p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                📸 Process multiple product images
              </button>
              <button
                onClick={() => {
                  setInput("Remove backgrounds in batch")
                  inputRef.current?.focus()
                }}
                className="text-left text-xs p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                🎨 Remove backgrounds in batch
              </button>
              <button
                onClick={() => {
                  setInput("Generate lifestyle shots")
                  inputRef.current?.focus()
                }}
                className="text-left text-xs p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                ✨ Generate lifestyle shots
              </button>
            </div>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <AdminAssistantMessage 
            key={message.id} 
            message={message}
            onRetry={message.retryable ? () => {
              // Find the previous user message and resend it
              const userMessages = messages.slice(0, idx).filter(m => m.role === "user")
              const lastUserMessage = userMessages[userMessages.length - 1]
              if (lastUserMessage) {
                sendMessage(lastUserMessage.content, lastUserMessage.images)
              }
            } : undefined}
          />
        ))}

        {/* Only show loading dots if there's no thinking message with steps already showing */}
        {isLoading && !messages.some(m => m.isThinking && m.steps && m.steps.length > 0) && (
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/40" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t">
        {/* Image Preview */}
        {attachedImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b p-3 bg-muted/30">
            {attachedImages.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0 group">
                <img
                  src={img}
                  alt={`Attachment ${idx + 1}`}
                  className="h-16 w-16 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Placeholder text for image context */}
        {attachedImages.length > 0 && pageContext?.pageType === "bulk-deals" && (
          <div className="px-3 pt-2 pb-1 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <ImageIcon className="h-3 w-3" />
              {attachedImages.length} image{attachedImages.length > 1 ? "s" : ""} ready for processing
            </p>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 flex flex-col gap-1">
            <textarea
              ref={inputRef as any}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={attachedImages.length > 0 ? "Describe what you want to do with these images..." : "Ask me to generate descriptions, analyze images, create campaigns..."}
              className="flex-1 rounded-xl border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[42px] max-h-[120px]"
              disabled={isLoading}
              rows={1}
              style={{
                height: "auto",
                minHeight: "42px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = "auto"
                target.style.height = Math.min(target.scrollHeight, 120) + "px"
              }}
            />
            {pageContext?.pageType === "bulk-deals" && attachedImages.length === 0 && (
              <p className="text-[10px] text-muted-foreground px-1">
                💡 Tip: Attach images to create products or process them in bulk
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
            className={cn(
              "h-10 w-10 rounded-xl transition-all flex-shrink-0",
              (input.trim() || attachedImages.length > 0) && !isLoading
                ? "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
