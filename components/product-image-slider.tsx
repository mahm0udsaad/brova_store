"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type PanInfo, useMotionValue, useTransform } from "framer-motion"
import { Camera, ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut, Download, Share2 } from "lucide-react"
import { triggerHaptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"

interface ProductImageSliderProps {
  images: string[]
  productName: string
  onTryOn?: () => void
}

export function ProductImageSlider({ images, productName, onTryOn }: ProductImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDraggingZoom, setIsDraggingZoom] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      zIndex: 0,
    }),
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    if (scale > 1) return // Don't paginate when zoomed
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
    if (scale > 1) return // Don't swipe when zoomed
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
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const toggleFullscreen = () => {
    triggerHaptic("medium")
    setIsFullscreen(!isFullscreen)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    triggerHaptic("light")
    setScale((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    triggerHaptic("light")
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newScale
    })
  }

  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      triggerHaptic("medium")
      if (scale === 1) {
        setScale(2)
      } else {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }
    setLastTap(now)
  }, [lastTap, scale])

  const handleZoomDrag = (_: any, info: PanInfo) => {
    if (scale > 1) {
      setPosition({
        x: position.x + info.delta.x,
        y: position.y + info.delta.y,
      })
    }
  }

  const handleShare = async () => {
    triggerHaptic("light")
    const currentImage = images[currentIndex]
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out ${productName}`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    }
  }

  // Reset zoom when changing images
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isFullscreen])

  const SliderContent = ({ inFullscreen = false }: { inFullscreen?: boolean }) => (
    <div className={cn("relative w-full", inFullscreen ? "h-full" : "aspect-[3/4]")}>
      {/* Image Counter */}
      {images.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium"
        >
          {currentIndex + 1} / {images.length}
        </motion.div>
      )}

      {/* Fullscreen Toggle */}
      {!inFullscreen && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg"
          aria-label="Fullscreen"
        >
          <Maximize2 className="w-5 h-5" />
        </motion.button>
      )}

      {/* Main Image Container */}
      <div className={cn("relative w-full h-full overflow-hidden", inFullscreen ? "bg-black" : "bg-muted/30 rounded-2xl")}>
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
            }}
            drag={scale > 1 ? true : "x"}
            dragConstraints={scale > 1 ? { left: -100, right: 100, top: -100, bottom: 100 } : { left: 0, right: 0 }}
            dragElastic={scale > 1 ? 0.1 : 1}
            onDragEnd={scale > 1 ? handleZoomDrag : handleDragEnd}
            onDragStart={() => scale > 1 && setIsDraggingZoom(true)}
            onTap={handleDoubleTap}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              scale > 1 ? "cursor-move" : "cursor-grab active:cursor-grabbing"
            )}
            style={{
              scale,
              x: position.x,
              y: position.y,
            }}
            ref={imageRef}
          >
            <div className="relative w-full h-full">
              <Image
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`${productName} - Image ${currentIndex + 1}`}
                fill
                className="object-cover"
                priority
                draggable={false}
                sizes={inFullscreen ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                quality={90}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && scale === 1 && (
        <>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg text-white"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </>
      )}

      {/* Zoom Controls */}
      {inFullscreen && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg disabled:opacity-50"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg disabled:opacity-50"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* Thumbnail Strip - Only in fullscreen */}
      {inFullscreen && images.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 px-4 py-3 bg-black/60 backdrop-blur-md rounded-full max-w-[90vw] overflow-x-auto scrollbar-hide"
        >
          {images.map((img, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.9 }}
              onClick={() => goToSlide(index)}
              className={cn(
                "relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                index === currentIndex ? "border-white scale-110" : "border-transparent opacity-60"
              )}
            >
              <Image
                src={img || "/placeholder.svg"}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="56px"
                quality={75}
                loading="lazy"
              />
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )

  return (
    <>
      <div className="relative w-full" ref={containerRef}>
        <SliderContent />

        {/* Try On Button */}
        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleTryOn}
            className="bg-foreground text-background hover:bg-foreground/90 backdrop-blur-md px-8 py-4 rounded-full flex items-center gap-3 shadow-lg border border-border transition-colors font-medium"
          >
            <Camera className="w-5 h-5" />
            <span>Try On with AI</span>
          </motion.button>
        </motion.div>

        {/* Thumbnail Gallery - Desktop */}
        {images.length > 1 && (
          <motion.div
            className="hidden lg:flex gap-3 mt-6 overflow-x-auto scrollbar-hide pb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {images.map((img, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => goToSlide(index)}
                className={cn(
                  "relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                  index === currentIndex 
                    ? "border-foreground ring-2 ring-foreground/20" 
                    : "border-border opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={img || "/placeholder.svg"}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  quality={75}
                  loading="lazy"
                />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Dots Indicator - Mobile */}
        {images.length > 1 && (
          <div className="flex lg:hidden justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentIndex 
                    ? "bg-foreground w-8" 
                    : "bg-muted-foreground/40 w-2"
                )}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-[110] w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </motion.button>

            <SliderContent inFullscreen />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
