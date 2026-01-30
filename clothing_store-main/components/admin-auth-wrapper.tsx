"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { isAdminClient } from "@/lib/admin/is-admin.client"
import { PhoneAuthModal } from "@/components/phone-auth-modal"

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check admin status whenever user changes
  useEffect(() => {
    async function checkAdminStatus() {
      setIsCheckingAdmin(true)
      
      if (!user) {
        // User not authenticated, show auth modal
        setIsAdmin(false)
        setShowAuthModal(true)
        setIsCheckingAdmin(false)
        return
      }

      // User is authenticated, check if they're an admin
      const adminStatus = await isAdminClient()
      setIsAdmin(adminStatus)
      
      if (!adminStatus) {
        // User is authenticated but not an admin
        // Redirect to home
        router.push("/")
      }
      
      setIsCheckingAdmin(false)
    }

    checkAdminStatus()
  }, [user, router])

  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    // Recheck admin status after successful auth
    const adminStatus = await isAdminClient()
    setIsAdmin(adminStatus)
    
    if (!adminStatus) {
      // User authenticated but not an admin, redirect to home
      router.push("/")
    }
    // If admin, stay on current page (pathname is preserved)
  }

  // Show loading state while checking auth and admin status
  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying access...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show auth modal if user is not authenticated
  if (!user || showAuthModal) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <p className="text-muted-foreground max-w-md">
              Please sign in to access the admin panel. Only authorized administrators can access this area.
            </p>
          </motion.div>
        </div>
        <PhoneAuthModal
          isOpen={true}
          onClose={() => {
            // Don't allow closing, redirect to home instead
            router.push("/")
          }}
          onSuccess={handleAuthSuccess}
          required={true}
        />
      </>
    )
  }

  // User is authenticated and is an admin, show the admin content
  if (isAdmin) {
    return <>{children}</>
  }

  // Fallback: shouldn't reach here, but show loading just in case
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )
}
