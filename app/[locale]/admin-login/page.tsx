"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { triggerHaptic } from "@/lib/haptics"
import { useAuth } from "@/hooks/use-auth"
import { isAdminClient } from "@/lib/admin/is-admin.client"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Only redirect if user is already authenticated and is admin
  // This check is passive and doesn't trigger redirects from the admin panel
  useEffect(() => {
    async function checkAdminStatus() {
      if (user && !authLoading) {
        const adminStatus = await isAdminClient()
        if (adminStatus) {
          router.replace("/admin")
        }
      }
    }
    checkAdminStatus()
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)
    setError(null)
    triggerHaptic("light")

    try {
      const supabase = createClient()

      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (!data.user) {
        setError("Failed to sign in")
        return
      }

      // Check if user is admin
      const adminStatus = await isAdminClient()
      
      if (!adminStatus) {
        // Not an admin, sign them out and show error
        await supabase.auth.signOut()
        setError("You do not have admin access")
        return
      }

      // Success - redirect to admin panel
      triggerHaptic("success")
      router.push("/admin")
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Admin Login</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to access the admin panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-muted border-0 text-base"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl bg-muted border-0 text-base"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl text-base font-semibold"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Admin access only. Need help? Contact support.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
