import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  createAuthFetch,
} from './api'
import type {
  ProductDetailResponse,
  ProductSummaryResponse,
  CollectionDetailResponse,
} from './api'

const BASE = 'http://localhost:8080'

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getPage', () => {
  it('fetches the correct URL and returns the data field', async () => {
    const page = {
      id: '1',
      title: 'Home',
      handle: 'home',
      body: 'Hello',
      metaTitle: null,
      metaDescription: null,
      publishedAt: '2026-01-01T00:00:00Z',
    }
    vi.stubGlobal('fetch', mockFetch({ data: page }))

    const result = await getPage('home')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/pages/home`)
    expect(result).toEqual(page)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not Found' }, 404))
    await expect(getPage('home')).rejects.toThrow('HTTP 404')
  })
})

describe('listCollections', () => {
  it('fetches with page and size query params', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listCollections(0, 20)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/collections?page=0&size=20`,
    )
  })

  it('returns the paged result', async () => {
    const collection = { id: 'abc', title: 'Seeds', handle: 'seeds-bulbs' }
    const response = {
      data: {
        content: [collection],
        meta: { page: 0, pageSize: 20, total: 1 },
      },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    const result = await listCollections(0, 20)

    expect(result.content).toHaveLength(1)
    expect(result.content[0].handle).toBe('seeds-bulbs')
  })
})

describe('listCollectionProducts', () => {
  it('fetches the correct URL with handle and pagination', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 4, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listCollectionProducts('seeds-bulbs', 0, 4)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/collections/seeds-bulbs/products?page=0&size=4`,
    )
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
    }
    vi.stubGlobal('fetch', mockFetch({ data: collection }))

    const result = await getCollection('seeds-bulbs')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/collections/seeds-bulbs`)
    expect(result).toEqual(collection)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not Found' }, 404))
    await expect(getCollection('unknown')).rejects.toThrow('HTTP 404')
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
    }
    vi.stubGlobal('fetch', mockFetch({ data: product }))

    const result = await getProduct('heirloom-tomato-seeds')

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/products/heirloom-tomato-seeds`,
    )
    expect(result).toEqual(product)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not Found' }, 404))
    await expect(getProduct('unknown')).rejects.toThrow('HTTP 404')
  })
})

describe('listProducts', () => {
  const summary: ProductSummaryResponse = {
    id: 'p1',
    title: 'Heirloom Tomato Seeds',
    handle: 'heirloom-tomato-seeds',
    vendor: 'Garden Co',
    featuredImageUrl: 'https://cdn.example.com/img.jpg',
    priceMin: 9.99,
    priceMax: 19.99,
    compareAtPriceMin: 24.99,
    compareAtPriceMax: 24.99,
  }

  it('fetches /api/v1/products with no query string when no params provided', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({})

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products`)
  })

  it('maps q to titleContains in the query string', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ q: 'tomato' })

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/products?titleContains=tomato`,
    )
  })

  it('maps vendor and type to their respective query params', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ vendor: 'Garden Co', type: 'Seeds' })

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(url).toContain('vendor=Garden+Co')
    expect(url).toContain('productType=Seeds')
  })

  it('includes page and size when provided', async () => {
    const response = {
      data: { content: [], meta: { page: 2, pageSize: 20, total: 100 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ page: 2, size: 20 })

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products?page=2&size=20`)
  })

  it('omits undefined params from the query string', async () => {
    const response = {
      data: { content: [], meta: { page: 0, pageSize: 20, total: 1 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    await listProducts({ page: 0 })

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/products?page=0`)
  })

  it('returns the paged result with content and meta', async () => {
    const response = {
      data: { content: [summary], meta: { page: 0, pageSize: 20, total: 1 } },
    }
    vi.stubGlobal('fetch', mockFetch(response))

    const result = await listProducts({})

    expect(result.content).toHaveLength(1)
    expect(result.content[0].handle).toBe('heirloom-tomato-seeds')
    expect(result.meta.total).toBe(1)
  })
})

describe('authLogin', () => {
  it('POSTs credentials and returns tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { accessToken: 'acc', refreshToken: 'ref' } }))

    const result = await authLogin('a@b.com', 'pass')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
    })
    expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Unauthorized' }, 401))
    await expect(authLogin('a@b.com', 'wrong')).rejects.toThrow('HTTP 401')
  })
})

describe('authRegister', () => {
  it('POSTs registration data and returns tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { accessToken: 'acc', refreshToken: 'ref' } }))

    const result = await authRegister('a@b.com', 'pass', 'Jane', 'Doe')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'pass', firstName: 'Jane', lastName: 'Doe' }),
    })
    expect(result).toEqual({ accessToken: 'acc', refreshToken: 'ref' })
  })
})

describe('authLogout', () => {
  it('POSTs the refresh token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response))

    await authLogout('ref-token')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'ref-token' }),
    })
  })
})

describe('authRefresh', () => {
  it('POSTs the refresh token and returns new tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { accessToken: 'new-acc', refreshToken: 'new-ref' } }))

    const result = await authRefresh('old-ref')

    expect(result).toEqual({ accessToken: 'new-acc', refreshToken: 'new-ref' })
  })
})

describe('authRequestPasswordReset', () => {
  it('POSTs email to request-password-reset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response))

    await authRequestPasswordReset('a@b.com')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com' }),
    })
  })
})

describe('authConfirmPasswordReset', () => {
  it('POSTs new password to confirm-password-reset', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response))

    await authConfirmPasswordReset('tok123', 'newpassword')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/auth/confirm-password-reset/tok123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: 'newpassword' }),
    })
  })
})

describe('authVerifyEmail', () => {
  it('GETs verify-email with token query param', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response))

    await authVerifyEmail('verify-tok')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/auth/verify-email?token=verify-tok`)
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

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/account`, {
      headers: { Authorization: 'Bearer my-token' },
    })
    expect(result).toEqual({ ...account })
  })
})

describe('createAuthFetch', () => {
  it('sends request with Authorization header', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: { ok: true } }))

    const authFetch = createAuthFetch({
      getTokens: () => ({ accessToken: 'tok', refreshToken: 'ref' }),
      onTokensRefreshed: vi.fn(),
      onAuthFailure: vi.fn(),
    })

    const result = await authFetch<{ ok: boolean }>('/api/v1/account')

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[1].headers.Authorization).toBe('Bearer tok')
    expect(result).toEqual({ ok: true })
  })

  it('refreshes tokens on 401 and retries', async () => {
    const onTokensRefreshed = vi.fn()
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 401 } as Response)
      }
      if (callCount === 2) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { accessToken: 'new', refreshToken: 'new-ref' } }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { result: 'ok' } }),
      } as Response)
    }))

    const authFetch = createAuthFetch({
      getTokens: () => ({ accessToken: 'old', refreshToken: 'ref' }),
      onTokensRefreshed,
      onAuthFailure: vi.fn(),
    })

    const result = await authFetch<{ result: string }>('/api/v1/account')

    expect(onTokensRefreshed).toHaveBeenCalledWith({ accessToken: 'new', refreshToken: 'new-ref' })
    expect(result).toEqual({ result: 'ok' })
  })

  it('calls onAuthFailure when refresh fails', async () => {
    const onAuthFailure = vi.fn()
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      return Promise.resolve({ ok: false, status: callCount === 1 ? 401 : 401 } as Response)
    }))

    const authFetch = createAuthFetch({
      getTokens: () => ({ accessToken: 'old', refreshToken: 'ref' }),
      onTokensRefreshed: vi.fn(),
      onAuthFailure,
    })

    await expect(authFetch('/api/v1/account')).rejects.toThrow('Session expired')
    expect(onAuthFailure).toHaveBeenCalled()
  })
})
