"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Camera, Upload, ImageIcon, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerHaptic, playSuccessSound } from "@/lib/haptics"

interface TryOnBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  productImage: string
  productName: string
}

export function TryOnBottomSheet({ isOpen, onClose, productImage, productName }: TryOnBottomSheetProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    triggerHaptic("light")
    onClose()
    // Reset state when closing
    setTimeout(() => {
      setUploadedImage(null)
      setTryOnResult(null)
      setIsProcessing(false)
    }, 300)
  }, [onClose])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      triggerHaptic("light")
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleUploadClick = useCallback(() => {
    triggerHaptic("light")
    fileInputRef.current?.click()
  }, [])

  const handleTryOn = useCallback(async () => {
    if (!uploadedImage) return

    triggerHaptic("medium")
    setIsProcessing(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // In a real app, this would call an AI API
    setTryOnResult(productImage) // Placeholder - would be AI generated result
    setIsProcessing(false)
    triggerHaptic("success")
    playSuccessSound()
  }, [uploadedImage, productImage])

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const sheetVariants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      y: "100%",
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Try-On</h2>
                  <p className="text-xs text-muted-foreground">See how it looks on you</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Product Preview */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">Trying on:</p>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image src={productImage || "/placeholder.svg"} alt={productName} fill className="object-cover" />
                  </div>
                  <p className="font-semibold">{productName}</p>
                </div>
              </div>

              {/* Upload Section */}
              {!tryOnResult && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Upload your photo</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!uploadedImage ? (
                    <motion.div
                      className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-muted/30"
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUploadClick}
                    >
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Tap to upload a photo</p>
                        <p className="text-sm text-muted-foreground">or take a new one</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Your photo"
                          fill
                          className="object-cover"
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            triggerHaptic("light")
                            setUploadedImage(null)
                          }}
                          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-14 bg-transparent"
                      onClick={handleUploadClick}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadedImage ? "Change" : "Upload"}
                    </Button>
                    <Button
                      className="flex-1 rounded-xl h-14"
                      disabled={!uploadedImage || isProcessing}
                      onClick={handleTryOn}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Try It On
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Result Section */}
              {tryOnResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="w-4 h-4" />
                    AI Try-On Result
                  </div>

                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary/20">
                    <Image src={tryOnResult || "/placeholder.svg"} alt="Try-on result" fill className="object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-sm font-medium">Looking great!</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-14 bg-transparent"
                      onClick={() => {
                        triggerHaptic("light")
                        setTryOnResult(null)
                        setUploadedImage(null)
                      }}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Try Another
                    </Button>
                    <Button className="flex-1 rounded-xl h-14" onClick={handleClose}>
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center mt-6">
                AI-generated preview. Actual fit may vary.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
