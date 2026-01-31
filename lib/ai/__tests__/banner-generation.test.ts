import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockGenerateObject = jest.fn()

jest.mock("ai", () => ({
  generateObject: (...args: any[]) => mockGenerateObject(...args),
}))

describe("banner generation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns success with banner content", async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        title: "Shop Now",
        title_ar: "تسوق الآن",
        subtitle: "Great deals",
        subtitle_ar: "عروض رائعة",
        cta_text: "Shop",
        cta_text_ar: "تسوق",
        style_suggestion: "Modern minimal",
      },
    })

    const { generateBannerContent } = await import("@/lib/ai/banner-generation")

    const result = await generateBannerContent({
      store_name: "Test Store",
      store_type: "clothing",
    })

    expect(result.success).toBe(true)
    expect(result.data?.title).toBe("Shop Now")
  })

  it("returns failure when generation throws", async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error("nope"))

    const { generateBannerContent } = await import("@/lib/ai/banner-generation")

    const result = await generateBannerContent({
      store_name: "Test Store",
      store_type: "car_care",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("nope")
  })
})
