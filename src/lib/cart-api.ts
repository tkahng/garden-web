import createClient from 'openapi-fetch'
import type { components } from '#/schema'

// ─── Exported types ───────────────────────────────────────────────────────────

export type CartResponse = components['schemas']['CartResponse']
export type CartItemResponse = components['schemas']['CartItemResponse']
export type CartItemProductInfo = components['schemas']['CartItemProductInfo']

// ─── Local path types ─────────────────────────────────────────────────────────
// openapi-typescript emits Spring's security principal as a required `user`
// query param. That param is server-resolved — the client never sends it.
// We redeclare only the cart paths with clean signatures.

type CartPaths = {
  '/api/v1/cart': {
    get: {
      parameters?: Record<string, never>
      requestBody?: never
      responses: {
        200: { content: { '*/*': components['schemas']['ApiResponseCartResponse'] } }
      }
    }
    delete: {
      parameters?: Record<string, never>
      requestBody?: never
      responses: { 200: { content?: never } }
    }
  }
  '/api/v1/cart/items': {
    post: {
      parameters?: Record<string, never>
      requestBody: {
        content: { 'application/json': components['schemas']['AddCartItemRequest'] }
      }
      responses: {
        200: { content: { '*/*': components['schemas']['ApiResponseCartResponse'] } }
      }
    }
  }
  '/api/v1/cart/items/{itemId}': {
    put: {
      parameters: { path: { itemId: string } }
      requestBody: {
        content: { 'application/json': components['schemas']['UpdateCartItemRequest'] }
      }
      responses: {
        200: { content: { '*/*': components['schemas']['ApiResponseCartResponse'] } }
      }
    }
    delete: {
      parameters: { path: { itemId: string } }
      requestBody?: never
      responses: {
        200: { content: { '*/*': components['schemas']['ApiResponseCartResponse'] } }
      }
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function baseUrl(): string {
  const url = import.meta.env.VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL is not set')
  return url
}

/**
 * Creates a type-safe cart API client.
 * Pass a `getToken` function that returns the current access token (or null).
 * The token is read at call time so the client stays valid after token refresh.
 */
export function createCartClient(getToken: () => string | null) {
  const client = createClient<CartPaths>({ baseUrl: baseUrl() })

  client.use({
    async onRequest({ request }) {
      const token = getToken()
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
      return request
    },
  })

  return {
    async getCart(): Promise<CartResponse> {
      const { data, response } = await client.GET('/api/v1/cart')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!data?.data) throw new Error('Invalid response: missing data')
      return data.data
    },

    async addCartItem(variantId: string, quantity = 1): Promise<CartResponse> {
      const { data, response } = await client.POST('/api/v1/cart/items', {
        body: { variantId, quantity },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!data?.data) throw new Error('Invalid response: missing data')
      return data.data
    },

    async updateCartItem(itemId: string, quantity: number): Promise<CartResponse> {
      const { data, response } = await client.PUT('/api/v1/cart/items/{itemId}', {
        params: { path: { itemId } },
        body: { quantity },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!data?.data) throw new Error('Invalid response: missing data')
      return data.data
    },

    async removeCartItem(itemId: string): Promise<CartResponse> {
      const { data, response } = await client.DELETE('/api/v1/cart/items/{itemId}', {
        params: { path: { itemId } },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!data?.data) throw new Error('Invalid response: missing data')
      return data.data
    },

    async abandonCart(): Promise<void> {
      const { response } = await client.DELETE('/api/v1/cart')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
    },
  }
}
