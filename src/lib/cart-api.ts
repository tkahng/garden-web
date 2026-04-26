import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi } from '#/lib/client'

// ─── Exported types ───────────────────────────────────────────────────────────

export type CartResponse = components['schemas']['CartResponse']
export type CartItemResponse = components['schemas']['CartItemResponse']
export type CartItemProductInfo = components['schemas']['CartItemProductInfo']
export type CheckoutResponse = components['schemas']['CheckoutResponse']
export type CheckoutReturnResponse = components['schemas']['CheckoutReturnResponse']
export type CheckoutRequest = components['schemas']['CheckoutRequest']
export type DiscountValidationResponse = components['schemas']['DiscountValidationResponse']

// ─── Cart ─────────────────────────────────────────────────────────────────────

export function getCart(client: ApiClient): Promise<CartResponse> {
  return callApi(client.GET('/api/v1/cart'))
}

export function addCartItem(
  client: ApiClient,
  variantId: string,
  quantity: number,
): Promise<CartResponse> {
  return callApi(client.POST('/api/v1/cart/items', { body: { variantId, quantity } }))
}

export function updateCartItem(
  client: ApiClient,
  itemId: string,
  quantity: number,
): Promise<CartResponse> {
  return callApi(client.PUT('/api/v1/cart/items/{itemId}', {
    params: { path: { itemId } },
    body: { quantity },
  }))
}

export function removeCartItem(client: ApiClient, itemId: string): Promise<CartResponse> {
  return callApi(client.DELETE('/api/v1/cart/items/{itemId}', {
    params: { path: { itemId } },
  }))
}

export function abandonCart(client: ApiClient): Promise<void> {
  return callApi(client.DELETE('/api/v1/cart')) as Promise<void>
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export function checkout(
  client: ApiClient,
  body: CheckoutRequest,
): Promise<CheckoutResponse> {
  return callApi(client.POST('/api/v1/checkout', { body }))
}

// ─── Discount validation ──────────────────────────────────────────────────────

export function validateDiscount(
  client: ApiClient,
  code: string,
  orderAmount?: number,
): Promise<DiscountValidationResponse> {
  return callApi(client.GET('/api/v1/storefront/discounts/validate', {
    params: { query: { code, orderAmount } },
  }))
}
