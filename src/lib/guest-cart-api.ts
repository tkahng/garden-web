import type { CartResponse, CheckoutResponse } from '#/lib/cart-api'
import { createPublicClient, callApi } from '#/lib/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShippingRateOption {
  id: string
  name: string
  price: number
  carrier: string | null
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
}

export interface GuestAddress {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  province?: string
  zip: string
  country: string
}

export interface GuestCheckoutRequest {
  email: string
  shippingAddress: GuestAddress
  shippingRateId: string
  discountCode?: string
  giftCardCode?: string
}

// ─── Session management ───────────────────────────────────────────────────────

const GUEST_SESSION_KEY = 'garden:guest-session'

export function getOrCreateGuestSessionId(): string {
  let id = localStorage.getItem(GUEST_SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_SESSION_KEY, id)
  }
  return id
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_SESSION_KEY)
}

// ─── Guest cart ───────────────────────────────────────────────────────────────

export function getGuestCart(sessionId: string): Promise<CartResponse> {
  return callApi(createPublicClient().GET('/api/v1/guest-cart', {
    params: { header: { 'X-Guest-Session': sessionId } },
  })) as Promise<CartResponse>
}

export function addGuestCartItem(sessionId: string, variantId: string, quantity: number): Promise<CartResponse> {
  return callApi(createPublicClient().POST('/api/v1/guest-cart/items', {
    params: { header: { 'X-Guest-Session': sessionId } },
    body: { variantId, quantity },
  })) as Promise<CartResponse>
}

export function updateGuestCartItem(sessionId: string, itemId: string, quantity: number): Promise<CartResponse> {
  return callApi(createPublicClient().PUT('/api/v1/guest-cart/items/{itemId}', {
    params: { header: { 'X-Guest-Session': sessionId }, path: { itemId } },
    body: { quantity },
  })) as Promise<CartResponse>
}

export function removeGuestCartItem(sessionId: string, itemId: string): Promise<CartResponse> {
  return callApi(createPublicClient().DELETE('/api/v1/guest-cart/items/{itemId}', {
    params: { header: { 'X-Guest-Session': sessionId }, path: { itemId } },
  })) as Promise<CartResponse>
}

export async function abandonGuestCart(sessionId: string): Promise<void> {
  const { error } = await createPublicClient().DELETE('/api/v1/guest-cart', {
    params: { header: { 'X-Guest-Session': sessionId } },
  })
  if (error) throw error
}

// ─── Shipping rates ───────────────────────────────────────────────────────────

export function getShippingRates(
  country: string,
  province?: string,
  orderAmount?: number,
): Promise<ShippingRateOption[]> {
  return callApi(createPublicClient().GET('/api/v1/storefront/shipping/rates', {
    params: { query: { country, province, orderAmount } },
  })) as Promise<ShippingRateOption[]>
}

// ─── Email check ──────────────────────────────────────────────────────────────

export function checkEmailExists(email: string): Promise<boolean> {
  return callApi(createPublicClient().GET('/api/v1/auth/check-email', {
    params: { query: { email } },
  })) as Promise<boolean>
}

// ─── Guest checkout ───────────────────────────────────────────────────────────

export function submitGuestCheckout(
  sessionId: string,
  request: GuestCheckoutRequest,
): Promise<CheckoutResponse> {
  return callApi(createPublicClient().POST('/api/v1/checkout/guest', {
    params: { header: { 'X-Guest-Session': sessionId } },
    body: request as never,
  })) as Promise<CheckoutResponse>
}
