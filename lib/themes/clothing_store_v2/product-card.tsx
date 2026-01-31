"use client"

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { triggerHaptic, playSuccessSound } from '@/lib/haptics'
import { toggleFavorite, isFavorite } from '@/lib/favorites'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'
import { blurPlaceholders } from '@/lib/image-utils'
import { ProductCardProps } from '../types'
import { getLocalizedProductText, mapStorefrontProductToCartProduct } from './utils'
import { useTranslations } from 'next-intl'

const FavoriteButton = memo(function FavoriteButton({
  isFav,
  onToggle,
  label,
}: {
  isFav: boolean
  onToggle: (e: React.MouseEvent) => void
  label: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all',
        isFav
          ? 'bg-red-500/30 text-red-500 border border-red-500/30'
          : 'bg-white/20 text-white border border-white/20',
      )}
      aria-label={label}
    >
      <Heart className={cn('w-5 h-5', isFav && 'fill-current')} />
    </motion.button>
  )
})

const AddToCartButton = memo(function AddToCartButton({
  isPurchasable,
  showAdded,
  onAdd,
  label,
}: {
  isPurchasable: boolean
  showAdded: boolean
  onAdd: (e: React.MouseEvent) => void
  label: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onAdd}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all',
        isPurchasable ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/10 text-white/50',
      )}
      aria-label={label}
      aria-disabled={!isPurchasable}
    >
      {showAdded ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
          ✓
        </motion.div>
      ) : (
        <ShoppingBag className="w-5 h-5" />
      )}
    </motion.button>
  )
})

export const ClothingStoreV2ProductCard = memo(function ClothingStoreV2ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('product')
  const { addToCart } = useCart()
  const [isFav, setIsFav] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const isPurchasable = typeof product.price === 'number' && product.price > 0
  const cartProduct = useMemo(() => mapStorefrontProductToCartProduct(product, locale), [product, locale])
  const { name } = getLocalizedProductText(product, locale)
  const image = product.image_url || product.images?.[0] || '/placeholder.svg'
  const href = `/${locale}/product/${product.id}`

  useEffect(() => {
    setIsFav(isFavorite(product.id))
  }, [product.id])

  const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    triggerHaptic('medium')
    const newState = toggleFavorite(product.id)
    setIsFav(newState)
    if (newState) {
      playSuccessSound()
    }
  }, [product.id])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isPurchasable) return
    triggerHaptic('medium')

    if (cartProduct.sizes && cartProduct.sizes.length > 0) {
      addToCart(cartProduct, cartProduct.sizes[0])
      setShowAdded(true)
      playSuccessSound()

      setTimeout(() => {
        setShowAdded(false)
      }, 1500)
    }
  }, [isPurchasable, cartProduct, addToCart])

  const handleTap = useCallback(() => {
    triggerHaptic('light')
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link href={href} className="group block" onClick={handleTap}>
        <motion.div
          className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
            quality={85}
            loading="lazy"
            placeholder="blur"
            blurDataURL={blurPlaceholders.product}
          />
          <div className="absolute top-3 ltr:left-3 rtl:right-3 flex flex-col gap-2 z-10">
            <FavoriteButton
              isFav={isFav}
              onToggle={handleFavoriteToggle}
              label={isFav ? t('removeFavorite') : t('addFavorite')}
            />
            <AddToCartButton
              isPurchasable={isPurchasable}
              showAdded={showAdded}
              onAdd={handleAddToCart}
              label={t('addToCart')}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isPurchasable ? (
            <p className="text-lg font-semibold text-foreground">
              {product.currency || 'EGP'} {product.price?.toLocaleString()}
            </p>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">{t('pricingSoon')}</p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-1">{name}</p>
        </motion.div>
      </Link>
    </motion.div>
  )
})
