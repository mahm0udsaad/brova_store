/**
 * Car Care V1 Theme - Hero Section
 *
 * Service-oriented hero for car care stores
 */

import { HeroProps } from '../types'

export function CarCareHero({ storeName, locale }: HeroProps) {
  const isRTL = locale === 'ar'

  return (
    <div className="relative w-full bg-gradient-to-br from-blue-50 to-neutral-100 dark:from-blue-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className={`max-w-4xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
            {storeName}
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-8">
            {locale === 'ar'
              ? 'منتجات عناية بالسيارات عالية الجودة'
              : 'Premium car care products and services'}
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {locale === 'ar' ? 'تسوق المنتجات' : 'Shop Products'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
