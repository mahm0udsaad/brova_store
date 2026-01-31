import { describe, it, expect, jest, beforeEach } from "@jest/globals"

describe("admin-dashboard stats", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns empty stats when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getDashboardStats } = await import("@/lib/supabase/queries/admin-dashboard")

    const stats = await getDashboardStats()

    expect(stats).toEqual({
      orders: { total: 0, pending: 0, completed: 0, today: 0, thisWeek: 0, thisMonth: 0 },
      products: { total: 0, active: 0, draft: 0, lowStock: 0 },
      customers: { total: 0, newThisMonth: 0 },
      revenue: { total: 0, thisMonth: 0, thisWeek: 0, today: 0 },
      wallet: { available: 0, pending: 0 },
    })
  })
})
