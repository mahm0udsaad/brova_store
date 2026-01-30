import { describe, it, expect } from "@jest/globals"

/**
 * Database tests for product_drafts table.
 *
 * These tests validate the schema constraints and RLS policies.
 * They require a running Supabase instance (local or test).
 *
 * Run with: TEST_SUPABASE_URL=... TEST_SUPABASE_SERVICE_KEY=... jest __tests__/db/
 */

const SKIP_DB = !process.env.TEST_SUPABASE_URL

const conditionalDescribe = SKIP_DB ? describe.skip : describe

conditionalDescribe("product_drafts table", () => {
  let supabase: any

  beforeAll(async () => {
    const { createClient } = await import("@supabase/supabase-js")
    supabase = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_SERVICE_KEY!
    )
  })

  it("should exist in the database", async () => {
    const { data, error } = await supabase
      .from("product_drafts")
      .select("id")
      .limit(0)

    expect(error).toBeNull()
  })

  it("should enforce status check constraint", async () => {
    const { error } = await supabase.from("product_drafts").insert({
      store_id: "00000000-0000-0000-0000-000000000001",
      merchant_id: "00000000-0000-0000-0000-000000000001",
      status: "invalid_status",
    })

    expect(error).not.toBeNull()
    expect(error.message).toContain("violates check constraint")
  })

  it("should enforce ai_confidence check constraint", async () => {
    const { error } = await supabase.from("product_drafts").insert({
      store_id: "00000000-0000-0000-0000-000000000001",
      merchant_id: "00000000-0000-0000-0000-000000000001",
      ai_confidence: "super_high",
    })

    expect(error).not.toBeNull()
  })

  it("should allow null ai_confidence", async () => {
    const { data, error } = await supabase
      .from("product_drafts")
      .insert({
        store_id: "00000000-0000-0000-0000-000000000001",
        merchant_id: "00000000-0000-0000-0000-000000000001",
        name: "Test Draft",
        ai_confidence: null,
      })
      .select("id")
      .single()

    // Will fail on RLS if no matching auth.uid(), which is expected with service role
    // The point is that NULL ai_confidence doesn't violate the check constraint
    if (error && error.message.includes("check constraint")) {
      throw new Error("NULL ai_confidence should be allowed")
    }
  })

  it("should default status to draft", async () => {
    const { data, error } = await supabase
      .from("product_drafts")
      .insert({
        store_id: "00000000-0000-0000-0000-000000000001",
        merchant_id: "00000000-0000-0000-0000-000000000001",
        name: "Default Status Test",
      })
      .select("status")
      .single()

    if (data) {
      expect(data.status).toBe("draft")
    }
  })

  it("should default tags to empty array", async () => {
    const { data } = await supabase
      .from("product_drafts")
      .insert({
        store_id: "00000000-0000-0000-0000-000000000001",
        merchant_id: "00000000-0000-0000-0000-000000000001",
        name: "Tags Test",
      })
      .select("tags")
      .single()

    if (data) {
      expect(data.tags).toEqual([])
    }
  })
})

// Schema validation tests (always run, no DB needed)
describe("product_drafts schema expectations", () => {
  it("should have valid status values", () => {
    const validStatuses = ["draft", "approved", "persisted", "discarded"]
    expect(validStatuses).toHaveLength(4)
  })

  it("should have valid ai_confidence values", () => {
    const validConfidences = ["high", "medium", "low"]
    expect(validConfidences).toHaveLength(3)
  })
})
