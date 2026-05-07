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
export type BlogResponse = components['schemas']['BlogResponse']
export type ArticleResponse = components['schemas']['ArticleResponse']
export type ArticleImageResponse = components['schemas']['ArticleImageResponse']

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

// ─── Auth functions ───────────────────────────────────────────────────────────

export function getGoogleOAuthUrl(): string {
  return `${base()}/api/v1/auth/oauth2/google`
}

export async function authLogin(email: string, password: string): Promise<AuthTokens> {
  const { data, error } = await createPublicClient().POST('/api/v1/auth/login', {
    body: { email, password },
  })
  if (error) throw error
  const t = data!.data!
  return { accessToken: t.accessToken!, refreshToken: t.refreshToken! }
}

export async function authRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<AuthTokens> {
  const { data, error } = await createPublicClient().POST('/api/v1/auth/register', {
    body: { email, password, firstName, lastName },
  })
  if (error) throw error
  const t = data!.data!
  return { accessToken: t.accessToken!, refreshToken: t.refreshToken! }
}

export async function authLogout(refreshToken: string): Promise<void> {
  const { error } = await createPublicClient().POST('/api/v1/auth/logout', {
    body: { refreshToken },
  })
  if (error) throw error
}

export async function authRefresh(refreshToken: string): Promise<AuthTokens> {
  const { data, error } = await createPublicClient().POST('/api/v1/auth/refresh', {
    body: { refreshToken },
  })
  if (error) throw error
  const t = data!.data!
  return { accessToken: t.accessToken!, refreshToken: t.refreshToken! }
}

export async function authRequestPasswordReset(email: string): Promise<void> {
  const { error } = await createPublicClient().POST('/api/v1/auth/request-password-reset', {
    body: { email },
  })
  if (error) throw error
}

export async function authConfirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  const { error } = await createPublicClient().POST('/api/v1/auth/confirm-password-reset/{token}', {
    params: { path: { token } },
    body: { newPassword },
  })
  if (error) throw error
}

export async function authVerifyEmail(token: string): Promise<void> {
  const { error } = await createPublicClient().GET('/api/v1/auth/verify-email', {
    params: { query: { token } },
  })
  if (error) throw error
}

// Used during login bootstrap (before auth client is initialized)
export async function getAccount(accessToken: string): Promise<User> {
  const { data, error } = await createPublicClient().GET('/api/v1/account', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (error) throw error
  const d = data!.data!
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

export function listBlogs(page = 0, pageSize = 20): Promise<PagedResult<BlogResponse>> {
  return callApi(createPublicClient().GET('/api/v1/blogs', {
    params: { query: { page, pageSize } },
  })) as Promise<PagedResult<BlogResponse>>
}

export function getBlog(blogHandle: string): Promise<BlogResponse> {
  return callApi(createPublicClient().GET('/api/v1/blogs/{blogHandle}', {
    params: { path: { blogHandle } },
  }))
}

export function listArticles(
  blogHandle: string,
  page = 0,
  pageSize = 10,
  tag?: string,
  q?: string,
): Promise<PagedResult<ArticleResponse>> {
  return callApi(createPublicClient().GET('/api/v1/blogs/{blogHandle}/articles', {
    params: { path: { blogHandle }, query: { page, pageSize, tag, q } },
  })) as Promise<PagedResult<ArticleResponse>>
}

export function getArticle(blogHandle: string, articleHandle: string): Promise<ArticleResponse> {
  return callApi(createPublicClient().GET('/api/v1/blogs/{blogHandle}/articles/{articleHandle}', {
    params: { path: { blogHandle, articleHandle } },
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
  sortBy?: string,
  sortDir?: string,
): Promise<PagedResult<CollectionProductResponse>> {
  return callApi(createPublicClient().GET('/api/v1/collections/{handle}/products', {
    params: { path: { handle }, query: { page, size, sortBy, sortDir } },
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
  sort?: string
  page?: number
  size?: number
  companyId?: string
}): Promise<PagedResult<ProductSummaryResponse>> {
  return callApi(createPublicClient().GET('/api/v1/products', {
    params: {
      query: {
        titleContains: params.q,
        vendor: params.vendor,
        productType: params.type,
        sortBy: params.sort,
        page: params.page,
        size: params.size,
        companyId: params.companyId,
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
  limit?: number
}): Promise<SearchResponse> {
  return callApi(createPublicClient().GET('/api/v1/search', {
    params: {
      query: {
        q: params.q,
        types: params.types,
        page: params.page,
        limit: params.limit,
      },
    },
  }))
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string, source: string): Promise<{ alreadySubscribed: boolean }> {
  const { data, error } = await createPublicClient().POST('/api/v1/newsletter/subscribe', {
    body: { email, source },
  })
  if (error) throw error
  return data!.data! as { alreadySubscribed: boolean }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function base(): string {
  const url = import.meta.env.VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL is not set')
  return url
}
