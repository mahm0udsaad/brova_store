/**
 * Clothing V1 Theme - Product Grid
 *
 * Image-first grid layout for fashion products
 */

import Link from 'next/link'
import Image from 'next/image'
import { ProductGridProps } from '../types'

export function ClothingProductGrid({ products, locale, emptyMessage }: ProductGridProps) {
  const isRTL = locale === 'ar'

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">
          {emptyMessage || (locale === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available')}
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const name = locale === 'ar' && product.name_ar ? product.name_ar : product.name
          const mainImage = product.image_url || product.images?.[0] || '/placeholder.svg'

          return (
            <Link
              key={product.id}
              href={`/${locale}/product/${product.id}`}
              className="group"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 mb-3">
                <Image
                  src={mainImage}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {product.inventory === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-medium px-4 py-2 bg-black/75 rounded-lg">
                      {locale === 'ar' ? 'نفذ من المخزون' : 'Out of Stock'}
                    </span>
                  </div>
                )}
              </div>
              <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-50 line-clamp-2">
                  {name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {product.price.toLocaleString()} {product.currency || 'EGP'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
