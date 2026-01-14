"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OtpInput } from "@/components/otp-input"
import { createClient } from "@/lib/supabase/client"
import { triggerHaptic, playSuccessSound } from "@/lib/haptics"

interface PhoneAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PhoneAuthModal({ isOpen, onClose, onSuccess }: PhoneAuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && step === "otp") {
      handleVerifyOtp()
    }
  }, [otp, step])

  const formatPhoneForSupabase = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.startsWith("0")) {
      return `+2${cleaned}`
    }
    if (cleaned.startsWith("20")) {
      return `+${cleaned}`
    }
    if (cleaned.startsWith("+20")) {
      return cleaned
    }
    return `+20${cleaned}`
  }

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number")
      return
    }

    const cleanPhone = phone.replace(/\s/g, "")
    if (!/^(\+20|0)?1[0125]\d{8}$/.test(cleanPhone)) {
      setError("Please enter a valid Egyptian phone number")
      return
    }

    setIsLoading(true)
    setError(null)
    triggerHaptic("light")

    try {
      const supabase = createClient()
      const formattedPhone = formatPhoneForSupabase(phone)

      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (signInError) {
        if (signInError.message.includes("Twilio") || signInError.message.includes("provider")) {
          setError("SMS verification is being set up. Please try again later or contact support.")
        } else {
          setError(signInError.message)
        }
        return
      }

      setStep("otp")
      setCountdown(60)
      playSuccessSound()
    } catch (err) {
      setError("Failed to send verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      return
    }

    setIsLoading(true)
    setError(null)
    triggerHaptic("light")

    try {
      const supabase = createClient()
      const formattedPhone = formatPhoneForSupabase(phone)

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      })

      if (verifyError) {
        setError(verifyError.message)
        setOtp("") // Clear OTP on error
        return
      }

      triggerHaptic("success")
      playSuccessSound()
      onSuccess()
    } catch (err) {
      setError("Failed to verify code. Please try again.")
      setOtp("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setOtp("")
    await handleSendOtp()
  }

  const handleClose = () => {
    setStep("phone")
    setPhone("")
    setOtp("")
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-3xl p-6 shadow-2xl border border-border/50">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  {step === "phone" ? "Sign In" : "Verify Code"}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {step === "phone" ? "Enter your phone number to continue" : `We sent a code to ${phone}`}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {step === "phone" ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Phone Number (Egypt)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">+20</span>
                      <Input
                        type="tel"
                        placeholder="1XX XXX XXXX"
                        value={phone.replace(/^\+?20?/, "")}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                        className="pl-14 h-14 rounded-2xl bg-muted border-0 text-base"
                        maxLength={15}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-3 block text-center">
                      Verification Code
                    </label>
                    <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={handleResendOtp}
                        disabled={countdown > 0 || isLoading}
                        className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 text-center"
                  >
                    {error}
                  </motion.p>
                )}

                {step === "phone" && (
                  <Button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl text-base font-semibold"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send Code
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {step === "otp" && (
                  <button
                    onClick={() => {
                      setStep("phone")
                      setOtp("")
                      setError(null)
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change phone number
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
