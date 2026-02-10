import type React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
      style={style}
    />
  )
}

/**
 * Product card skeleton during AI product creation
 */
export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 p-4", className)}>
      <Skeleton className="aspect-square rounded-lg mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
  )
}

/**
 * Message skeleton during AI thinking
 */
export function MessageSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

/**
 * Image upload skeleton during processing
 */
export function ImageUploadSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-800 p-4", className)}>
      <Skeleton className="aspect-square rounded-lg mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-2 w-2/3" />
    </div>
  )
}

/**
 * Table row skeleton for data loading
 */
export function TableRowSkeleton({ columns = 4, className }: SkeletonProps & { columns?: number }) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Campaign card skeleton
 */
export function CampaignCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 p-4", className)}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

/**
 * Stats card skeleton for analytics
 */
export function StatsCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 p-6", className)}>
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-8 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg", className)}>
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/**
 * Generic shimmer skeleton with custom size
 */
export function ShimmerSkeleton({ width, height, className }: { width?: string | number; height?: string | number; className?: string }) {
  return (
    <Skeleton
      className={className}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  )
}

/**
 * Bulk processing grid skeleton
 */
export function BulkProcessingGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ImageUploadSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Form skeleton for dynamic form loading
 */
export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
