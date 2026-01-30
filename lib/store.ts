import type { CartItem, Order, ContactInfo, Address, UserProfile } from "@/types"
export type { UserProfile } from "@/types"

const CART_KEY = "atypical_cart"
const ORDER_KEY = "atypical_order"
const CONTACT_KEY = "atypical_contact"
const ADDRESS_KEY = "atypical_address"
const PROFILE_KEY = "brova_profile"

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

export function clearCart(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CART_KEY)
}

export function getOrder(): Order | null {
  if (typeof window === "undefined") return null
  const order = localStorage.getItem(ORDER_KEY)
  return order ? JSON.parse(order) : null
}

export function saveOrder(order: Order): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ORDER_KEY, JSON.stringify(order))
}

export function clearOrder(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ORDER_KEY)
}

export function getContact(): ContactInfo | null {
  if (typeof window === "undefined") return null
  const contact = sessionStorage.getItem(CONTACT_KEY)
  return contact ? JSON.parse(contact) : null
}

export function saveContact(contact: ContactInfo): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(CONTACT_KEY, JSON.stringify(contact))
}

export function getAddress(): Address | null {
  if (typeof window === "undefined") return null
  const address = sessionStorage.getItem(ADDRESS_KEY)
  return address ? JSON.parse(address) : null
}

export function saveAddress(address: Address): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(address))
}

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null
  const profile = localStorage.getItem(PROFILE_KEY)
  return profile ? JSON.parse(profile) : null
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(PROFILE_KEY)
}
