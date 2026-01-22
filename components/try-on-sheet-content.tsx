"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { X, Camera, Upload, ImageIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerHaptic, playSuccessSound } from "@/lib/haptics"
import { useModalStack } from "./modal-stack/modal-stack-context"
import { createClient } from "@/lib/supabase/client"

interface TryOnSheetContentProps {
  productImage: string
  productName: string
  productImageFile?: File | null
  productId?: string
}

export function TryOnSheetContent({ productImage, productName, productImageFile, productId }: TryOnSheetContentProps) {
  const { dismiss } = useModalStack()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [showCreditsUpsell, setShowCreditsUpsell] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadCredits = async () => {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        setIsAuthenticated(false)
        setCredits(0)
        return
      }
      setIsAuthenticated(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("try_on_credits")
        .eq("id", authData.user.id)
        .single()
      if (error) {
        setCredits(0)
        return
      }
      setCredits(data?.try_on_credits ?? 0)
    }

    loadCredits()
  }, [])

  const handleClose = useCallback(() => {
    triggerHaptic("light")
    dismiss()
  }, [dismiss])

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
    if (!isAuthenticated) {
      setErrorMessage("Please sign in to use Try-On.")
      return
    }

    if (credits !== null && credits <= 0) {
      setShowCreditsUpsell(true)
      return
    }

    const previousCredits = credits

    triggerHaptic("medium")
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      if (typeof previousCredits === "number") {
        setCredits(Math.max(0, previousCredits - 1))
      }

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
      if (productId) {
        formData.append("productId", productId)
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
      if (typeof data.newCredits === "number") {
        setCredits(data.newCredits)
      }
      triggerHaptic("success")
      playSuccessSound()
    } catch (error: any) {
      console.error("Try-on error:", error)
      triggerHaptic("heavy")
      if (typeof previousCredits === "number") {
        setCredits(previousCredits)
      }
      
      // Set user-friendly error message
      if (error.message.includes("Rate limit")) {
        setErrorMessage("Too many requests. Please try again in a few moments.")
      } else if (error.message.includes("Service")) {
        setErrorMessage("Service temporarily unavailable. Please try again.")
      } else if (error.message.toLowerCase().includes("credits")) {
        setShowCreditsUpsell(true)
        setErrorMessage(null)
      } else {
        setErrorMessage("Failed to generate try-on. Please try again.")
      }
    } finally {
      setIsProcessing(false)
    }
  }, [uploadedImage, productImage, productImageFile, productId, credits, isAuthenticated])

  return (
    <div className="flex flex-col h-full min-h-[60vh]">
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
        {typeof credits === "number" && (
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Credits: {credits}
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-4">
        {/* Product Preview - Hide when showing result to save space */}
        {!tryOnResult && (
          <div className="mb-2 shrink-0">
            <p className="text-sm text-muted-foreground mb-2">Trying on:</p>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                <Image 
                  src={productImage || "/placeholder.svg"} 
                  alt={productName} 
                  fill 
                  className="object-cover" 
                  sizes="64px"
                  quality={75}
                  loading="lazy"
                />
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

        {showCreditsUpsell && (
          <div className="mb-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 text-center">
            <p className="text-sm font-semibold">No Try-On credits left</p>
            <p className="text-xs text-muted-foreground mt-1">Complete a purchase to earn more credits.</p>
            <div className="flex gap-2 justify-center mt-3">
              <Button
                variant="outline"
                className="rounded-xl h-10"
                onClick={() => setShowCreditsUpsell(false)}
              >
                Not now
              </Button>
              <Button className="rounded-xl h-10" onClick={() => (window.location.href = "/cart")}>
                Get More Credits
              </Button>
            </div>
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
                <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-black/5 min-h-[300px]">
                  <Image
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Your photo"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 500px"
                    quality={90}
                    priority
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
            <div className="flex gap-3 shrink-0 pt-2 pb-6">
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

            <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-primary/20 bg-black/5 shadow-2xl min-h-[400px]">
              <Image 
                src={tryOnResult || "/placeholder.svg"} 
                alt="Try-on result" 
                fill 
                className="object-contain" 
                sizes="(max-width: 768px) 100vw, 500px"
                quality={95}
                priority
              />
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

            <div className="flex gap-3 shrink-0 pt-2 pb-6">
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
            <div className="shrink-0 space-y-2 pb-6">
              <p className="text-xs text-muted-foreground text-center">
              AI-generated preview. Actual fit may vary.
              </p>
            </div>
        )}
      </div>
    </div>
  )
}
