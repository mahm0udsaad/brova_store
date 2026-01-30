"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { isAdminClient } from "@/lib/admin/is-admin.client"

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check admin status whenever user changes
  useEffect(() => {
    async function checkAdminStatus() {
      // Don't check if we're still loading the auth state
      if (authLoading) {
        return
      }

      setIsCheckingAdmin(true)
      
      if (!user) {
        // User not authenticated, redirect to login
        setIsAdmin(false)
        setIsCheckingAdmin(false)
        // Use replace instead of push to avoid redirect loops
        router.replace("/admin-login")
        return
      }

      // User is authenticated, check if they're an admin
      const adminStatus = await isAdminClient()
      setIsAdmin(adminStatus)
      
      if (!adminStatus) {
        // User is authenticated but not an admin
        // Redirect to home
        router.replace("/")
      }
      
      setIsCheckingAdmin(false)
    }

    checkAdminStatus()
  }, [user, authLoading, router])

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
