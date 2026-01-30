/**
 * Car Care V1 Theme - Product Grid
 *
 * Card/list hybrid layout for service products
 */

import Link from 'next/link'
import Image from 'next/image'
import { ProductGridProps } from '../types'

export function CarCareProductGrid({ products, locale, emptyMessage }: ProductGridProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const name = locale === 'ar' && product.name_ar ? product.name_ar : product.name
          const description = locale === 'ar' && product.description_ar ? product.description_ar : product.description
          const mainImage = product.image_url || product.images?.[0] || '/placeholder.svg'

          return (
            <Link
              key={product.id}
              href={`/${locale}/product/${product.id}`}
              className="group bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                <Image
                  src={mainImage}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              <div className={`p-4 space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-50">
                  {name}
                </h3>
                {description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {product.price.toLocaleString()} {product.currency || 'EGP'}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
