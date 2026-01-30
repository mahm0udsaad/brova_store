/**
 * AI Platform Reader
 * ==================
 * Read-only access to platform data for AI agents.
 * 
 * STRATEGY: Service Role + Scoped Queries
 * - Uses service role for database access
 * - ALL queries MUST include organization scope
 * - NO write operations allowed
 * 
 * AI ACCESS CONTRACT:
 * - ai_store_summary: Store overview (required: organization_id)
 * - ai_products: Product catalog (required: organization_id or store_id)
 * - ai_orders: Order data (required: user_id, privacy-filtered)
 * - ai_catalog_stats: Catalog statistics (required: organization_id)
 * 
 * PROHIBITED ACTIONS:
 * - INSERT, UPDATE, DELETE, TRUNCATE
 * - Accessing phone numbers or addresses
 * - Cross-tenant reads without explicit scope
 */

import { createClient } from "@supabase/supabase-js"

// Service role client for AI access (bypasses RLS, but we scope manually)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

// =============================================================================
// Types
// =============================================================================

export interface AIStoreSummary {
  organization_id: string
  organization_slug: string
  organization_name: string
  organization_type: "legacy" | "standard"
  organization_created_at: string
  store_id: string
  store_name: string
  store_status: "draft" | "active" | "paused"
  store_created_at: string
  total_products: number
  active_products: number
  draft_products: number
  avg_product_price: number
  total_inventory: number
}

export interface AIProduct {
  organization_id: string
  organization_slug: string
  store_id: string
  store_name: string
  product_id: string
  legacy_product_id: string | null
  product_name: string
  price: number
  inventory: number
  status: "active" | "draft"
  category_id: string | null
  gender: "men" | "women" | "unisex" | null
  sizes: string[] | null
  description: string | null
  created_at: string
  image_count: number
  primary_image_url: string | null
}

export interface AIOrder {
  order_id: string
  user_id: string
  order_status: string
  subtotal: number
  shipping_fee: number
  total: number
  order_date: string
  item_count: number
  customer_name: string
  days_since_order: number
}

export interface AICatalogStats {
  organization_id: string
  organization_slug: string
  store_id: string
  store_name: string
  category_id: string | null
  product_count: number
  active_count: number
  avg_price: number
  min_price: number
  max_price: number
  total_inventory: number
}

// =============================================================================
// AI Read Functions (Read-Only)
// =============================================================================

/**
 * Get store summary for an organization
 * REQUIRED: organizationId OR organizationSlug
 */
export async function getAIStoreSummary(params: {
  organizationId?: string
  organizationSlug?: string
}): Promise<{ data: AIStoreSummary[] | null; error: Error | null }> {
  if (!params.organizationId && !params.organizationSlug) {
    return { 
      data: null, 
      error: new Error("AI Access Error: organization_id or organization_slug is REQUIRED") 
    }
  }

  const admin = getAdminClient()
  let query = admin.from("ai_store_summary").select("*")

  if (params.organizationId) {
    query = query.eq("organization_id", params.organizationId)
  } else if (params.organizationSlug) {
    query = query.eq("organization_slug", params.organizationSlug)
  }

  const { data, error } = await query

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as AIStoreSummary[], error: null }
}

/**
 * Get products for an organization or store
 * REQUIRED: organizationId OR organizationSlug OR storeId
 */
export async function getAIProducts(params: {
  organizationId?: string
  organizationSlug?: string
  storeId?: string
  status?: "active" | "draft"
  limit?: number
  offset?: number
}): Promise<{ data: AIProduct[] | null; error: Error | null; count: number }> {
  if (!params.organizationId && !params.organizationSlug && !params.storeId) {
    return { 
      data: null, 
      error: new Error("AI Access Error: organization_id, organization_slug, or store_id is REQUIRED"),
      count: 0
    }
  }

  const admin = getAdminClient()
  let query = admin
    .from("ai_products")
    .select("*", { count: "exact" })

  if (params.organizationId) {
    query = query.eq("organization_id", params.organizationId)
  } else if (params.organizationSlug) {
    query = query.eq("organization_slug", params.organizationSlug)
  } else if (params.storeId) {
    query = query.eq("store_id", params.storeId)
  }

  if (params.status) {
    query = query.eq("status", params.status)
  }

  if (params.limit) {
    const offset = params.offset ?? 0
    query = query.range(offset, offset + params.limit - 1)
  }

  const { data, error, count } = await query

  if (error) return { data: null, error: new Error(error.message), count: 0 }
  return { data: data as AIProduct[], error: null, count: count ?? 0 }
}

/**
 * Get catalog statistics for an organization
 * REQUIRED: organizationId OR organizationSlug
 */
export async function getAICatalogStats(params: {
  organizationId?: string
  organizationSlug?: string
}): Promise<{ data: AICatalogStats[] | null; error: Error | null }> {
  if (!params.organizationId && !params.organizationSlug) {
    return { 
      data: null, 
      error: new Error("AI Access Error: organization_id or organization_slug is REQUIRED") 
    }
  }

  const admin = getAdminClient()
  let query = admin.from("ai_catalog_stats").select("*")

  if (params.organizationId) {
    query = query.eq("organization_id", params.organizationId)
  } else if (params.organizationSlug) {
    query = query.eq("organization_slug", params.organizationSlug)
  }

  const { data, error } = await query

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as AICatalogStats[], error: null }
}

/**
 * Get orders (privacy-filtered)
 * REQUIRED: userId (for privacy)
 * Note: Phone and address are NOT exposed
 */
export async function getAIOrders(params: {
  userId: string
  status?: string
  limit?: number
}): Promise<{ data: AIOrder[] | null; error: Error | null }> {
  if (!params.userId) {
    return { 
      data: null, 
      error: new Error("AI Access Error: user_id is REQUIRED for order access") 
    }
  }

  const admin = getAdminClient()
  let query = admin
    .from("ai_orders")
    .select("*")
    .eq("user_id", params.userId)
    .order("order_date", { ascending: false })

  if (params.status) {
    query = query.eq("order_status", params.status)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as AIOrder[], error: null }
}

// =============================================================================
// AI Manager Helpers
// =============================================================================

/**
 * Get complete store context for AI Manager
 * Returns everything an AI needs to understand a store's state
 */
export async function getAIStoreContext(organizationSlug: string): Promise<{
  summary: AIStoreSummary | null
  products: AIProduct[]
  catalogStats: AICatalogStats[]
  error: Error | null
}> {
  const [summaryResult, productsResult, statsResult] = await Promise.all([
    getAIStoreSummary({ organizationSlug }),
    getAIProducts({ organizationSlug, status: "active", limit: 100 }),
    getAICatalogStats({ organizationSlug })
  ])

  if (summaryResult.error) {
    return { summary: null, products: [], catalogStats: [], error: summaryResult.error }
  }

  return {
    summary: summaryResult.data?.[0] ?? null,
    products: productsResult.data ?? [],
    catalogStats: statsResult.data ?? [],
    error: null
  }
}

// =============================================================================
// Contract Documentation
// =============================================================================

export const AI_ACCESS_CONTRACT = {
  views: {
    ai_store_summary: {
      required_filters: ["organization_id"],
      guaranteed_fields: ["organization_id", "store_id", "store_name", "total_products", "active_products"],
      prohibited_actions: ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]
    },
    ai_products: {
      required_filters: ["organization_id", "store_id"],
      guaranteed_fields: ["product_id", "product_name", "price", "status", "category_id"],
      prohibited_actions: ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]
    },
    ai_orders: {
      required_filters: ["user_id"],
      guaranteed_fields: ["order_id", "order_status", "total", "item_count"],
      prohibited_actions: ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "EXPOSE phone", "EXPOSE address"]
    },
    ai_catalog_stats: {
      required_filters: ["organization_id"],
      guaranteed_fields: ["organization_id", "store_id", "category_id", "product_count", "avg_price"],
      prohibited_actions: ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]
    }
  },
  
  /**
   * EXPLICIT NON-GOALS (What AI Must NEVER Do)
   */
  prohibited: [
    "Modify any data (INSERT, UPDATE, DELETE)",
    "Change order states",
    "Access wallet balances",
    "Bypass tenant isolation",
    "Access phone numbers or addresses",
    "Read data without explicit organization scope",
    "Write to any table"
  ]
} as const
