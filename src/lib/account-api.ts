import type { components } from '#/schema'
import type { createAuthFetch } from '#/lib/api'

// ─── Exported types ───────────────────────────────────────────────────────────

export type AccountResponse = components['schemas']['AccountResponse']
export type UpdateAccountRequest = components['schemas']['UpdateAccountRequest']
export type AddressRequest = components['schemas']['AddressRequest']
export type AddressResponse = components['schemas']['AddressResponse']
export type OrderResponse = components['schemas']['OrderResponse']
export type OrderItemResponse = components['schemas']['OrderItemResponse']
export type OrderItemProductInfo = components['schemas']['OrderItemProductInfo']
export type PagedResultOrderResponse = components['schemas']['PagedResultOrderResponse']

// ─── Auth fetch type alias ────────────────────────────────────────────────────

type AuthFetch = ReturnType<typeof createAuthFetch>

// ─── Account ──────────────────────────────────────────────────────────────────

export async function getAccount(fetch: AuthFetch): Promise<AccountResponse> {
  return fetch<AccountResponse>('/api/v1/account')
}

export async function updateAccount(
  fetch: AuthFetch,
  data: UpdateAccountRequest,
): Promise<AccountResponse> {
  return fetch<AccountResponse>('/api/v1/account', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export async function listAddresses(fetch: AuthFetch): Promise<AddressResponse[]> {
  return fetch<AddressResponse[]>('/api/v1/account/addresses')
}

export async function createAddress(
  fetch: AuthFetch,
  data: AddressRequest,
): Promise<AddressResponse> {
  return fetch<AddressResponse>('/api/v1/account/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAddress(
  fetch: AuthFetch,
  id: string,
  data: AddressRequest,
): Promise<AddressResponse> {
  return fetch<AddressResponse>(`/api/v1/account/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAddress(fetch: AuthFetch, id: string): Promise<void> {
  return fetch<void>(`/api/v1/account/addresses/${id}`, { method: 'DELETE' })
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function listOrders(
  fetch: AuthFetch,
  params?: { page?: number; size?: number },
): Promise<PagedResultOrderResponse> {
  const qs = new URLSearchParams()
  if (params?.page !== undefined) qs.set('page', String(params.page))
  if (params?.size !== undefined) qs.set('size', String(params.size))
  const query = qs.toString()
  return fetch<PagedResultOrderResponse>(
    `/api/v1/storefront/orders${query ? `?${query}` : ''}`,
  )
}

export async function getOrder(fetch: AuthFetch, id: string): Promise<OrderResponse> {
  return fetch<OrderResponse>(`/api/v1/storefront/orders/${id}`)
}

export async function cancelOrder(fetch: AuthFetch, id: string): Promise<OrderResponse> {
  return fetch<OrderResponse>(`/api/v1/storefront/orders/${id}/cancel`, { method: 'PUT' })
}
