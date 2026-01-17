export interface Product {
  id: string
  name: string
  price: number
  category: "hoodies" | "joggers" | "shorts" | "t-shirts" | "accessories"
  gender: "men" | "women" | "unisex"
  sizes: string[]
  image: string
  images?: string[]
  description: string
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
