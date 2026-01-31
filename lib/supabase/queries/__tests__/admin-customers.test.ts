import { describe, it, expect, jest, beforeEach } from "@jest/globals"

describe("admin-customers queries", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns empty list when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getCustomers } = await import("@/lib/supabase/queries/admin-customers")

    const result = await getCustomers()

    expect(result.total).toBe(0)
    expect(result.customers).toHaveLength(0)
  })

  it("returns zero stats when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getCustomerStats } = await import("@/lib/supabase/queries/admin-customers")

    const result = await getCustomerStats()

    expect(result).toEqual({ total: 0, newThisMonth: 0 })
  })
})
