"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { springConfigs } from "@/lib/ui/motion-presets"
import { ArrowRight, type LucideIcon } from "lucide-react"

// =============================================================================
// TYPES
// =============================================================================

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  variant?: "default" | "primary" | "success" | "warning"
  badge?: string
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  variant = "default",
  badge,
  className,
}: ActionCardProps) {
  // Variant styles
  const variantStyles = {
    default: {
      bg: "bg-card hover:bg-accent/50",
      border: "border-border",
      iconBg: "bg-muted",
      iconColor: "text-foreground",
    },
    primary: {
      bg: "bg-primary/5 hover:bg-primary/10",
      border: "border-primary/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    success: {
      bg: "bg-success-bg hover:bg-success/10",
      border: "border-success-border",
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    warning: {
      bg: "bg-warning-bg hover:bg-warning/10",
      border: "border-warning-border",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
  }

  const styles = variantStyles[variant]

  const content = (
    <motion.div
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border p-5 transition-all cursor-pointer",
        styles.bg,
        styles.border,
        className
      )}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      whileTap={{ scale: 0.99 }}
      transition={springConfigs.snappy}
    >
      {/* Icon */}
      <div className={cn(
        "shrink-0 p-3 rounded-xl transition-transform group-hover:scale-105",
        styles.iconBg
      )}>
        <Icon className={cn("w-5 h-5", styles.iconColor)} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground">
            {title}
          </h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight className={cn(
        "shrink-0 w-5 h-5 text-muted-foreground transition-all opacity-0 -translate-x-2",
        "group-hover:opacity-100 group-hover:translate-x-0",
        "rtl:rotate-180 rtl:group-hover:-translate-x-0 rtl:translate-x-2"
      )} />
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  if (onClick) {
    return <button onClick={onClick} className="w-full text-left">{content}</button>
  }

  return content
}

// =============================================================================
// ACTION CARD GRID
// =============================================================================

interface ActionCardGridProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3
}

export function ActionCardGrid({ children, className, columns = 2 }: ActionCardGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }

  return (
    <div className={cn(
      "grid gap-4",
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  )
}
