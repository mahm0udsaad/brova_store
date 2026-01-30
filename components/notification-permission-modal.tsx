"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, BellOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export function NotificationPermissionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    // Check if notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }

    // Show modal after user signs in and hasn't been asked before
    const hasAskedForNotifications = localStorage.getItem("store-notification-asked")
    
    if (isAuthenticated && !hasAskedForNotifications && supported && Notification.permission === "default") {
      // Small delay after sign in
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  const handleAllow = async () => {
    triggerHaptic("light")
    
    if (!isSupported) {
      console.log("Notifications not supported")
      handleClose()
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === "granted") {
        // Save notification preference to Supabase
        if (user) {
          const supabase = createClient()
          await supabase
            .from("user_preferences")
            .upsert({
              user_id: user.id,
              notifications_enabled: true,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id"
            })
        }
        
        localStorage.setItem("store-notification-asked", "true")
        localStorage.setItem("store-notification-enabled", "true")
        
        // Show success notification
        new Notification("Notifications Enabled! 🎉", {
          body: "You'll receive updates about your orders.",
          icon: "/icon-192x192.jpg",
          badge: "/icon-192x192.jpg",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
    
    handleClose()
  }

  const handleDeny = () => {
    triggerHaptic("medium")
    localStorage.setItem("store-notification-asked", "true")
    localStorage.setItem("store-notification-enabled", "false")
    
    if (user) {
      const supabase = createClient()
      supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          notifications_enabled: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        })
        .then(() => {})
        .catch(console.error)
    }
    
    handleClose()
  }

  const handleClose = () => {
    triggerHaptic("light")
    setIsOpen(false)
  }

  if (!isSupported || !isAuthenticated) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-card border rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center">
              {/* Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Bell className="w-10 h-10 text-primary" />
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3">Stay Updated on Your Orders</h2>
              
              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get real-time notifications when your order is:
              </p>

              {/* Features List */}
              <div className="text-left mb-8 space-y-2 bg-muted/30 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Confirmed & processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Out for delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">Delivered successfully</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleAllow}
                  className="w-full h-12 text-base rounded-xl"
                  size="lg"
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Allow Notifications
                </Button>
                
                <Button
                  onClick={handleDeny}
                  variant="ghost"
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  <BellOff className="w-5 h-5 mr-2" />
                  Not Now
                </Button>
              </div>

              {/* Privacy note */}
              <p className="text-xs text-muted-foreground mt-6">
                You can change this anytime in your settings
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}