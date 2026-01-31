import { describe, it, expect, jest, beforeEach } from "@jest/globals"

describe("notification actions", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns unauthorized when marking single notification without context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))
    jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }))

    const { markNotificationAsRead } = await import("@/lib/actions/notifications")

    const result = await markNotificationAsRead("notif-1")

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it("returns unauthorized when marking all notifications without context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))
    jest.doMock("next/cache", () => ({ revalidatePath: jest.fn() }))

    const { markAllNotificationsAsRead } = await import("@/lib/actions/notifications")

    const result = await markAllNotificationsAsRead()

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })
})
