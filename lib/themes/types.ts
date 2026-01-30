/**
 * Theme System Types
 *
 * Defines the theme interface for storefront rendering.
 * Themes control visual appearance but use the same data layer.
 */

import { StorefrontProduct, StoreContact } from '@/lib/supabase/queries/storefront'
import { ReactNode } from 'react'

/**
 * Theme Configuration
 */
export interface ThemeConfig {
  id: string
  name: string
  description: string
  supportedStoreTypes: ('clothing' | 'car_care')[]
}

/**
 * Product Grid Component Props
 */
export interface ProductGridProps {
  products: StorefrontProduct[]
  locale: 'en' | 'ar'
  storeName: string
  storeId?: string
  emptyMessage?: string
}

/**
 * Product Card Component Props
 */
export interface ProductCardProps {
  product: StorefrontProduct
  locale: 'en' | 'ar'
}

/**
 * Hero Section Component Props
 */
export interface HeroProps {
  storeName: string
  storeType: 'clothing' | 'car_care'
  locale: 'en' | 'ar'
}

/**
 * Product Detail Layout Props
 */
export interface ProductDetailProps {
  product: StorefrontProduct
  locale: 'en' | 'ar'
  storeName: string
}

/**
 * Footer Component Props
 */
export interface FooterProps {
  contact: StoreContact | null
  storeName: string
  locale: 'en' | 'ar'
}

/**
 * Theme Component Interface
 */
export interface Theme {
  config: ThemeConfig
  components: {
    Hero: (props: HeroProps) => ReactNode
    ProductGrid: (props: ProductGridProps) => ReactNode
    ProductCard: (props: ProductCardProps) => ReactNode
    ProductDetail: (props: ProductDetailProps) => ReactNode
    Footer: (props: FooterProps) => ReactNode
  }
}