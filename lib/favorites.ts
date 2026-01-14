"use client"

const FAVORITES_KEY = "atypical_favorites"

export function getFavorites(): string[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(FAVORITES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addToFavorites(productId: string): void {
  const favorites = getFavorites()
  if (!favorites.includes(productId)) {
    favorites.push(productId)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }
}

export function removeFromFavorites(productId: string): void {
  const favorites = getFavorites()
  const updated = favorites.filter((id) => id !== productId)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
}

export function isFavorite(productId: string): boolean {
  return getFavorites().includes(productId)
}

export function toggleFavorite(productId: string): boolean {
  if (isFavorite(productId)) {
    removeFromFavorites(productId)
    return false
  } else {
    addToFavorites(productId)
    return true
  }
}
