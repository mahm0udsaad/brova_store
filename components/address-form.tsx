"use client"

import { useState, useEffect } from "react"
import { MapPin, Loader2, AlertCircle, Phone, User, Building, MapPinned } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { triggerHaptic, playSound } from "@/lib/haptics"
import { getContact, saveContact, getAddress, saveAddress } from "@/lib/store"
import type { Address, ContactInfo } from "@/types"

interface AddressFormProps {
  address: Address | null
  contactInfo: ContactInfo | null
  onAddressChange: (address: Address) => void
  onContactChange: (contact: ContactInfo) => void
}

const ALLOWED_CITIES = ["Cairo", "Giza"] as const

const inputVariants = {
  focus: { scale: 1.01, transition: { type: "spring" as const, stiffness: 300 } },
  blur: { scale: 1 },
}

export function AddressForm({ address, contactInfo, onAddressChange, onContactChange }: AddressFormProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSuccess, setLocationSuccess] = useState(false)

  const [formData, setFormData] = useState<Address>(
    address || {
      buildingNumber: "",
      apartmentFloor: "",
      street: "",
      district: "",
      landmark: "",
      city: "Cairo",
      country: "Egypt",
    },
  )

  const [contact, setContact] = useState<ContactInfo>(contactInfo || { fullName: "", phoneNumber: "" })

  // Load saved data from session storage on mount
  useEffect(() => {
    const savedContact = getContact()
    const savedAddress = getAddress()
    if (savedContact) {
      setContact(savedContact)
      onContactChange(savedContact)
    }
    if (savedAddress) {
      setFormData(savedAddress)
      onAddressChange(savedAddress)
    }
  }, [])

  const handleInputChange = (field: keyof Address, value: string) => {
    const newAddress = { ...formData, [field]: value }
    setFormData(newAddress)
    onAddressChange(newAddress)
    saveAddress(newAddress)
  }

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    // Phone number formatting for Egypt
    if (field === "phoneNumber") {
      value = value.replace(/[^0-9+]/g, "")
      if (value.length > 15) return
    }

    const newContact = { ...contact, [field]: value }
    setContact(newContact)
    onContactChange(newContact)
    saveContact(newContact)
  }

  const getCurrentLocation = async () => {
    setIsLocating(true)
    setLocationError(null)
    setLocationSuccess(false)
    triggerHaptic("light")
    playSound("tap")

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          )

          if (!response.ok) throw new Error("Failed to fetch address")

          const data = await response.json()
          const addr = data.address || {}

          const city = addr.city || addr.town || addr.state || ""
          const detectedCity = city.toLowerCase().includes("giza")
            ? "Giza"
            : city.toLowerCase().includes("cairo")
              ? "Cairo"
              : null

          if (!detectedCity) {
            setLocationError("Sorry, delivery is only available in Cairo and Giza")
            triggerHaptic("heavy")
            setIsLocating(false)
            return
          }

          const newAddress: Address = {
            buildingNumber: addr.house_number || "",
            apartmentFloor: "",
            street: addr.road || addr.street || "",
            district: addr.suburb || addr.neighbourhood || addr.district || "",
            landmark: "",
            city: detectedCity,
            country: "Egypt",
          }

          setFormData(newAddress)
          onAddressChange(newAddress)
          saveAddress(newAddress)
          setLocationSuccess(true)
          triggerHaptic("success")
          playSound("success")

          setTimeout(() => setLocationSuccess(false), 3000)
        } catch {
          setLocationError("Failed to get address from your location")
          triggerHaptic("heavy")
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        const errorMessages: Record<number, string> = {
          1: "Location access denied. Please enable location services.",
          2: "Location unavailable. Please try again.",
          3: "Location request timed out. Please try again.",
        }
        setLocationError(errorMessages[error.code] || "Failed to get location")
        triggerHaptic("heavy")
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const isPhoneValid = /^(\+20|0)?1[0125]\d{8}$/.test(contact.phoneNumber.replace(/\s/g, ""))

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Delivery Area Notice */}
      <motion.div
        className="bg-accent/50 rounded-2xl p-4 border border-border"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Delivery Area</span>
        </div>
        <p className="text-sm text-muted-foreground">
          We currently deliver only to <strong className="text-foreground">Cairo</strong> and{" "}
          <strong className="text-foreground">Giza</strong>.
        </p>
      </motion.div>

      {/* Contact Information */}
      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact Information</h3>

        <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name
          </Label>
          <Input
            id="fullName"
            placeholder="e.g., Ahmed Mohamed"
            value={contact.fullName}
            onChange={(e) => handleContactChange("fullName", e.target.value)}
            className="mt-1.5 h-12 rounded-xl transition-all duration-200"
          />
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="e.g., 01012345678"
            value={contact.phoneNumber}
            onChange={(e) => handleContactChange("phoneNumber", e.target.value)}
            className={`mt-1.5 h-12 rounded-xl transition-all duration-200 ${
              contact.phoneNumber && !isPhoneValid ? "border-destructive" : ""
            }`}
          />
          {contact.phoneNumber && !isPhoneValid && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive-foreground mt-1"
            >
              Please enter a valid Egyptian phone number
            </motion.p>
          )}
        </motion.div>
      </motion.div>

      {/* Location Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Button
          type="button"
          variant="outline"
          className={`w-full gap-2 h-14 rounded-xl bg-transparent transition-all duration-300 ${
            locationSuccess ? "border-green-500 text-green-500" : ""
          }`}
          onClick={getCurrentLocation}
          disabled={isLocating}
        >
          <AnimatePresence mode="wait">
            {isLocating ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting your location...
              </motion.span>
            ) : locationSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Location detected!
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Use Current Location
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {locationError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-destructive-foreground bg-destructive/10 p-3 rounded-xl"
          >
            {locationError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">Or enter manually</span>
        </div>
      </div>

      {/* Address Fields */}
      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Delivery Address</h3>

        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
            <Label htmlFor="buildingNumber" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Building No.
            </Label>
            <Input
              id="buildingNumber"
              placeholder="e.g., 123"
              value={formData.buildingNumber}
              onChange={(e) => handleInputChange("buildingNumber", e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </motion.div>

          <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
            <Label htmlFor="apartmentFloor">Apt/Floor</Label>
            <Input
              id="apartmentFloor"
              placeholder="e.g., 3rd Floor, Apt 5"
              value={formData.apartmentFloor}
              onChange={(e) => handleInputChange("apartmentFloor", e.target.value)}
              className="mt-1.5 h-12 rounded-xl"
            />
          </motion.div>
        </div>

        <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
          <Label htmlFor="street" className="flex items-center gap-2">
            <MapPinned className="w-4 h-4" />
            Street Name
          </Label>
          <Input
            id="street"
            placeholder="e.g., El-Tahrir Street"
            value={formData.street}
            onChange={(e) => handleInputChange("street", e.target.value)}
            className="mt-1.5 h-12 rounded-xl"
          />
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
          <Label htmlFor="district">District / Area</Label>
          <Input
            id="district"
            placeholder="e.g., Zamalek, Maadi, 6th October"
            value={formData.district}
            onChange={(e) => handleInputChange("district", e.target.value)}
            className="mt-1.5 h-12 rounded-xl"
          />
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus" initial="blur" animate="blur">
          <Label htmlFor="landmark">Landmark (Optional)</Label>
          <Input
            id="landmark"
            placeholder="e.g., Near Cairo Tower, Behind Mall"
            value={formData.landmark}
            onChange={(e) => handleInputChange("landmark", e.target.value)}
            className="mt-1.5 h-12 rounded-xl"
          />
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <select
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value as "Cairo" | "Giza")}
              className="mt-1.5 flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              {ALLOWED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" value="Egypt" disabled className="mt-1.5 h-12 rounded-xl bg-muted" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
