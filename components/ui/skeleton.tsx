"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean
  /** Round to full circle */
  circle?: boolean
}

export function Skeleton({
  className,
  shimmer = false,
  circle = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted",
        circle ? "rounded-full" : "rounded-md",
        shimmer
          ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent dark:before:via-white/5"
          : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

// =============================================================================
// SEMANTIC SKELETONS
// =============================================================================

interface SemanticSkeletonProps {
  className?: string
  shimmer?: boolean
}

/**
 * Text skeleton - for text lines
 */
export function SkeletonText({
  lines = 1,
  className,
  shimmer,
}: SemanticSkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shimmer={shimmer}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-4/5" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

/**
 * Heading skeleton - for titles
 */
export function SkeletonHeading({
  size = "md",
  className,
  shimmer,
}: SemanticSkeletonProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const heights = {
    sm: "h-5",
    md: "h-6",
    lg: "h-7",
    xl: "h-8",
  }
  
  return (
    <Skeleton
      shimmer={shimmer}
      className={cn(heights[size], "w-2/3", className)}
    />
  )
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({
  size = "md",
  className,
  shimmer,
}: SemanticSkeletonProps & { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }
  
  return (
    <Skeleton
      shimmer={shimmer}
      circle
      className={cn(sizes[size], className)}
    />
  )
}

/**
 * Button skeleton
 */
export function SkeletonButton({
  size = "md",
  className,
  shimmer,
}: SemanticSkeletonProps & { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-20",
    md: "h-9 w-24",
    lg: "h-10 w-28",
  }
  
  return (
    <Skeleton
      shimmer={shimmer}
      className={cn(sizes[size], "rounded-lg", className)}
    />
  )
}

/**
 * Image skeleton - for images and thumbnails
 */
export function SkeletonImage({
  aspectRatio = "square",
  className,
  shimmer,
}: SemanticSkeletonProps & { aspectRatio?: "square" | "video" | "portrait" }) {
  const ratios = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }
  
  return (
    <Skeleton
      shimmer={shimmer}
      className={cn(ratios[aspectRatio], "rounded-lg", className)}
    />
  )
}

/**
 * Card skeleton - for content cards
 */
export function SkeletonCard({
  className,
  shimmer,
  hasImage = true,
  hasActions = true,
}: SemanticSkeletonProps & { hasImage?: boolean; hasActions?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-3", className)}>
      {hasImage && <SkeletonImage shimmer={shimmer} />}
      <div className="space-y-2">
        <Skeleton shimmer={shimmer} className="h-5 w-3/4" />
        <Skeleton shimmer={shimmer} className="h-4 w-1/2" />
      </div>
      {hasActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton shimmer={shimmer} className="h-6 w-14 rounded-full" />
          <Skeleton shimmer={shimmer} className="h-6 w-14 rounded-full" />
        </div>
      )}
    </div>
  )
}

/**
 * Stats card skeleton - for dashboard metrics
 */
export function SkeletonStats({
  className,
  shimmer,
}: SemanticSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 space-y-3", className)}>
      <Skeleton shimmer={shimmer} className="h-4 w-24" />
      <Skeleton shimmer={shimmer} className="h-8 w-20" />
      <Skeleton shimmer={shimmer} className="h-3 w-32" />
    </div>
  )
}

/**
 * Table skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  shimmer,
}: SemanticSkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 bg-muted/50 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            shimmer={shimmer}
            className="h-4 flex-1"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-border last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              shimmer={shimmer}
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "w-1/4",
                colIndex === columns - 1 && "w-20 flex-none"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * List skeleton
 */
export function SkeletonList({
  items = 3,
  className,
  shimmer,
  hasAvatar = true,
}: SemanticSkeletonProps & { items?: number; hasAvatar?: boolean }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          {hasAvatar && <SkeletonAvatar size="md" shimmer={shimmer} />}
          <div className="flex-1 space-y-2">
            <Skeleton shimmer={shimmer} className="h-4 w-3/4" />
            <Skeleton shimmer={shimmer} className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Form skeleton
 */
export function SkeletonForm({
  fields = 3,
  className,
  shimmer,
}: SemanticSkeletonProps & { fields?: number }) {
  return (
    <div className={cn("space-y-5", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton shimmer={shimmer} className="h-4 w-20" />
          <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <SkeletonButton shimmer={shimmer} />
        <SkeletonButton shimmer={shimmer} size="md" />
      </div>
    </div>
  )
}

/**
 * Page header skeleton
 */
export function SkeletonPageHeader({
  className,
  shimmer,
  hasActions = true,
}: SemanticSkeletonProps & { hasActions?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-2">
        <Skeleton shimmer={shimmer} className="h-7 w-48" />
        <Skeleton shimmer={shimmer} className="h-4 w-64" />
      </div>
      {hasActions && (
        <div className="flex gap-2">
          <SkeletonButton shimmer={shimmer} size="sm" />
          <SkeletonButton shimmer={shimmer} size="sm" />
        </div>
      )}
    </div>
  )
}

/**
 * Navigation skeleton
 */
export function SkeletonNav({
  items = 5,
  className,
  shimmer,
}: SemanticSkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <Skeleton shimmer={shimmer} className="w-5 h-5 rounded" />
          <Skeleton shimmer={shimmer} className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}
