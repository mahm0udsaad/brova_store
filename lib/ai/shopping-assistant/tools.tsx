// APUS Layer - AI Shopping Assistant Tools
// Owner: APUS (Claude Opus - AI & Integrations Engineer)

import { tool } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import type { ProductCardData, CartConfirmationData, ComparisonTableData } from "@/types/ai"

// ============================================================================
// Tool: Show Products
// ============================================================================

export const showProductsTool = tool({
  description: "Search and display products from the store",
  inputSchema: z.object({
    query: z.string().optional().describe("Search query in Arabic or English"),
    categoryId: z.string().optional().describe("Category ID to filter by"),
    limit: z.number().min(1).max(20).default(6).describe("Number of products to show"),
    sortBy: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    storeId: z.string().describe("Store ID"),
  }),
  execute: async ({ query, categoryId, limit, sortBy, priceMin, priceMax, storeId }) => {
    const supabase = await createClient()

    let queryBuilder = supabase
      .from("store_products")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "active")

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,name_ar.ilike.%${query}%,description_ar.ilike.%${query}%`)
    }

    if (categoryId) {
      queryBuilder = queryBuilder.eq("category_id", categoryId)
    }

    if (priceMin !== undefined) {
      queryBuilder = queryBuilder.gte("price", priceMin)
    }

    if (priceMax !== undefined) {
      queryBuilder = queryBuilder.lte("price", priceMax)
    }

    switch (sortBy) {
      case "price_asc":
        queryBuilder = queryBuilder.order("price", { ascending: true })
        break
      case "price_desc":
        queryBuilder = queryBuilder.order("price", { ascending: false })
        break
      case "newest":
        queryBuilder = queryBuilder.order("created_at", { ascending: false })
        break
      default:
        queryBuilder = queryBuilder.order("created_at", { ascending: false })
    }

    queryBuilder = queryBuilder.limit(limit)

    const { data: products, error } = await queryBuilder

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    const productCards: ProductCardData[] = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.name_ar,
      price: Number(p.price),
      currency: p.currency || "EGP",
      image: p.image_url || "",
      images: p.images || [],
      inStock: (p.stock_quantity || 0) > 0,
      sizes: p.sizes || [],
      colors: p.colors || [],
      category: p.category || "",
      description: p.description,
      descriptionAr: p.description_ar,
    }))

    return { products: productCards, count: productCards.length }
  },
})

// ============================================================================
// Tool: Add to Cart
// ============================================================================

export const addToCartTool = tool({
  description: "Add a product to the shopping cart",
  inputSchema: z.object({
    productId: z.string().describe("Product ID to add"),
    quantity: z.number().min(1).default(1).describe("Quantity to add"),
    variantId: z.string().optional().describe("Variant ID if applicable"),
    size: z.string().optional().describe("Size selection"),
    color: z.string().optional().describe("Color selection"),
    storeId: z.string().describe("Store ID"),
    sessionId: z.string().describe("Session ID"),
  }),
  execute: async ({ productId, quantity, variantId, size, color, storeId, sessionId }) => {
    const supabase = await createClient()

    const { data: product, error: productError } = await supabase
      .from("store_products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      throw new Error("Product not found")
    }

    if ((product.stock_quantity || 0) < quantity) {
      throw new Error("Insufficient stock")
    }

    const { data: cartId } = await supabase.rpc("get_or_create_cart", {
      p_store_id: storeId,
      p_session_id: sessionId,
    })

    if (!cartId) {
      throw new Error("Failed to create cart")
    }

    const unitPrice = Number(product.price)
    const totalPrice = unitPrice * quantity

    const { error: addError } = await supabase
      .from("cart_items")
      .upsert({
        cart_id: cartId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        variant_id: variantId,
        size,
        color,
        product_snapshot: {
          name: product.name,
          name_ar: product.name_ar,
          image_url: product.image_url,
          price: product.price,
        },
      })

    if (addError) {
      throw new Error(`Failed to add to cart: ${addError.message}`)
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("*, cart_items(count)")
      .eq("id", cartId)
      .single()

    const response: CartConfirmationData = {
      success: true,
      message: "Product added to cart successfully",
      messageAr: "تمت إضافة المنتج إلى السلة بنجاح",
      cartItemCount: cart?.cart_items?.[0]?.count || 0,
      cartTotal: Number(cart?.total || 0),
      addedProduct: {
        id: product.id,
        name: product.name,
        nameAr: product.name_ar,
        price: unitPrice,
        currency: product.currency || "EGP",
        image: product.image_url || "",
        inStock: true,
        category: product.category || "",
      },
    }

    return response
  },
})

// ============================================================================
// Tool: Compare Products
// ============================================================================

export const compareProductsTool = tool({
  description: "Compare multiple products side by side",
  inputSchema: z.object({
    productIds: z.array(z.string()).min(2).max(4).describe("Product IDs to compare"),
    storeId: z.string().describe("Store ID"),
  }),
  execute: async ({ productIds, storeId }) => {
    const supabase = await createClient()

    const { data: products, error } = await supabase
      .from("store_products")
      .select("*")
      .eq("store_id", storeId)
      .in("id", productIds)

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    if (!products || products.length < 2) {
      throw new Error("Need at least 2 products to compare")
    }

    const productCards: ProductCardData[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.name_ar,
      price: Number(p.price),
      currency: p.currency || "EGP",
      image: p.image_url || "",
      inStock: (p.stock_quantity || 0) > 0,
      category: p.category || "",
      description: p.description,
    }))

    const attributes = [
      {
        name: "Price",
        nameAr: "السعر",
        values: products.reduce((acc, p) => {
          acc[p.id] = `${p.price} ${p.currency || "EGP"}`
          return acc
        }, {} as Record<string, string>),
      },
      {
        name: "Stock",
        nameAr: "المخزون",
        values: products.reduce((acc, p) => {
          acc[p.id] = (p.stock_quantity || 0) > 0 ? "In Stock" : "Out of Stock"
          return acc
        }, {} as Record<string, string>),
      },
      {
        name: "Category",
        nameAr: "الفئة",
        values: products.reduce((acc, p) => {
          acc[p.id] = p.category || "N/A"
          return acc
        }, {} as Record<string, string>),
      },
    ]

    const response: ComparisonTableData = {
      products: productCards,
      attributes,
    }

    return response
  },
})

// ============================================================================
// Tool: Show Categories
// ============================================================================

export const showCategoriesTool = tool({
  description: "Show available product categories",
  inputSchema: z.object({
    storeId: z.string().describe("Store ID"),
  }),
  execute: async ({ storeId }) => {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("store_categories")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order")

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }

    return { categories: categories || [] }
  },
})

// ============================================================================
// Export all tools
// ============================================================================

export const shoppingAssistantTools = {
  showProducts: showProductsTool,
  addToCart: addToCartTool,
  compareProducts: compareProductsTool,
  showCategories: showCategoriesTool,
}
