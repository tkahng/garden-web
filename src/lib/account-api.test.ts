import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ApiClient } from '#/lib/client'
import {
  getAccount,
  updateAccount,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listOrders,
  getOrder,
  cancelOrder,
  requestRefund,
  reorder,
  approveOrder,
  rejectApproval,
  submitReturn,
  listReturns,
  getReturn,
  listFulfillments,
  getGiftCardBalance,
  getGiftCardTransactions,
  listOrderTemplates,
  createOrderTemplate,
  deleteOrderTemplate,
  loadOrderTemplate,
  getNotificationPreferences,
  updateNotificationPreferences,
} from './account-api'

// Wraps payload the way callApi expects: { data: { data: payload } }
function wrap<T>(payload: T) {
  return Promise.resolve({ data: { data: payload } })
}

function makeClient(payload: unknown, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): ApiClient {
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
  const mock = vi.fn().mockImplementation(() => Promise.resolve({ error: new Error('HTTP 401') }))
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

const mockAccount = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-1234',
  status: 'ACTIVE' as const,
  emailVerifiedAt: '2026-01-01T00:00:00Z',
}

const mockAddress = {
  id: 'addr-1',
  firstName: 'Jane',
  lastName: 'Smith',
  address1: '123 Garden St',
  city: 'Portland',
  zip: '97201',
  country: 'US',
  isDefault: true,
}

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  status: 'PAID' as const,
  totalAmount: 29.99,
  currency: 'USD',
  items: [],
  createdAt: '2026-04-01T00:00:00Z',
}

describe('getAccount', () => {
  it('calls client.GET /api/v1/account', async () => {
    const c = makeClient(mockAccount, 'GET')
    await getAccount(c)
    expect((c as unknown as { GET: ReturnType<typeof vi.fn> }).GET).toHaveBeenCalledWith('/api/v1/account')
  })

  it('returns the AccountResponse', async () => {
    const c = makeClient(mockAccount, 'GET')
    const result = await getAccount(c)
    expect(result).toEqual(mockAccount)
  })
})

describe('updateAccount', () => {
  it('calls client.PUT /api/v1/account with body', async () => {
    const c = makeClient(mockAccount, 'PUT')
    await updateAccount(c, { firstName: 'Janet' })
    expect((c as unknown as { PUT: ReturnType<typeof vi.fn> }).PUT).toHaveBeenCalledWith(
      '/api/v1/account',
      { body: { firstName: 'Janet' } },
    )
  })

  it('returns the updated AccountResponse', async () => {
    const updated = { ...mockAccount, firstName: 'Janet' }
    const c = makeClient(updated, 'PUT')
    const result = await updateAccount(c, { firstName: 'Janet' })
    expect(result.firstName).toBe('Janet')
  })
})

describe('listAddresses', () => {
  it('calls client.GET /api/v1/account/addresses', async () => {
    const c = makeClient([mockAddress], 'GET')
    await listAddresses(c)
    expect((c as unknown as { GET: ReturnType<typeof vi.fn> }).GET).toHaveBeenCalledWith(
      '/api/v1/account/addresses',
    )
  })

  it('returns array of AddressResponse', async () => {
    const c = makeClient([mockAddress], 'GET')
    const result = await listAddresses(c)
    expect(result).toEqual([mockAddress])
  })
})

describe('createAddress', () => {
  it('calls client.POST /api/v1/account/addresses with body', async () => {
    const data = {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '123 Garden St',
      city: 'Portland',
      zip: '97201',
      country: 'US',
    }
    const c = makeClient(mockAddress, 'POST')
    await createAddress(c, data)
    expect((c as unknown as { POST: ReturnType<typeof vi.fn> }).POST).toHaveBeenCalledWith(
      '/api/v1/account/addresses',
      { body: data },
    )
  })
})

describe('updateAddress', () => {
  it('calls client.PUT /api/v1/account/addresses/{id} with path + body', async () => {
    const data = {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '456 Oak Ave',
      city: 'Portland',
      zip: '97201',
      country: 'US',
    }
    const c = makeClient(mockAddress, 'PUT')
    await updateAddress(c, 'addr-1', data)
    expect((c as unknown as { PUT: ReturnType<typeof vi.fn> }).PUT).toHaveBeenCalledWith(
      '/api/v1/account/addresses/{id}',
      { params: { path: { id: 'addr-1' } }, body: data },
    )
  })
})

describe('deleteAddress', () => {
  it('calls client.DELETE /api/v1/account/addresses/{id}', async () => {
    const c = makeClient(undefined, 'DELETE')
    await deleteAddress(c, 'addr-1')
    expect((c as unknown as { DELETE: ReturnType<typeof vi.fn> }).DELETE).toHaveBeenCalledWith(
      '/api/v1/account/addresses/{id}',
      { params: { path: { id: 'addr-1' } } },
    )
  })
})

describe('listOrders', () => {
  it('calls client.GET /api/v1/storefront/orders', async () => {
    const data = { content: [mockOrder], meta: { page: 0, pageSize: 10, total: 1 } }
    const c = makeClient(data, 'GET')
    await listOrders(c)
    expect((c as unknown as { GET: ReturnType<typeof vi.fn> }).GET).toHaveBeenCalledWith(
      '/api/v1/storefront/orders',
      expect.objectContaining({ params: { query: { page: undefined, size: undefined } } }),
    )
  })

  it('passes page and size as query params when provided', async () => {
    const data = { content: [], meta: { page: 1, pageSize: 10, total: 0 } }
    const c = makeClient(data, 'GET')
    await listOrders(c, { page: 1, size: 10 })
    expect((c as unknown as { GET: ReturnType<typeof vi.fn> }).GET).toHaveBeenCalledWith(
      '/api/v1/storefront/orders',
      expect.objectContaining({ params: { query: { page: 1, size: 10 } } }),
    )
  })

  it('returns PagedResultOrderResponse', async () => {
    const data = { content: [mockOrder], meta: { page: 0, pageSize: 10, total: 1 } }
    const c = makeClient(data, 'GET')
    const result = await listOrders(c)
    expect(result.content).toEqual([mockOrder])
  })
})

describe('getOrder', () => {
  it('calls client.GET /api/v1/storefront/orders/{id}', async () => {
    const c = makeClient(mockOrder, 'GET')
    await getOrder(c, 'order-1')
    expect((c as unknown as { GET: ReturnType<typeof vi.fn> }).GET).toHaveBeenCalledWith(
      '/api/v1/storefront/orders/{id}',
      { params: { path: { id: 'order-1' } } },
    )
  })
})

describe('cancelOrder', () => {
  it('calls client.PUT /api/v1/storefront/orders/{id}/cancel', async () => {
    const c = makeClient({ ...mockOrder, status: 'CANCELLED' }, 'PUT')
    await cancelOrder(c, 'order-1')
    expect((c as unknown as { PUT: ReturnType<typeof vi.fn> }).PUT).toHaveBeenCalledWith(
      '/api/v1/storefront/orders/{id}/cancel',
      { params: { path: { id: 'order-1' } } },
    )
  })

  it('returns the updated OrderResponse', async () => {
    const cancelled = { ...mockOrder, status: 'CANCELLED' as const }
    const c = makeClient(cancelled, 'PUT')
    const result = await cancelOrder(c, 'order-1')
    expect(result.status).toBe('CANCELLED')
  })
})

describe('error propagation', () => {
  it('propagates errors from the client', async () => {
    const c = makeFailingClient()
    await expect(getAccount(c)).rejects.toThrow('HTTP 401')
  })
})

// ─── Helper for any-cast functions ────────────────────────────────────────────

function makeAnyCastClient(payload: unknown, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') {
  const mock = vi.fn().mockResolvedValue({ data: { data: payload } })
  const client = {
    GET: method === 'GET' ? mock : vi.fn(),
    POST: method === 'POST' ? mock : vi.fn(),
    PUT: method === 'PUT' ? mock : vi.fn(),
    DELETE: method === 'DELETE' ? mock : vi.fn().mockResolvedValue({}),
  }
  return { client: client as unknown as import('#/lib/client').ApiClient, mock }
}

// ─── requestRefund ────────────────────────────────────────────────────────────

describe('requestRefund', () => {
  it('calls POST /api/v1/storefront/orders/{id}/refund', async () => {
    const c = makeClient(mockOrder, 'POST')
    await requestRefund(c, 'order-1')
    expect((c as unknown as { POST: ReturnType<typeof vi.fn> }).POST).toHaveBeenCalledWith(
      '/api/v1/storefront/orders/{id}/refund',
      expect.objectContaining({ params: { path: { id: 'order-1' } } }),
    )
  })
})

describe('reorder', () => {
  it('calls POST /api/v1/storefront/orders/{id}/reorder', async () => {
    const c = makeClient({ id: 'cart-1' }, 'POST')
    await reorder(c, 'order-1')
    expect((c as unknown as { POST: ReturnType<typeof vi.fn> }).POST).toHaveBeenCalledWith(
      '/api/v1/storefront/orders/{id}/reorder',
      expect.objectContaining({ params: { path: { id: 'order-1' } } }),
    )
  })
})

// ─── Order approval ───────────────────────────────────────────────────────────

describe('approveOrder', () => {
  it('returns CheckoutResponse', async () => {
    const { client } = makeAnyCastClient({ checkoutUrl: null, orderId: 'order-1', pendingApproval: false }, 'POST')
    const result = await approveOrder(client, 'order-1')
    expect(result.orderId).toBe('order-1')
  })
})

describe('rejectApproval', () => {
  it('calls POST /api/v1/storefront/orders/{id}/reject-approval', async () => {
    const c = makeClient(mockOrder, 'POST')
    await rejectApproval(c, 'order-1')
    expect((c as unknown as { POST: ReturnType<typeof vi.fn> }).POST).toHaveBeenCalledWith(
      '/api/v1/storefront/orders/{id}/reject-approval',
      expect.objectContaining({ params: { path: { id: 'order-1' } } }),
    )
  })
})

// ─── Return requests ──────────────────────────────────────────────────────────

const mockReturn = {
  id: 'rr-1',
  orderId: 'order-1',
  reason: 'DAMAGED' as const,
  resolution: 'REFUND' as const,
  status: 'PENDING' as const,
}

describe('submitReturn', () => {
  it('calls POST /api/v1/storefront/returns/orders/{orderId}', async () => {
    const c = makeClient(mockReturn, 'POST')
    await submitReturn(c, 'order-1', { reason: 'DAMAGED', resolution: 'REFUND' })
    expect((c as unknown as { POST: ReturnType<typeof vi.fn> }).POST).toHaveBeenCalledWith(
      '/api/v1/storefront/returns/orders/{orderId}',
      expect.objectContaining({
        params: { path: { orderId: 'order-1' } },
        body: { reason: 'DAMAGED', resolution: 'REFUND' },
      }),
    )
  })
})

describe('listReturns', () => {
  it('calls GET /api/v1/storefront/returns', async () => {
    const c = makeClient({ content: [mockReturn], meta: {} }, 'GET')
    await listReturns(c)
    expect((c as unknown as { GET: ReturnType<typeof vi.fn> }).GET).toHaveBeenCalledWith(
      '/api/v1/storefront/returns',
      expect.any(Object),
    )
  })
})

describe('getReturn', () => {
  it('returns the return request', async () => {
    const c = makeClient(mockReturn, 'GET')
    const result = await getReturn(c, 'rr-1')
    expect(result.id).toBe('rr-1')
  })
})

// ─── Fulfillments (any-cast) ──────────────────────────────────────────────────

describe('listFulfillments', () => {
  it('returns fulfillment array from nested data', async () => {
    const mockFulfillments = [{ id: 'f-1', status: 'SHIPPED', trackingNumber: '1Z999' }]
    const { client } = makeAnyCastClient(mockFulfillments, 'GET')
    const result = await listFulfillments(client, 'order-1')
    expect(result).toEqual(mockFulfillments)
  })

  it('returns empty array when data is missing', async () => {
    const { client } = makeAnyCastClient(undefined, 'GET')
    const result = await listFulfillments(client, 'order-1')
    expect(result).toEqual([])
  })
})

// ─── Gift card (any-cast) ─────────────────────────────────────────────────────

describe('getGiftCardBalance', () => {
  it('returns balance response', async () => {
    const payload = { valid: true, code: 'GIFT-123', currentBalance: 50, currency: 'USD' }
    const { client } = makeAnyCastClient(payload, 'GET')
    const result = await getGiftCardBalance(client, 'GIFT-123')
    expect(result.currentBalance).toBe(50)
    expect(result.valid).toBe(true)
  })
})

describe('getGiftCardTransactions', () => {
  it('returns transaction array', async () => {
    const txs = [{ id: 'tx-1', delta: -10, createdAt: '2026-01-01T00:00:00Z' }]
    const { client } = makeAnyCastClient(txs, 'GET')
    const result = await getGiftCardTransactions(client, 'GIFT-123')
    expect(result).toHaveLength(1)
    expect(result[0].delta).toBe(-10)
  })

  it('returns empty array when no transactions', async () => {
    const { client } = makeAnyCastClient([], 'GET')
    const result = await getGiftCardTransactions(client, 'GIFT-123')
    expect(result).toEqual([])
  })
})

// ─── Order templates (any-cast) ───────────────────────────────────────────────

const mockTemplate = { id: 'tmpl-1', name: 'Monthly', items: [], userId: 'user-1' }

describe('listOrderTemplates', () => {
  it('returns template array', async () => {
    const { client } = makeAnyCastClient([mockTemplate], 'GET')
    const result = await listOrderTemplates(client)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Monthly')
  })
})

describe('createOrderTemplate', () => {
  it('posts name and items, returns template', async () => {
    const { client, mock } = makeAnyCastClient(mockTemplate, 'POST')
    const result = await createOrderTemplate(client, 'Monthly', [{ variantId: 'v-1', quantity: 2 }])
    expect(result.id).toBe('tmpl-1')
    expect(mock).toHaveBeenCalledWith(
      '/api/v1/storefront/order-templates',
      expect.objectContaining({ body: { name: 'Monthly', items: [{ variantId: 'v-1', quantity: 2 }] } }),
    )
  })
})

describe('deleteOrderTemplate', () => {
  it('calls DELETE without throwing', async () => {
    const { client } = makeAnyCastClient(undefined, 'DELETE')
    await expect(deleteOrderTemplate(client, 'tmpl-1')).resolves.toBeUndefined()
  })
})

describe('loadOrderTemplate', () => {
  it('returns cart response', async () => {
    const { client } = makeAnyCastClient({ id: 'cart-1', status: 'ACTIVE' }, 'POST')
    const result = await loadOrderTemplate(client, 'tmpl-1')
    expect((result as { id: string }).id).toBe('cart-1')
  })
})

// ─── Notification preferences (any-cast) ─────────────────────────────────────

describe('getNotificationPreferences', () => {
  it('returns preference array', async () => {
    const prefs = [{ type: 'ORDER_CONFIRMATION', enabled: true }]
    const { client } = makeAnyCastClient(prefs, 'GET')
    const result = await getNotificationPreferences(client)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('ORDER_CONFIRMATION')
  })

  it('returns empty array when data missing', async () => {
    const { client } = makeAnyCastClient(undefined, 'GET')
    const result = await getNotificationPreferences(client)
    expect(result).toEqual([])
  })
})

describe('updateNotificationPreferences', () => {
  it('posts preferences map, returns updated array', async () => {
    const prefs = [{ type: 'MARKETING', enabled: false }]
    const { client, mock } = makeAnyCastClient(prefs, 'PUT')
    const result = await updateNotificationPreferences(client, { MARKETING: false })
    expect(result[0].enabled).toBe(false)
    expect(mock).toHaveBeenCalledWith(
      '/api/v1/account/notification-preferences',
      expect.objectContaining({ body: { preferences: { MARKETING: false } } }),
    )
  })
})
