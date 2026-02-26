/**
 * YNS Skin Registry
 *
 * YourNextStore-inspired: minimal, modern, lots of white space,
 * subtle shadows instead of borders, large product images.
 *
 * Provides 8 critical components. Missing types fall back to default skin.
 */

import type { StorefrontSkin } from "../types"
import { YnsHeader } from "./yns-header"
import { YnsHero } from "./yns-hero"
import { YnsProductGrid } from "./yns-product-grid"
import { YnsProductCarousel } from "./yns-product-carousel"
import { YnsProductDetail } from "./yns-product-detail"
import { YnsCartDrawer } from "./yns-cart-drawer"
import { YnsFooter } from "./yns-footer"
import { YnsCategoryBrowser } from "./yns-category-browser"

export const ynsSkin: StorefrontSkin = {
  id: "yns",
  name: "Modern Store",
  description: "Clean, minimal storefront with large images and subtle shadows. Inspired by YourNextStore.",
  components: {
    StoreHeader: YnsHeader,
    HeroBanner: YnsHero,
    ProductGrid: YnsProductGrid,
    ProductCarousel: YnsProductCarousel,
    ProductDetail: YnsProductDetail,
    CartDrawer: YnsCartDrawer,
    StoreFooter: YnsFooter,
    CategoryBrowser: YnsCategoryBrowser,
  },
  defaultSettings: {
    palette: {
      primary: "#111827",
      secondary: "#6B7280",
      accent: "#111827",
      background: "#FFFFFF",
      foreground: "#0F172A",
      muted: "#6B7280",
      border: "#F3F4F6",
    },
    radius: "12px",
  },
}
