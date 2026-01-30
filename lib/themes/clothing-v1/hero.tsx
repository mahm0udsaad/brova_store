/**
 * Clothing V1 Theme - Hero Section
 *
 * Image-first hero for fashion stores
 */

import { HeroProps } from '../types'

export function ClothingHero({ storeName, locale }: HeroProps) {
  const isRTL = locale === 'ar'

  return (
    <div className="relative w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className={`max-w-4xl ${isRTL ? 'mr-auto text-right' : 'ml-auto text-left'}`}>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
            {storeName}
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-8">
            {locale === 'ar'
              ? 'اكتشف أحدث صيحات الموضة'
              : 'Discover the latest fashion trends'}
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-neutral-900 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-900 rounded-lg font-medium hover:opacity-90 transition-opacity">
              {locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
