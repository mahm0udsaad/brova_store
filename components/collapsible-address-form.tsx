"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, MapPin, Loader2, Navigation, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { triggerHaptic, playSuccessSound } from "@/lib/haptics"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface CollapsibleAddressFormProps {
  address: string
  fullName?: string
  phoneNumber?: string
  isPhoneVerified?: boolean
  onAddressChange: (address: string) => void
  onFullNameChange?: (name: string) => void
  onPhoneChange?: (phone: string) => void
  showContactFields?: boolean
  addressError?: string | null
  forceManualExpanded?: boolean
}

export function CollapsibleAddressForm({
  address,
  fullName = "",
  phoneNumber = "",
  isPhoneVerified = false,
  onAddressChange,
  onFullNameChange,
  onPhoneChange,
  showContactFields = true,
  addressError = null,
  forceManualExpanded = false,
}: CollapsibleAddressFormProps) {
  const locale = useLocale()
  const t = useTranslations("addressForm")
  const isRtl = locale === "ar"
  const [isManualExpanded, setIsManualExpanded] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    if (forceManualExpanded) setIsManualExpanded(true)
  }, [forceManualExpanded])

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(t("errors.geoUnsupported"))
      return
    }

    setIsLoadingLocation(true)
    setLocationError(null)
    triggerHaptic("light")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          )

          if (!response.ok) throw new Error("Failed to fetch address")

          const data = await response.json()
          const addr = data.address

          const city = addr.city || addr.town || addr.county || addr.state
          const isCairoOrGiza =
            city?.toLowerCase().includes("cairo") ||
            city?.toLowerCase().includes("giza") ||
            addr.state?.toLowerCase().includes("cairo") ||
            addr.state?.toLowerCase().includes("giza")

          if (!isCairoOrGiza) {
            setLocationError(t("errors.deliveryArea"))
            setIsLoadingLocation(false)
            return
          }

          const formattedAddress = [
            addr.house_number,
            addr.road || addr.street,
            addr.suburb || addr.neighbourhood,
            city,
            "Egypt",
          ]
            .filter(Boolean)
            .join(", ")

          onAddressChange(formattedAddress)
          setIsManualExpanded(true)
          playSuccessSound()
          triggerHaptic("success")
        } catch (err) {
          setLocationError(t("errors.addressFetchFailed"))
        } finally {
          setIsLoadingLocation(false)
        }
      },
      (error) => {
        setIsLoadingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t("errors.permissionDenied"))
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError(t("errors.positionUnavailable"))
            break
          case error.TIMEOUT:
            setLocationError(t("errors.timeout"))
            break
          default:
            setLocationError(t("errors.generic"))
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  return (
    <div className="space-y-4">
      {/* Contact Fields */}
      {showContactFields && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">{t("fullName")}</label>
            <Input
              type="text"
              placeholder={t("fullNamePlaceholder")}
              value={fullName}
              onChange={(e) => onFullNameChange?.(e.target.value)}
              className="h-12 rounded-xl bg-muted border-0"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">{t("phoneNumber")}</label>
            <div className="relative">
              <span className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+20</span>
              <Input
                type="tel"
                placeholder={t("phonePlaceholder")}
                value={phoneNumber.replace(/^\+?20?/, "")}
                onChange={(e) => onPhoneChange?.(e.target.value.replace(/[^\d\s]/g, ""))}
                className={cn(
                  "h-12 rounded-xl bg-muted transition-all ltr:pl-12 rtl:pr-12 ltr:pr-20 rtl:pl-20",
                  isPhoneVerified ? "border-2 border-green-500/50 bg-green-500/5" : "border-0"
                )}
                disabled={isPhoneVerified}
              />
              {isPhoneVerified && (
                <div className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-green-500">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-medium">{t("verified")}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{t("deliveryAddress")}</p>
            <p className="text-sm text-muted-foreground">{t("deliveryAreas")}</p>
          </div>
        </div>

        {/* Get Location Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGetLocation}
          disabled={isLoadingLocation}
          className="w-full h-12 rounded-xl border-dashed border-2 bg-transparent"
        >
          {isLoadingLocation ? (
            <>
              <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />
              {t("gettingLocation")}
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t("useCurrentLocation")}
            </>
          )}
        </Button>

        {locationError && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 text-center">
            {locationError}
          </motion.p>
        )}

        {/* Address Preview (when has address and manual is collapsed) */}
        {address && !isManualExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 text-sm ${addressError ? "bg-red-500/10 ring-1 ring-red-500/30" : "bg-accent/30"}`}
          >
            <p className="text-muted-foreground">{address}</p>
          </motion.div>
        )}

        <div className="bg-muted rounded-2xl overflow-hidden">
          <motion.button
            onClick={() => {
              setIsManualExpanded(!isManualExpanded)
              triggerHaptic("light")
            }}
            className={cn("w-full p-3 flex items-center justify-between text-left", isRtl && "text-right")}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-sm font-medium">{t("enterManually")}</span>
            <motion.div animate={{ rotate: isManualExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isManualExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3">
                  <Textarea
                    placeholder={t("manualPlaceholder")}
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    className={`min-h-[120px] rounded-xl bg-card border-0 resize-none ${
                      addressError ? "ring-2 ring-red-500/40" : ""
                    }`}
                  />
                  {addressError && <p className="text-xs text-red-500 mt-2">{addressError}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("example")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
