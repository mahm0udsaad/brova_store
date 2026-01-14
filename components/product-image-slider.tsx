"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { Camera, ChevronLeft, ChevronRight } from "lucide-react"
import { triggerHaptic } from "@/lib/haptics"

interface ProductImageSliderProps {
  images: string[]
  productName: string
  onTryOn?: () => void
}

export function ProductImageSlider({ images, productName, onTryOn }: ProductImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.9,
      zIndex: 0,
    }),
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    triggerHaptic("light")
    setDirection(newDirection)
    setCurrentIndex((prev) => {
      const nextIndex = prev + newDirection
      if (nextIndex < 0) return images.length - 1
      if (nextIndex >= images.length) return 0
      return nextIndex
    })
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipe = swipePower(info.offset.x, info.velocity.x)
    if (swipe < -swipeConfidenceThreshold) {
      paginate(1)
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1)
    }
  }

  const handleTryOn = () => {
    triggerHaptic("medium")
    onTryOn?.()
  }

  const goToSlide = (index: number) => {
    triggerHaptic("light")
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  // Calculate indices for side previews
  const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
  const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Main Slider Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {/* Side Preview - Previous */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[15%] h-[85%] z-10 pointer-events-none opacity-40">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src={images[prevIndex] || "/placeholder.svg"}
              alt={`${productName} preview`}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Side Preview - Next */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[15%] h-[85%] z-10 pointer-events-none opacity-40">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src={images[nextIndex] || "/placeholder.svg"}
              alt={`${productName} preview`}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Main Image */}
        <div className="absolute inset-0 flex items-center justify-center px-[12%]">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute w-[76%] h-[90%] cursor-grab active:cursor-grabbing"
            >
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-border/20">
                <Image
                  src={images[currentIndex] || "/placeholder.svg"}
                  alt={`${productName} - Image ${currentIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                  draggable={false}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => paginate(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => paginate(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </div>

      <motion.div
        className="flex justify-center mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleTryOn}
          className="bg-muted hover:bg-muted/80 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 shadow-lg border border-border transition-colors"
        >
          <Camera className="w-5 h-5" />
          <span className="font-medium">Try On with AI</span>
        </motion.button>
      </motion.div>

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-foreground w-6" : "bg-muted-foreground/40 w-2"
              }`}
              whileTap={{ scale: 0.9 }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
