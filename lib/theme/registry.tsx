import type { ComponentRegistry } from "@/types/theme"
import { StoreHeader } from "@/components/storefront/theme/store-header"
import { HeroBanner } from "@/components/storefront/theme/hero-banner"
import { ProductGrid } from "@/components/storefront/theme/product-grid"
import { ProductCarousel } from "@/components/storefront/theme/product-carousel"
import { ProductDetail } from "@/components/storefront/theme/product-detail"
import { CategoryBrowser } from "@/components/storefront/theme/category-browser"
import { Testimonials } from "@/components/storefront/theme/testimonials"
import { NewsletterSignup } from "@/components/storefront/theme/newsletter-signup"
import { FeaturedCollections } from "@/components/storefront/theme/featured-collections"
import { StoreInfo } from "@/components/storefront/theme/store-info"
import { ShippingCalculator } from "@/components/storefront/theme/shipping-calculator"
import { CartDrawer } from "@/components/storefront/theme/cart-drawer"
import { CheckoutFlow } from "@/components/storefront/theme/checkout-flow"
import { StoreFooter } from "@/components/storefront/theme/store-footer"
import { AIShoppingAssistant } from "@/components/storefront/theme/ai-shopping-assistant"

export const themeComponentRegistry: ComponentRegistry = {
  StoreHeader,
  HeroBanner,
  ProductGrid,
  ProductCarousel,
  ProductDetail,
  CategoryBrowser,
  Testimonials,
  NewsletterSignup,
  FeaturedCollections,
  StoreInfo,
  ShippingCalculator,
  CartDrawer,
  CheckoutFlow,
  StoreFooter,
  AIShoppingAssistant,
}
