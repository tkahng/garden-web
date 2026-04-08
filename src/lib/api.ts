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
}

export interface CollectionProductResponse {
  id: string
  productId: string
  title: string
  handle: string
  position: number
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
  price: number
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

export function listCollections(page: number, size: number): Promise<PagedResult<CollectionSummaryResponse>> {
  return apiFetch(`/api/v1/collections?page=${page}&size=${size}`)
}

export function listCollectionProducts(
  handle: string,
  page: number,
  size: number,
): Promise<PagedResult<CollectionProductResponse>> {
  return apiFetch(`/api/v1/collections/${handle}/products?page=${page}&size=${size}`)
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
