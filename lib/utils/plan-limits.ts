"use server"

import { createClient } from "@/lib/supabase/server"
import { getPlanById } from "@/lib/stripe/client"
import { cache } from "react"

/**
 * Plan limits enforcement utilities
 * Following Vercel best practices: React.cache() for deduplication
 */

export interface PlanLimits {
  productLimit: number
  aiGenerationLimit: number
  transactionFee: number
  canCreateProducts: boolean
  canUseAI: boolean
  productsUsed: number
  aiGenerationsUsed: number
}

/**
 * Get plan limits for a store
 * Cached per request using React.cache()
 */
export const getPlanLimits = cache(async (storeId: string): Promise<PlanLimits | null> => {
  try {
    const supabase = await createClient()

    // Get store and organization
    const { data: store } = await supabase
      .from("stores")
      .select(`
        id,
        organization_id,
        organizations (
          id,
          subscription_plan,
          subscription_status
        )
      `)
      .eq("id", storeId)
      .single()

    if (!store) return null

    const subscriptionPlan = store.organizations?.subscription_plan
    const subscriptionStatus = store.organizations?.subscription_status

    // Default limits (free/no subscription)
    let limits = {
      productLimit: 10,
      aiGenerationLimit: 5,
      transactionFee: 2.0,
    }

    // Get limits from plan if subscribed
    if (subscriptionPlan && subscriptionStatus === 'active') {
      const plan = await getPlanById(subscriptionPlan)
      if (plan) {
        limits = {
          productLimit: plan.product_limit,
          aiGenerationLimit: plan.ai_generation_limit,
          transactionFee: plan.transaction_fee,
        }
      }
    }

    // Count current usage
    const { count: productsUsed } = await supabase
      .from("products")
      .select("*", { count: 'exact', head: true })
      .eq("store_id", storeId)

    // Count AI generations (if tracked)
    // This assumes you have an ai_generations table or similar
    const aiGenerationsUsed = 0 // TODO: Implement AI generation tracking

    return {
      productLimit: limits.productLimit,
      aiGenerationLimit: limits.aiGenerationLimit,
      transactionFee: limits.transactionFee,
      canCreateProducts: (productsUsed || 0) < limits.productLimit,
      canUseAI: aiGenerationsUsed < limits.aiGenerationLimit,
      productsUsed: productsUsed || 0,
      aiGenerationsUsed,
    }
  } catch (error) {
    console.error("Error getting plan limits:", error)
    return null
  }
})

/**
 * Check if store can create a product
 */
export async function canCreateProduct(storeId: string): Promise<boolean> {
  const limits = await getPlanLimits(storeId)
  return limits?.canCreateProducts ?? false
}

/**
 * Check if store can use AI generation
 */
export async function canUseAI(storeId: string): Promise<boolean> {
  const limits = await getPlanLimits(storeId)
  return limits?.canUseAI ?? false
}

/**
 * Get transaction fee percentage for a store
 */
export async function getTransactionFee(storeId: string): Promise<number> {
  const limits = await getPlanLimits(storeId)
  return limits?.transactionFee ?? 2.0
}

/**
 * Get remaining product slots
 */
export async function getRemainingProducts(storeId: string): Promise<number> {
  const limits = await getPlanLimits(storeId)
  if (!limits) return 0
  return Math.max(0, limits.productLimit - limits.productsUsed)
}

/**
 * Get remaining AI generation slots
 */
export async function getRemainingAIGenerations(storeId: string): Promise<number> {
  const limits = await getPlanLimits(storeId)
  if (!limits) return 0
  return Math.max(0, limits.aiGenerationLimit - limits.aiGenerationsUsed)
}

/**
 * Check if approaching product limit (>80%)
 */
export async function isApproachingProductLimit(storeId: string): Promise<boolean> {
  const limits = await getPlanLimits(storeId)
  if (!limits) return false
  const usagePercent = (limits.productsUsed / limits.productLimit) * 100
  return usagePercent >= 80
}

/**
 * Check if at product limit
 */
export async function isAtProductLimit(storeId: string): Promise<boolean> {
  const limits = await getPlanLimits(storeId)
  if (!limits) return true
  return limits.productsUsed >= limits.productLimit
}

/**
 * Get usage statistics
 */
export async function getUsageStats(storeId: string) {
  const limits = await getPlanLimits(storeId)
  if (!limits) return null

  return {
    products: {
      used: limits.productsUsed,
      limit: limits.productLimit,
      remaining: limits.productLimit - limits.productsUsed,
      percentage: (limits.productsUsed / limits.productLimit) * 100,
    },
    aiGenerations: {
      used: limits.aiGenerationsUsed,
      limit: limits.aiGenerationLimit,
      remaining: limits.aiGenerationLimit - limits.aiGenerationsUsed,
      percentage: (limits.aiGenerationsUsed / limits.aiGenerationLimit) * 100,
    },
    transactionFee: limits.transactionFee,
  }
}
