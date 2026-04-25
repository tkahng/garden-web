export interface WishlistItemResponse {
  id: string
  productId: string
  title: string
  handle: string
  featuredImageUrl: string | null
  priceMin: number | null
}

export interface WishlistResponse {
  id: string | null
  items: WishlistItemResponse[]
}

export async function getWishlist(
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>,
): Promise<WishlistResponse> {
  return authFetch<WishlistResponse>('/api/v1/account/wishlist')
}

export async function addWishlistItem(
  productId: string,
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>,
): Promise<WishlistResponse> {
  return authFetch<WishlistResponse>('/api/v1/account/wishlist/items', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
}

export async function removeWishlistItem(
  productId: string,
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>,
): Promise<WishlistResponse> {
  return authFetch<WishlistResponse>(`/api/v1/account/wishlist/items/${productId}`, {
    method: 'DELETE',
  })
}
