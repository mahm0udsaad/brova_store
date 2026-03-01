export interface Product {
  id: string
  name: string
  price: number | null
  category?: string
  gender?: "men" | "women" | "unisex"
  sizes?: string[]
  image: string
  images?: string[]
  description?: string
}

export interface CartItem {
  product: Product
  quantity: number
  selectedSize: string
  customDesign?: {
    frontImage?: string
    backImage?: string
    color: string
  }
}

/**
 * Storefront product info (serializable, passed from server to client components)
 */
export interface StorefrontProductInfo {
  id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  price: number
  currency?: string
  image: string
  images: string[]
  category?: string
  sizes?: string[]
  colors?: string[]
}

/**
 * Convert a StorefrontProductInfo to a cart-compatible Product
 */
export function toCartProduct(p: StorefrontProductInfo): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    image: p.image,
    images: p.images,
    description: p.description,
  }
}

export interface Address {
  buildingNumber: string
  apartmentFloor: string
  street: string
  district: string
  landmark: string
  city: "Cairo" | "Giza"
  country: string
}

export interface ContactInfo {
  fullName: string
  phoneNumber: string
}

export interface Order {
  items: CartItem[]
  address: Address
  contactInfo: ContactInfo
  subtotal: number
  shippingFee: number
  total: number
  createdAt: string
}

export interface UserProfile {
  fullName: string
  phoneNumber: string
  address: string
}
