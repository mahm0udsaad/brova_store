"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { 
  Store, 
  Package, 
  Palette, 
  AlertCircle,
  Sparkles,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { springConfigs, staggerContainerVariants, staggerItemVariants } from "@/lib/ui/motion-presets"
import { useConcierge } from "./ConciergeProvider"
import type { DraftProduct, DraftAppearance } from "@/lib/ai/concierge-context"

// =============================================================================
// MAIN PREVIEW COMPONENT
// =============================================================================

export function DraftPreview() {
  const locale = useLocale()
  const t = useTranslations("concierge")
  const isRtl = locale === "ar"
  
  const { draftState } = useConcierge()
  
  return (
    <motion.div
      className="flex-1 flex flex-col p-6 overflow-y-auto"
      variants={staggerContainerVariants(0.1)}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={staggerItemVariants} className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {t("draft.previewTitle")}
          </h3>
          <DraftBadge />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t("draft.previewHint")}
        </p>
      </motion.div>
      
      {/* Store Name Preview */}
      <motion.div variants={staggerItemVariants}>
        <StoreNamePreview 
          storeName={draftState.store_name} 
          isRtl={isRtl}
        />
      </motion.div>
      
      {/* Products Preview */}
      <motion.div variants={staggerItemVariants} className="mt-6">
        <ProductsPreview 
          products={draftState.products}
          isRtl={isRtl}
        />
      </motion.div>
      
      {/* Appearance Preview */}
      <motion.div variants={staggerItemVariants} className="mt-6">
        <AppearancePreview 
          appearance={draftState.appearance}
          isRtl={isRtl}
        />
      </motion.div>
      
      {/* Safety Notice */}
      <motion.div 
        variants={staggerItemVariants}
        className="mt-auto pt-6"
      >
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-xl",
          "bg-muted/50 border border-border"
        )}>
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            {t("draft.notSaved")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// =============================================================================
// DRAFT BADGE
// =============================================================================

function DraftBadge() {
  const t = useTranslations("concierge")
  
  return (
    <motion.div
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        "border border-amber-500/20"
      )}
      animate={{ 
        scale: [1, 1.02, 1],
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {t("draft.label")}
    </motion.div>
  )
}

// =============================================================================
// STORE NAME PREVIEW
// =============================================================================

interface StoreNamePreviewProps {
  storeName?: {
    value: string
    confidence: "suggestion" | "user_provided"
    source: "ai" | "user"
  }
  isRtl: boolean
}

function StoreNamePreview({ storeName, isRtl }: StoreNamePreviewProps) {
  const t = useTranslations("concierge")
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Store className="w-3.5 h-3.5" />
        <span>{t("draft.storeName")}</span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={storeName?.value || "placeholder"}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={springConfigs.smooth}
          className={cn(
            "p-4 rounded-xl bg-card border border-border",
            !storeName && "border-dashed"
          )}
        >
          <h2 className={cn(
            "text-xl font-bold",
            !storeName && "text-muted-foreground",
            isRtl && "text-right"
          )}>
            {storeName?.value || t("draft.storeNamePlaceholder")}
          </h2>
          
          {storeName?.source === "ai" && (
            <div className="flex items-center gap-1 mt-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                {isRtl ? "اقتراح الذكاء الاصطناعي" : "AI suggestion"}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// PRODUCTS PREVIEW
// =============================================================================

interface ProductsPreviewProps {
  products: DraftProduct[]
  isRtl: boolean
}

function ProductsPreview({ products, isRtl }: ProductsPreviewProps) {
  const t = useTranslations("concierge")
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Package className="w-3.5 h-3.5" />
        <span>{t("draft.products")}</span>
        {products.length > 0 && (
          <span className="ml-auto text-foreground font-medium">
            {products.length}
          </span>
        )}
      </div>
      
      {products.length === 0 ? (
        <div className={cn(
          "p-4 rounded-xl border border-dashed border-border",
          "flex flex-col items-center justify-center text-center",
          "min-h-[120px]"
        )}>
          <Package className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("draft.noProducts")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {products.slice(0, 4).map((product, index) => (
              <ProductCardPreview 
                key={product.id}
                product={product}
                isRtl={isRtl}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// PRODUCT CARD PREVIEW
// =============================================================================

interface ProductCardPreviewProps {
  product: DraftProduct
  isRtl: boolean
  index: number
}

function ProductCardPreview({ product, isRtl, index }: ProductCardPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ ...springConfigs.smooth, delay: index * 0.05 }}
      className={cn(
        "p-3 rounded-xl bg-card border border-border",
        "relative overflow-hidden group"
      )}
    >
      {/* Draft indicator */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
      </div>
      
      {/* Image placeholder */}
      <div className={cn(
        "aspect-square rounded-lg bg-muted mb-2",
        "flex items-center justify-center"
      )}>
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
        )}
      </div>
      
      {/* Product info */}
      <div className={cn(
        "space-y-1",
        isRtl && "text-right"
      )}>
        <h4 className="text-xs font-medium truncate">
          {isRtl ? (product.name_ar || product.name) : product.name}
        </h4>
        {product.price !== undefined && (
          <p className="text-xs text-muted-foreground">
            {isRtl ? `${product.price} ج.م` : `EGP ${product.price}`}
          </p>
        )}
      </div>
      
      {/* AI confidence indicator */}
      {product.confidence === "ai_generated" && (
        <div className="absolute bottom-1 left-1">
          <Sparkles className="w-3 h-3 text-primary/50" />
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// APPEARANCE PREVIEW
// =============================================================================

interface AppearancePreviewProps {
  appearance?: DraftAppearance
  isRtl: boolean
}

function AppearancePreview({ appearance, isRtl }: AppearancePreviewProps) {
  const t = useTranslations("concierge")
  
  const colors = [
    appearance?.primary_color || "#000000",
    appearance?.accent_color || "#6366f1",
  ]
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Palette className="w-3.5 h-3.5" />
        <span>{t("draft.appearance")}</span>
      </div>
      
      <div className={cn(
        "p-4 rounded-xl bg-card border border-border",
        !appearance && "border-dashed"
      )}>
        {/* Colors */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t("draft.colors")}
          </span>
          <div className="flex gap-1.5">
            <AnimatePresence mode="popLayout">
              {colors.map((color, index) => (
                <motion.div
                  key={`${color}-${index}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={springConfigs.bouncy}
                  className="w-6 h-6 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Font */}
        {appearance?.font_family && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground">
              {t("draft.fonts")}
            </span>
            <span className="text-xs font-medium">
              {appearance.font_family}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
