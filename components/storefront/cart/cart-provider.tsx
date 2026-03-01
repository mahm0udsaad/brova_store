"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useCart } from "@/hooks/use-cart"
import type { Product, CartItem } from "@/types"

interface CartContextValue {
  cart: CartItem[]
  isLoaded: boolean
  addToCart: (product: Product, size?: string, quantity?: number) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  removeFromCart: (productId: string, size: string) => void
  emptyCart: () => void
  subtotal: number
  shippingFee: number
  total: number
  itemCount: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  const value: CartContextValue = {
    ...cart,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toggleCart: () => setIsCartOpen((prev) => !prev),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCartContext must be used within a CartProvider")
  }
  return ctx
}
