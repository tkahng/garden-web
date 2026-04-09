import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CollectionDetailResponse } from '#/lib/api'
import { CollectionHeader } from './$handle'

const baseCollection: CollectionDetailResponse = {
  id: 'c1',
  title: 'Seeds & Bulbs',
  handle: 'seeds-bulbs',
  description: null,
  featuredImageUrl: null,
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
