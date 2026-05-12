import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuthClient } from './client'

const BASE = 'http://localhost:8080'

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createAuthClient', () => {
  it('deduplicates concurrent refresh requests and retries original requests', async () => {
    let tokens = { accessToken: 'expired-access', refreshToken: 'refresh-token' }
    let refreshCalls = 0
    const accountAuthHeaders: string[] = []

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      const url = new URL(request.url)

      if (url.pathname === '/api/v1/auth/refresh') {
        refreshCalls += 1
        expect(await request.json()).toEqual({ refreshToken: 'refresh-token' })
        return jsonResponse({
          data: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          },
        })
      }

      if (url.pathname === '/api/v1/account') {
        const auth = request.headers.get('Authorization') ?? ''
        accountAuthHeaders.push(auth)
        if (auth === 'Bearer expired-access') {
          return jsonResponse({}, 401)
        }
        return jsonResponse({ data: { id: 'u1', email: 'a@b.com' } })
      }

      return jsonResponse({}, 404)
    }))

    const client = createAuthClient({
      getTokens: () => tokens,
      onTokensRefreshed: next => {
        tokens = next
      },
      onAuthFailure: vi.fn(),
    })

    await Promise.all([
      client.GET('/api/v1/account'),
      client.GET('/api/v1/account'),
    ])

    expect(refreshCalls).toBe(1)
    expect(tokens).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    expect(accountAuthHeaders).toEqual([
      'Bearer expired-access',
      'Bearer expired-access',
      'Bearer new-access',
      'Bearer new-access',
    ])
  })

  it('calls auth failure when refresh fails', async () => {
    const onAuthFailure = vi.fn()

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      const url = new URL(request.url)
      if (url.pathname === '/api/v1/auth/refresh') return jsonResponse({}, 401)
      if (url.pathname === '/api/v1/account') return jsonResponse({}, 401)
      return jsonResponse({}, 404)
    }))

    const client = createAuthClient({
      getTokens: () => ({ accessToken: 'expired-access', refreshToken: 'refresh-token' }),
      onTokensRefreshed: vi.fn(),
      onAuthFailure,
    })

    await client.GET('/api/v1/account')

    expect(onAuthFailure).toHaveBeenCalledTimes(1)
  })

  it('keeps using refreshed tokens before provider state re-renders', async () => {
    let refreshCalls = 0
    const accountAuthHeaders: string[] = []

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      const url = new URL(request.url)

      if (url.pathname === '/api/v1/auth/refresh') {
        refreshCalls += 1
        return jsonResponse({
          data: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          },
        })
      }

      if (url.pathname === '/api/v1/account') {
        const auth = request.headers.get('Authorization') ?? ''
        accountAuthHeaders.push(auth)
        if (auth === 'Bearer expired-access') return jsonResponse({}, 401)
        return jsonResponse({ data: { id: 'u1', email: 'a@b.com' } })
      }

      return jsonResponse({}, 404)
    }))

    const client = createAuthClient({
      getTokens: () => ({ accessToken: 'expired-access', refreshToken: 'refresh-token' }),
      onTokensRefreshed: vi.fn(),
      onAuthFailure: vi.fn(),
    })

    await client.GET('/api/v1/account')
    await client.GET('/api/v1/account')

    expect(refreshCalls).toBe(1)
    expect(accountAuthHeaders).toEqual([
      'Bearer expired-access',
      'Bearer new-access',
      'Bearer new-access',
    ])
  })
})
