/**
 * Salla Store Scraper
 *
 * Scrapes product data from Salla stores (Arabic e-commerce platform)
 * Uses HTML parsing as Salla doesn't expose a public API
 */

import { load } from "cheerio"
import {
  BaseScraper,
  type ScrapedData,
  type RawProduct,
  type RawCategory,
  type StoreInfo,
  type Platform,
} from "../scraper"

export class SallaScraper extends BaseScraper {
  constructor(storeUrl: string, platform: Platform) {
    super(storeUrl, platform)
  }

  /**
   * Scrape complete store data
   */
  async scrapeStore(): Promise<ScrapedData> {
    const errors: string[] = []

    try {
      // Scrape in parallel
      const [storeInfo, categories, totalProducts] = await Promise.all([
        this.scrapeStoreInfo().catch((e) => {
          errors.push(`Store info error: ${e.message}`)
          return this.getDefaultStoreInfo()
        }),
        this.scrapeCategories().catch((e) => {
          errors.push(`Categories error: ${e.message}`)
          return []
        }),
        this.getTotalProductCount().catch((e) => {
          errors.push(`Product count error: ${e.message}`)
          return 0
        }),
      ])

      // Scrape products (limit to 500 for now)
      const products = await this.scrapeProducts({ limit: 500 }).catch((e) => {
        errors.push(`Products error: ${e.message}`)
        return []
      })

      return {
        platform: this.platform,
        storeInfo,
        products,
        categories,
        totalProducts,
        errors,
      }
    } catch (error: any) {
      errors.push(`Fatal error: ${error.message}`)
      return {
        platform: this.platform,
        storeInfo: this.getDefaultStoreInfo(),
        products: [],
        categories: [],
        totalProducts: 0,
        errors,
      }
    }
  }

  /**
   * Scrape store information
   */
  async scrapeStoreInfo(): Promise<StoreInfo> {
    const response = await this.fetchWithRetry(this.storeUrl)
    const html = await response.text()
    const $ = load(html)

    // Extract store name from various possible locations
    const storeName =
      $('meta[property="og:site_name"]').attr("content") ||
      $("title").text().split("|")[0].trim() ||
      $(".store-name").text().trim() ||
      this.getDomain()

    // Extract store description
    const storeDescription =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      ""

    // Extract store logo
    const storeLogo =
      $('meta[property="og:image"]').attr("content") ||
      $(".store-logo img").attr("src") ||
      $('link[rel="icon"]').attr("href") ||
      ""

    return {
      name: storeName,
      description: storeDescription,
      logo: storeLogo,
      url: this.storeUrl,
      platform: this.platform,
    }
  }

  /**
   * Scrape products from Salla store
   */
  async scrapeProducts(options?: {
    limit?: number
    offset?: number
  }): Promise<RawProduct[]> {
    const limit = options?.limit || 100
    const offset = options?.offset || 0
    const products: RawProduct[] = []
    const errors: string[] = []

    try {
      // Fetch products page
      const productsUrl = `${this.storeUrl}/products`
      const response = await this.fetchWithRetry(productsUrl)
      const html = await response.text()
      const $ = load(html)

      // Find product links
      const productLinks: string[] = []
      $('a[href*="/product/"], a[href*="/p/"]').each((_, el) => {
        const href = $(el).attr("href")
        if (href) {
          const fullUrl = href.startsWith("http")
            ? href
            : `${this.storeUrl}${href.startsWith("/") ? "" : "/"}${href}`
          if (!productLinks.includes(fullUrl)) {
            productLinks.push(fullUrl)
          }
        }
      })

      // Limit product links
      const linksToScrape = productLinks.slice(offset, offset + limit)

      // Scrape each product (with rate limiting)
      for (let i = 0; i < linksToScrape.length; i++) {
        try {
          const product = await this.scrapeProductPage(linksToScrape[i])
          if (product) {
            products.push(product)
          }

          // Rate limiting: wait 200ms between requests
          if (i < linksToScrape.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        } catch (error: any) {
          errors.push(`Product ${linksToScrape[i]}: ${error.message}`)
        }
      }

      return products
    } catch (error: any) {
      console.error("Failed to scrape Salla products:", error)
      return products
    }
  }

  /**
   * Scrape individual product page
   */
  private async scrapeProductPage(productUrl: string): Promise<RawProduct | null> {
    const response = await this.fetchWithRetry(productUrl)
    const html = await response.text()
    const $ = load(html)

    // Extract product data
    const name =
      $('meta[property="og:title"]').attr("content") ||
      $('h1[class*="product"]').first().text().trim() ||
      $(".product-name").text().trim() ||
      $("title").text().split("|")[0].trim()

    if (!name) {
      return null // Skip products without names
    }

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('.product-description').html() ||
      ""

    // Extract price (try multiple selectors)
    const priceText =
      $('[class*="price"]').first().text().trim() ||
      $('[data-price]').attr("data-price") ||
      ""

    const price = parseFloat(priceText.replace(/[^\d.]/g, "")) || 0

    // Extract images
    const images: string[] = []
    $('[class*="product-image"] img, [class*="gallery"] img, img[class*="product"]').each(
      (_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src")
        if (src && !images.includes(src)) {
          images.push(src.startsWith("http") ? src : `${this.storeUrl}${src}`)
        }
      }
    )

    // Add og:image if no images found
    if (images.length === 0) {
      const ogImage = $('meta[property="og:image"]').attr("content")
      if (ogImage) {
        images.push(ogImage)
      }
    }

    // Extract SKU
    const sku =
      $('[class*="sku"]').text().trim() ||
      $('[data-sku]').attr("data-sku") ||
      ""

    // Extract category
    const category =
      $('[class*="breadcrumb"] a').last().text().trim() ||
      $('[class*="category"]').first().text().trim() ||
      ""

    return {
      name,
      description,
      price,
      currency: "SAR",
      sku,
      images,
      category,
      inStock: true, // Assume in stock if listed
      url: productUrl,
    }
  }

  /**
   * Scrape categories
   */
  async scrapeCategories(): Promise<RawCategory[]> {
    const categories: RawCategory[] = []

    try {
      const response = await this.fetchWithRetry(this.storeUrl)
      const html = await response.text()
      const $ = load(html)

      // Find category links
      $('a[href*="/category/"], a[href*="/categories/"]').each((_, el) => {
        const $el = $(el)
        const name = $el.text().trim()
        const href = $el.attr("href")

        if (name && href) {
          const slug = href.split("/").filter(Boolean).pop() || ""
          const image = $el.find("img").attr("src") || ""

          categories.push({
            name,
            slug,
            image: image.startsWith("http") ? image : `${this.storeUrl}${image}`,
          })
        }
      })

      return categories
    } catch (error) {
      console.error("Failed to scrape Salla categories:", error)
      return []
    }
  }

  /**
   * Get total product count
   */
  async getTotalProductCount(): Promise<number> {
    try {
      const productsUrl = `${this.storeUrl}/products`
      const response = await this.fetchWithRetry(productsUrl)
      const html = await response.text()
      const $ = load(html)

      // Try to find product count in various locations
      const countText =
        $('[class*="product-count"]').text() ||
        $('[class*="results-count"]').text() ||
        ""

      const match = countText.match(/\d+/)
      if (match) {
        return parseInt(match[0], 10)
      }

      // Fallback: count product links on page
      const productLinks = $('a[href*="/product/"], a[href*="/p/"]').length
      return productLinks || 0
    } catch (error) {
      console.error("Failed to get Salla product count:", error)
      return 0
    }
  }

  /**
   * Get default store info
   */
  private getDefaultStoreInfo(): StoreInfo {
    return {
      name: this.getDomain(),
      description: "",
      logo: "",
      url: this.storeUrl,
      platform: this.platform,
    }
  }
}
