import { describe, it, expect, jest, beforeEach } from "@jest/globals"

describe("banner actions", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns empty banners when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))
    jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }))

    const { getBanners } = await import("@/lib/actions/banners")

    const result = await getBanners()

    expect(result).toEqual([])
  })

  it("returns unauthorized when creating banner without context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))
    jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }))

    const { createBanner } = await import("@/lib/actions/banners")

    const result = await createBanner({ image_url: "https://example.com/banner.png" })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })
})
