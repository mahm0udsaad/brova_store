"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { triggerHaptic } from "@/lib/haptics"

interface HeaderProps {
  showBack?: boolean
  title?: string
  showAvatar?: boolean
}

export function Header({ showBack = false, title, showAvatar = false }: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    triggerHaptic("light")
    router.back()
  }

  return (
    <motion.header
      className="flex items-center justify-between py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="w-10">
        {showBack && (
          <motion.button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            whileTap={{ scale: 0.9 }}
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {title && (
        <motion.h1
          className="font-bold text-xl uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h1>
      )}

      <div className="w-10">
        {showAvatar && (
          <motion.div
            className="w-10 h-10 rounded-full bg-muted overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image src="/diverse-profile-avatars.png" alt="Profile" width={40} height={40} className="object-cover" />
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
