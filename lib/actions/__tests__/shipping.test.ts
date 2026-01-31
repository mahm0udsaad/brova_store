import { describe, it, expect, jest, beforeEach } from "@jest/globals"

describe("shipping actions", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns default settings when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))
    jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }))

    const { getShippingSettings } = await import("@/lib/actions/shipping")

    const settings = await getShippingSettings()

    expect(settings).toEqual({
      flat_rate_enabled: true,
      flat_rate_amount: 5000,
      free_shipping_threshold: null,
      shipping_zones: ['EG'],
    })
  })

  it("returns unauthorized when no store context on update", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))
    jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }))

    const { updateShippingSettings } = await import("@/lib/actions/shipping")

    const result = await updateShippingSettings({
      flat_rate_enabled: true,
      flat_rate_amount: 5000,
      free_shipping_threshold: null,
      shipping_zones: ['EG'],
    })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })
})
