import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type {
  PageResponse,
  CollectionSummaryResponse,
  ProductSummaryResponse,
} from '#/lib/api'
import { HeroSection, FeaturedCollection, CollectionsGrid } from './index'

const mockPage: PageResponse = {
  id: '1',
  title: 'Welcome to Garden',
  handle: 'home',
  body: 'Seasonal plants, seeds, and tools for every garden.',
  metaTitle: null,
  metaDescription: null,
  publishedAt: '2026-01-01T00:00:00Z',
}

const mockCollections: CollectionSummaryResponse[] = [
  { id: 'c1', title: 'Seeds & Bulbs', handle: 'seeds-bulbs', featuredImageUrl: null },
  { id: 'c2', title: 'Tools & Supplies', handle: 'tools-supplies', featuredImageUrl: null },
]

const mockProducts: ProductSummaryResponse[] = [
  { id: 'p1', title: 'Heirloom Tomato Seeds', handle: 'heirloom-tomato-seeds', vendor: null, featuredImageUrl: null, priceMin: null, priceMax: null, compareAtPriceMin: null, compareAtPriceMax: null },
  { id: 'p2', title: 'Lavender Starter Pack', handle: 'lavender-starter-pack', vendor: null, featuredImageUrl: null, priceMin: null, priceMax: null, compareAtPriceMin: null, compareAtPriceMax: null },
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
    expect(screen.getByRole('link', { name: /Shop Now/i })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /View Collections/i }),
    ).toBeInTheDocument()
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
