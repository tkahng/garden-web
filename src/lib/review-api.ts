import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi, createPublicClient } from '#/lib/client'
import type { PagedResult } from '#/lib/api'

export type ReviewResponse = components['schemas']['ReviewResponse']

export function getProductReviews(
  productId: string,
  page = 0,
  size = 10,
): Promise<PagedResult<ReviewResponse>> {
  return callApi(createPublicClient().GET('/api/v1/products/{productId}/reviews', {
    params: { path: { productId }, query: { page, size } },
  })) as Promise<PagedResult<ReviewResponse>>
}

export function createReview(
  productId: string,
  req: { rating: number; title?: string; body?: string },
  client: ApiClient,
): Promise<ReviewResponse> {
  return callApi(client.POST('/api/v1/products/{productId}/reviews', {
    params: { path: { productId } },
    body: req,
  }))
}
