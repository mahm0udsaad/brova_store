import type { StorefrontProduct } from '@/lib/supabase/queries/storefront'
import type { Product } from '@/types'

const KNOWN_SIZES = new Set([
  'XXXS',
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  '4XL',
  '5XL',
])

function normalizeSizeToken(token: string): string | null {
  const upper = token.trim().toUpperCase()
  if (!upper) return null
  if (KNOWN_SIZES.has(upper)) return upper
  if (upper === 'ONE' || upper === 'ONESIZE' || upper === 'ONE-SIZE' || upper === 'OS') {
    return 'ONE SIZE'
  }
  return null
}

export function inferSizesFromTags(tags: string[] | null | undefined, locale: 'en' | 'ar'): string[] {
  if (!tags || tags.length === 0) {
    return [locale === 'ar' ? 'مقاس واحد' : 'One Size']
  }

  const sizes = new Set<string>()

  tags.forEach((tag) => {
    const cleaned = tag.replace(/^sizes?:/i, '').trim()
    const tokens = cleaned.split(/[\s,\/]+/).filter(Boolean)
    tokens.forEach((token) => {
      const normalized = normalizeSizeToken(token)
      if (normalized) sizes.add(normalized)
    })
  })

  if (sizes.size === 0) {
    return [locale === 'ar' ? 'مقاس واحد' : 'One Size']
  }

  return Array.from(sizes)
}

export function mapStorefrontProductToCartProduct(
  product: StorefrontProduct,
  locale: 'en' | 'ar'
): Product {
  const name = locale === 'ar' && product.name_ar ? product.name_ar : product.name
  const description =
    locale === 'ar' && product.description_ar ? product.description_ar : product.description || ''
  const category =
    locale === 'ar' && product.category_ar ? product.category_ar : product.category || ''
  const image = product.image_url || product.images?.[0] || '/placeholder.svg'

  return {
    id: product.id,
    name,
    price: product.price ?? 0,
    category,
    gender: 'unisex',
    sizes: inferSizesFromTags(product.tags, locale),
    image,
    images: product.images,
    description: description || '',
  }
}

export function getLocalizedProductText(product: StorefrontProduct, locale: 'en' | 'ar') {
  return {
    name: locale === 'ar' && product.name_ar ? product.name_ar : product.name,
    description:
      locale === 'ar' && product.description_ar ? product.description_ar : product.description || '',
    category:
      locale === 'ar' && product.category_ar ? product.category_ar : product.category || '',
  }
}
