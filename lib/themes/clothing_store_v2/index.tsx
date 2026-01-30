/**
 * Clothing Store V2 Theme
 *
 * Reference UI: /clothing_store-main
 */

import { Theme } from '../types'
import { ClothingStoreV2Hero } from './hero'
import { ClothingStoreV2ProductGrid } from './product-grid'
import { ClothingStoreV2ProductCard } from './product-card'
import { ClothingStoreV2ProductDetail } from './product-detail'
import { DefaultFooter } from '@/components/storefront/default-footer'

export const clothingStoreV2Theme: Theme = {
  config: {
    id: 'clothing_store_v2',
    name: 'Clothing Store V2',
    description: 'Pixel-matched UI based on clothing_store-main reference',
    supportedStoreTypes: ['clothing'],
  },
  components: {
    Hero: ClothingStoreV2Hero,
    ProductGrid: ClothingStoreV2ProductGrid,
    ProductCard: ClothingStoreV2ProductCard,
    ProductDetail: ClothingStoreV2ProductDetail,
    Footer: DefaultFooter,
  },
}