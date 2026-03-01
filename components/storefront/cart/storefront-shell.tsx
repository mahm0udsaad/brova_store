"use client"

import type { ReactNode } from "react"
import { CartProvider, useCartContext } from "./cart-provider"
import { CartDrawer } from "./cart-drawer"
import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

function FloatingCartTrigger() {
  const { itemCount, isLoaded, toggleCart } = useCartContext()

  if (!isLoaded || itemCount === 0) return null

  return (
    <button
      onClick={toggleCart}
      className={cn(
        "fixed bottom-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg transition-all",
        "bg-[var(--theme-primary,#111827)] text-white",
        "hover:shadow-xl hover:scale-105 active:scale-95",
        "end-6"
      )}
      aria-label="Open cart"
    >
      <ShoppingBag className="size-5" />
      <span className="text-sm font-semibold tabular-nums">{itemCount}</span>
    </button>
  )
}

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <FloatingCartTrigger />
      <CartDrawer />
    </CartProvider>
  )
}
