"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { useCart } from "@/hooks/use-cart"
import { getUserProfile, clearUserProfile, type UserProfile } from "@/lib/store"
import { MapPin, Truck, Phone, User, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { triggerHaptic } from "@/lib/haptics"

export default function SettingsPage() {
  const { itemCount } = useCart()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    setProfile(getUserProfile())
  }, [])

  const handleClearProfile = () => {
    triggerHaptic("medium")
    clearUserProfile()
    setProfile(null)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4">
        <Header showBack title="Settings" />

        <div className="space-y-6">
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg uppercase">Saved Profile</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearProfile}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Full Name</p>
                    <p className="text-muted-foreground">{profile.fullName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-muted-foreground">{profile.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-muted-foreground">{profile.address}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="bg-muted rounded-2xl p-6">
            <h2 className="font-bold text-lg uppercase mb-4">About Brova</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium clothing for men and women. Join the community today and be a part of the latest fashion trends.
              From the latest drops and exclusive releases to insider tips and style advice.
            </p>
          </div>

          <div className="bg-muted rounded-2xl p-6">
            <h2 className="font-bold text-lg uppercase mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Areas</p>
                  <p className="text-muted-foreground">Cairo & Giza only</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Shipping & Payment</p>
                  <p className="text-muted-foreground">Cash on Delivery (1-3 working days) - Flat rate: EGP 20</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-2xl p-6">
            <h2 className="font-bold text-lg uppercase mb-4">Contact Us</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>+20 123 456 7890</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav cartCount={itemCount} />
    </div>
  )
}
