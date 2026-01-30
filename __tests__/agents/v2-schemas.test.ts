import { describe, it, expect } from "@jest/globals"
import {
  ImageGroupSchema,
  ProductDraftSchema,
  UIQuestionSchema,
  UIDraftCardSchema,
  UIConfirmationSchema,
  AgentContextSchema,
} from "@/lib/agents/v2/schemas"

describe("V2 Schemas", () => {
  describe("ImageGroupSchema", () => {
    it("should accept valid group", () => {
      const result = ImageGroupSchema.safeParse({
        id: "g1",
        name: "Black Tee",
        image_urls: ["https://example.com/1.jpg"],
        primary_image_url: "https://example.com/1.jpg",
        category_hint: "t-shirts",
      })
      expect(result.success).toBe(true)
    })

    it("should accept without optional fields", () => {
      const result = ImageGroupSchema.safeParse({
        id: "g1",
        name: "Product",
        image_urls: ["url"],
        primary_image_url: "url",
      })
      expect(result.success).toBe(true)
    })

    it("should reject missing required fields", () => {
      const result = ImageGroupSchema.safeParse({ id: "g1" })
      expect(result.success).toBe(false)
    })
  })

  describe("ProductDraftSchema", () => {
    it("should accept valid draft", () => {
      const result = ProductDraftSchema.safeParse({
        name: "Test",
        image_urls: ["url"],
        primary_image_url: "url",
        ai_confidence: "high",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid ai_confidence", () => {
      const result = ProductDraftSchema.safeParse({
        name: "Test",
        image_urls: ["url"],
        primary_image_url: "url",
        ai_confidence: "super_high",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("AgentContextSchema", () => {
    it("should accept valid context", () => {
      const result = AgentContextSchema.safeParse({
        merchant_id: "m1",
        store_id: "s1",
        locale: "en",
        store_type: "clothing",
      })
      expect(result.success).toBe(true)
    })

    it("should accept with optional batch_id", () => {
      const result = AgentContextSchema.safeParse({
        merchant_id: "m1",
        store_id: "s1",
        locale: "ar",
        store_type: "car_care",
        batch_id: "b1",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid locale", () => {
      const result = AgentContextSchema.safeParse({
        merchant_id: "m1",
        store_id: "s1",
        locale: "fr",
        store_type: "clothing",
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid store_type", () => {
      const result = AgentContextSchema.safeParse({
        merchant_id: "m1",
        store_id: "s1",
        locale: "en",
        store_type: "grocery",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("UIQuestionSchema", () => {
    it("should accept valid question", () => {
      const result = UIQuestionSchema.safeParse({
        question: "Choose one",
        options: [
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe("UIDraftCardSchema", () => {
    it("should accept valid draft card", () => {
      const result = UIDraftCardSchema.safeParse({
        draft_id: "d1",
        name: "Product",
        image_urls: ["url"],
        primary_image_url: "url",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("UIConfirmationSchema", () => {
    it("should accept valid confirmation", () => {
      const result = UIConfirmationSchema.safeParse({
        action: "approve",
        description: "Approve 3 products",
        draft_ids: ["d1", "d2", "d3"],
        total_products: 3,
      })
      expect(result.success).toBe(true)
    })
  })
})
