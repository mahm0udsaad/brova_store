"use client"

import { Search, ShoppingBag, Settings, Sparkles, HomeIcon, Home, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"
import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

interface BottomNavProps {
  cartCount?: number
}

// Custom Brova Icon Component using the SVG
const BrovaIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // brova-symbol.svg is light (off-white) -> use in dark mode
  // brova-symbol-dark.svg is dark (black) -> use in light mode
  const iconSrc = mounted && theme === "light" ? "/brova-symbol.svg" : "/brova-symbol-dark.svg"

  return (
    <div className={cn("relative size-12 transition-all duration-300", isActive ? "scale-105" : "scale-100", className)}>
      <Image 
        src={iconSrc} 
        alt="Home" 
        fill 
        className={cn("object-contain transition-all duration-300", isActive ? "opacity-100" : "opacity-90")}
        sizes="48px"
        quality={90}
        priority
      />
    </div>
  )
}

export function BottomNav({ cartCount = 0 }: BottomNavProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("navigation")
  const isRtl = locale === "ar"
  const normalizedPathname = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/"
  const buildHref = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`)

  const navItems = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/search", icon: Search, label: t("search") },
    { href: "/assistant", icon: BrovaIcon, label: t("assistant"), isMain: true },
    { href: "/cart", icon: ShoppingBag, label: t("cart"), badge: cartCount },
    { href: "/orders", icon: Package, label: t("orders") },
  ]

  const handleNavClick = () => {
    triggerHaptic("light")
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      {/* Glow effect behind the center button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary/20 blur-2xl rounded-full -z-10 sm:bottom-8 sm:w-20 sm:h-20" />
      
      <motion.nav
        className="max-w-md mx-auto mb-2 px-3 pointer-events-auto lg:max-w-lg sm:mb-4 sm:px-6"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="bg-background/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-between px-2 py-1.5 sm:rounded-[1.75rem] sm:px-4 sm:py-2.5">
          {navItems.map(({ href, icon: Icon, label, badge, isMain }) => {
            const localizedHref = buildHref(href)
            const isActive = normalizedPathname === href || (href !== "/" && normalizedPathname.startsWith(href))
            
            if (isMain) {
              return (
                <Link
                  key={localizedHref}
                  href={localizedHref}
                  onClick={handleNavClick}
                  className="relative -top-3 flex flex-col items-center sm:-top-5"
                >
                  <motion.div
                    className={cn(
                      "size-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 sm:size-16",
                      isActive 
                        ? "bg-primary text-primary-foreground scale-105 rotate-6" 
                        : "bg-neutral-900 dark:bg-white text-white dark:text-black hover:scale-105"
                    )}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                  >
                    <Icon className="size-9 sm:size-14" />
                  </motion.div>
                </Link>
              )
            }

            return (
              <Link
                key={localizedHref}
                href={localizedHref}
                onClick={handleNavClick}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-10 h-10 rounded-lg transition-all duration-300 sm:w-14 sm:h-14 sm:rounded-2xl",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={label}
              >
                <motion.div
                  className="relative flex flex-col items-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Icon rendering */}
                    <Icon className={cn("size-[18px] transition-all duration-300 sm:size-6", isActive && "scale-110")} />

                  {/* Cart badge */}
                  <AnimatePresence>
                    {typeof badge === "number" && badge > 0 && (
                      <motion.span
                        initial={{ scale: 0, x: isRtl ? -10 : 10, y: -10 }}
                        animate={{ scale: 1, x: isRtl ? -10 : 10, y: -10 }}
                        exit={{ scale: 0 }}
                        className="absolute top-0 ltr:right-0 rtl:left-0 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm"
                      >
                        {badge > 9 ? "9+" : badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </motion.nav>
      
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </div>
  )
}
