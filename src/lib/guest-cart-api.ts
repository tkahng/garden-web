import type { CartResponse, CheckoutResponse } from '#/lib/cart-api'

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

// ─── Internals ────────────────────────────────────────────────────────────────

function base(): string {
  const url = import.meta.env.VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL is not set')
  return url
}

async function guestFetch<T>(path: string, sessionId: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'X-Guest-Session': sessionId,
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${base()}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.error ?? `HTTP ${res.status}`), { status: res.status, code: body?.error })
  }
  const json = await res.json()
  return json.data as T
}

async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.data as T
}

// ─── Guest cart ───────────────────────────────────────────────────────────────

export function getGuestCart(sessionId: string): Promise<CartResponse> {
  return guestFetch<CartResponse>('/api/v1/guest-cart', sessionId)
}

export function addGuestCartItem(sessionId: string, variantId: string, quantity: number): Promise<CartResponse> {
  return guestFetch<CartResponse>('/api/v1/guest-cart/items', sessionId, {
    method: 'POST',
    body: JSON.stringify({ variantId, quantity }),
  })
}

export function updateGuestCartItem(sessionId: string, itemId: string, quantity: number): Promise<CartResponse> {
  return guestFetch<CartResponse>(`/api/v1/guest-cart/items/${itemId}`, sessionId, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  })
}

export function removeGuestCartItem(sessionId: string, itemId: string): Promise<CartResponse> {
  return guestFetch<CartResponse>(`/api/v1/guest-cart/items/${itemId}`, sessionId, {
    method: 'DELETE',
  })
}

export function abandonGuestCart(sessionId: string): Promise<void> {
  return guestFetch<void>('/api/v1/guest-cart', sessionId, { method: 'DELETE' })
}

// ─── Shipping rates ───────────────────────────────────────────────────────────

export function getShippingRates(
  country: string,
  province?: string,
  orderAmount?: number,
): Promise<ShippingRateOption[]> {
  const qs = new URLSearchParams({ country })
  if (province) qs.set('province', province)
  if (orderAmount !== undefined) qs.set('orderAmount', String(orderAmount))
  return publicFetch<ShippingRateOption[]>(`/api/v1/storefront/shipping/rates?${qs}`)
}

// ─── Email check ──────────────────────────────────────────────────────────────

export function checkEmailExists(email: string): Promise<boolean> {
  return publicFetch<boolean>(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`)
}

// ─── Guest checkout ───────────────────────────────────────────────────────────

export function submitGuestCheckout(
  sessionId: string,
  request: GuestCheckoutRequest,
): Promise<CheckoutResponse> {
  return guestFetch<CheckoutResponse>('/api/v1/checkout/guest', sessionId, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
