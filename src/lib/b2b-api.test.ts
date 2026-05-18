import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ApiClient } from '#/lib/client'
import {
  rejectQuote,
  getQuoteCart,
  addToQuoteCart,
  updateQuoteCartItem,
  removeQuoteCartItem,
  listQuotes,
  getQuote,
  submitQuote,
  acceptQuote,
  cancelQuote,
  listPendingApprovals,
  approveQuote,
  rejectApproval,
  getQuotePdfUrl,
} from './b2b-api'

function wrap<T>(payload: T) {
  return Promise.resolve({ data: { data: payload } })
}

function makeClient(
  payload: unknown,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
): ApiClient & { _mock: ReturnType<typeof vi.fn> } {
  const mock = vi.fn().mockImplementation(() => wrap(payload))
  return {
    GET: method === 'GET' ? mock : vi.fn(),
    POST: method === 'POST' ? mock : vi.fn(),
    PUT: method === 'PUT' ? mock : vi.fn(),
    DELETE: method === 'DELETE' ? mock : vi.fn(),
    PATCH: vi.fn(),
    HEAD: vi.fn(),
    OPTIONS: vi.fn(),
    TRACE: vi.fn(),
    _mock: mock,
  } as unknown as ApiClient & { _mock: ReturnType<typeof vi.fn> }
}

function makeFailingClient(): ApiClient & { _mock: ReturnType<typeof vi.fn> } {
  const mock = vi.fn().mockImplementation(() => Promise.resolve({ error: new Error('HTTP 500') }))
  return {
    GET: mock,
    POST: mock,
    PUT: mock,
    DELETE: mock,
    PATCH: vi.fn(),
    HEAD: vi.fn(),
    OPTIONS: vi.fn(),
    TRACE: vi.fn(),
    _mock: mock,
  } as unknown as ApiClient & { _mock: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

const mockCart = {
  id: 'cart-1',
  status: 'ACTIVE',
  items: [],
  createdAt: '2026-01-01T00:00:00Z',
}

const mockQuote = {
  id: 'quote-1',
  status: 'PENDING',
  companyId: 'company-1',
  userId: 'user-1',
  items: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

// ─── Quote cart ───────────────────────────────────────────────────────────────

describe('getQuoteCart', () => {
  it('calls GET /api/v1/quote-cart and returns cart', async () => {
    const client = makeClient(mockCart)
    const result = await getQuoteCart(client)
    expect(client._mock).toHaveBeenCalled()
    expect(client._mock.mock.calls[0][0]).toBe('/api/v1/quote-cart')
    expect(result).toEqual(mockCart)
  })
})

describe('addToQuoteCart', () => {
  it('calls POST /api/v1/quote-cart/items with body', async () => {
    const client = makeClient(mockCart, 'POST')
    await addToQuoteCart(client, { variantId: 'v1', quantity: 2 })
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quote-cart/items',
      expect.objectContaining({ body: { variantId: 'v1', quantity: 2 } }),
    )
  })
})

describe('updateQuoteCartItem', () => {
  it('calls PUT /api/v1/quote-cart/items/{itemId}', async () => {
    const client = makeClient(mockCart, 'PUT')
    await updateQuoteCartItem(client, 'item-1', { quantity: 3 })
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quote-cart/items/{itemId}',
      expect.objectContaining({ params: { path: { itemId: 'item-1' } } }),
    )
  })
})

describe('removeQuoteCartItem', () => {
  it('calls DELETE /api/v1/quote-cart/items/{itemId}', async () => {
    const client = makeClient(mockCart, 'DELETE')
    await removeQuoteCartItem(client, 'item-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quote-cart/items/{itemId}',
      expect.objectContaining({ params: { path: { itemId: 'item-1' } } }),
    )
  })
})

// ─── Quotes ───────────────────────────────────────────────────────────────────

describe('listQuotes', () => {
  it('calls GET /api/v1/quotes with pagination params', async () => {
    const client = makeClient({ content: [mockQuote], meta: { total: 1, page: 0, size: 20 } })
    await listQuotes(client, { page: 0, size: 20 })
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes',
      expect.objectContaining({ params: { query: { page: 0, size: 20 } } }),
    )
  })
})

describe('getQuote', () => {
  it('calls GET /api/v1/quotes/{id}', async () => {
    const client = makeClient(mockQuote)
    await getQuote(client, 'quote-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes/{id}',
      expect.objectContaining({ params: { path: { id: 'quote-1' } } }),
    )
  })
})

describe('submitQuote', () => {
  it('calls POST /api/v1/quotes with body', async () => {
    const client = makeClient(mockQuote, 'POST')
    const body = {
      companyId: 'company-1',
      deliveryAddressLine1: '123 Main St',
      deliveryCity: 'Portland',
      deliveryPostalCode: '97201',
      deliveryCountry: 'US',
    }
    await submitQuote(client, body)
    expect(client._mock).toHaveBeenCalledWith('/api/v1/quotes', expect.objectContaining({ body }))
  })
})

describe('acceptQuote', () => {
  it('calls POST /api/v1/quotes/{id}/accept', async () => {
    const client = makeClient({ checkoutUrl: 'https://stripe.com/pay', orderId: 'order-1', pendingApproval: false }, 'POST')
    await acceptQuote(client, 'quote-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes/{id}/accept',
      expect.objectContaining({ params: { path: { id: 'quote-1' } } }),
    )
  })
})

describe('rejectQuote', () => {
  it('calls POST /api/v1/quotes/{id}/reject', async () => {
    const client = makeClient({ ...mockQuote, status: 'REJECTED' }, 'POST')
    const result = await rejectQuote(client, 'quote-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes/{id}/reject',
      expect.objectContaining({ params: { path: { id: 'quote-1' } } }),
    )
    expect(result).toMatchObject({ status: 'REJECTED' })
  })

  it('throws when the API returns an error', async () => {
    const client = makeFailingClient()
    await expect(rejectQuote(client, 'quote-1')).rejects.toThrow()
  })
})

describe('cancelQuote', () => {
  it('calls POST /api/v1/quotes/{id}/cancel', async () => {
    const client = makeClient({ ...mockQuote, status: 'CANCELLED' }, 'POST')
    await cancelQuote(client, 'quote-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes/{id}/cancel',
      expect.objectContaining({ params: { path: { id: 'quote-1' } } }),
    )
  })
})

describe('listPendingApprovals', () => {
  it('calls GET /api/v1/quotes/pending-approvals', async () => {
    const client = makeClient({ content: [], meta: { total: 0, page: 0, size: 20 } })
    await listPendingApprovals(client)
    expect(client._mock).toHaveBeenCalledWith('/api/v1/quotes/pending-approvals', expect.anything())
  })
})

describe('approveQuote', () => {
  it('calls POST /api/v1/quotes/{id}/approve', async () => {
    const client = makeClient({ orderId: 'order-1', pendingApproval: false }, 'POST')
    await approveQuote(client, 'quote-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes/{id}/approve',
      expect.objectContaining({ params: { path: { id: 'quote-1' } } }),
    )
  })
})

describe('rejectApproval', () => {
  it('calls POST /api/v1/quotes/{id}/reject-approval', async () => {
    const client = makeClient({ ...mockQuote, status: 'REJECTED' }, 'POST')
    await rejectApproval(client, 'quote-1')
    expect(client._mock).toHaveBeenCalledWith(
      '/api/v1/quotes/{id}/reject-approval',
      expect.objectContaining({ params: { path: { id: 'quote-1' } } }),
    )
  })
})

describe('getQuotePdfUrl', () => {
  it('returns the correct URL for a quote PDF', () => {
    const url = getQuotePdfUrl('quote-abc')
    expect(url).toBe('http://localhost:8080/api/v1/quotes/quote-abc/pdf')
  })
})
