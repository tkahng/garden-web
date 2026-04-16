import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
} from './account-api'

const BASE = 'http://localhost:8080'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAuthFetch(body: unknown): any {
  return vi.fn().mockResolvedValue(body)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFailingAuthFetch(message: string): any {
  return vi.fn().mockRejectedValue(new Error(message))
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getAccount', () => {
  it('calls authFetch with GET /api/v1/account', async () => {
    const fetch = makeAuthFetch(mockAccount)
    await getAccount(fetch)
    expect(fetch).toHaveBeenCalledWith('/api/v1/account')
  })

  it('returns the AccountResponse', async () => {
    const fetch = makeAuthFetch(mockAccount)
    const result = await getAccount(fetch)
    expect(result).toEqual(mockAccount)
  })
})

describe('updateAccount', () => {
  it('calls authFetch with PUT /api/v1/account and body', async () => {
    const fetch = makeAuthFetch(mockAccount)
    await updateAccount(fetch, { firstName: 'Janet' })
    expect(fetch).toHaveBeenCalledWith('/api/v1/account', {
      method: 'PUT',
      body: JSON.stringify({ firstName: 'Janet' }),
    })
  })

  it('returns the updated AccountResponse', async () => {
    const updated = { ...mockAccount, firstName: 'Janet' }
    const fetch = makeAuthFetch(updated)
    const result = await updateAccount(fetch, { firstName: 'Janet' })
    expect(result.firstName).toBe('Janet')
  })
})

describe('listAddresses', () => {
  it('calls authFetch with GET /api/v1/account/addresses', async () => {
    const fetch = makeAuthFetch([mockAddress])
    await listAddresses(fetch)
    expect(fetch).toHaveBeenCalledWith('/api/v1/account/addresses')
  })

  it('returns array of AddressResponse', async () => {
    const fetch = makeAuthFetch([mockAddress])
    const result = await listAddresses(fetch)
    expect(result).toEqual([mockAddress])
  })
})

describe('createAddress', () => {
  it('calls authFetch with POST /api/v1/account/addresses and body', async () => {
    const fetch = makeAuthFetch(mockAddress)
    const data = {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '123 Garden St',
      city: 'Portland',
      zip: '97201',
      country: 'US',
    }
    await createAddress(fetch, data)
    expect(fetch).toHaveBeenCalledWith('/api/v1/account/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  })
})

describe('updateAddress', () => {
  it('calls authFetch with PUT /api/v1/account/addresses/{id}', async () => {
    const fetch = makeAuthFetch(mockAddress)
    const data = {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '456 Oak Ave',
      city: 'Portland',
      zip: '97201',
      country: 'US',
    }
    await updateAddress(fetch, 'addr-1', data)
    expect(fetch).toHaveBeenCalledWith('/api/v1/account/addresses/addr-1', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  })
})

describe('deleteAddress', () => {
  it('calls authFetch with DELETE /api/v1/account/addresses/{id}', async () => {
    const fetch = makeAuthFetch(undefined)
    await deleteAddress(fetch, 'addr-1')
    expect(fetch).toHaveBeenCalledWith('/api/v1/account/addresses/addr-1', { method: 'DELETE' })
  })
})

describe('listOrders', () => {
  it('calls authFetch with GET /api/v1/storefront/orders', async () => {
    const fetch = makeAuthFetch({ content: [mockOrder], meta: { page: 0, pageSize: 10, total: 1 } })
    await listOrders(fetch)
    expect(fetch).toHaveBeenCalledWith('/api/v1/storefront/orders')
  })

  it('appends page and size query params when provided', async () => {
    const fetch = makeAuthFetch({ content: [], meta: { page: 1, pageSize: 10, total: 0 } })
    await listOrders(fetch, { page: 1, size: 10 })
    expect(fetch).toHaveBeenCalledWith('/api/v1/storefront/orders?page=1&size=10')
  })

  it('returns PagedResultOrderResponse', async () => {
    const data = { content: [mockOrder], meta: { page: 0, pageSize: 10, total: 1 } }
    const fetch = makeAuthFetch(data)
    const result = await listOrders(fetch)
    expect(result.content).toEqual([mockOrder])
  })
})

describe('getOrder', () => {
  it('calls authFetch with GET /api/v1/storefront/orders/{id}', async () => {
    const fetch = makeAuthFetch(mockOrder)
    await getOrder(fetch, 'order-1')
    expect(fetch).toHaveBeenCalledWith('/api/v1/storefront/orders/order-1')
  })
})

describe('cancelOrder', () => {
  it('calls authFetch with PUT /api/v1/storefront/orders/{id}/cancel', async () => {
    const fetch = makeAuthFetch({ ...mockOrder, status: 'CANCELLED' })
    await cancelOrder(fetch, 'order-1')
    expect(fetch).toHaveBeenCalledWith('/api/v1/storefront/orders/order-1/cancel', {
      method: 'PUT',
    })
  })

  it('returns the updated OrderResponse', async () => {
    const cancelled = { ...mockOrder, status: 'CANCELLED' as const }
    const fetch = makeAuthFetch(cancelled)
    const result = await cancelOrder(fetch, 'order-1')
    expect(result.status).toBe('CANCELLED')
  })
})

describe('error propagation', () => {
  it('propagates errors from authFetch', async () => {
    const fetch = makeFailingAuthFetch('HTTP 401')
    await expect(getAccount(fetch)).rejects.toThrow('HTTP 401')
  })
})
