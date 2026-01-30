/**
 * Theme Registry
 *
 * Central registry for all available themes.
 * Resolves theme by ID or store type.
 */

import { Theme } from './types'
import { clothingV1Theme } from './clothing-v1'
import { clothingStoreV2Theme } from './clothing_store_v2'
import { carCareV1Theme } from './car-care-v1'

/**
 * All available themes
 */
const themes: Theme[] = [
  clothingV1Theme,
  clothingStoreV2Theme,
  carCareV1Theme,
]

/**
 * Get theme by ID
 *
 * @param themeId - Theme ID (e.g., 'clothing_v1')
 * @returns Theme or undefined if not found
 */
export function getThemeById(themeId: string): Theme | undefined {
  return themes.find(theme => theme.config.id === themeId)
}

/**
 * Get default theme for a store type
 *
 * @param storeType - Store type ('clothing' | 'car_care')
 * @returns Theme or undefined if no match
 */
export function getDefaultTheme(storeType: 'clothing' | 'car_care'): Theme | undefined {
  return themes.find(theme => theme.config.supportedStoreTypes.includes(storeType))
}

/**
 * List theme configs for admin selection
 */
export function listThemeConfigs() {
  return themes.map(theme => theme.config)
}

/**
 * Resolve theme for a store
 *
 * Priority:
 * 1. Store's explicit theme_id
 * 2. Default theme for store type
 * 3. First available theme (fallback)
 *
 * @param themeId - Store's theme_id (can be null)
 * @param storeType - Store type
 * @returns Theme (guaranteed)
 */
export function resolveTheme(
  themeId: string | null,
  storeType: 'clothing' | 'car_care'
): Theme {
  // Try explicit theme ID
  if (themeId) {
    const theme = getThemeById(themeId)
    if (theme) return theme
  }

  // Try default for store type
  const defaultTheme = getDefaultTheme(storeType)
  if (defaultTheme) return defaultTheme

  // Fallback to first theme
  return themes[0]
}

export { clothingV1Theme, clothingStoreV2Theme, carCareV1Theme }
export * from './types'
