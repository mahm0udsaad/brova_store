/**
 * Car Care V1 Theme
 *
 * Service-oriented theme for car care and automotive stores
 */

import { Theme } from '../types'
import { CarCareHero } from './hero'
import { CarCareProductGrid } from './product-grid'
import { CarCareProductDetail } from './product-detail'
import { DefaultFooter } from '@/components/storefront/default-footer'

export const carCareV1Theme: Theme = {
  config: {
    id: 'car_care_v1',
    name: 'Car Care V1',
    description: 'Service-focused theme optimized for car care and automotive products',
    supportedStoreTypes: ['car_care'],
  },
  components: {
    Hero: CarCareHero,
    ProductGrid: CarCareProductGrid,
    ProductCard: ({ product, locale }) => null, // Not used in grid, handled by ProductGrid
    ProductDetail: CarCareProductDetail,
    Footer: DefaultFooter,
  },
}