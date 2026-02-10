import type { ComponentNode, ThemeTemplate, ThemeSettings } from "@/types/theme"

// TODO(@SONNET): Provide server actions to load/save ComponentNode[] templates per store.

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

export const fashionTemplate: ThemeTemplate = {
  id: "fashion",
  name: "Fashion",
  description: "Image-forward layout with bold collections.",
  settings: defaultSettings,
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.fashion.heroTitle" } }, 2),
    node(
      {
        id: "carousel",
        type: "ProductCarousel",
        config: {
          titleKey: "templates.fashion.carouselTitle",
          products: [
            { id: "f1", nameKey: "templates.fashion.products.look1", price: 140, imageUrl: "/placeholder.png" },
            { id: "f2", nameKey: "templates.fashion.products.look2", price: 180, imageUrl: "/placeholder.png" },
            { id: "f3", nameKey: "templates.fashion.products.look3", price: 210, imageUrl: "/placeholder.png" },
          ],
        },
      },
      3
    ),
    node(
      {
        id: "grid",
        type: "ProductGrid",
        config: {
          titleKey: "templates.fashion.gridTitle",
          products: [
            { id: "f4", nameKey: "templates.fashion.products.look4", price: 160, imageUrl: "/placeholder.png" },
            { id: "f5", nameKey: "templates.fashion.products.look5", price: 220, imageUrl: "/placeholder.png" },
            { id: "f6", nameKey: "templates.fashion.products.look6", price: 190, imageUrl: "/placeholder.png" },
            { id: "f7", nameKey: "templates.fashion.products.look7", price: 240, imageUrl: "/placeholder.png" },
          ],
        },
      },
      4
    ),
    node(
      {
        id: "collections",
        type: "FeaturedCollections",
        config: {
          items: [
            {
              id: "c1",
              titleKey: "templates.fashion.collections.editorial",
              descriptionKey: "templates.fashion.collections.editorialDesc",
              imageUrl: "/placeholder.png",
            },
            {
              id: "c2",
              titleKey: "templates.fashion.collections.essentials",
              descriptionKey: "templates.fashion.collections.essentialsDesc",
              imageUrl: "/placeholder.png",
            },
            {
              id: "c3",
              titleKey: "templates.fashion.collections.street",
              descriptionKey: "templates.fashion.collections.streetDesc",
              imageUrl: "/placeholder.png",
            },
          ],
        },
      },
      5
    ),
    node(
      {
        id: "testimonials",
        type: "Testimonials",
        config: {
          items: [
            { id: "t1", quoteKey: "templates.fashion.testimonials.quote1", nameKey: "templates.fashion.testimonials.name1" },
            { id: "t2", quoteKey: "templates.fashion.testimonials.quote2", nameKey: "templates.fashion.testimonials.name2" },
            { id: "t3", quoteKey: "templates.fashion.testimonials.quote3", nameKey: "templates.fashion.testimonials.name3" },
          ],
        },
      },
      6
    ),
    node({ id: "newsletter", type: "NewsletterSignup", config: {} }, 7),
    node({ id: "info", type: "StoreInfo", config: {} }, 8),
    node({ id: "footer", type: "StoreFooter", config: {} }, 9),
  ],
}

export const electronicsTemplate: ThemeTemplate = {
  id: "electronics",
  name: "Electronics",
  description: "Spec-driven layout with clarity and structure.",
  settings: {
    ...defaultSettings,
    palette: {
      ...defaultSettings.palette,
      primary: "#0F172A",
      accent: "#2563EB",
    },
  },
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.electronics.heroTitle" } }, 2),
    node(
      {
        id: "grid",
        type: "ProductGrid",
        config: {
          titleKey: "templates.electronics.gridTitle",
          products: [
            { id: "e1", nameKey: "templates.electronics.products.device1", price: 899, imageUrl: "/placeholder.png" },
            { id: "e2", nameKey: "templates.electronics.products.device2", price: 1299, imageUrl: "/placeholder.png" },
            { id: "e3", nameKey: "templates.electronics.products.device3", price: 499, imageUrl: "/placeholder.png" },
            { id: "e4", nameKey: "templates.electronics.products.device4", price: 299, imageUrl: "/placeholder.png" },
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
            {
              id: "c1",
              titleKey: "templates.electronics.collections.audio",
              descriptionKey: "templates.electronics.collections.audioDesc",
              imageUrl: "/placeholder.png",
            },
            {
              id: "c2",
              titleKey: "templates.electronics.collections.smartHome",
              descriptionKey: "templates.electronics.collections.smartHomeDesc",
              imageUrl: "/placeholder.png",
            },
            {
              id: "c3",
              titleKey: "templates.electronics.collections.work",
              descriptionKey: "templates.electronics.collections.workDesc",
              imageUrl: "/placeholder.png",
            },
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
            { id: "t1", quoteKey: "templates.electronics.testimonials.quote1", nameKey: "templates.electronics.testimonials.name1" },
            { id: "t2", quoteKey: "templates.electronics.testimonials.quote2", nameKey: "templates.electronics.testimonials.name2" },
          ],
        },
      },
      5
    ),
    node({ id: "newsletter", type: "NewsletterSignup", config: {} }, 6),
    node({ id: "info", type: "StoreInfo", config: {} }, 7),
    node({ id: "footer", type: "StoreFooter", config: {} }, 8),
  ],
}

export const generalTemplate: ThemeTemplate = {
  id: "general",
  name: "General",
  description: "Balanced layout suitable for most stores.",
  settings: {
    ...defaultSettings,
    palette: {
      ...defaultSettings.palette,
      primary: "#111827",
      accent: "#10B981",
    },
  },
  nodes: [
    node({ id: "header", type: "StoreHeader", config: { showSearch: true } }, 1),
    node({ id: "hero", type: "HeroBanner", config: { titleKey: "templates.general.heroTitle" } }, 2),
    node(
      {
        id: "grid",
        type: "ProductGrid",
        config: {
          titleKey: "templates.general.gridTitle",
          products: [
            { id: "g1", nameKey: "templates.general.products.item1", price: 89, imageUrl: "/placeholder.png" },
            { id: "g2", nameKey: "templates.general.products.item2", price: 129, imageUrl: "/placeholder.png" },
            { id: "g3", nameKey: "templates.general.products.item3", price: 159, imageUrl: "/placeholder.png" },
            { id: "g4", nameKey: "templates.general.products.item4", price: 119, imageUrl: "/placeholder.png" },
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
            {
              id: "c1",
              titleKey: "templates.general.collections.curated",
              descriptionKey: "templates.general.collections.curatedDesc",
              imageUrl: "/placeholder.png",
            },
            {
              id: "c2",
              titleKey: "templates.general.collections.bestsellers",
              descriptionKey: "templates.general.collections.bestsellersDesc",
              imageUrl: "/placeholder.png",
            },
          ],
        },
      },
      4
    ),
    node({ id: "testimonials", type: "Testimonials", config: { items: [
      { id: "t1", quoteKey: "templates.general.testimonials.quote1", nameKey: "templates.general.testimonials.name1" },
      { id: "t2", quoteKey: "templates.general.testimonials.quote2", nameKey: "templates.general.testimonials.name2" },
    ] } }, 5),
    node({ id: "newsletter", type: "NewsletterSignup", config: {} }, 6),
    node({ id: "info", type: "StoreInfo", config: {} }, 7),
    node({ id: "footer", type: "StoreFooter", config: {} }, 8),
  ],
}

export const themeTemplates: ThemeTemplate[] = [
  fashionTemplate,
  electronicsTemplate,
  generalTemplate,
]

export function getTemplateById(id: string) {
  return themeTemplates.find((template) => template.id === id)
}
