/**
 * Car Care V1 Theme - Product Detail
 *
 * Service-focused product detail page
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ProductDetailProps } from '../types'
import { ChevronLeft, ChevronRight, X, Package, CheckCircle } from 'lucide-react'

export function CarCareProductDetail({ product, locale }: ProductDetailProps) {
  const isRTL = locale === 'ar'
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const name = locale === 'ar' && product.name_ar ? product.name_ar : product.name
  const description = locale === 'ar' && product.description_ar ? product.description_ar : product.description
  const category = locale === 'ar' && product.category_ar ? product.category_ar : product.category

  const images = product.images?.length > 0 ? product.images : [product.image_url || '/placeholder.svg']

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div
            className="relative aspect-video overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          >
            <Image
              src={images[currentImageIndex]}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/90 p-2 rounded-full hover:bg-white dark:hover:bg-black transition-colors`}
                  aria-label={locale === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                >
                  {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/90 p-2 rounded-full hover:bg-white dark:hover:bg-black transition-colors`}
                  aria-label={locale === 'ar' ? 'الصورة التالية' : 'Next image'}
                >
                  {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative aspect-video overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 ${
                    idx === currentImageIndex ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${name} ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          {category && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              <Package className="w-4 h-4" />
              {category}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
            {name}
          </h1>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {product.price.toLocaleString()} {product.currency || 'EGP'}
            </span>
          </div>

          {description && (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {locale === 'ar' ? 'منتج أصلي 100%' : '100% Authentic Product'}
              </span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {locale === 'ar' ? 'ضمان الجودة' : 'Quality Guaranteed'}
              </span>
            </div>
          </div>

          {/* Inventory Indicator */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {product.inventory > 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {locale === 'ar' ? 'متوفر في المخزون' : 'In Stock'}
              </p>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                {locale === 'ar' ? 'نفذ من المخزون' : 'Out of Stock'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Image
              src={images[currentImageIndex]}
              alt={name}
              fill
              sizes="100vw"
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors`}
                  aria-label={locale === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                >
                  {isRTL ? <ChevronRight className="w-8 h-8 text-white" /> : <ChevronLeft className="w-8 h-8 text-white" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-full hover:bg-white/30 transition-colors`}
                  aria-label={locale === 'ar' ? 'الصورة التالية' : 'Next image'}
                >
                  {isRTL ? <ChevronLeft className="w-8 h-8 text-white" /> : <ChevronRight className="w-8 h-8 text-white" />}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
