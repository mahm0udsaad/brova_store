"use client"

import { ReactNode, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useModalStack } from "./modal-stack-context"
import { cn } from "@/lib/utils"

export function PageScaleWrapper({ children }: { children: ReactNode }) {
  const { stack } = useModalStack()
  const isModalOpen = stack.length > 0
  const scrollRef = useRef<HTMLDivElement>(null)

  // When modal closes, we might want to ensure transform is cleared if we used a different method,
  // but with motion it handles it.
  
  return (
    <motion.div
      ref={scrollRef}
      className={cn(
        "h-[100dvh] w-full bg-background overflow-y-auto overflow-x-hidden",
        "scrollbar-hide" // Optional: hide scrollbar for cleaner look
      )}
      initial={false}
      animate={{
        scale: isModalOpen ? 0.92 : 1,
        borderRadius: isModalOpen ? "16px" : "0px",
        y: isModalOpen ? "10px" : "0px",
        filter: isModalOpen ? "brightness(0.7)" : "brightness(1)",
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 30,
      }}
      style={{
        transformOrigin: "top center",
        // When modal is open, we can disable pointer events on the page to prevent interaction
        pointerEvents: isModalOpen ? "none" : "auto",
      }}
    >
      {children}
    </motion.div>
  )
}
