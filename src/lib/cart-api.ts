import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi, createPublicClient } from '#/lib/client'

// ─── Exported types ───────────────────────────────────────────────────────────

export type CartResponse = components['schemas']['CartResponse']
export type CartItemResponse = components['schemas']['CartItemResponse']
export type CartItemProductInfo = components['schemas']['CartItemProductInfo']
export type CheckoutResponse = components['schemas']['CheckoutResponse']
export type CheckoutReturnResponse = components['schemas']['CheckoutReturnResponse']
export type CheckoutRequest = components['schemas']['CheckoutRequest']
export type DiscountValidationResponse = components['schemas']['DiscountValidationResponse']
export type GiftCardValidationResponse = components['schemas']['GiftCardValidationResponse']
export type BulkAddToCartResponse = components['schemas']['BulkAddToCartResponse']
export type BulkAddToCartLineResult = components['schemas']['LineResult']

// ─── Cart ─────────────────────────────────────────────────────────────────────

export function getCart(client: ApiClient, signal?: AbortSignal): Promise<CartResponse> {
  return callApi(client.GET('/api/v1/cart', { signal }))
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

// ─── Gift card validation ─────────────────────────────────────────────────────

export function validateGiftCard(code: string): Promise<GiftCardValidationResponse> {
  return callApi(createPublicClient().GET('/api/v1/storefront/gift-cards/validate', {
    params: { query: { code } },
  }))
}

// ─── CSV bulk import ──────────────────────────────────────────────────────────

// Reads the access token from the same localStorage slot the auth context uses,
// avoiding the need to expose the raw JWT through the React context value.
function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('garden:auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accessToken?: string | null }
    return parsed.accessToken ?? null
  } catch {
    return null
  }
}

export async function importCsvToCart(
  file: File,
): Promise<BulkAddToCartResponse> {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Not authenticated')
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${base}/api/v1/cart/import-csv`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error(String(res.status))
  const json = await res.json() as { data: BulkAddToCartResponse }
  return json.data
}
