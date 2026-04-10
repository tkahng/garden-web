import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCartClient } from './cart-api'

const BASE = 'http://localhost:8080'

const mockCart = {
  id: 'cart-1',
  status: 'ACTIVE' as const,
  items: [],
  createdAt: '2026-04-10T00:00:00Z',
}

function mockResponse(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function emptyResponse(status = 200) {
  return vi.fn().mockResolvedValue(new Response(null, { status }))
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function lastRequest(): Request {
  return (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as Request
}

describe('createCartClient', () => {
  it('getCart sends GET /api/v1/cart with Authorization header', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => 'test-token')

    await client.getCart()

    const req = lastRequest()
    expect(req.url).toBe(`${BASE}/api/v1/cart`)
    expect(req.method).toBe('GET')
    expect(req.headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('getCart returns the CartResponse', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => 'tok')

    const result = await client.getCart()

    expect(result).toEqual(mockCart)
  })

  it('addCartItem sends POST /api/v1/cart/items with variantId and quantity', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => 'tok')

    await client.addCartItem('variant-1', 2)

    const req = lastRequest()
    expect(req.url).toBe(`${BASE}/api/v1/cart/items`)
    expect(req.method).toBe('POST')
    const body = await req.json()
    expect(body).toEqual({ variantId: 'variant-1', quantity: 2 })
  })

  it('addCartItem defaults quantity to 1', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => 'tok')

    await client.addCartItem('variant-1')

    const req = lastRequest()
    const body = await req.json()
    expect(body.quantity).toBe(1)
  })

  it('updateCartItem sends PUT /api/v1/cart/items/{itemId} with quantity', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => 'tok')

    await client.updateCartItem('item-1', 3)

    const req = lastRequest()
    expect(req.url).toBe(`${BASE}/api/v1/cart/items/item-1`)
    expect(req.method).toBe('PUT')
    const body = await req.json()
    expect(body).toEqual({ quantity: 3 })
  })

  it('removeCartItem sends DELETE /api/v1/cart/items/{itemId}', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => 'tok')

    await client.removeCartItem('item-1')

    const req = lastRequest()
    expect(req.url).toBe(`${BASE}/api/v1/cart/items/item-1`)
    expect(req.method).toBe('DELETE')
  })

  it('abandonCart sends DELETE /api/v1/cart', async () => {
    vi.stubGlobal('fetch', emptyResponse(200))
    const client = createCartClient(() => 'tok')

    await client.abandonCart()

    const req = lastRequest()
    expect(req.url).toBe(`${BASE}/api/v1/cart`)
    expect(req.method).toBe('DELETE')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockResponse({ error: 'Unauthorized' }, 401))
    const client = createCartClient(() => 'tok')

    await expect(client.getCart()).rejects.toThrow('HTTP 401')
  })

  it('does not set Authorization header when token is null', async () => {
    vi.stubGlobal('fetch', mockResponse({ data: mockCart }))
    const client = createCartClient(() => null)

    await client.getCart()

    const req = lastRequest()
    expect(req.headers.get('Authorization')).toBeNull()
  })
})
