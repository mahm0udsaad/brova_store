"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"

interface ThemeToggleProps {
  compact?: boolean
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    triggerHaptic("light")
    const isDark = theme === "dark"
    
    // Fallback for browsers that don't support View Transitions API
    if (!document.startViewTransition) {
      setTheme(isDark ? "light" : "dark")
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )

    const transition = document.startViewTransition(async () => {
      setTheme(isDark ? "light" : "dark")
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: isDark ? "::view-transition-old(root)" : "::view-transition-new(root)",
        }
      )
    })
  }

  if (!mounted) {
    return null
  }

  if (compact) {
    return (
      <motion.button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative sm:w-10 sm:h-10"
        whileTap={{ scale: 0.9 }}
        aria-label="Toggle theme"
      >
        <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 sm:h-5 sm:w-5" />
        <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-100 sm:h-5 sm:w-5" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-24 right-6 z-[60]"
    >
      <Button
        variant="outline"
        size="icon"
        className="size-12 rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-md"
        onClick={toggleTheme}
      >
        <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  )
}
