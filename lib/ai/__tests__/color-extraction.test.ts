import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockGenerateObject = jest.fn()

jest.mock("ai", () => ({
  generateObject: (...args: any[]) => mockGenerateObject(...args),
}))

describe("color extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns success with structured data", async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        dominant_colors: ["#ffffff"],
        suggested_palettes: [],
      },
    })

    const { extractColorsFromLogo } = await import("@/lib/ai/color-extraction")

    const result = await extractColorsFromLogo("https://example.com/logo.png")

    expect(result.success).toBe(true)
    expect(result.data?.dominant_colors).toEqual(["#ffffff"])
  })

  it("returns failure when generation throws", async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error("boom"))

    const { extractColorsFromLogo } = await import("@/lib/ai/color-extraction")

    const result = await extractColorsFromLogo("https://example.com/logo.png")

    expect(result.success).toBe(false)
    expect(result.error).toBe("boom")
  })
})
