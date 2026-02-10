// Store Builder AI Agent - Tools
// Uses AI SDK v6 tool() with inputSchema pattern, matching the existing
// shopping assistant tools convention.

import { tool } from "ai"
import { z } from "zod"
import {
  addThemeComponent,
  removeThemeComponent,
  updateThemeComponent,
  reorderThemeComponents,
  updateColors,
  updateThemeConfig,
} from "@/lib/actions/theme"
import type { ComponentType } from "@/types/theme"

// =============================================================================
// Tool: Add Component
// =============================================================================

export const addComponentTool = tool({
  description:
    "Add a new theme component/section to the storefront. Available types: StoreHeader, HeroBanner, ProductGrid, ProductCarousel, CategoryBrowser, FeaturedCollections, Testimonials, NewsletterSignup, StoreInfo, StoreFooter, AIShoppingAssistant, ImageBanner, TextSection, VideoSection, CountdownTimer, TrustBadges, SocialFeed.",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    type: z
      .enum([
        "StoreHeader",
        "HeroBanner",
        "ProductGrid",
        "ProductCarousel",
        "CategoryBrowser",
        "FeaturedCollections",
        "Testimonials",
        "NewsletterSignup",
        "StoreInfo",
        "StoreFooter",
        "AIShoppingAssistant",
      ])
      .describe("Component type to add"),
    config: z
      .record(z.unknown())
      .default({})
      .describe("Component configuration object"),
    position: z
      .number()
      .optional()
      .describe("Position in the component list (0-based). Appended at end if omitted."),
  }),
  execute: async ({ storeId, type, config, position }) => {
    const result = await addThemeComponent(
      storeId,
      type as ComponentType,
      config,
      position
    )
    return result
  },
})

// =============================================================================
// Tool: Remove Component
// =============================================================================

export const removeComponentTool = tool({
  description: "Remove a component/section from the storefront by its ID.",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    componentId: z.string().describe("The ID of the component to remove"),
  }),
  execute: async ({ storeId, componentId }) => {
    const result = await removeThemeComponent(storeId, componentId)
    return result
  },
})

// =============================================================================
// Tool: Update Component
// =============================================================================

export const updateComponentTool = tool({
  description:
    "Update the configuration of an existing storefront component. Can change config values and visibility.",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    componentId: z.string().describe("The ID of the component to update"),
    config: z
      .record(z.unknown())
      .optional()
      .describe("New configuration values to merge into the component"),
    visible: z
      .boolean()
      .optional()
      .describe("Set component visibility (true = active, false = hidden)"),
  }),
  execute: async ({ storeId, componentId, config, visible }) => {
    const result = await updateThemeComponent(storeId, componentId, {
      config,
      visible,
    })
    return result
  },
})

// =============================================================================
// Tool: Reorder Components
// =============================================================================

export const reorderComponentsTool = tool({
  description:
    "Reorder storefront components by providing component IDs in the desired order.",
  inputSchema: z.object({
    storeId: z.string().describe("The store ID"),
    componentIds: z
      .array(z.string())
      .describe("Array of component IDs in the new desired order"),
  }),
  execute: async ({ storeId, componentIds }) => {
    const result = await reorderThemeComponents(storeId, componentIds)
    return result
  },
})

// =============================================================================
// Tool: Update Theme Colors
// =============================================================================

export const updateThemeColorsTool = tool({
  description:
    "Update the store's color palette. Provide hex color codes for any combination of: primary, secondary, accent, background, text.",
  inputSchema: z.object({
    primary: z
      .string()
      .optional()
      .describe("Primary brand color (hex, e.g. #1a1a2e)"),
    secondary: z
      .string()
      .optional()
      .describe("Secondary color (hex, e.g. #16213e)"),
    accent: z
      .string()
      .optional()
      .describe("Accent/highlight color (hex, e.g. #e94560)"),
    background: z
      .string()
      .optional()
      .describe("Background color (hex, e.g. #ffffff)"),
    text: z
      .string()
      .optional()
      .describe("Text color (hex, e.g. #1a1a1a)"),
  }),
  execute: async ({ primary, secondary, accent, background, text }) => {
    const colors: Record<string, string> = {}
    if (primary) colors.primary = primary
    if (secondary) colors.secondary = secondary
    if (accent) colors.accent = accent
    if (background) colors.background = background
    if (text) colors.text = text

    const result = await updateColors(colors)
    return result
  },
})

// =============================================================================
// Tool: Update Typography
// =============================================================================

export const updateTypographyTool = tool({
  description:
    "Update the store's typography/font settings. Provide font family names (Google Fonts or web-safe fonts).",
  inputSchema: z.object({
    headingFont: z
      .string()
      .optional()
      .describe("Font family for headings (e.g. 'Playfair Display', 'Cairo')"),
    bodyFont: z
      .string()
      .optional()
      .describe("Font family for body text (e.g. 'Inter', 'Tajawal')"),
    arabicFont: z
      .string()
      .optional()
      .describe("Font family for Arabic text (e.g. 'Cairo', 'Tajawal', 'Almarai')"),
    baseFontSize: z
      .number()
      .optional()
      .describe("Base font size in pixels (e.g. 16)"),
  }),
  execute: async ({ headingFont, bodyFont, arabicFont, baseFontSize }) => {
    const typography: Record<string, unknown> = {}
    if (headingFont) typography.headingFont = headingFont
    if (bodyFont) typography.bodyFont = bodyFont
    if (arabicFont) typography.arabicFont = arabicFont
    if (baseFontSize) typography.baseFontSize = baseFontSize

    const result = await updateThemeConfig({ typography })
    return result
  },
})

// =============================================================================
// Export all store builder tools
// =============================================================================

export const storeBuilderTools = {
  addComponent: addComponentTool,
  removeComponent: removeComponentTool,
  updateComponent: updateComponentTool,
  reorderComponents: reorderComponentsTool,
  updateThemeColors: updateThemeColorsTool,
  updateTypography: updateTypographyTool,
}
