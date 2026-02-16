"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  Check,
  X,
  AlertCircle,
  Store,
  Package,
  Palette,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { springConfigs, staggerContainerVariants, staggerItemVariants } from "@/lib/ui/motion-presets"
import { useConcierge } from "./ConciergeProvider"
import type { DraftProduct } from "@/lib/ai/concierge-context"

// =============================================================================
// MAIN APPROVAL SCREEN COMPONENT
// =============================================================================

interface DraftApprovalScreenProps {
  onBack?: () => void
  onComplete?: () => void
}

export function DraftApprovalScreen({ onBack, onComplete }: DraftApprovalScreenProps) {
  const locale = useLocale()
  const t = useTranslations("concierge")
  const router = useRouter()
  const isRtl = locale === "ar"
  
  const { draftState, publishStore } = useConcierge()

  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllProducts, setShowAllProducts] = useState(false)

  // Prepare summary data
  const hasStoreName = Boolean(draftState.store_name?.value)
  const hasProducts = draftState.products.length > 0
  const hasAppearance = Boolean(draftState.appearance)

  const hasAnything = hasStoreName || hasProducts || hasAppearance

  // Handle approval — publishes the store and redirects
  const handleApprove = async () => {
    if (!hasAnything) {
      setError(isRtl ? "لا يوجد شيء للحفظ" : "Nothing to save")
      return
    }

    setIsApproving(true)
    setError(null)

    try {
      const success = await publishStore()

      if (success) {
        if (onComplete) {
          onComplete()
        } else {
          setTimeout(() => {
            router.push(`/${locale}/admin`)
          }, 0)
        }
      } else {
        setError(t("approval.error"))
      }
    } catch (err) {
      console.error("Approval error:", err)
      setError(t("approval.error"))
    } finally {
      setIsApproving(false)
    }
  }
  
  // Handle cancel
  const handleCancel = () => {
    if (onBack) {
      onBack()
    }
  }
  
  return (
    <motion.div
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
      variants={staggerContainerVariants(0.1)}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={staggerItemVariants}
        className="shrink-0 px-6 py-6 border-b border-border"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              isRtl && "text-right"
            )}>
              {t("approval.title")}
            </h2>
            <p className={cn(
              "text-sm text-muted-foreground",
              isRtl && "text-right"
            )}>
              {t("approval.subtitle")}
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <motion.div
          className="max-w-2xl mx-auto space-y-6"
          variants={staggerContainerVariants(0.05)}
        >
          {/* Explanation */}
          <motion.div
            variants={staggerItemVariants}
            className={cn(
              "p-4 rounded-xl bg-muted/50 border border-border",
              "flex items-start gap-3"
            )}
          >
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className={cn(
              "text-sm text-muted-foreground",
              isRtl && "text-right"
            )}>
              {t("approval.explanation")}
            </p>
          </motion.div>
          
          {/* Summary Section */}
          <motion.div variants={staggerItemVariants}>
            <h3 className={cn(
              "text-lg font-semibold mb-4",
              isRtl && "text-right"
            )}>
              {t("approval.summary.title")}
            </h3>
            
            <div className="space-y-3">
              {/* Store Name */}
              <SummaryItem
                icon={Store}
                label={t("approval.summary.storeName")}
                value={draftState.store_name?.value}
                placeholder={t("approval.summary.noStoreName")}
                aiGenerated={draftState.store_name?.source === "ai"}
                isRtl={isRtl}
              />
              
              {/* Products */}
              <SummaryItem
                icon={Package}
                label={t("approval.summary.products")}
                value={hasProducts ? (
                  <ProductsSummary 
                    products={draftState.products}
                    showAll={showAllProducts}
                    onToggle={() => setShowAllProducts(!showAllProducts)}
                    isRtl={isRtl}
                  />
                ) : undefined}
                placeholder={t("approval.summary.noProducts")}
                isRtl={isRtl}
              />
              
              {/* Appearance */}
              <SummaryItem
                icon={Palette}
                label={t("approval.summary.appearance")}
                value={hasAppearance ? (
                  <AppearanceSummary 
                    appearance={draftState.appearance!}
                    isRtl={isRtl}
                  />
                ) : undefined}
                placeholder={t("approval.summary.noAppearance")}
                isRtl={isRtl}
              />
            </div>
          </motion.div>
          
          {/* Safety Reminders */}
          <motion.div
            variants={staggerItemVariants}
            className={cn(
              "p-4 rounded-xl border-2 border-dashed border-border",
              "space-y-2"
            )}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className={cn(
                "font-semibold text-sm",
                isRtl && "text-right"
              )}>
                {t("approval.reminder.title")}
              </h4>
            </div>
            <ul className={cn(
              "space-y-1 text-sm text-muted-foreground",
              isRtl && "text-right"
            )}>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{t("approval.reminder.draftOnly")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{t("approval.reminder.noPublish")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{t("approval.reminder.canEdit")}</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{t("approval.reminder.canCancel")}</span>
              </li>
            </ul>
          </motion.div>
          
          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-4 rounded-xl bg-destructive/10 border border-destructive/20",
                  "flex items-center gap-3"
                )}
              >
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Actions */}
      <motion.div
        variants={staggerItemVariants}
        className="shrink-0 p-6 border-t border-border bg-gradient-to-t from-card to-card/80 backdrop-blur-sm"
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isApproving}
            className="flex-1 h-12 rounded-xl"
          >
            {t("approval.cancelButton")}
          </Button>
          
          <Button
            size="lg"
            onClick={handleApprove}
            disabled={isApproving || !hasAnything}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t("approval.saving")}
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                {t("approval.approveButton")}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// =============================================================================
// SUMMARY ITEM COMPONENT
// =============================================================================

interface SummaryItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: React.ReactNode
  placeholder?: string
  aiGenerated?: boolean
  isRtl: boolean
}

function SummaryItem({ 
  icon: Icon, 
  label, 
  value, 
  placeholder, 
  aiGenerated,
  isRtl 
}: SummaryItemProps) {
  const hasValue = value !== undefined && value !== null && value !== ""
  
  return (
    <div className={cn(
      "p-4 rounded-xl bg-card border border-border",
      !hasValue && "border-dashed opacity-60"
    )}>
      <div className={cn(
        "flex items-start gap-3",
        isRtl && "flex-row-reverse"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-lg shrink-0",
          "bg-primary/10 flex items-center justify-center"
        )}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "flex items-center gap-2 mb-2",
            isRtl && "flex-row-reverse"
          )}>
            <h4 className="text-sm font-medium text-muted-foreground">
              {label}
            </h4>
            {aiGenerated && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">AI</span>
              </div>
            )}
          </div>
          
          {hasValue ? (
            <div className={cn(
              "text-base font-medium",
              isRtl && "text-right"
            )}>
              {value}
            </div>
          ) : (
            <div className={cn(
              "text-base text-muted-foreground italic",
              isRtl && "text-right"
            )}>
              {placeholder}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PRODUCTS SUMMARY COMPONENT
// =============================================================================

interface ProductsSummaryProps {
  products: DraftProduct[]
  showAll: boolean
  onToggle: () => void
  isRtl: boolean
}

function ProductsSummary({ products, showAll, onToggle, isRtl }: ProductsSummaryProps) {
  const t = useTranslations("concierge")
  const displayedProducts = showAll ? products : products.slice(0, 3)
  const hasMore = products.length > 3
  
  return (
    <div className="space-y-2">
      <div className={cn(
        "text-sm font-medium mb-2",
        isRtl && "text-right"
      )}>
        {products.length === 1 
          ? t("approval.productList.count") 
          : t("approval.productList.count_plural", { count: products.length })
        }
      </div>
      
      <div className="space-y-2">
        {displayedProducts.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg bg-muted/50",
              isRtl && "flex-row-reverse"
            )}
          >
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                isRtl && "text-right"
              )}>
                {isRtl ? (product.name_ar || product.name) : product.name}
              </p>
              {product.price !== undefined && (
                <p className={cn(
                  "text-xs text-muted-foreground",
                  isRtl && "text-right"
                )}>
                  {isRtl ? `${product.price} ج.م` : `EGP ${product.price}`}
                </p>
              )}
            </div>
            {product.confidence === "ai_generated" && (
              <Sparkles className="w-3 h-3 text-primary/50 shrink-0" />
            )}
          </div>
        ))}
      </div>
      
      {hasMore && (
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors",
            "w-full justify-center py-2",
            isRtl && "flex-row-reverse"
          )}
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>{t("approval.productList.collapse")}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>{t("approval.productList.viewAll")}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

// =============================================================================
// APPEARANCE SUMMARY COMPONENT
// =============================================================================

interface AppearanceSummaryProps {
  appearance: {
    primary_color?: string
    accent_color?: string
    font_family?: string
  }
  isRtl: boolean
}

function AppearanceSummary({ appearance, isRtl }: AppearanceSummaryProps) {
  const t = useTranslations("concierge")
  
  return (
    <div className="space-y-3">
      {/* Colors */}
      {(appearance.primary_color || appearance.accent_color) && (
        <div className={cn(
          "flex items-center gap-3",
          isRtl && "flex-row-reverse"
        )}>
          <span className="text-sm text-muted-foreground">
            {t("draft.colors")}:
          </span>
          <div className="flex gap-2">
            {appearance.primary_color && (
              <div
                className="w-6 h-6 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: appearance.primary_color }}
              />
            )}
            {appearance.accent_color && (
              <div
                className="w-6 h-6 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: appearance.accent_color }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Font */}
      {appearance.font_family && (
        <div className={cn(
          "flex items-center gap-3",
          isRtl && "flex-row-reverse"
        )}>
          <span className="text-sm text-muted-foreground">
            {t("draft.fonts")}:
          </span>
          <span className="text-sm font-medium">
            {appearance.font_family}
          </span>
        </div>
      )}
    </div>
  )
}
