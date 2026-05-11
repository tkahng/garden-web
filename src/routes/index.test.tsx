import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type {
  PageResponse,
  CollectionSummaryResponse,
  ProductSummaryResponse,
} from '#/lib/api'
import { HeroSection, FeaturedCollection, CollectionsGrid } from './index'

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
  useNavigate: () => vi.fn(),
  lazyRouteComponent: (fn: () => Promise<unknown>) => fn,
  createFileRoute: () => (_config: unknown) => ({}),
}))

vi.mock('#/context/auth', () => ({
  useAuth: () => ({ isAuthenticated: false, authFetch: { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn() } }),
}))

vi.mock('#/context/auth-modal', () => ({
  useAuthModal: () => ({ openAuthModal: vi.fn() }),
}))

vi.mock('#/context/wishlist', () => ({
  useWishlist: () => ({ isWishlisted: () => false, toggleWishlist: vi.fn() }),
}))

const mockPage: PageResponse = {
  id: '1',
  title: 'Welcome to Garden',
  handle: 'home',
  body: 'Seasonal plants, seeds, and tools for every garden.',
  metaTitle: undefined,
  metaDescription: undefined,
  publishedAt: '2026-01-01T00:00:00Z',
}

const mockCollections: CollectionSummaryResponse[] = [
  { id: 'c1', title: 'Seeds & Bulbs', handle: 'seeds-bulbs', featuredImageUrl: undefined },
  { id: 'c2', title: 'Tools & Supplies', handle: 'tools-supplies', featuredImageUrl: undefined },
]

const mockProducts: ProductSummaryResponse[] = [
  { id: 'p1', title: 'Heirloom Tomato Seeds', handle: 'heirloom-tomato-seeds', vendor: undefined, featuredImageUrl: undefined, priceMin: undefined, priceMax: undefined, compareAtPriceMin: undefined, compareAtPriceMax: undefined },
  { id: 'p2', title: 'Lavender Starter Pack', handle: 'lavender-starter-pack', vendor: undefined, featuredImageUrl: undefined, priceMin: undefined, priceMax: undefined, compareAtPriceMin: undefined, compareAtPriceMax: undefined },
]

describe('HeroSection', () => {
  it('renders page title and body from CMS', () => {
    render(<HeroSection page={mockPage} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Welcome to Garden',
    )
    expect(screen.getByText(/Seasonal plants/)).toBeInTheDocument()
  })

  it('renders fallback copy when page is null', () => {
    render(<HeroSection page={null} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Welcome to Garden',
    )
  })

  it('renders Shop Now and View Collections links', () => {
    render(<HeroSection page={mockPage} />)
    expect(screen.getByRole('link', { name: /Shop Now/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /View Collections/i })).toHaveAttribute('href', '/collections')
  })
})

describe('FeaturedCollection', () => {
  it('renders the collection title', () => {
    render(
      <FeaturedCollection
        collection={mockCollections[0]}
        products={mockProducts}
      />,
    )
    expect(screen.getByText('Seeds & Bulbs')).toBeInTheDocument()
  })

  it('renders a card per product', () => {
    render(
      <FeaturedCollection
        collection={mockCollections[0]}
        products={mockProducts}
      />,
    )
    expect(screen.getByText('Heirloom Tomato Seeds')).toBeInTheDocument()
    expect(screen.getByText('Lavender Starter Pack')).toBeInTheDocument()
  })

  it('renders View all link pointing to the collection', () => {
    render(
      <FeaturedCollection
        collection={mockCollections[0]}
        products={mockProducts}
      />,
    )
    const link = screen.getByRole('link', { name: /View all/i })
    expect(link).toHaveAttribute('href', '/collections/seeds-bulbs')
  })
})

describe('CollectionsGrid', () => {
  it('renders a card per collection', () => {
    render(<CollectionsGrid collections={mockCollections} />)
    expect(screen.getByText('Seeds & Bulbs')).toBeInTheDocument()
    expect(screen.getByText('Tools & Supplies')).toBeInTheDocument()
  })

  it('each collection links to its page', () => {
    render(<CollectionsGrid collections={mockCollections} />)
    const links = screen.getAllByRole('link', { name: /Browse/i })
    expect(links[0]).toHaveAttribute('href', '/collections/seeds-bulbs')
    expect(links[1]).toHaveAttribute('href', '/collections/tools-supplies')
  })

  it('renders empty state when there are no collections', () => {
    render(<CollectionsGrid collections={[]} />)
    expect(screen.getByText(/No collections/i)).toBeInTheDocument()
  })
})
