import type { ComponentRegistry, ThemeSettings } from "@/types/theme"

export interface StorefrontSkin {
  id: string
  name: string
  description: string
  /** Full component registry — missing types fall back to default skin */
  components: Partial<ComponentRegistry>
  /** Default theme settings for this skin (store settings override these) */
  defaultSettings?: Partial<ThemeSettings>
}
