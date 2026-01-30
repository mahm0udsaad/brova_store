/**
 * Clothing V1 Theme
 *
 * Image-first, fashion-oriented theme for clothing stores
 */

import { Theme } from '../types'
import { ClothingHero } from './hero'
import { ClothingProductGrid } from './product-grid'
import { ClothingProductDetail } from './product-detail'
import { DefaultFooter } from '@/components/storefront/default-footer'

export const clothingV1Theme: Theme = {
  config: {
    id: 'clothing_v1',
    name: 'Clothing V1',
    description: 'Image-first theme optimized for fashion and clothing stores',
    supportedStoreTypes: ['clothing'],
  },
  components: {
    Hero: ClothingHero,
    ProductGrid: ClothingProductGrid,
    ProductCard: ({ product, locale }) => null, // Not used in grid, handled by ProductGrid
    ProductDetail: ClothingProductDetail,
    Footer: DefaultFooter,
  },
}