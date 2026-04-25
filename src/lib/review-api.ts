import { apiFetch } from '#/lib/api'
import type { PagedResult } from '#/lib/api'

export interface ReviewResponse {
  id: string
  productId: string
  userId: string
  reviewerName: string
  rating: number
  title: string | null
  body: string | null
  verifiedPurchase: boolean
  status: 'PUBLISHED' | 'HIDDEN'
  createdAt: string
}

export function getProductReviews(
  productId: string,
  page = 0,
  size = 10,
): Promise<PagedResult<ReviewResponse>> {
  return apiFetch(`/api/v1/products/${productId}/reviews?page=${page}&size=${size}`)
}

export async function createReview(
  productId: string,
  req: { rating: number; title?: string; body?: string },
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>,
): Promise<ReviewResponse> {
  return authFetch<ReviewResponse>(`/api/v1/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
