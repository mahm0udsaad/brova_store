"use client"

import Image from "next/image"
import { Plus, Minus, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { triggerHaptic } from "@/lib/haptics"
import type { CartItem as CartItemType } from "@/types"

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (productId: string, size: string, quantity: number) => void
  index?: number
}

export function CartItem({ item, onUpdateQuantity, index = 0 }: CartItemProps) {
  const handleQuantityChange = (newQuantity: number) => {
    triggerHaptic("light")
    onUpdateQuantity(item.product.id, item.selectedSize, newQuantity)
  }

  const handleRemove = () => {
    triggerHaptic("medium")
    onUpdateQuantity(item.product.id, item.selectedSize, 0)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex gap-4 py-4"
    >
      <motion.div
        className="relative w-20 h-24 md:w-24 md:h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Image src={item.product.image || "/placeholder.svg"} alt={item.product.name} fill className="object-cover" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-foreground uppercase tracking-wide text-sm md:text-base line-clamp-1">
              {item.product.name}
            </h3>
            <p className="text-lg font-semibold text-foreground mt-0.5">EGP {item.product.price.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Size: {item.selectedSize}</p>
          </div>

          {/* Remove button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            className="p-2 text-muted-foreground hover:text-destructive-foreground transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center bg-muted rounded-xl">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-l-xl rounded-r-none"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.span
                key={item.quantity}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-10 text-center font-semibold"
              >
                {item.quantity}
              </motion.span>
            </AnimatePresence>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-r-xl rounded-l-none"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          <span className="text-sm text-muted-foreground ml-auto">
            EGP {(item.product.price * item.quantity).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
