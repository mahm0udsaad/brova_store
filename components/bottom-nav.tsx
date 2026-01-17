"use client"

import { Search, ShoppingBag, Settings, Sparkles, HomeIcon, Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"
import * as React from "react"

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
    <div className={cn("relative size-16 transition-all duration-300", isActive ? "scale-110" : "scale-100", className)}>
      <Image 
        src={iconSrc} 
        alt="Home" 
        fill 
        className={cn("object-contain transition-all duration-300", isActive ? "opacity-100" : "opacity-90")}
      />
    </div>
  )
}

export function BottomNav({ cartCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/editor", icon: BrovaIcon, label: "Design", isMain: true },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: cartCount },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  const handleNavClick = () => {
    triggerHaptic("light")
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Glow effect behind the center button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 blur-3xl rounded-full -z-10" />
      
      <motion.nav
        className="max-w-md mx-auto mb-6 px-6 pointer-events-auto lg:max-w-lg"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="bg-background/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-between p-2">
          {navItems.map(({ href, icon: Icon, label, badge, isMain }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
            
            if (isMain) {
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleNavClick}
                  className="relative -top-6 flex flex-col items-center"
                >
                  <motion.div
                    className={cn(
                      "size-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                      isActive 
                        ? "bg-primary text-primary-foreground scale-110 rotate-12" 
                        : "bg-neutral-900 dark:bg-white text-white dark:text-black hover:scale-105"
                    )}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                  >
                    <Icon className="size-16" />
                  </motion.div>
                </Link>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={label}
              >
                <motion.div
                  className="relative flex flex-col items-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Icon rendering */}
                    <Icon className={cn("size-6 transition-all duration-300", isActive && "scale-110")} />

                  {/* Cart badge */}
                  <AnimatePresence>
                    {typeof badge === "number" && badge > 0 && (
                      <motion.span
                        initial={{ scale: 0, x: 10, y: -10 }}
                        animate={{ scale: 1, x: 12, y: -8 }}
                        exit={{ scale: 0 }}
                        className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm"
                      >
                        {badge > 9 ? "9+" : badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
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
