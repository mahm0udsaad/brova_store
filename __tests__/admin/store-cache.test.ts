import { describe, it, expect, jest, beforeEach } from "@jest/globals"

type MockClient = {
  from: jest.Mock
}

const mockReactCache = () => {
  return {
    cache: <T extends (...args: any[]) => any>(fn: T) => {
      const memo = new Map<string, ReturnType<T>>()
      return (...args: Parameters<T>) => {
        const key = JSON.stringify(args)
        if (memo.has(key)) return memo.get(key) as ReturnType<T>
        const result = fn(...args)
        memo.set(key, result)
        return result
      }
    },
  }
}

const buildMockClient = (): MockClient => {
  const mockOrderSecond = jest.fn(() => ({ data: [], error: null }))
  const mockOrderFirst = jest.fn(() => ({ order: mockOrderSecond }))
  const mockEq = jest.fn(() => ({ order: mockOrderFirst }))
  const mockSelect = jest.fn(() => ({ eq: mockEq }))
  const mockFrom = jest.fn(() => ({ select: mockSelect }))
  return { from: mockFrom }
}

describe("admin category cache keying", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("keys listStoreCategories by store id", async () => {
    const mockClient = buildMockClient()
    const createClient = jest.fn(async () => mockClient)

    jest.doMock("react", mockReactCache)
    jest.doMock("@/lib/supabase/server", () => ({ createClient }))

    const { listStoreCategories } = await import("@/lib/supabase/queries/admin-categories")

    await listStoreCategories("store-1")
    await listStoreCategories("store-1")
    await listStoreCategories("store-2")

    expect(createClient).toHaveBeenCalledTimes(2)
    expect(mockClient.from).toHaveBeenCalledTimes(2)
  })
})
