import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPage, listCollections, listCollectionProducts } from './api'

const BASE = 'http://localhost:8080'

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getPage', () => {
  it('fetches the correct URL and returns the data field', async () => {
    const page = { id: '1', title: 'Home', handle: 'home', body: 'Hello', metaTitle: null, metaDescription: null, publishedAt: '2026-01-01T00:00:00Z' }
    vi.stubGlobal('fetch', mockFetch({ data: page }))

    const result = await getPage('home')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/pages/home`)
    expect(result).toEqual(page)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Not Found' }, 404))
    await expect(getPage('home')).rejects.toThrow('HTTP 404')
  })
})

describe('listCollections', () => {
  it('fetches with page and size query params', async () => {
    const response = { data: { content: [], meta: { page: 0, pageSize: 20, total: 0 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listCollections(0, 20)

    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/v1/collections?page=0&size=20`)
  })

  it('returns the paged result', async () => {
    const collection = { id: 'abc', title: 'Seeds', handle: 'seeds-bulbs' }
    const response = { data: { content: [collection], meta: { page: 0, pageSize: 20, total: 1 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    const result = await listCollections(0, 20)

    expect(result.content).toHaveLength(1)
    expect(result.content[0].handle).toBe('seeds-bulbs')
  })
})

describe('listCollectionProducts', () => {
  it('fetches the correct URL with handle and pagination', async () => {
    const response = { data: { content: [], meta: { page: 0, pageSize: 4, total: 0 } } }
    vi.stubGlobal('fetch', mockFetch(response))

    await listCollectionProducts('seeds-bulbs', 0, 4)

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/collections/seeds-bulbs/products?page=0&size=4`
    )
  })
})
