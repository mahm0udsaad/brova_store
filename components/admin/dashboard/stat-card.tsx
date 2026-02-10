"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  type LucideIcon 
} from "lucide-react"

// =============================================================================
// TYPES
// =============================================================================

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
  }
  variant?: "default" | "success" | "warning" | "info"
  className?: string
  loading?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  loading = false,
}: StatCardProps) {
  // Variant styles
  const variantStyles = {
    default: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    success: {
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    warning: {
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    info: {
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
  }

  const styles = variantStyles[variant]

  // Trend indicator
  const TrendIcon = trend 
    ? trend.value > 0 
      ? TrendingUp 
      : trend.value < 0 
        ? TrendingDown 
        : Minus
    : null

  const trendColor = trend
    ? trend.value > 0
      ? "text-emerald-500"
      : trend.value < 0
        ? "text-rose-500"
        : "text-muted-foreground"
    : ""

  if (loading) {
    return (
      <div className={cn(
        "rounded-2xl border border-white/5 bg-white/5 p-5 animate-pulse backdrop-blur-sm",
        className
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-10 w-10 bg-white/10 rounded-xl" />
        </div>
        <div className="h-8 w-20 bg-white/10 rounded mb-2" />
        <div className="h-3 w-32 bg-white/10 rounded" />
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_-10px_rgba(var(--primary),0.3)]",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        {Icon && (
          <div className={cn(
            "p-2.5 rounded-xl",
            styles.iconBg
          )}>
            <Icon className={cn("w-5 h-5", styles.iconColor)} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold tracking-tight mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        {trend && TrendIcon && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// =============================================================================
// STAT CARD GRID
// =============================================================================

interface StatCardGridProps {
  children: React.ReactNode
  className?: string
}

export function StatCardGrid({ children, className }: StatCardGridProps) {
  return (
    <div className={cn(
      "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}
