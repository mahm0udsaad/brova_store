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
  productImageFile?: File | null
}

export function TryOnBottomSheet({ isOpen, onClose, productImage, productName, productImageFile }: TryOnBottomSheetProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    triggerHaptic("light")
    onClose()
    // Reset state when closing
    setTimeout(() => {
      setUploadedImage(null)
      setTryOnResult(null)
      setIsProcessing(false)
      setErrorMessage(null)
    }, 300)
  }, [onClose])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Clear previous error
      setErrorMessage(null)

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("Please upload a valid image (JPEG, PNG, or WebP)")
        return
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setErrorMessage("Image size must be less than 5MB")
        return
      }

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
    setErrorMessage(null)

    try {
      // Convert base64 data URL to File object
      const response = await fetch(uploadedImage)
      const blob = await response.blob()
      const file = new File([blob], "user-photo.jpg", { type: blob.type })

      // Prepare form data
      const formData = new FormData()
      formData.append("userImage", file)
      
      if (productImageFile) {
        formData.append("productImageFile", productImageFile)
      } else {
        formData.append("productImageUrl", productImage)
      }

      // Call the try-on API
      const apiResponse = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      })

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(data.error || "Failed to generate try-on")
      }

      // Set the result image
      setTryOnResult(data.resultImage)
      triggerHaptic("success")
      playSuccessSound()
    } catch (error: any) {
      console.error("Try-on error:", error)
      triggerHaptic("heavy")
      
      // Set user-friendly error message
      if (error.message.includes("Rate limit")) {
        setErrorMessage("Too many requests. Please try again in a few moments.")
      } else if (error.message.includes("Service")) {
        setErrorMessage("Service temporarily unavailable. Please try again.")
      } else {
        setErrorMessage("Failed to generate try-on. Please try again.")
      }
    } finally {
      setIsProcessing(false)
    }
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
        type: "spring" as const,
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      y: "100%",
      transition: {
        type: "spring" as const,
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
            <div className="p-4 h-[calc(90vh-5rem)] flex flex-col">
              {/* Product Preview - Hide when showing result to save space */}
              {!tryOnResult && (
                <div className="mb-6 shrink-0">
                  <p className="text-sm text-muted-foreground mb-2">Trying on:</p>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                      <Image src={productImage || "/placeholder.svg"} alt={productName} fill className="object-cover" />
                    </div>
                    <p className="font-semibold">{productName}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl shrink-0">
                  <p className="text-sm text-destructive">{errorMessage}</p>
                </div>
              )}

              {/* Upload Section */}
              {!tryOnResult && (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <p className="text-sm font-semibold shrink-0">Upload your photo</p>

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
                      className="border-2 border-dashed border-border rounded-2xl flex-1 flex flex-col items-center justify-center gap-4 bg-muted/30 min-h-[200px]"
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
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                      <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-black/5">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Your photo"
                          fill
                          className="object-contain"
                        />
                        
                        {/* Loading Overlay */}
                        {isProcessing && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center"
                          >
                             {/* Scanner Line */}
                            <motion.div
                              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(var(--primary),1)]"
                              animate={{
                                top: ["0%", "100%", "0%"],
                              }}
                              transition={{
                                duration: 3,
                                ease: "linear",
                                repeat: Infinity,
                              }}
                            />
                            
                            {/* Animated Particles/Rings */}
                            <div className="relative">
                                <motion.div 
                                    className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="relative bg-background/10 backdrop-blur-md p-4 rounded-full border border-white/10">
                                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                </div>
                            </div>
                            
                            <motion.p 
                                className="text-white font-medium mt-6 text-lg tracking-wide"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                Generating Look...
                            </motion.p>
                          </motion.div>
                        )}

                        {!isProcessing && (
                            <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                triggerHaptic("light")
                                setUploadedImage(null)
                            }}
                            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
                            >
                            <X className="w-5 h-5" />
                            </motion.button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 shrink-0 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-14 bg-transparent"
                      onClick={handleUploadClick}
                      disabled={isProcessing}
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
                        "Processing..."
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
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="flex-1 flex flex-col min-h-0 space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary shrink-0">
                    <Sparkles className="w-4 h-4" />
                    AI Try-On Result
                  </div>

                  <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-primary/20 bg-black/5 shadow-2xl">
                    <Image src={tryOnResult || "/placeholder.svg"} alt="Try-on result" fill className="object-contain" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-white text-lg font-bold text-center"
                      >
                        Looking great! ✨
                      </motion.p>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0 pt-2">
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
              {!tryOnResult && !isProcessing && (
                  <div className="mt-4 shrink-0 space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                    AI-generated preview. Actual fit may vary.
                    </p>
                  </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
