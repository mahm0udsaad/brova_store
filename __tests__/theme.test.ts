/**
 * Theme Actions Tests
 *
 * Tests for theme config CRUD and banner management.
 */

const mockGetUser = jest.fn()

function makeQueryBuilder(singleResult: any = { data: null, error: null }) {
  const qb: any = {}
  const methods = ['select', 'eq', 'insert', 'update', 'delete', 'order', 'not', 'range']
  for (const m of methods) {
    qb[m] = jest.fn(() => qb)
  }
  qb.single = jest.fn(() => Promise.resolve(singleResult))
  return qb
}

let queryBuilderResults: any[] = []
let callIndex = 0

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => {
      const result = queryBuilderResults[callIndex] || { data: null, error: null }
      callIndex++
      return makeQueryBuilder(result)
    }),
  })),
}))

jest.mock('@/lib/supabase/queries/admin-store', () => ({
  getAdminStoreContext: jest.fn(),
}))

jest.mock('@/lib/themes', () => ({
  getThemeById: jest.fn(),
}))

import {
  getThemeConfig,
  updateThemeConfig,
  updateBranding,
  updateColors,
  updateHero,
  createBanner,
  deleteBanner,
  getBanners,
} from '@/lib/actions/theme'

import { getAdminStoreContext } from '@/lib/supabase/queries/admin-store'

const mockContext = {
  store: { id: 's1', slug: 'test', name: 'Test', type: 'clothing' as const, status: 'active' as const, theme_id: null, onboarding_completed: 'completed' },
  organization: { id: 'org1', slug: 'org-test' },
}

beforeEach(() => {
  jest.clearAllMocks()
  queryBuilderResults = []
  callIndex = 0
  ;(getAdminStoreContext as jest.Mock).mockResolvedValue(mockContext)
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
})

describe('getThemeConfig', () => {
  it('returns null when no store context', async () => {
    ;(getAdminStoreContext as jest.Mock).mockResolvedValue(null)
    const result = await getThemeConfig()
    expect(result).toBeNull()
  })

  it('returns theme config from store_settings', async () => {
    const config = { colors: { primary: '#ff0000' } }
    queryBuilderResults = [{ data: { theme_config: config }, error: null }]

    const result = await getThemeConfig()
    expect(result).toEqual(config)
  })
})

describe('updateThemeConfig', () => {
  it('returns error when no store context', async () => {
    ;(getAdminStoreContext as jest.Mock).mockResolvedValue(null)
    const result = await updateThemeConfig({ colors: { primary: '#000' } })
    expect(result.success).toBe(false)
  })

  it('merges updates into existing config', async () => {
    queryBuilderResults = [
      // get current config
      { data: { theme_config: { colors: { primary: '#000' } } }, error: null },
    ]
    // update returns via the chain (no .single())

    const result = await updateThemeConfig({ colors: { primary: '#ff0000' } })
    // The update goes through the chain mock which doesn't error
    expect(result.success).toBe(true)
  })
})

describe('updateBranding', () => {
  it('delegates to updateThemeConfig', async () => {
    queryBuilderResults = [{ data: { theme_config: {} }, error: null }]
    const result = await updateBranding({ logo_url: 'https://example.com/logo.png' })
    expect(result.success).toBe(true)
  })
})

describe('updateColors', () => {
  it('delegates to updateThemeConfig', async () => {
    queryBuilderResults = [{ data: { theme_config: {} }, error: null }]
    const result = await updateColors({ primary: '#3b82f6' })
    expect(result.success).toBe(true)
  })
})

describe('updateHero', () => {
  it('delegates to updateThemeConfig', async () => {
    queryBuilderResults = [{ data: { theme_config: {} }, error: null }]
    const result = await updateHero({ enabled: false })
    expect(result.success).toBe(true)
  })
})

describe('Banner CRUD', () => {
  it('createBanner returns error when no store context', async () => {
    ;(getAdminStoreContext as jest.Mock).mockResolvedValue(null)
    const result = await createBanner({ image_url: 'https://example.com/img.png' })
    expect(result.success).toBe(false)
  })

  it('deleteBanner returns error when no store context', async () => {
    ;(getAdminStoreContext as jest.Mock).mockResolvedValue(null)
    const result = await deleteBanner('b1')
    expect(result.success).toBe(false)
  })

  it('getBanners returns null when no store context', async () => {
    ;(getAdminStoreContext as jest.Mock).mockResolvedValue(null)
    const result = await getBanners()
    expect(result).toBeNull()
  })
})
