import type { components } from '#/schema'
import { createPublicClient, callApi } from '#/lib/client'
export { createAuthClient } from '#/lib/client'
export type { ApiClient, AuthClientConfig } from '#/lib/client'

// ─── Re-exported schema types ─────────────────────────────────────────────────

export type PageResponse = components['schemas']['PageResponse']
export type CollectionSummaryResponse = components['schemas']['CollectionSummaryResponse']
export type CollectionDetailResponse = components['schemas']['CollectionDetailResponse']
export type CollectionProductResponse = components['schemas']['CollectionProductResponse']
export type PageMeta = components['schemas']['PageMeta']
export type ProductVariantResponse = components['schemas']['ProductVariantResponse']
export type ProductImageResponse = components['schemas']['ProductImageResponse']
export type ReviewSummaryResponse = components['schemas']['ReviewSummaryResponse']
export type ProductDetailResponse = components['schemas']['ProductDetailResponse']
export type ProductSummaryResponse = components['schemas']['ProductSummaryResponse']
export type SearchResponse = components['schemas']['SearchResponse']
export type SearchArticleResult = components['schemas']['SearchArticleResult']
export type SearchPageResult = components['schemas']['SearchPageResult']

export interface PagedResult<T> {
  content: T[]
  meta: PageMeta
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  status: 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── Auth functions (raw fetch — used for login bootstrap before auth client) ─

export function getGoogleOAuthUrl(): string {
  return `${base()}/api/v1/auth/oauth2/google`
}

export async function authLogin(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${base()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return { accessToken: json.data.accessToken, refreshToken: json.data.refreshToken }
}

export async function authRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<AuthTokens> {
  const res = await fetch(`${base()}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return { accessToken: json.data.accessToken, refreshToken: json.data.refreshToken }
}

export async function authLogout(refreshToken: string): Promise<void> {
  const res = await fetch(`${base()}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function authRefresh(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${base()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return { accessToken: json.data.accessToken, refreshToken: json.data.refreshToken }
}

export async function authRequestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${base()}/api/v1/auth/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function authConfirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${base()}/api/v1/auth/confirm-password-reset/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function authVerifyEmail(token: string): Promise<void> {
  const res = await fetch(`${base()}/api/v1/auth/verify-email?token=${token}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// Used during login bootstrap (before auth client is initialized)
export async function getAccount(accessToken: string): Promise<User> {
  const res = await fetch(`${base()}/api/v1/account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const d = json.data
  return {
    id: d.id ?? '',
    email: d.email ?? '',
    firstName: d.firstName ?? '',
    lastName: d.lastName ?? '',
    phone: d.phone ?? null,
    status: d.status ?? 'UNVERIFIED',
  }
}

// ─── Public API functions ─────────────────────────────────────────────────────

export function getPage(handle: string): Promise<PageResponse> {
  return callApi(createPublicClient().GET('/api/v1/pages/{handle}', {
    params: { path: { handle } },
  }))
}

export function listCollections(page: number, size: number): Promise<PagedResult<CollectionSummaryResponse>> {
  return callApi(createPublicClient().GET('/api/v1/collections', {
    params: { query: { page, size } },
  })) as Promise<PagedResult<CollectionSummaryResponse>>
}

export function getCollection(handle: string): Promise<CollectionDetailResponse> {
  return callApi(createPublicClient().GET('/api/v1/collections/{handle}', {
    params: { path: { handle } },
  }))
}

export function listCollectionProducts(
  handle: string,
  page: number,
  size: number,
): Promise<PagedResult<CollectionProductResponse>> {
  return callApi(createPublicClient().GET('/api/v1/collections/{handle}/products', {
    params: { path: { handle }, query: { page, size } },
  })) as Promise<PagedResult<CollectionProductResponse>>
}

export function getProduct(handle: string): Promise<ProductDetailResponse> {
  return callApi(createPublicClient().GET('/api/v1/products/{handle}', {
    params: { path: { handle } },
  }))
}

export function listProducts(params: {
  q?: string
  vendor?: string
  type?: string
  page?: number
  size?: number
}): Promise<PagedResult<ProductSummaryResponse>> {
  return callApi(createPublicClient().GET('/api/v1/products', {
    params: {
      query: {
        titleContains: params.q,
        vendor: params.vendor,
        productType: params.type,
        page: params.page,
        size: params.size,
      },
    },
  })) as Promise<PagedResult<ProductSummaryResponse>>
}

export function getRelatedProducts(handle: string, limit = 4): Promise<ProductSummaryResponse[]> {
  return callApi(createPublicClient().GET('/api/v1/products/{handle}/related', {
    params: { path: { handle }, query: { limit } },
  })) as Promise<ProductSummaryResponse[]>
}

export function search(params: {
  q: string
  types?: string[]
  page?: number
  size?: number
}): Promise<SearchResponse> {
  return callApi(createPublicClient().GET('/api/v1/search', {
    params: {
      query: {
        q: params.q,
        types: params.types,
        page: params.page,
        size: params.size,
      },
    },
  }))
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function base(): string {
  const url = import.meta.env.VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL is not set')
  return url
}
