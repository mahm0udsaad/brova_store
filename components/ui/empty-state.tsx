"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Package,
  ShoppingCart,
  Search,
  ImageIcon,
  FileText,
  Users,
  BarChart3,
  MessageSquare,
  Heart,
  Bell,
  Inbox,
  FolderOpen,
  Sparkles,
  Plus,
  ArrowRight,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { springConfigs, durations } from "@/lib/ui/motion-presets"

// =============================================================================
// TYPES
// =============================================================================

export type EmptyStateVariant =
  | "products"
  | "orders"
  | "search"
  | "cart"
  | "favorites"
  | "images"
  | "documents"
  | "users"
  | "analytics"
  | "messages"
  | "notifications"
  | "inbox"
  | "folder"
  | "ai"
  | "custom"

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: "default" | "outline" | "ghost"
  icon?: LucideIcon
}

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: LucideIcon
  actions?: EmptyStateAction[]
  className?: string
  compact?: boolean
  animated?: boolean
}

// =============================================================================
// VARIANT CONFIGURATIONS
// =============================================================================

const variantConfig: Record<
  Exclude<EmptyStateVariant, "custom">,
  { icon: LucideIcon; illustrationClass: string }
> = {
  products: { icon: Package, illustrationClass: "text-primary/60" },
  orders: { icon: ShoppingCart, illustrationClass: "text-primary/60" },
  search: { icon: Search, illustrationClass: "text-muted-foreground/60" },
  cart: { icon: ShoppingCart, illustrationClass: "text-primary/60" },
  favorites: { icon: Heart, illustrationClass: "text-destructive/40" },
  images: { icon: ImageIcon, illustrationClass: "text-info/60" },
  documents: { icon: FileText, illustrationClass: "text-muted-foreground/60" },
  users: { icon: Users, illustrationClass: "text-primary/60" },
  analytics: { icon: BarChart3, illustrationClass: "text-info/60" },
  messages: { icon: MessageSquare, illustrationClass: "text-primary/60" },
  notifications: { icon: Bell, illustrationClass: "text-warning/60" },
  inbox: { icon: Inbox, illustrationClass: "text-muted-foreground/60" },
  folder: { icon: FolderOpen, illustrationClass: "text-muted-foreground/60" },
  ai: { icon: Sparkles, illustrationClass: "text-primary/60" },
}

// =============================================================================
// ILLUSTRATION COMPONENT
// =============================================================================

function EmptyStateIllustration({
  icon: Icon,
  className,
  animated = true,
}: {
  icon: LucideIcon
  className?: string
  animated?: boolean
}) {
  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24",
        className
      )}
      initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={springConfigs.gentle}
    >
      {/* Background circle */}
      <div className="absolute inset-0 rounded-full bg-muted/50" />
      
      {/* Decorative ring */}
      <motion.div
        className="absolute inset-1 rounded-full border-2 border-dashed border-muted-foreground/20"
        initial={animated ? { rotate: 0 } : undefined}
        animate={animated ? { rotate: 360 } : undefined}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Icon */}
      <Icon className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" strokeWidth={1.5} />
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EmptyState({
  variant = "custom",
  title,
  description,
  icon,
  actions = [],
  className,
  compact = false,
  animated = true,
}: EmptyStateProps) {
  const t = useTranslations("emptyStates")
  
  // Get variant configuration
  const config = variant !== "custom" ? variantConfig[variant] : null
  const IconComponent = icon || config?.icon || Package
  const iconClass = config?.illustrationClass || "text-muted-foreground/60"
  
  // Get translations if not overridden
  const displayTitle = title || (variant !== "custom" ? t(`${variant}.title`) : "")
  const displayDescription = description || (variant !== "custom" ? t(`${variant}.description`) : "")

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-12 sm:py-16 px-6",
        className
      )}
      initial={animated ? { opacity: 0, y: 12 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: durations.relaxed }}
    >
      {/* Illustration */}
      <EmptyStateIllustration
        icon={IconComponent}
        className={iconClass}
        animated={animated}
      />

      {/* Content */}
      <motion.div
        className={cn(
          "mt-6 space-y-2 max-w-sm",
          compact && "mt-4"
        )}
        initial={animated ? { opacity: 0, y: 8 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.1, duration: durations.relaxed }}
      >
        {displayTitle && (
          <h3 className={cn(
            "font-semibold text-foreground",
            compact ? "text-base" : "text-lg sm:text-xl"
          )}>
            {displayTitle}
          </h3>
        )}
        
        {displayDescription && (
          <p className={cn(
            "text-muted-foreground leading-relaxed",
            compact ? "text-sm" : "text-sm sm:text-base"
          )}>
            {displayDescription}
          </p>
        )}
      </motion.div>

      {/* Actions */}
      {actions.length > 0 && (
        <motion.div
          className={cn(
            "flex flex-col sm:flex-row items-center gap-3",
            compact ? "mt-5" : "mt-6 sm:mt-8"
          )}
          initial={animated ? { opacity: 0, y: 8 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.2, duration: durations.relaxed }}
        >
          {actions.map((action, index) => {
            const ActionIcon = action.icon
            const isFirst = index === 0
            
            return (
              <Button
                key={action.label}
                variant={action.variant || (isFirst ? "default" : "outline")}
                size={compact ? "sm" : "default"}
                onClick={action.onClick}
                asChild={!!action.href}
                className={cn(
                  "gap-2",
                  isFirst && "min-w-[140px]"
                )}
              >
                {action.href ? (
                  <a href={action.href}>
                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                    {action.label}
                    {isFirst && !ActionIcon && <ArrowRight className="w-4 h-4" />}
                  </a>
                ) : (
                  <>
                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                    {action.label}
                    {isFirst && !ActionIcon && <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </Button>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

// =============================================================================
// CONVENIENCE COMPONENTS
// =============================================================================

/**
 * Products empty state
 */
export function ProductsEmptyState({
  onAddProduct,
  ...props
}: Omit<EmptyStateProps, "variant"> & { onAddProduct?: () => void }) {
  const t = useTranslations("emptyStates")
  
  return (
    <EmptyState
      variant="products"
      actions={onAddProduct ? [
        { label: t("products.action"), onClick: onAddProduct, icon: Plus },
      ] : undefined}
      {...props}
    />
  )
}

/**
 * Orders empty state
 */
export function OrdersEmptyState({
  onBrowseProducts,
  ...props
}: Omit<EmptyStateProps, "variant"> & { onBrowseProducts?: () => void }) {
  const t = useTranslations("emptyStates")
  
  return (
    <EmptyState
      variant="orders"
      actions={onBrowseProducts ? [
        { label: t("orders.action"), onClick: onBrowseProducts },
      ] : undefined}
      {...props}
    />
  )
}

/**
 * Search empty state
 */
export function SearchEmptyState({
  query,
  onClearSearch,
  ...props
}: Omit<EmptyStateProps, "variant"> & { 
  query?: string
  onClearSearch?: () => void 
}) {
  const t = useTranslations("emptyStates")
  
  return (
    <EmptyState
      variant="search"
      description={query ? t("search.descriptionWithQuery", { query }) : undefined}
      actions={onClearSearch ? [
        { label: t("search.action"), onClick: onClearSearch, variant: "outline" },
      ] : undefined}
      {...props}
    />
  )
}

/**
 * Cart empty state
 */
export function CartEmptyState({
  onBrowseProducts,
  ...props
}: Omit<EmptyStateProps, "variant"> & { onBrowseProducts?: () => void }) {
  const t = useTranslations("emptyStates")
  
  return (
    <EmptyState
      variant="cart"
      actions={onBrowseProducts ? [
        { label: t("cart.action"), onClick: onBrowseProducts },
      ] : undefined}
      {...props}
    />
  )
}

/**
 * Favorites empty state
 */
export function FavoritesEmptyState({
  onBrowseProducts,
  ...props
}: Omit<EmptyStateProps, "variant"> & { onBrowseProducts?: () => void }) {
  const t = useTranslations("emptyStates")
  
  return (
    <EmptyState
      variant="favorites"
      actions={onBrowseProducts ? [
        { label: t("favorites.action"), onClick: onBrowseProducts },
      ] : undefined}
      {...props}
    />
  )
}

/**
 * AI empty state - for when AI has no context or suggestions
 */
export function AIEmptyState({
  onStartConversation,
  ...props
}: Omit<EmptyStateProps, "variant"> & { onStartConversation?: () => void }) {
  const t = useTranslations("emptyStates")
  
  return (
    <EmptyState
      variant="ai"
      actions={onStartConversation ? [
        { label: t("ai.action"), onClick: onStartConversation, icon: Sparkles },
      ] : undefined}
      {...props}
    />
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { EmptyStateIllustration }
