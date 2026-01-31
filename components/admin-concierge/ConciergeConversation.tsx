"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import {
  Send,
  SkipForward,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { ImageUploadZone } from "./ImageUploadZone"
import { useUIState, useActions } from '@ai-sdk/rsc';
import type { AI } from '@/app/actions';
import { useConcierge } from "./ConciergeProvider";

// =============================================================================
// TYPES
// =============================================================================

interface ConciergeConversationProps {
  onRequestReview: () => void;
  context: any; // The context object will now be passed as a prop
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConciergeConversation({ onRequestReview, context }: ConciergeConversationProps) {
  const locale = useLocale()
  const t = useTranslations("concierge")
  const isRtl = locale === "ar"
  const { currentStep } = useConcierge()

  // Use the AI SDK hooks for messages and actions
  const [aiMessages, setAiMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>() as any;

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showImageUpload, setShowImageUpload] = useState(aiMessages.length === 0)
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [aiMessages])
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Trigger initial AI greeting when conversation starts
  useEffect(() => {
    if (aiMessages.length === 0 && (currentStep as string) === 'conversation') {
      // Send empty message with special flag to trigger greeting
      submitUserMessage('', {
        ...context,
        is_initial_greeting: true,
      })
    }
  }, [aiMessages.length, currentStep, context, submitUserMessage]) // Only run when entering conversation phase

  // Handle submit
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return
    
    const message = input.trim()
    setInput("")
    // Call the server action directly with the message and context
    await submitUserMessage(message, context);
  }
  
  // These handlers will need to be re-implemented to work with the new action-based system
  // The QuestionCard is now streamed directly with its own onSelect handler.
  const handleOptionSelect = async (optionId: string, optionText: string) => {
    console.log("handleOptionSelect not directly used here anymore. Logic moved to streamed components.");
    // This function will likely be removed as onSelect will directly call submitUserMessage
    // or another server action from within the streamed QuestionCard.
  }
  
  // Skip logic will also need to be integrated into streamed components or a new server action.
  const handleSkip = () => {
    console.log("handleSkip not directly used here anymore. Logic needs re-evaluation.");
  }
  
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className={cn(
        "shrink-0 px-6 py-4 border-b border-border",
        "flex items-center gap-3"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-xl",
          "bg-gradient-to-br from-primary/20 to-primary/10",
          "flex items-center justify-center"
        )}>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">{t("name")}</h2>
          <p className="text-xs text-muted-foreground">{t("role")}</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {/* Image Upload Zone (first message) */}
          {showImageUpload && aiMessages.length === 0 && (
            <motion.div
              key="image-upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ImageUploadZone
                onUploadComplete={async (urls, batchId) => {
                  setShowImageUpload(false)
                  // The handleImageUpload logic needs to be integrated into submitUserMessage
                  // For now, this will need a specific server action to handle initial image upload
                  // await handleImageUpload(urls, batchId)
                  await submitUserMessage(`I've uploaded ${urls.length} images for batch ${batchId || 'N/A'}. URLs: ${urls.join(', ')}`, context);
                }}
                locale={locale as "en" | "ar"}
              />
            </motion.div>
          )}

          {aiMessages.map((message) => (
            <div key={message.id} className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={springConfigs.smooth}
              >
                {message.display}
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="shrink-0 p-4 border-t border-border">
        {/* Review button - This logic will be handled by a streamed component if needed */}
        {/*
        {hasDraftContent && onboardingStatus === "in_progress" && (
          <div className="mb-3">
            <Button
              onClick={onRequestReview}
              className={cn(
                "w-full h-12 rounded-xl",
                "bg-gradient-to-r from-primary to-primary/90",
                "flex items-center justify-center gap-2"
              )}
              size="lg"
            >
              <Check className="w-5 h-5" />
              <span>{isRtl ? "مراجعة وحفظ" : "Review & Save"}</span>
            </Button>
          </div>
        )}
        */}
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
              className={cn(
                "w-full h-12 px-4 rounded-xl",
                "bg-muted border border-border",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                "text-base placeholder:text-muted-foreground",
                isRtl && "text-right"
              )}
              // Disabled logic will need to be derived from AI state or Streamed UI components
              // disabled={isThinking}
            />
          </div>
          
          {/* Skip button - This will be handled by streamed components if needed */}
          {/*
          {currentQuestion?.skippable && !isThinking && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0"
              onClick={handleSkip}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          )}
          */}
          
          {/* Send button */}
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-xl shrink-0"
            disabled={!input.trim()}
          >
            <Send className={cn(
              "w-5 h-5",
              isRtl && "rotate-180"
            )} />
          </Button>
        </form>
        
        {/* Safety reminder */}
        <p className="mt-2 text-xs text-center text-muted-foreground">
          {t("safety.yourControl")}
        </p>
      </div>
    </div>
  )
}
