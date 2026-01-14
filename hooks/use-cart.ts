"use client"

import { useState, useEffect, useCallback } from "react"
import type { CartItem, Product } from "@/types"
import { getCart, saveCart, clearCart } from "@/lib/store"

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setCart(getCart())
    setIsLoaded(true)
  }, [])

  const addToCart = useCallback((product: Product, size: string, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id && item.selectedSize === size)

      let newCart: CartItem[]
      if (existingIndex >= 0) {
        newCart = prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        newCart = [...prev, { product, selectedSize: size, quantity }]
      }

      saveCart(newCart)
      return newCart
    })
  }, [])

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    setCart((prev) => {
      const newCart =
        quantity <= 0
          ? prev.filter((item) => !(item.product.id === productId && item.selectedSize === size))
          : prev.map((item) =>
              item.product.id === productId && item.selectedSize === size ? { ...item, quantity } : item,
            )
      saveCart(newCart)
      return newCart
    })
  }, [])

  const removeFromCart = useCallback((productId: string, size: string) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => !(item.product.id === productId && item.selectedSize === size))
      saveCart(newCart)
      return newCart
    })
  }, [])

  const emptyCart = useCallback(() => {
    setCart([])
    clearCart()
  }, [])

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const shippingFee = cart.length > 0 ? 20 : 0
  const total = subtotal + shippingFee
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  return {
    cart,
    isLoaded,
    addToCart,
    updateQuantity,
    removeFromCart,
    emptyCart,
    subtotal,
    shippingFee,
    total,
    itemCount,
  }
}
