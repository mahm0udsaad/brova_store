"use client"

import { Home, Search, ShoppingBag, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"

interface BottomNavProps {
  cartCount?: number
}

export function BottomNav({ cartCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: cartCount },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  const handleNavClick = () => {
    triggerHaptic("light")
  }

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-3 px-4 lg:max-w-lg">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={label}
            >
              <motion.div
                className="relative"
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 -m-2 bg-muted rounded-xl"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />

                {/* Cart badge */}
                <AnimatePresence>
                  {typeof badge === "number" && badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold z-20"
                    >
                      {badge > 9 ? "9+" : badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </motion.nav>
  )
}
