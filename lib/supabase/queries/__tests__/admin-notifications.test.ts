import { describe, it, expect, jest, beforeEach } from "@jest/globals"

describe("admin-notifications queries", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns empty notifications when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getNotifications } = await import("@/lib/supabase/queries/admin-notifications")

    const result = await getNotifications()

    expect(result.notifications).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it("returns 0 unread when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getUnreadCount } = await import("@/lib/supabase/queries/admin-notifications")

    const count = await getUnreadCount()

    expect(count).toBe(0)
  })
})
