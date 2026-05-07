import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import {
  getPage,
  listCollections,
  listCollectionProducts,
  getCollection,
  getProduct,
  listProducts,
  authLogin,
  authRegister,
  authLogout,
  authRefresh,
  authRequestPasswordReset,
  authConfirmPasswordReset,
  authVerifyEmail,
  getAccount,
} from './api'
import type {
  ProductDetailResponse,
  CollectionDetailResponse,
} from './api'

const BASE = 'http://localhost:8080'

function mockFetch(body: unknown, status = 200) {
  const bodyStr = JSON.stringify(body)
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      'Content-Type': 'application/json',
      'Content-Length': String(bodyStr.length),
    }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(bodyStr),
  }
  return vi.fn().mockResolvedValue(response as unknown as Response)
}

// Helper to get the URL from the first fetch call (openapi-fetch passes a Request object)
function capturedUrl(): string {
  const arg = (fetch as Mock).mock.calls[0][0]
  return arg instanceof Request ? arg.url : String(arg)
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// ─── Public API functions (openapi-fetch) ─────────────────────────────────────

describe('getPage', () => {
  it('fetches the correct URL and returns the data field', async () => {
    const page = {
      id: '1',
      title: 'Home',
      handle: 'home',
      body: 'Hello',
      metaTitle: undefined,
      metaDescription: undefined,
      publishedAt: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', mockFetch({ data: page }))

    const result = await getPage('home')

    expect(capturedUrl()).toContain('/api/v1/pages/home')
    expect(result).toEqual(page)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not Found' }, 404))
    await expect(getPage('home')).rejects.toThrow()
  })
})

describe('listCollections', () => {
  it('fetches with page and size query params', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listCollections(0, 20)

    const url = new URL(capturedUrl())
    expect(url.pathname).toContain('/api/v1/collections')
    expect(url.searchParams.get('page')).toBe('0')
    expect(url.searchParams.get('size')).toBe('20')
  })
})

describe('listCollectionProducts', () => {
  it('fetches with handle, page and size', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 4, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listCollectionProducts('seeds-bulbs', 0, 4)

    const url = new URL(capturedUrl())
    expect(url.pathname).toContain('/api/v1/collections/seeds-bulbs/products')
    expect(url.searchParams.get('page')).toBe('0')
    expect(url.searchParams.get('size')).toBe('4')
  })
})

describe('getCollection', () => {
  it('fetches the correct URL and returns the data field', async () => {
    const collection: CollectionDetailResponse = {
      id: 'c1',
      title: 'Seeds & Bulbs',
      handle: 'seeds-bulbs',
      description: 'All your seed needs.',
      featuredImageUrl: 'https://cdn.example.com/seeds.jpg',
      metaTitle: undefined,
      metaDescription: undefined,
    }
    vi.stubGlobal('fetch', mockFetch({ data: collection }))

    const result = await getCollection('seeds-bulbs')

    expect(capturedUrl()).toContain('/api/v1/collections/seeds-bulbs')
    expect(result).toEqual(collection)
  })
})

describe('getProduct', () => {
  it('fetches the correct URL and returns the data field', async () => {
    const product: ProductDetailResponse = {
      id: 'p1',
      title: 'Heirloom Tomato Seeds',
      description: '<p>Rich flavor.</p>',
      handle: 'heirloom-tomato-seeds',
      vendor: 'Garden Co',
      productType: 'Seeds',
      variants: [],
      images: [],
      tags: ['organic'],
      reviewSummary: undefined,
      metaTitle: undefined,
      metaDescription: undefined,
    }
    vi.stubGlobal('fetch', mockFetch({ data: product }))

    const result = await getProduct('heirloom-tomato-seeds')

    expect(capturedUrl()).toContain('/api/v1/products/heirloom-tomato-seeds')
    expect(result).toEqual(product)
  })
})

describe('listProducts', () => {
  it('fetches /api/v1/products with no query string when no params provided', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({})

    expect(capturedUrl()).toContain('/api/v1/products')
  })

  it('maps q to titleContains in the query string', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ q: 'tomato' })

    const url = new URL(capturedUrl())
    expect(url.searchParams.get('titleContains')).toBe('tomato')
  })

  it('maps vendor and type to their respective query params', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ vendor: 'Garden Co', type: 'Seeds' })

    const url = new URL(capturedUrl())
    expect(url.searchParams.get('vendor')).toBe('Garden Co')
    expect(url.searchParams.get('productType')).toBe('Seeds')
  })

  it('includes page and size when provided', async () => {
    const response = {
      data: { content: [], meta: { page: 2, pageSize: 20, total: 100 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ page: 2, size: 20 })

    const url = new URL(capturedUrl())
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('size')).toBe('20')
  })
})

// ─── Auth functions (raw fetch — unchanged) ───────────────────────────────────

describe('authLogin', () => {
  it('POSTs credentials and returns tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { accessToken: 'acc', refreshToken: 'ref' } }))

    const result = await authLogin('a@b.com', 'pass')

    expect(capturedUrl()).toContain('/api/v1/auth/login')
    expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Unauthorized' }, 401))
    await expect(authLogin('a@b.com', 'wrong')).rejects.toBeDefined()
  })
})

describe('authRegister', () => {
  it('POSTs registration data and returns tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { accessToken: 'acc', refreshToken: 'ref' } }))

    const result = await authRegister('a@b.com', 'pass', 'Jane', 'Doe')

    expect(capturedUrl()).toContain('/api/v1/auth/register')
    expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
  })
})

describe('authLogout', () => {
  it('POSTs the refresh token', async () => {
    vi.stubGlobal('fetch', mockFetch(null))

    await authLogout('ref-token')

    expect(capturedUrl()).toContain('/api/v1/auth/logout')
  })
})

describe('authRefresh', () => {
  it('POSTs the refresh token and returns new tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { accessToken: 'new-acc', refreshToken: 'new-ref' } }))

    const result = await authRefresh('old-ref')

    expect(capturedUrl()).toContain('/api/v1/auth/refresh')
    expect(result).toEqual({ accessToken: 'new-acc', refreshToken: 'new-ref' })
  })
})

describe('authRequestPasswordReset', () => {
  it('POSTs email to request-password-reset', async () => {
    vi.stubGlobal('fetch', mockFetch(null))

    await authRequestPasswordReset('a@b.com')

    expect(capturedUrl()).toContain('/api/v1/auth/request-password-reset')
  })
})

describe('authConfirmPasswordReset', () => {
  it('POSTs new password to confirm-password-reset', async () => {
    vi.stubGlobal('fetch', mockFetch(null))

    await authConfirmPasswordReset('tok123', 'newpassword')

    expect(capturedUrl()).toContain('/api/v1/auth/confirm-password-reset/tok123')
  })
})

describe('authVerifyEmail', () => {
  it('GETs verify-email with token query param', async () => {
    vi.stubGlobal('fetch', mockFetch(null))

    await authVerifyEmail('verify-tok')

    expect(capturedUrl()).toContain('/api/v1/auth/verify-email')
    expect(capturedUrl()).toContain('token=verify-tok')
  })
})

describe('getAccount', () => {
  it('GETs /account with Authorization header and returns User', async () => {
    const account = {
      id: 'u1',
      email: 'a@b.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: null,
      status: 'ACTIVE',
    }
    vi.stubGlobal('fetch', mockFetch({ data: account }))

    const result = await getAccount('my-token')

    expect(capturedUrl()).toContain('/api/v1/account')
    expect(result.id).toBe('u1')
    expect(result.email).toBe('a@b.com')
  })
})
