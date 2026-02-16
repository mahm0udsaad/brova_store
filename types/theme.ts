import type { ReactNode } from "react"
import type { Locale } from "@/i18n"

export type ComponentType =
  | "StoreHeader"
  | "HeroBanner"
  | "ProductGrid"
  | "ProductCarousel"
  | "ProductDetail"
  | "CategoryBrowser"
  | "Testimonials"
  | "NewsletterSignup"
  | "FeaturedCollections"
  | "StoreInfo"
  | "ShippingCalculator"
  | "CartDrawer"
  | "CheckoutFlow"
  | "StoreFooter"
  | "AIShoppingAssistant"
  | "WhatsAppButton"
  | "TrustBadges"
  | "DeliveryInfo"
  | "OccasionBanner"

export interface ComponentNode<T extends ComponentType = ComponentType> {
  id: string
  type: T
  config: Record<string, unknown>
  children?: ComponentNode[]
  order: number
  visible: boolean
}

export interface ThemePalette {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
}

export interface ThemeTypography {
  fontBody: string
  fontHeading: string
}

export interface ThemeSettings {
  palette: ThemePalette
  typography: ThemeTypography
  radius: string
}

export interface ThemeComponentProps<TConfig = Record<string, unknown>> {
  config: TConfig
  locale: Locale
  theme: ThemeSettings
  children?: ReactNode
  preview?: boolean
}

export type ThemeComponent<TConfig = Record<string, unknown>> = (
  props: ThemeComponentProps<TConfig>
) => ReactNode

export type ComponentRegistry = Record<ComponentType, ThemeComponent>

export interface ThemeTemplate {
  id: string
  name: string
  description: string
  nodes: ComponentNode[]
  settings: ThemeSettings
}
