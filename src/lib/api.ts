// Response types — mirror the backend DTOs exactly

export interface PageResponse {
  id: string
  title: string
  handle: string
  body: string
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: string
}

export interface CollectionSummaryResponse {
  id: string
  title: string
  handle: string
  featuredImageUrl: string | null
}

export interface CollectionDetailResponse {
  id: string
  title: string
  handle: string
  description: string | null
  featuredImageUrl: string | null
}

export interface CollectionProductResponse {
  id: string
  productId: string
  title: string
  handle: string
  position: number
  featuredImageUrl: string | null
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
}

export interface PagedResult<T> {
  content: T[]
  meta: PageMeta
}

export interface OptionValueLabel {
  optionName: string
  valueLabel: string
}

export interface ProductVariantResponse {
  id: string
  title: string
  sku: string | null
  price: number | null
  compareAtPrice: number | null
  optionValues: OptionValueLabel[]
  fulfillmentType: string
  inventoryPolicy: string
  leadTimeDays: number
}

export interface ProductImageResponse {
  id: string
  url: string
  altText: string | null
  position: number
}

export interface ProductDetailResponse {
  id: string
  title: string
  description: string | null
  handle: string
  vendor: string | null
  productType: string | null
  variants: ProductVariantResponse[]
  images: ProductImageResponse[]
  tags: string[]
}

export interface ProductSummaryResponse {
  id: string
  title: string
  handle: string
  vendor: string | null
  featuredImageUrl: string | null
  priceMin: number | null
  priceMax: number | null
  compareAtPriceMin: number | null
  compareAtPriceMax: number | null
}

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

export interface AuthFetchConfig {
  getTokens: () => { accessToken: string | null; refreshToken: string | null }
  onTokensRefreshed: (tokens: AuthTokens) => void
  onAuthFailure: () => void
}

export function createAuthFetch(config: AuthFetchConfig) {
  return async function authFetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const { accessToken, refreshToken } = config.getTokens()

    const headers: Record<string, string> = {
      ...(options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers as Record<string, string> | undefined),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }

    const res = await fetch(`${base()}${path}`, { ...options, headers })

    if (res.status === 401) {
      if (refreshToken) {
        const refreshRes = await fetch(`${base()}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (!refreshRes.ok) {
          config.onAuthFailure()
          throw new Error('Session expired')
        }

        const refreshJson = await refreshRes.json()
        const newTokens: AuthTokens = {
          accessToken: refreshJson.data.accessToken,
          refreshToken: refreshJson.data.refreshToken,
        }
        config.onTokensRefreshed(newTokens)

        const retryRes = await fetch(`${base()}${path}`, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newTokens.accessToken}`,
          },
        })
        if (!retryRes.ok) {
          if (retryRes.status === 401) {
            config.onAuthFailure()
            throw new Error('Session expired')
          }
          throw new Error(`HTTP ${retryRes.status}`)
        }
        const retryJson = await retryRes.json()
        return retryJson.data as T
      } else {
        config.onAuthFailure()
        throw new Error('Session expired')
      }
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.data as T
  }
}

export function getGoogleOAuthUrl(): string {
  return `${base()}/api/v1/auth/oauth2/google`
}

export async function authLogin(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await fetch(`${base()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
  }
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
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
  }
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
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
  }
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
  const res = await fetch(
    `${base()}/api/v1/auth/confirm-password-reset/${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function authVerifyEmail(token: string): Promise<void> {
  const res = await fetch(`${base()}/api/v1/auth/verify-email?token=${token}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

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

// Internal helpers

function base(): string {
  const url = import.meta.env.VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL is not set')
  return url
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.data as T
}

// Public API functions

export function getPage(handle: string): Promise<PageResponse> {
  return apiFetch(`/api/v1/pages/${handle}`)
}

export function listCollections(
  page: number,
  size: number,
): Promise<PagedResult<CollectionSummaryResponse>> {
  return apiFetch(`/api/v1/collections?page=${page}&size=${size}`)
}

export function getCollection(
  handle: string,
): Promise<CollectionDetailResponse> {
  return apiFetch(`/api/v1/collections/${handle}`)
}

export function listCollectionProducts(
  handle: string,
  page: number,
  size: number,
): Promise<PagedResult<CollectionProductResponse>> {
  return apiFetch(
    `/api/v1/collections/${handle}/products?page=${page}&size=${size}`,
  )
}

export function getProduct(handle: string): Promise<ProductDetailResponse> {
  return apiFetch(`/api/v1/products/${handle}`)
}

export function listProducts(params: {
  q?: string
  vendor?: string
  type?: string
  page?: number
  size?: number
}): Promise<PagedResult<ProductSummaryResponse>> {
  const qs = new URLSearchParams()
  if (params.q !== undefined) qs.set('titleContains', params.q)
  if (params.vendor !== undefined) qs.set('vendor', params.vendor)
  if (params.type !== undefined) qs.set('productType', params.type)
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.size !== undefined) qs.set('size', String(params.size))
  const query = qs.toString()
  return apiFetch(`/api/v1/products${query ? `?${query}` : ''}`)
}
