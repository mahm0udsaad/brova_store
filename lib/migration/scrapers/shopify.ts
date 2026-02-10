import type {
  Platform,
  RawCategory,
  RawProduct,
  ScrapedData,
  StoreInfo,
} from "../scraper"
import { BaseScraper } from "../scraper"

export class ShopifyScraper extends BaseScraper {
  constructor(storeUrl: string, platform: Platform) {
    super(storeUrl, platform)
  }

  async scrapeStore(): Promise<ScrapedData> {
    throw new Error("Shopify scraping is not implemented.")
  }

  async scrapeStoreInfo(): Promise<StoreInfo> {
    throw new Error("Shopify scraping is not implemented.")
  }

  async scrapeProducts(): Promise<RawProduct[]> {
    throw new Error("Shopify scraping is not implemented.")
  }

  async scrapeCategories(): Promise<RawCategory[]> {
    throw new Error("Shopify scraping is not implemented.")
  }

  async getTotalProductCount(): Promise<number> {
    throw new Error("Shopify scraping is not implemented.")
  }
}
