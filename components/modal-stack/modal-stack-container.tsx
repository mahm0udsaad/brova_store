"use client"

import React, { useEffect } from "react"
import { useModalStack } from "./modal-stack-context"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { ModalItem } from "./types"
import { triggerHaptic } from "@/lib/haptics"

export function ModalStackContainer() {
  const { stack, dismiss } = useModalStack()

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack.length > 0) {
        dismiss()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [stack.length, dismiss])

  return (
    <>
      <AnimatePresence>
        {stack.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[99]"
            onClick={() => {
              // Only dismiss if the top modal allows backdrop click
              const topOption = stack[stack.length - 1]?.options
              if (topOption?.preventBackdropClick) return
              dismiss()
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {stack.map((item, index) => (
          <ModalCard
            key={item.id}
            item={item}
            index={index}
            total={stack.length}
            dismiss={dismiss}
          />
        ))}
      </AnimatePresence>
    </>
  )
}

function ModalCard({
  item,
  index,
  total,
  dismiss,
}: {
  item: ModalItem
  index: number
  total: number
  dismiss: () => void
}) {
  const isTop = index === total - 1
  const reverseIndex = total - 1 - index

  // iOS Stack Effect Constants
  const SCALE_STEP = 0.05 // How much to scale down per level
  const Y_OFFSET_STEP = 15 // Pixels to move down per level
  const BRIGHTNESS_STEP = 0.1 // Dimming per level

  // Limit rendering depth for performance
  if (reverseIndex > 2) return null

  // Calculate transforms
  const scale = 1 - reverseIndex * SCALE_STEP
  const yOffset = reverseIndex * Y_OFFSET_STEP
  // We want the card to slide up from 100% when entering,
  // but if it's already in the stack (not top), it should be at its stack position.
  // When a new card enters (it becomes top), the previous top (now index total-2) should animate to scale < 1.

  return (
    <motion.div
      layout
      initial={{ y: "100%" }}
      animate={{
        y: yOffset,
        scale: scale,
        filter: `brightness(${Math.max(0.5, 1 - reverseIndex * BRIGHTNESS_STEP)})`,
        borderRadius: "20px 20px 0 0",
      }}
      exit={{ y: "100%" }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
        mass: 1,
      }}
      style={{
        zIndex: 100 + index,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "auto", // Allow content to determine height, up to max
        maxHeight: "94vh", // iOS sheets usually leave a gap at top
        transformOrigin: "bottom center",
      }}
      drag={item.options?.dragToDismiss !== false ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.5 }} // Resistance when pulling up, stretchy down
      onDragEnd={(_e, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
          triggerHaptic("light")
          dismiss()
        }
      }}
      className="bg-background shadow-2xl flex flex-col"
    >
      {/* Drag Handle Area */}
      <div 
        className="w-full h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing"
      >
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Content Container - scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-safe-area-bottom">
         <div className="px-4 pb-8">
            {item.content}
         </div>
      </div>
    </motion.div>
  )
}
