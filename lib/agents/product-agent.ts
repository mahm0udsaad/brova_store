import { generateWithRetry } from "@/lib/ai/gateway"
import { withRetry } from "@/lib/ai/execution-config"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { BaseAgent } from "./base-agent"
import type {
  AgentResult,
  ProductSearchParams,
  ProductCreateParams,
  ProductUpdateParams,
} from "./types"

export class ProductAgent extends BaseAgent {
  constructor(userId: string) {
    super(userId, "product")
  }

  /**
   * Execute a product-related action with retry logic
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    // Validate capability
    if (!this.hasCapability(action)) {
      return this.formatError(`Product agent does not support action: ${action}`, action)
    }

    try {
      switch (action) {
        case "search_products":
          return await withRetry(() => this.searchProducts(params as ProductSearchParams), "product")
        case "get_product":
          return await withRetry(() => this.getProduct(params.id), "product")
        case "create_product":
          return await withRetry(() => this.createProduct(params as ProductCreateParams), "product")
        case "update_product":
          return await withRetry(() => this.updateProduct(params as ProductUpdateParams), "product")
        case "delete_product":
          return await withRetry(() => this.deleteProduct(params.id), "product")
        case "generate_description":
          return await withRetry(() => this.generateDescription(params as { productName: string; category?: string; features?: string[]; style?: string }), "product")
        case "suggest_pricing":
          return await withRetry(() => this.suggestPricing(params as { productName: string; category?: string }), "product")
        case "update_inventory":
          return await withRetry(() => this.updateInventory(params as { productId: string; sizes: string[] }), "product")
        case "update_stock_quantity":
          return await withRetry(() => this.updateStockQuantity(params as { productId: string; quantity: number }), "product")
        case "bulk_update_stock_quantity":
          return await withRetry(() => this.bulkUpdateStockQuantity(params as { quantity: number; productIds?: string[] }), "product")
        default:
          return this.formatError(`Unknown action: ${action}`, action)
      }
    } catch (error) {
      return this.formatError(error as Error, action)
    }
  }

  /**
   * Search products
   */
  private async searchProducts(params: ProductSearchParams): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      let query = supabase
        .from("products")
        .select("id, name, price, category_id, image_url, description, published, sizes, created_at")

      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`)
      }

      if (params.category) {
        query = query.eq("category_id", params.category)
      }

      if (params.priceMin !== undefined) {
        query = query.gte("price", params.priceMin)
      }

      if (params.priceMax !== undefined) {
        query = query.lte("price", params.priceMax)
      }

      if (params.published !== undefined) {
        query = query.eq("published", params.published)
      }

      query = query.order("created_at", { ascending: false })
        .limit(params.limit || 20)

      const { data, error } = await query

      if (error) throw error

      // Extract image URLs for easy reference
      const productImages = data
        .map(p => p.image_url)
        .filter((url): url is string => url !== null && url !== undefined)

      return {
        success: true,
        message: `Found ${data.length} products`,
        data: { 
          products: data, 
          count: data.length,
          productImages, // Add array of image URLs for marketing/photography agents
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to search products",
        error: error.message,
      }
    }
  }

  /**
   * Get a single product
   */
  private async getProduct(id: string): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      return {
        success: true,
        message: "Product found",
        data: { product: data },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get product",
        error: error.message,
      }
    }
  }

  /**
   * Create a new product
   * Uses admin client to bypass RLS policies
   */
  private async createProduct(params: ProductCreateParams): Promise<AgentResult> {
    try {
      // Use admin client to bypass RLS for server-side product creation
      const supabase = createAdminClient()

      // Get user's store_id
      const { data: orgData, error: orgError } = await (supabase as any)
        .rpc('get_user_organization')
        .maybeSingle()

      if (orgError || !orgData?.store_id) {
        // Fallback: try to get first available store for this user
        const userSupabase = await createClient()
        const { data: { user } } = await userSupabase.auth.getUser()

        if (!user) {
          throw new Error("User not authenticated")
        }

        const { data: storeData } = await (supabase as any)
          .from('stores')
          .select('id')
          .eq('organization_id', (await (supabase as any)
            .from('organizations')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle())?.data?.id)
          .maybeSingle()

        if (!storeData?.id) {
          throw new Error("No store found for user. Please complete onboarding first.")
        }

        const storeId = storeData.id

        const slug = (params.name || "product")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .concat(`-${Date.now().toString(36)}`)

        // Insert into store_products table
        const { data, error } = await (supabase as any)
          .from("store_products")
          .insert({
            store_id: storeId,
            name: params.name,
            slug,
            description: params.description,
            price: params.price || 0,
            category: params.categoryId,
            image_url: params.images?.[0],
            images: params.images || [],
            stock_quantity: 0, // Default stock
            inventory: 0,
            status: params.published ? 'active' : 'draft',
            ai_generated: true,
            ai_confidence: 'high',
          })
          .select()
          .single()

        if (error) throw error

        return {
          success: true,
          message: `Product "${params.name}" created successfully`,
          data: { product: data, productId: data.id },
        }
      }

      const storeId = orgData.store_id
      const slug = (params.name || "product")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .concat(`-${Date.now().toString(36)}`)

      // Insert into store_products table
      const { data, error } = await (supabase as any)
        .from("store_products")
        .insert({
          store_id: storeId,
          name: params.name,
          slug,
          description: params.description,
          price: params.price || 0,
          category: params.categoryId,
          image_url: params.images?.[0],
          images: params.images || [],
          stock_quantity: 0, // Default stock
          inventory: 0,
          status: params.published ? 'active' : 'draft',
          ai_generated: true,
          ai_confidence: 'high',
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: `Product "${params.name}" created successfully`,
        data: { product: data, productId: data.id },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to create product",
        error: error.message,
      }
    }
  }

  /**
   * Update a product
   * Uses admin client to bypass RLS policies
   */
  private async updateProduct(params: ProductUpdateParams): Promise<AgentResult> {
    try {
      const productId = params.id || params.productId
      if (!productId) {
        return {
          success: false,
          message: "Failed to update product",
          error: "No product ID provided",
        }
      }

      // Use admin client to bypass RLS for server-side product updates
      const supabase = createAdminClient()

      const updates: Record<string, any> = {}
      if (params.name !== undefined) updates.name = params.name
      if (params.description !== undefined) updates.description = params.description
      if (params.price !== undefined) updates.price = params.price
      if (params.categoryId !== undefined) updates.category_id = params.categoryId
      if (params.images !== undefined) {
        updates.images = params.images
        updates.image_url = params.images[0]
      }
      if (params.sizes !== undefined) updates.sizes = params.sizes
      if (params.published !== undefined) updates.published = params.published

      const { data, error } = (await (supabase as any)
        .from("products")
        .update(updates)
        .eq("id", productId)
        .select()
        .maybeSingle()) as any

      if (error) throw error

      return {
        success: true,
        message: "Product updated successfully",
        data: { product: data },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update product",
        error: error.message,
      }
    }
  }

  /**
   * Delete a product
   * Uses admin client to bypass RLS policies
   */
  private async deleteProduct(id: string): Promise<AgentResult> {
    try {
      // Use admin client to bypass RLS for server-side product deletion
      const supabase = createAdminClient()

      // First get the product name for the response
      const { data: product } = (await supabase
        .from("products")
        .select("name")
        .eq("id", id)
        .single()) as any

      const { error } = (await supabase
        .from("products")
        .delete()
        .eq("id", id)) as any

      if (error) throw error

      return {
        success: true,
        message: `Product "${product?.name || id}" deleted successfully`,
        data: { deletedId: id },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to delete product",
        error: error.message,
      }
    }
  }

  /**
   * Generate product description using AI
   */
  private async generateDescription(params: {
    productName: string
    category?: string
    features?: string[]
    style?: string
  }): Promise<AgentResult> {
    try {
      const prompt = `Generate a compelling product description for a streetwear item:

Product: ${params.productName}
Category: ${params.category || "General"}
Features: ${params.features?.join(", ") || "Not specified"}
Style: ${params.style || "Modern streetwear"}

Requirements:
- Keep it concise (2-3 sentences)
- Highlight key features
- Appeal to streetwear enthusiasts
- Use casual but professional tone
- Don't use excessive adjectives

Just output the description text, nothing else.`

      const model = this.getModel()
      const result = await generateWithRetry({
        model,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 200,
      })

      return {
        success: true,
        message: "Description generated",
        data: { description: result.text.trim() },
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to generate description",
        error: error.message,
      }
    }
  }

  /**
   * Suggest pricing based on similar products
   */
  private async suggestPricing(params: {
    productName: string
    category?: string
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      // Get similar products for price comparison
      let query = supabase
        .from("products")
        .select("price")
        .not("price", "is", null)

      if (params.category) {
        query = query.eq("category_id", params.category)
      }

      const { data: products } = await query.limit(20)

      if (!products || products.length === 0) {
        return {
          success: true,
          message: "No comparable products found",
          data: { suggestion: null, note: "Consider market research for pricing" },
        }
      }

      const prices = products.map((p) => p.price).filter(Boolean) as number[]
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      return {
        success: true,
        message: "Pricing suggestion ready",
        data: {
          suggestion: Math.round(avgPrice),
          range: { min: minPrice, max: maxPrice },
          basedOn: prices.length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to suggest pricing",
        error: error.message,
      }
    }
  }

  /**
   * Update inventory (sizes availability)
   */
  private async updateInventory(params: {
    productId: string
    sizes: string[]
  }): Promise<AgentResult> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("products")
        .update({ sizes: params.sizes })
        .eq("id", params.productId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: "Inventory updated",
        data: { product: data },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update inventory",
        error: error.message,
      }
    }
  }

  /**
   * Update stock quantity for a product
   * Works with both legacy products and store_products
   */
  private async updateStockQuantity(params: {
    productId?: string
    id?: string
    quantity: number
  }): Promise<AgentResult> {
    try {
      const productId = params.productId || params.id
      if (!productId) {
        return {
          success: false,
          message: "Failed to update stock quantity",
          error: "No product ID provided",
        }
      }

      const supabase = createAdminClient()

      // First try to update store_products by UUID
      const { data: storeProduct } = await (supabase as any)
        .from("store_products")
        .update({
          stock_quantity: params.quantity,
          inventory: params.quantity,
        })
        .eq("id", productId)
        .select()
        .maybeSingle()

      if (storeProduct) {
        return {
          success: true,
          message: `Stock quantity updated to ${params.quantity}`,
          data: { product: storeProduct, quantity: params.quantity },
        }
      }

      // Try by legacy_product_id
      const { data: legacyMapping } = await (supabase as any)
        .from("store_products")
        .update({
          stock_quantity: params.quantity,
          inventory: params.quantity,
        })
        .eq("legacy_product_id", productId)
        .select()
        .maybeSingle()

      if (legacyMapping) {
        return {
          success: true,
          message: `Stock quantity updated to ${params.quantity}`,
          data: { product: legacyMapping, quantity: params.quantity },
        }
      }

      throw new Error(`Product with id ${productId} not found in store_products`)

    } catch (error: any) {
      return {
        success: false,
        message: "Failed to update stock quantity",
        error: error.message,
      }
    }
  }

  /**
   * Bulk update stock quantity for multiple products or all products
   * If productIds is not provided, updates all products in the store
   */
  private async bulkUpdateStockQuantity(params: {
    quantity: number
    productIds?: string[]
    filterByQuantity?: number
  }): Promise<AgentResult> {
    try {
      const supabase = createAdminClient()

      // Fetch all products with names for progress display
      let query = (supabase as any)
        .from("store_products")
        .select("id, name")

      if (params.productIds && params.productIds.length > 0) {
        query = query.in("id", params.productIds)
      }

      if (params.filterByQuantity !== undefined) {
        query = query.eq("stock_quantity", params.filterByQuantity)
      }

      const { data: products, error: fetchError } = await query
      if (fetchError) throw fetchError

      if (!products || products.length === 0) {
        return {
          success: false,
          message: "No products found to update",
          error: "No products exist in the store",
        }
      }

      const operationId = `bulk_stock_${Date.now()}`
      const completedItems: Array<{ id: string; name: string; status: "done" | "failed"; error?: string }> = []
      const total = products.length

      // Update products one by one with progress
      for (let i = 0; i < products.length; i++) {
        const product = products[i]

        // Emit "updating" progress
        if (this.onProgress) {
          this.onProgress({
            type: "bulk_progress",
            operationId,
            operationLabel: `Updating stock to ${params.quantity}`,
            current: i + 1,
            total,
            item: { id: product.id, name: product.name, status: "updating" },
            completedItems: [...completedItems],
          })
        }

        // Do the actual update
        const { error: updateError } = await (supabase as any)
          .from("store_products")
          .update({
            stock_quantity: params.quantity,
            inventory: params.quantity,
          })
          .eq("id", product.id)

        const itemResult = updateError
          ? { id: product.id, name: product.name, status: "failed" as const, error: updateError.message }
          : { id: product.id, name: product.name, status: "done" as const }

        completedItems.push(itemResult)

        // Emit "done" progress
        if (this.onProgress) {
          this.onProgress({
            type: "bulk_progress",
            operationId,
            operationLabel: `Updating stock to ${params.quantity}`,
            current: i + 1,
            total,
            item: { id: product.id, name: product.name, status: itemResult.status },
            completedItems: [...completedItems],
          })
        }
      }

      const succeeded = completedItems.filter((i) => i.status === "done").length
      const failed = completedItems.filter((i) => i.status === "failed").length

      return {
        success: failed === 0,
        message: `Updated stock quantity to ${params.quantity} for ${succeeded}/${total} product(s)${failed > 0 ? ` (${failed} failed)` : ""}`,
        data: {
          updatedCount: succeeded,
          failedCount: failed,
          quantity: params.quantity,
          completedItems,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to bulk update stock quantities",
        error: error.message,
      }
    }
  }
}
