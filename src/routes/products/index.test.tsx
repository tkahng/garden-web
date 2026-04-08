import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ProductSummaryResponse } from '#/lib/api'
import { ProductCard } from './index'

const base: ProductSummaryResponse = {
  id: 'p1',
  title: 'Heirloom Tomato Seeds',
  handle: 'heirloom-tomato-seeds',
  vendor: 'Garden Co',
  featuredImageUrl: null,
  priceMin: null,
  priceMax: null,
  compareAtPriceMin: null,
  compareAtPriceMax: null,
}

describe('ProductCard', () => {
  it('renders a placeholder when featuredImageUrl is null', () => {
    render(<ProductCard product={base} />)
    expect(screen.getByTestId('card-placeholder')).toBeInTheDocument()
  })

  it('renders the product image when featuredImageUrl is set', () => {
    const product = { ...base, featuredImageUrl: 'https://cdn.example.com/img.jpg' }
    render(<ProductCard product={product} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/img.jpg')
    expect(img).toHaveAttribute('alt', 'Heirloom Tomato Seeds')
  })

  it('renders the product title', () => {
    render(<ProductCard product={base} />)
    expect(screen.getByText('Heirloom Tomato Seeds')).toBeInTheDocument()
  })

  it('renders the vendor when set', () => {
    render(<ProductCard product={base} />)
    expect(screen.getByText('Garden Co')).toBeInTheDocument()
  })

  it('omits vendor when null', () => {
    render(<ProductCard product={{ ...base, vendor: null }} />)
    expect(screen.queryByText('Garden Co')).not.toBeInTheDocument()
  })

  it('omits price section when priceMin is null', () => {
    render(<ProductCard product={base} />)
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })

  it('renders a single price when priceMin equals priceMax', () => {
    render(<ProductCard product={{ ...base, priceMin: 19.99, priceMax: 19.99 }} />)
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('renders a price range when priceMin differs from priceMax', () => {
    render(<ProductCard product={{ ...base, priceMin: 9.99, priceMax: 19.99 }} />)
    expect(screen.getByText('$9.99 – $19.99')).toBeInTheDocument()
  })

  it('renders compare-at price with line-through when compareAtPriceMin > priceMin', () => {
    render(<ProductCard product={{ ...base, priceMin: 9.99, priceMax: 9.99, compareAtPriceMin: 14.99, compareAtPriceMax: 14.99 }} />)
    const compareAt = screen.getByText('$14.99')
    expect(compareAt).toHaveClass('line-through')
  })

  it('does not render compare-at when compareAtPriceMin equals priceMin', () => {
    render(<ProductCard product={{ ...base, priceMin: 9.99, priceMax: 9.99, compareAtPriceMin: 9.99, compareAtPriceMax: 9.99 }} />)
    // only one $9.99 element (no compare-at)
    expect(screen.getAllByText('$9.99')).toHaveLength(1)
  })

  it('wraps the card in a link to the product handle', () => {
    render(<ProductCard product={base} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/products/heirloom-tomato-seeds')
  })
})
