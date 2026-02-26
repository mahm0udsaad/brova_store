/**
 * Skin Registry
 *
 * Resolves a skin_id to a full ComponentRegistry.
 * Missing components in a skin fall back to the default skin.
 */

import type { ComponentRegistry } from "@/types/theme"
import type { StorefrontSkin } from "./types"
import { defaultRegistry } from "./default/registry"

// Lazy-load skin registries to avoid importing all skins at once
const skinLoaders: Record<string, () => Promise<StorefrontSkin>> = {
  yns: () => import("./yns/registry").then((m) => m.ynsSkin),
  paper: () => import("./paper/registry").then((m) => m.paperSkin),
}

// Cache resolved skins
const skinCache = new Map<string, ComponentRegistry>()

/**
 * Resolve a skin_id to a full ComponentRegistry.
 * Missing components fall back to the default skin.
 */
export async function resolveSkin(
  skinId: string | null | undefined
): Promise<ComponentRegistry> {
  const id = skinId || "default"

  // Default skin — no merging needed
  if (id === "default") return defaultRegistry

  // Check cache
  if (skinCache.has(id)) return skinCache.get(id)!

  // Load skin
  const loader = skinLoaders[id]
  if (!loader) return defaultRegistry

  try {
    const skin = await loader()
    // Merge: skin components override default, rest fall back
    const merged: ComponentRegistry = {
      ...defaultRegistry,
      ...skin.components,
    } as ComponentRegistry
    skinCache.set(id, merged)
    return merged
  } catch (e) {
    console.error(`[resolveSkin] Failed to load skin "${id}":`, e)
    return defaultRegistry
  }
}

/** Available skin IDs for UI pickers */
export const availableSkins = ["default", "yns", "paper"] as const
export type SkinId = (typeof availableSkins)[number]
