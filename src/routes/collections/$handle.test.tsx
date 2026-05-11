import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CollectionDetailResponse } from '#/lib/api'
import { CollectionHeader, CollectionDetailPage } from './$handle'

// ─── Mocks for CollectionDetailPage ──────────────────────────────────────────

const mockUseLoaderData = vi.hoisted(() => vi.fn())
const mockUseSearch = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    params,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    params?: Record<string, string>
    [key: string]: unknown
  }) => {
    let href = to
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, value)
      })
    }
    return <a href={href} className={className}>{children}</a>
  },
  createFileRoute: () => (_config: unknown) => ({
    useLoaderData: mockUseLoaderData,
    useSearch: mockUseSearch,
  }),
  useNavigate: () => vi.fn(),
  lazyRouteComponent: (fn: () => Promise<unknown>) => fn,
}))

vi.mock('#/hooks/useDocumentMeta', () => ({ useDocumentMeta: vi.fn() }))
vi.mock('#/context/cart', () => ({ useCart: () => ({ cart: null }) }))
vi.mock('#/context/wishlist', () => ({ useWishlist: () => ({ isWishlisted: () => false, toggleWishlist: vi.fn() }) }))
vi.mock('#/context/auth', () => ({ useAuth: () => ({ isAuthenticated: false }) }))
vi.mock('#/context/auth-modal', () => ({ useAuthModal: () => ({ openAuthModal: vi.fn() }) }))

const baseCollection: CollectionDetailResponse = {
  id: 'c1',
  title: 'Seeds & Bulbs',
  handle: 'seeds-bulbs',
  description: undefined,
  featuredImageUrl: undefined,
  metaTitle: undefined,
  metaDescription: undefined,
}

describe('CollectionHeader', () => {
  it('renders the collection title in an h1', () => {
    render(<CollectionHeader collection={baseCollection} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Seeds & Bulbs')
  })

  it('omits the banner when featuredImageUrl is null', () => {
    render(<CollectionHeader collection={baseCollection} />)
    expect(screen.queryByTestId('collection-banner')).not.toBeInTheDocument()
  })

  it('renders the banner image when featuredImageUrl is set', () => {
    const collection = { ...baseCollection, featuredImageUrl: 'https://cdn.example.com/seeds.jpg' }
    render(<CollectionHeader collection={collection} />)
    const banner = screen.getByTestId('collection-banner')
    expect(banner).toBeInTheDocument()
    const img = banner.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/seeds.jpg')
    expect(img).toHaveAttribute('alt', 'Seeds & Bulbs')
  })

  it('omits description when description is null', () => {
    render(<CollectionHeader collection={baseCollection} />)
    expect(screen.queryByTestId('collection-description')).not.toBeInTheDocument()
  })

  it('renders description when present', () => {
    const collection = { ...baseCollection, description: 'Everything you need to grow.' }
    render(<CollectionHeader collection={collection} />)
    const desc = screen.getByTestId('collection-description')
    expect(desc).toHaveTextContent('Everything you need to grow.')
  })
})

describe('CollectionDetailPage', () => {
  it('empty collection shows Back to collections link pointing to /collections', () => {
    mockUseLoaderData.mockReturnValue([
      baseCollection,
      { content: [], meta: { total: 0, page: 0, pageSize: 20 } },
    ])
    mockUseSearch.mockReturnValue({ sort: undefined, companyId: undefined, page: 0 })
    render(<CollectionDetailPage />)
    const link = screen.getByRole('link', { name: /back to collections/i })
    expect(link).toHaveAttribute('href', '/collections')
  })
})
