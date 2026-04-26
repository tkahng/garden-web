import type { components } from '#/schema'
import type { ApiClient } from '#/lib/client'
import { callApi } from '#/lib/client'

export type WishlistItemResponse = components['schemas']['WishlistItemResponse']
export type WishlistResponse = components['schemas']['WishlistResponse']

export function getWishlist(client: ApiClient): Promise<WishlistResponse> {
  return callApi(client.GET('/api/v1/account/wishlist'))
}

export function addWishlistItem(productId: string, client: ApiClient): Promise<WishlistResponse> {
  return callApi(client.POST('/api/v1/account/wishlist/items', { body: { productId } }))
}

export function removeWishlistItem(productId: string, client: ApiClient): Promise<WishlistResponse> {
  return callApi(client.DELETE('/api/v1/account/wishlist/items/{productId}', {
    params: { path: { productId } },
  }))
}
