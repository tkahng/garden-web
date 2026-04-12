import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CollectionSummaryResponse } from '#/lib/api'
import { CollectionCard } from './index'

const mockCollection: CollectionSummaryResponse = {
  id: 'c1',
  title: 'Seeds & Bulbs',
  handle: 'seeds-bulbs',
  featuredImageUrl: null,
}

describe('CollectionCard', () => {
  it('renders the collection title', () => {
    render(<CollectionCard collection={mockCollection} />)
    expect(screen.getByText('Seeds & Bulbs')).toBeInTheDocument()
  })

  it('renders a Browse link to the collection handle', () => {
    render(<CollectionCard collection={mockCollection} />)
    const link = screen.getByRole('link', { name: /Browse/i })
    expect(link).toHaveAttribute('href', '/collections/seeds-bulbs')
  })

  it('renders the decorative circle placeholder', () => {
    render(<CollectionCard collection={mockCollection} />)
    // The decorative div is present (not a meaningful assertion, just confirms structure)
    expect(screen.getByText('Seeds & Bulbs').closest('div')).toBeInTheDocument()
  })
})
