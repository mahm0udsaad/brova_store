"use client"

import { motion } from "framer-motion"

interface ProductCardSkeletonProps {
  index?: number
}

export function ProductCardSkeleton({ index = 0 }: ProductCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-3">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-20 bg-muted rounded-md">
          <motion.div
            className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-md"
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
        <div className="h-4 w-32 bg-muted rounded-md">
          <motion.div
            className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-md"
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.1,
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
