import createClient from 'openapi-fetch'
import type { paths } from '#/schema'

export type ApiClient = ReturnType<typeof createClient<paths>>

export interface AuthClientConfig {
  getTokens: () => { accessToken: string | null; refreshToken: string | null }
  onTokensRefreshed: (tokens: { accessToken: string; refreshToken: string }) => void
  onAuthFailure: () => void
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? ''
}

export function createAuthClient(config: AuthClientConfig): ApiClient {
  const client = createClient<paths>({ baseUrl: getBaseUrl() })
  let latestTokens = config.getTokens()
  let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null
  let rotatedRefreshToken: string | null = null

  function refreshTokens(refreshToken: string) {
    if (!refreshPromise) {
      refreshPromise = callApi<{ accessToken?: string; refreshToken?: string }>(
        createPublicClient().POST('/api/v1/auth/refresh', { body: { refreshToken } }),
      )
        .then(tokens => {
          const { accessToken, refreshToken: nextRefreshToken } = tokens
          if (!accessToken || !nextRefreshToken) throw new Error('Invalid refresh response')
          const newTokens = { accessToken, refreshToken: nextRefreshToken }
          rotatedRefreshToken = refreshToken
          latestTokens = newTokens
          config.onTokensRefreshed(newTokens)
          return newTokens
        })
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
  }

  client.use({
    async onRequest({ request }) {
      const configuredTokens = config.getTokens()
      if (configuredTokens.refreshToken !== rotatedRefreshToken) {
        latestTokens = configuredTokens
      }
      const { accessToken } = latestTokens
      if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`)
      return request
    },
    async onResponse({ request, response }) {
      if (response.status !== 401) return response
      const { refreshToken } = latestTokens
      if (refreshToken) {
        try {
          const newTokens = await refreshTokens(refreshToken)
          const retryRequest = request.clone()
          retryRequest.headers.set('Authorization', `Bearer ${newTokens.accessToken}`)
          return fetch(retryRequest)
        } catch {
          // Fall through to auth failure below.
        }
      }
      config.onAuthFailure()
      return response
    },
  })
  return client
}

export function createPublicClient(): ApiClient {
  return createClient<paths>({ baseUrl: getBaseUrl() })
}

// Unwraps the openapi-fetch envelope and backend ApiResponse wrapper.
export async function callApi<T>(
  promise: Promise<{ data?: { data?: T }; error?: unknown }>,
): Promise<T> {
  const { data, error } = await promise
  if (error) throw error
  return data!.data as T
}
