import type { ComponentNode, ThemeTemplate, ThemeSettings } from "@/types/theme"

const defaultSettings: ThemeSettings = {
  palette: {
    primary: "#111827",
    secondary: "#6B7280",
    accent: "#111827",
    background: "#F9FAFB",
    foreground: "#0F172A",
    muted: "#6B7280",
    border: "#E5E7EB",
  },
  typography: {
    fontBody: "\"Geist\", system-ui, sans-serif",
    fontHeading: "\"Geist\", system-ui, sans-serif",
  },
  radius: "16px",
}

function node<T extends ComponentNode["type"]>(
  data: Omit<ComponentNode<T>, "visible" | "order">
  , order: number
): ComponentNode<T> {
  return {
    ...data,
    order,
    visible: true,
  }
}

// =============================================================================
// CLASSIC — Traditional, balanced layout. Grid-first, no carousel.
// Best for: food, home_decor, general
// =============================================================================

export const classicTemplate: ThemeTemplate = {
  id: "classic",
  name: "Classic",
  description: "Traditional balanced layout with product grid and trust signals.",
  settings: {
    ...defaultSettings,
    palette: {
      ...defaultSettings.palette,
      primary: "#111827",
      accent: "#10B981",
    },
  },
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true, sticky: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.classic.heroTitle", align: "center" } }, 2),
    node(
      {
        id: "grid",
        type: "ProductGrid",
        config: {
          titleKey: "templates.classic.gridTitle",
          columns: 4,
          showPrices: true,
          products: [
            { id: "g1", nameKey: "templates.classic.products.item1", price: 89, imageUrl: "/placeholder.png" },
            { id: "g2", nameKey: "templates.classic.products.item2", price: 129, imageUrl: "/placeholder.png" },
            { id: "g3", nameKey: "templates.classic.products.item3", price: 159, imageUrl: "/placeholder.png" },
            { id: "g4", nameKey: "templates.classic.products.item4", price: 119, imageUrl: "/placeholder.png" },
          ],
        },
      },
      3
    ),
    node(
      {
        id: "collections",
        type: "FeaturedCollections",
        config: {
          items: [
            { id: "c1", titleKey: "templates.classic.collections.curated", descriptionKey: "templates.classic.collections.curatedDesc", imageUrl: "/placeholder.png" },
            { id: "c2", titleKey: "templates.classic.collections.bestsellers", descriptionKey: "templates.classic.collections.bestsellersDesc", imageUrl: "/placeholder.png" },
            { id: "c3", titleKey: "templates.classic.collections.newArrivals", descriptionKey: "templates.classic.collections.newArrivalsDesc", imageUrl: "/placeholder.png" },
          ],
        },
      },
      4
    ),
    node(
      {
        id: "testimonials",
        type: "Testimonials",
        config: {
          items: [
            { id: "t1", quoteKey: "templates.classic.testimonials.quote1", nameKey: "templates.classic.testimonials.name1" },
            { id: "t2", quoteKey: "templates.classic.testimonials.quote2", nameKey: "templates.classic.testimonials.name2" },
            { id: "t3", quoteKey: "templates.classic.testimonials.quote3", nameKey: "templates.classic.testimonials.name3" },
          ],
        },
      },
      5
    ),
    node({ id: "trust", type: "TrustBadges", config: { badges: [{ type: "mada" }, { type: "visa" }, { type: "apple_pay" }, { type: "tamara" }] } }, 6),
    node({ id: "newsletter", type: "NewsletterSignup", config: {} }, 7),
    node({ id: "info", type: "StoreInfo", config: {} }, 8),
    node({ id: "footer", type: "StoreFooter", config: {} }, 9),
  ],
}

// =============================================================================
// SHOWCASE — Editorial, image-forward. Carousel + categories + 3-col grid.
// Best for: clothing
// =============================================================================

export const showcaseTemplate: ThemeTemplate = {
  id: "showcase",
  name: "Showcase",
  description: "Image-forward editorial layout with carousel, categories, and 3-column grid.",
  settings: defaultSettings,
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true, sticky: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.showcase.heroTitle", align: "start" } }, 2),
    node(
      {
        id: "carousel",
        type: "ProductCarousel",
        config: {
          titleKey: "templates.showcase.carouselTitle",
          products: [
            { id: "s1", nameKey: "templates.showcase.products.look1", price: 140, imageUrl: "/placeholder.png" },
            { id: "s2", nameKey: "templates.showcase.products.look2", price: 180, imageUrl: "/placeholder.png" },
            { id: "s3", nameKey: "templates.showcase.products.look3", price: 210, imageUrl: "/placeholder.png" },
          ],
        },
      },
      3
    ),
    node({ id: "categories", type: "CategoryBrowser", config: { columns: 3, layout: "grid", categories: [] } }, 4),
    node(
      {
        id: "grid",
        type: "ProductGrid",
        config: {
          titleKey: "templates.showcase.gridTitle",
          columns: 3,
          showPrices: true,
          products: [
            { id: "s4", nameKey: "templates.showcase.products.look4", price: 160, imageUrl: "/placeholder.png" },
            { id: "s5", nameKey: "templates.showcase.products.look5", price: 220, imageUrl: "/placeholder.png" },
            { id: "s6", nameKey: "templates.showcase.products.look6", price: 190, imageUrl: "/placeholder.png" },
          ],
        },
      },
      5
    ),
    node(
      {
        id: "collections",
        type: "FeaturedCollections",
        config: {
          items: [
            { id: "c1", titleKey: "templates.showcase.collections.editorial", descriptionKey: "templates.showcase.collections.editorialDesc", imageUrl: "/placeholder.png" },
            { id: "c2", titleKey: "templates.showcase.collections.essentials", descriptionKey: "templates.showcase.collections.essentialsDesc", imageUrl: "/placeholder.png" },
            { id: "c3", titleKey: "templates.showcase.collections.street", descriptionKey: "templates.showcase.collections.streetDesc", imageUrl: "/placeholder.png" },
          ],
        },
      },
      6
    ),
    node(
      {
        id: "testimonials",
        type: "Testimonials",
        config: {
          items: [
            { id: "t1", quoteKey: "templates.showcase.testimonials.quote1", nameKey: "templates.showcase.testimonials.name1" },
            { id: "t2", quoteKey: "templates.showcase.testimonials.quote2", nameKey: "templates.showcase.testimonials.name2" },
          ],
        },
      },
      7
    ),
    node({ id: "trust", type: "TrustBadges", config: { badges: [{ type: "mada" }, { type: "visa" }, { type: "apple_pay" }, { type: "tamara" }] } }, 8),
    node({ id: "newsletter", type: "NewsletterSignup", config: {} }, 9),
    node({ id: "info", type: "StoreInfo", config: {} }, 10),
    node({ id: "footer", type: "StoreFooter", config: {} }, 11),
  ],
}

// =============================================================================
// CATALOG — Category-first, dense browsing. Categories → grid → carousel → delivery.
// Best for: electronics, car_care
// =============================================================================

export const catalogTemplate: ThemeTemplate = {
  id: "catalog",
  name: "Catalog",
  description: "Category-first dense layout with delivery info and expanded trust badges.",
  settings: {
    ...defaultSettings,
    palette: {
      ...defaultSettings.palette,
      primary: "#0F172A",
      accent: "#2563EB",
    },
  },
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true, sticky: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.catalog.heroTitle", align: "start" } }, 2),
    node({ id: "categories", type: "CategoryBrowser", config: { columns: 4, layout: "grid", categories: [] } }, 3),
    node(
      {
        id: "grid",
        type: "ProductGrid",
        config: {
          titleKey: "templates.catalog.gridTitle",
          columns: 4,
          showPrices: true,
          products: [
            { id: "e1", nameKey: "templates.catalog.products.device1", price: 899, imageUrl: "/placeholder.png" },
            { id: "e2", nameKey: "templates.catalog.products.device2", price: 1299, imageUrl: "/placeholder.png" },
            { id: "e3", nameKey: "templates.catalog.products.device3", price: 499, imageUrl: "/placeholder.png" },
            { id: "e4", nameKey: "templates.catalog.products.device4", price: 299, imageUrl: "/placeholder.png" },
          ],
        },
      },
      4
    ),
    node(
      {
        id: "carousel",
        type: "ProductCarousel",
        config: {
          titleKey: "templates.catalog.carouselTitle",
          products: [
            { id: "e5", nameKey: "templates.catalog.products.deal1", price: 199, imageUrl: "/placeholder.png" },
            { id: "e6", nameKey: "templates.catalog.products.deal2", price: 349, imageUrl: "/placeholder.png" },
            { id: "e7", nameKey: "templates.catalog.products.deal3", price: 149, imageUrl: "/placeholder.png" },
          ],
        },
      },
      5
    ),
    node({ id: "delivery", type: "DeliveryInfo", config: { free_shipping_threshold: 200, same_day_available: true, currency: "SAR" } }, 6),
    node({ id: "trust", type: "TrustBadges", config: { badges: [{ type: "mada" }, { type: "visa" }, { type: "mastercard" }, { type: "apple_pay" }, { type: "tamara" }, { type: "cod" }] } }, 7),
    node(
      {
        id: "testimonials",
        type: "Testimonials",
        config: {
          items: [
            { id: "t1", quoteKey: "templates.catalog.testimonials.quote1", nameKey: "templates.catalog.testimonials.name1" },
            { id: "t2", quoteKey: "templates.catalog.testimonials.quote2", nameKey: "templates.catalog.testimonials.name2" },
          ],
        },
      },
      8
    ),
    node({ id: "info", type: "StoreInfo", config: {} }, 9),
    node({ id: "footer", type: "StoreFooter", config: {} }, 10),
  ],
}

// =============================================================================
// BOUTIQUE — Minimal, premium. Carousel only (no grid), fewer sections.
// Best for: beauty, services
// =============================================================================

export const boutiqueTemplate: ThemeTemplate = {
  id: "boutique",
  name: "Boutique",
  description: "Minimal premium layout with carousel-only product display.",
  settings: {
    ...defaultSettings,
    palette: {
      ...defaultSettings.palette,
      primary: "#831843",
      accent: "#f472b6",
    },
  },
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true, sticky: true, showLocaleSwitch: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.boutique.heroTitle", align: "center" } }, 2),
    node(
      {
        id: "carousel",
        type: "ProductCarousel",
        config: {
          titleKey: "templates.boutique.carouselTitle",
          products: [
            { id: "b1", nameKey: "templates.boutique.products.item1", price: 250, imageUrl: "/placeholder.png" },
            { id: "b2", nameKey: "templates.boutique.products.item2", price: 320, imageUrl: "/placeholder.png" },
            { id: "b3", nameKey: "templates.boutique.products.item3", price: 180, imageUrl: "/placeholder.png" },
          ],
        },
      },
      3
    ),
    node(
      {
        id: "collections",
        type: "FeaturedCollections",
        config: {
          items: [
            { id: "c1", titleKey: "templates.boutique.collections.signature", descriptionKey: "templates.boutique.collections.signatureDesc", imageUrl: "/placeholder.png" },
            { id: "c2", titleKey: "templates.boutique.collections.seasonal", descriptionKey: "templates.boutique.collections.seasonalDesc", imageUrl: "/placeholder.png" },
          ],
        },
      },
      4
    ),
    node(
      {
        id: "testimonials",
        type: "Testimonials",
        config: {
          items: [
            { id: "t1", quoteKey: "templates.boutique.testimonials.quote1", nameKey: "templates.boutique.testimonials.name1" },
            { id: "t2", quoteKey: "templates.boutique.testimonials.quote2", nameKey: "templates.boutique.testimonials.name2" },
            { id: "t3", quoteKey: "templates.boutique.testimonials.quote3", nameKey: "templates.boutique.testimonials.name3" },
          ],
        },
      },
      5
    ),
    node({ id: "trust", type: "TrustBadges", config: { badges: [{ type: "mada" }, { type: "visa" }, { type: "apple_pay" }, { type: "tamara" }] } }, 6),
    node({ id: "newsletter", type: "NewsletterSignup", config: {} }, 7),
    node({ id: "footer", type: "StoreFooter", config: {} }, 8),
  ],
}

// =============================================================================
// EXPORTS
// =============================================================================

export const themeTemplates: ThemeTemplate[] = [
  classicTemplate,
  showcaseTemplate,
  catalogTemplate,
  boutiqueTemplate,
]

// Backward compatibility aliases for old template IDs
const TEMPLATE_ALIASES: Record<string, string> = {
  fashion: "showcase",
  electronics: "catalog",
  general: "classic",
}

export function getTemplateById(id: string) {
  const resolvedId = TEMPLATE_ALIASES[id] || id
  return themeTemplates.find((template) => template.id === resolvedId)
}
