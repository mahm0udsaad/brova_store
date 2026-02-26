/**
 * Default Skin Registry
 *
 * Re-exports existing theme components as the "default" skin.
 * This is the baseline — other skins override specific components
 * and fall back to these for the rest.
 */
export { themeComponentRegistry as defaultRegistry } from "@/lib/theme/registry"
