/**
 * Usage Limits Enforcement
 *
 * Prevents cost overruns by enforcing daily limits on AI operations.
 * Configured per merchant in store_settings.ai_preferences.
 */
import { createAdminClient } from "@/lib/supabase/admin"

export interface UsageLimits {
  text_tokens: number
  bulk_batches: number
  image_generation: number
  screenshot_analysis: number
}

export interface UsageStats {
  text_tokens_used: number
  bulk_batches_used: number
  image_generation_used: number
  screenshot_analysis_used: number
  date: string
}

/**
 * Default usage limits (from design document)
 */
const DEFAULT_LIMITS: UsageLimits = {
  text_tokens: 500_000,
  bulk_batches: 5,
  image_generation: 100,
  screenshot_analysis: 20,
}

/**
 * Get merchant's usage limits from store_settings
 */
export async function getUserLimits(merchantId: string): Promise<UsageLimits> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("store_settings")
      .select("ai_preferences")
      .eq("merchant_id", merchantId)
      .single()

    if (error || !data) {
      // Return defaults if no settings found
      return DEFAULT_LIMITS
    }

    const aiPrefs = (data.ai_preferences || {}) as Record<string, any>
    const dailyLimits = (aiPrefs.daily_limits || {}) as Record<string, any>

    return {
      text_tokens: dailyLimits.text_tokens || DEFAULT_LIMITS.text_tokens,
      bulk_batches: dailyLimits.bulk_batches || DEFAULT_LIMITS.bulk_batches,
      image_generation: dailyLimits.image_generation || DEFAULT_LIMITS.image_generation,
      screenshot_analysis: dailyLimits.screenshot_analysis || DEFAULT_LIMITS.screenshot_analysis,
    }
  } catch (err) {
    console.error("Failed to get user limits:", err)
    return DEFAULT_LIMITS
  }
}

/**
 * Get today's usage for a merchant
 */
export async function getTodayUsage(merchantId: string): Promise<UsageStats> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    const { data, error } = await admin
      .from("ai_usage")
      .select()
      .eq("merchant_id", merchantId)
      .eq("date", today)

    if (error) {
      console.error("Failed to get usage stats:", error)
      return {
        text_tokens_used: 0,
        bulk_batches_used: 0,
        image_generation_used: 0,
        screenshot_analysis_used: 0,
        date: today,
      }
    }

    // Aggregate usage by operation type
    const stats: UsageStats = {
      text_tokens_used: 0,
      bulk_batches_used: 0,
      image_generation_used: 0,
      screenshot_analysis_used: 0,
      date: today,
    }

    for (const row of data) {
      if (row.operation === "text_generation") {
        stats.text_tokens_used += row.tokens_used || 0
      } else if (row.operation === "bulk_batch") {
        stats.bulk_batches_used += row.count || 0
      } else if (row.operation === "image_generation") {
        stats.image_generation_used += row.count || 0
      } else if (row.operation === "screenshot_analysis") {
        stats.screenshot_analysis_used += row.count || 0
      }
    }

    return stats
  } catch (err) {
    console.error("Failed to get today's usage:", err)
    return {
      text_tokens_used: 0,
      bulk_batches_used: 0,
      image_generation_used: 0,
      screenshot_analysis_used: 0,
      date: new Date().toISOString().split("T")[0],
    }
  }
}

/**
 * Check if an operation is within limits
 */
export async function checkUsageLimit(params: {
  merchant_id: string
  operation: "text_generation" | "bulk_batch" | "image_generation" | "screenshot_analysis"
  estimated_tokens?: number
  estimated_count?: number
}): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  try {
    const limits = await getUserLimits(params.merchant_id)
    const usage = await getTodayUsage(params.merchant_id)

    switch (params.operation) {
      case "text_generation": {
        const tokensToUse = params.estimated_tokens || 0
        const remaining = limits.text_tokens - usage.text_tokens_used

        if (tokensToUse > remaining) {
          return {
            allowed: false,
            reason: `Daily token limit exceeded. Used ${usage.text_tokens_used}/${limits.text_tokens} tokens today.`,
            remaining: 0,
          }
        }

        return { allowed: true, remaining }
      }

      case "bulk_batch": {
        const remaining = limits.bulk_batches - usage.bulk_batches_used

        if (remaining <= 0) {
          return {
            allowed: false,
            reason: `Daily bulk batch limit exceeded. Used ${usage.bulk_batches_used}/${limits.bulk_batches} batches today.`,
            remaining: 0,
          }
        }

        return { allowed: true, remaining }
      }

      case "image_generation": {
        const imagesToGenerate = params.estimated_count || 1
        const remaining = limits.image_generation - usage.image_generation_used

        if (imagesToGenerate > remaining) {
          return {
            allowed: false,
            reason: `Daily image generation limit exceeded. Used ${usage.image_generation_used}/${limits.image_generation} images today.`,
            remaining: 0,
          }
        }

        return { allowed: true, remaining }
      }

      case "screenshot_analysis": {
        const remaining = limits.screenshot_analysis - usage.screenshot_analysis_used

        if (remaining <= 0) {
          return {
            allowed: false,
            reason: `Daily screenshot analysis limit exceeded. Used ${usage.screenshot_analysis_used}/${limits.screenshot_analysis} analyses today.`,
            remaining: 0,
          }
        }

        return { allowed: true, remaining }
      }

      default:
        return { allowed: true }
    }
  } catch (err) {
    console.error("Usage limit check error:", err)
    // Fail open - allow operation if check fails
    return { allowed: true }
  }
}

/**
 * Record usage for an operation
 */
export async function recordUsage(params: {
  merchant_id: string
  operation: "text_generation" | "bulk_batch" | "image_generation" | "screenshot_analysis"
  tokens_used?: number
  count?: number
  cost_estimate?: number
}): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().split("T")[0]

    // Check if entry exists for today
    const { data: existing } = await admin
      .from("ai_usage")
      .select("id, count, tokens_used, cost_estimate")
      .eq("merchant_id", params.merchant_id)
      .eq("operation", params.operation)
      .eq("date", today)
      .single()

    if (existing) {
      // Update existing entry
      const { error } = await admin
        .from("ai_usage")
        .update({
          count: (existing.count || 0) + (params.count || 1),
          tokens_used: (existing.tokens_used || 0) + (params.tokens_used || 0),
          cost_estimate: (existing.cost_estimate || 0) + (params.cost_estimate || 0),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Failed to update usage:", error)
        return false
      }
    } else {
      // Create new entry
      const { error } = await admin.from("ai_usage").insert({
        merchant_id: params.merchant_id,
        operation: params.operation,
        date: today,
        count: params.count || 1,
        tokens_used: params.tokens_used || 0,
        cost_estimate: params.cost_estimate || 0,
      })

      if (error) {
        console.error("Failed to record usage:", error)
        return false
      }
    }

    return true
  } catch (err) {
    console.error("Usage recording error:", err)
    return false
  }
}

/**
 * Get usage summary for display
 */
export async function getUsageSummary(merchantId: string): Promise<{
  limits: UsageLimits
  usage: UsageStats
  percentage: {
    text_tokens: number
    bulk_batches: number
    image_generation: number
    screenshot_analysis: number
  }
  warnings: string[]
}> {
  const limits = await getUserLimits(merchantId)
  const usage = await getTodayUsage(merchantId)

  const percentage = {
    text_tokens: Math.round((usage.text_tokens_used / limits.text_tokens) * 100),
    bulk_batches: Math.round((usage.bulk_batches_used / limits.bulk_batches) * 100),
    image_generation: Math.round((usage.image_generation_used / limits.image_generation) * 100),
    screenshot_analysis: Math.round((usage.screenshot_analysis_used / limits.screenshot_analysis) * 100),
  }

  const warnings: string[] = []
  if (percentage.text_tokens >= 80) warnings.push("Text token usage above 80%")
  if (percentage.bulk_batches >= 80) warnings.push("Bulk batch usage above 80%")
  if (percentage.image_generation >= 80) warnings.push("Image generation usage above 80%")
  if (percentage.screenshot_analysis >= 80) warnings.push("Screenshot analysis usage above 80%")

  return { limits, usage, percentage, warnings }
}
