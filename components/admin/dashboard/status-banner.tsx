"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  X,
  ArrowRight,
  type LucideIcon 
} from "lucide-react"

// =============================================================================
// TYPES
// =============================================================================

type BannerVariant = "success" | "warning" | "error" | "info"

interface StatusBannerProps {
  variant: BannerVariant
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

// =============================================================================
// VARIANT CONFIG
// =============================================================================

const variantConfig: Record<BannerVariant, {
  icon: LucideIcon
  bg: string
  border: string
  iconColor: string
  textColor: string
}> = {
  success: {
    icon: CheckCircle,
    bg: "bg-success-bg",
    border: "border-success-border",
    iconColor: "text-success",
    textColor: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning-bg",
    border: "border-warning-border",
    iconColor: "text-warning",
    textColor: "text-warning-foreground",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    iconColor: "text-destructive",
    textColor: "text-destructive",
  },
  info: {
    icon: Info,
    bg: "bg-info-bg",
    border: "border-info-border",
    iconColor: "text-info",
    textColor: "text-info",
  },
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StatusBanner({
  variant,
  title,
  description,
  action,
  dismissible = false,
  onDismiss,
  className,
}: StatusBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "relative flex items-start gap-3 rounded-xl border p-4",
            config.bg,
            config.border,
            className
          )}
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={springConfigs.smooth}
        >
          {/* Icon */}
          <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconColor)} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium text-sm", config.textColor)}>
              {title}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
            {action && (
              <div className="mt-2">
                {action.href ? (
                  <Link
                    href={action.href}
                    className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium hover:underline",
                      config.textColor
                    )}
                  >
                    {action.label}
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                ) : (
                  <button
                    onClick={action.onClick}
                    className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium hover:underline",
                      config.textColor
                    )}
                  >
                    {action.label}
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-md hover:bg-foreground/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// STORE STATUS BANNERS
// =============================================================================

interface StoreStatusProps {
  productsCount: number
  ordersCount: number
  locale?: string
  className?: string
}

export function StoreStatusBanners({
  productsCount,
  ordersCount,
  locale = "en",
  className,
}: StoreStatusProps) {
  const isArabic = locale === "ar"

  // No products
  if (productsCount === 0) {
    return (
      <StatusBanner
        variant="info"
        title={isArabic ? "متجرك جاهز للمنتجات!" : "Your store is ready for products!"}
        description={isArabic 
          ? "أضف منتجك الأول للبدء في البيع"
          : "Add your first product to start selling"
        }
        action={{
          label: isArabic ? "إضافة منتج" : "Add a product",
          href: `/${locale}/admin/inventory`,
        }}
        className={className}
      />
    )
  }

  // Pending orders
  if (ordersCount > 0) {
    return (
      <StatusBanner
        variant="warning"
        title={isArabic 
          ? `لديك ${ordersCount} طلب${ordersCount > 1 ? "ات" : ""} قيد الانتظار`
          : `You have ${ordersCount} pending order${ordersCount > 1 ? "s" : ""}`
        }
        description={isArabic
          ? "تحقق من الطلبات الجديدة وابدأ الشحن"
          : "Review new orders and start fulfilling"
        }
        action={{
          label: isArabic ? "عرض الطلبات" : "View orders",
          href: `/${locale}/admin/orders`,
        }}
        dismissible
        className={className}
      />
    )
  }

  // All good
  return (
    <StatusBanner
      variant="success"
      title={isArabic ? "كل شيء يسير على ما يرام!" : "Everything is running smoothly!"}
      description={isArabic
        ? "لا توجد عناصر تتطلب اهتمامك الآن"
        : "No items require your attention right now"
      }
      dismissible
      className={className}
    />
  )
}
