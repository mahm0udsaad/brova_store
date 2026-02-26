/**
 * Paper Skin Registry
 *
 * Saleor Storefront-inspired: editorial, structured, clean with visible borders,
 * mix of sharp and rounded corners, professional e-commerce feel.
 *
 * Provides 8 critical components. Missing types fall back to default skin.
 */

import type { StorefrontSkin } from "../types"
import { PaperHeader } from "./paper-header"
import { PaperHero } from "./paper-hero"
import { PaperProductGrid } from "./paper-product-grid"
import { PaperProductCarousel } from "./paper-product-carousel"
import { PaperProductDetail } from "./paper-product-detail"
import { PaperCartDrawer } from "./paper-cart-drawer"
import { PaperFooter } from "./paper-footer"
import { PaperCategoryBrowser } from "./paper-category-browser"

export const paperSkin: StorefrontSkin = {
  id: "paper",
  name: "Paper Store",
  description: "Editorial, structured storefront with visible borders and clean typography. Inspired by Saleor Storefront.",
  components: {
    StoreHeader: PaperHeader,
    HeroBanner: PaperHero,
    ProductGrid: PaperProductGrid,
    ProductCarousel: PaperProductCarousel,
    ProductDetail: PaperProductDetail,
    CartDrawer: PaperCartDrawer,
    StoreFooter: PaperFooter,
    CategoryBrowser: PaperCategoryBrowser,
  },
  defaultSettings: {
    palette: {
      primary: "#1A1A1A",
      secondary: "#737373",
      accent: "#1A1A1A",
      background: "#FFFFFF",
      foreground: "#171717",
      muted: "#737373",
      border: "#E5E5E5",
    },
    radius: "0px",
  },
}
