import { describe, it, expect, jest, beforeEach } from "@jest/globals"

type QueryResult = { data: any; count?: number | null; error?: any }

const createThenableQuery = (result: QueryResult) => {
  const query: any = {
    eq: jest.fn(() => query),
    order: jest.fn(() => query),
    range: jest.fn(() => query),
  }
  query.then = (resolve: any) => Promise.resolve(result).then(resolve)
  query.catch = (reject: any) => Promise.resolve(result).catch(reject)
  return query
}

describe("admin-wallet queries", () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it("returns null wallet when no store context", async () => {
    const createClient = jest.fn(async () => ({ from: jest.fn() }))
    const getAdminStoreContext = jest.fn(async () => null)

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getStoreWallet } = await import("@/lib/supabase/queries/admin-wallet")

    const wallet = await getStoreWallet()

    expect(wallet).toBeNull()
    expect(createClient).toHaveBeenCalledTimes(1)
  })

  it("returns transactions and count", async () => {
    const result = { data: [{ id: "tx-1" }], count: 1, error: null }
    const query = createThenableQuery(result)
    const from = jest.fn(() => ({ select: jest.fn(() => query) }))
    const createClient = jest.fn(async () => ({ from }))
    const getAdminStoreContext = jest.fn(async () => ({ store: { id: "store-1" } }))

    jest.doMock("@/lib/supabase/server", () => ({ createClient }))
    jest.doMock("@/lib/supabase/queries/admin-store", () => ({ getAdminStoreContext }))

    const { getWalletTransactions } = await import("@/lib/supabase/queries/admin-wallet")

    const response = await getWalletTransactions({ limit: 10, offset: 0 })

    expect(response.total).toBe(1)
    expect(response.transactions).toHaveLength(1)
    expect(from).toHaveBeenCalledWith("wallet_transactions")
  })
})
