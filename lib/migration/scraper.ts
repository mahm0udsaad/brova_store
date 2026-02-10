/**
 * Store Migration - Web Scraping Module
 *
 * Detects e-commerce platform and extracts product data
 * Supports: Salla, Shopify, WooCommerce
 */

// ============================================================================
// Types
// ============================================================================

export type Platform = "salla" | "shopify" | "woocommerce" | "unknown"

export interface RawProduct {
  id?: string
  name: string
  description?: string
  price: number
  compareAtPrice?: number
  currency?: string
  sku?: string
  images: string[]
  category?: string
  attributes?: Record<string, string | string[]>
  variants?: ProductVariant[]
  inStock?: boolean
  url?: string
  [key: string]: any // Platform-specific fields
}

export interface ProductVariant {
  id?: string
  name: string
  price?: number
  sku?: string
  attributes: Record<string, string>
  inStock?: boolean
  image?: string
}

export interface RawCategory {
  id?: string
  name: string
  description?: string
  slug?: string
  parentId?: string
  image?: string
}

export interface StoreInfo {
  name: string
  description?: string
  logo?: string
  url: string
  platform: Platform
}

export interface ScrapedData {
  platform: Platform
  storeInfo: StoreInfo
  products: RawProduct[]
  categories: RawCategory[]
  totalProducts: number
  errors: string[]
}

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Detect e-commerce platform from store URL
 */
export async function detectPlatform(storeUrl: string): Promise<Platform> {
  try {
    const url = new URL(storeUrl)

    // Check URL patterns
    if (url.hostname.includes("salla.sa") || url.hostname.includes("salla.com")) {
      return "salla"
    }

    if (url.hostname.includes("myshopify.com")) {
      return "shopify"
    }

    // Fetch homepage to detect platform
    const response = await fetch(storeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    const html = await response.text()

    // Check for platform indicators
    if (html.includes("salla.sa") || html.includes('name="salla-store"')) {
      return "salla"
    }

    if (html.includes("Shopify.") || html.includes("cdn.shopify.com")) {
      return "shopify"
    }

    if (
      html.includes("woocommerce") ||
      html.includes("wp-content") ||
      html.includes("wc-") ||
      html.includes("/wp-json/wc/")
    ) {
      return "woocommerce"
    }

    return "unknown"
  } catch (error) {
    console.error("Platform detection failed:", error)
    return "unknown"
  }
}

/**
 * Normalize URL (ensure HTTPS and remove trailing slash)
 */
export function normalizeStoreUrl(url: string): string {
  let normalized = url.trim()

  // Add protocol if missing
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`
  }

  // Remove trailing slash
  if (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Validate store URL
 */
export function validateStoreUrl(url: string): {
  valid: boolean
  error?: string
} {
  try {
    const parsedUrl = new URL(url)

    // Must be HTTP or HTTPS
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" }
    }

    // Must have a hostname
    if (!parsedUrl.hostname) {
      return { valid: false, error: "Invalid hostname" }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

// ============================================================================
// Base Scraper Class
// ============================================================================

export abstract class BaseScraper {
  protected storeUrl: string
  protected platform: Platform

  constructor(storeUrl: string, platform: Platform) {
    this.storeUrl = normalizeStoreUrl(storeUrl)
    this.platform = platform
  }

  /**
   * Scrape all store data
   */
  abstract scrapeStore(): Promise<ScrapedData>

  /**
   * Scrape store information
   */
  abstract scrapeStoreInfo(): Promise<StoreInfo>

  /**
   * Scrape products
   */
  abstract scrapeProducts(options?: {
    limit?: number
    offset?: number
  }): Promise<RawProduct[]>

  /**
   * Scrape categories
   */
  abstract scrapeCategories(): Promise<RawCategory[]>

  /**
   * Get total product count
   */
  abstract getTotalProductCount(): Promise<number>

  /**
   * Fetch with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<Response> {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ...options.headers,
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, { ...options, headers })

        if (response.ok) {
          return response
        }

        // Don't retry on 4xx errors (except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Wait before retry (exponential backoff)
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      } catch (error) {
        if (i === retries - 1) {
          throw error
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }

    throw new Error(`Failed to fetch ${url} after ${retries} retries`)
  }

  /**
   * Extract domain from URL
   */
  protected getDomain(): string {
    try {
      const url = new URL(this.storeUrl)
      return url.hostname
    } catch {
      return ""
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create appropriate scraper based on platform
 */
export async function createScraper(storeUrl: string): Promise<BaseScraper> {
  const normalizedUrl = normalizeStoreUrl(storeUrl)
  const platform = await detectPlatform(normalizedUrl)

  switch (platform) {
    case "salla":
      const { SallaScraper } = await import("./scrapers/salla")
      return new SallaScraper(normalizedUrl, platform)

    case "shopify":
      const { ShopifyScraper } = await import("./scrapers/shopify")
      return new ShopifyScraper(normalizedUrl, platform)

    case "woocommerce":
      const { WooCommerceScraper } = await import("./scrapers/woocommerce")
      return new WooCommerceScraper(normalizedUrl, platform)

    default:
      throw new Error(
        `Unsupported platform: ${platform}. Supported platforms: Salla, Shopify, WooCommerce`
      )
  }
}
