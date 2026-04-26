import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi } from '#/lib/client'

// ─── Exported types ───────────────────────────────────────────────────────────

export type AccountResponse = components['schemas']['AccountResponse']
export type UpdateAccountRequest = components['schemas']['UpdateAccountRequest']
export type AddressRequest = components['schemas']['AddressRequest']
export type AddressResponse = components['schemas']['AddressResponse']
export type OrderResponse = components['schemas']['OrderResponse']
export type OrderItemResponse = components['schemas']['OrderItemResponse']
export type OrderItemProductInfo = components['schemas']['OrderItemProductInfo']
export type PagedResultOrderResponse = components['schemas']['PagedResultOrderResponse']
export type PageMeta = components['schemas']['PageMeta']

// ─── Account ──────────────────────────────────────────────────────────────────

export function getAccount(client: ApiClient): Promise<AccountResponse> {
  return callApi(client.GET('/api/v1/account'))
}

export function updateAccount(
  client: ApiClient,
  data: UpdateAccountRequest,
): Promise<AccountResponse> {
  return callApi(client.PUT('/api/v1/account', { body: data }))
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export function listAddresses(client: ApiClient): Promise<AddressResponse[]> {
  return callApi(client.GET('/api/v1/account/addresses')) as Promise<AddressResponse[]>
}

export function createAddress(client: ApiClient, data: AddressRequest): Promise<AddressResponse> {
  return callApi(client.POST('/api/v1/account/addresses', { body: data }))
}

export function updateAddress(
  client: ApiClient,
  id: string,
  data: AddressRequest,
): Promise<AddressResponse> {
  return callApi(client.PUT('/api/v1/account/addresses/{id}', {
    params: { path: { id } },
    body: data,
  }))
}

export function deleteAddress(client: ApiClient, id: string): Promise<void> {
  return callApi(client.DELETE('/api/v1/account/addresses/{id}', {
    params: { path: { id } },
  })) as Promise<void>
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function listOrders(
  client: ApiClient,
  params?: { page?: number; size?: number },
): Promise<PagedResultOrderResponse> {
  return callApi(client.GET('/api/v1/storefront/orders', {
    params: { query: { page: params?.page, size: params?.size } },
  }))
}

export function getOrder(client: ApiClient, id: string): Promise<OrderResponse> {
  return callApi(client.GET('/api/v1/storefront/orders/{id}', {
    params: { path: { id } },
  }))
}

export function cancelOrder(client: ApiClient, id: string): Promise<OrderResponse> {
  return callApi(client.PUT('/api/v1/storefront/orders/{id}/cancel', {
    params: { path: { id } },
  }))
}
