import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ProductImageResponse } from '#/lib/api'
import { ProductGallery } from './$handle'

const mockImages: ProductImageResponse[] = [
  { id: 'img1', url: 'https://example.com/img1.jpg', altText: 'Front view', position: 1 },
  { id: 'img2', url: 'https://example.com/img2.jpg', altText: 'Side view', position: 2 },
]

describe('ProductGallery', () => {
  it('renders a placeholder when images array is empty', () => {
    render(<ProductGallery images={[]} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.getByTestId('gallery-placeholder')).toBeInTheDocument()
  })

  it('renders the featured image at activeIndex', () => {
    render(<ProductGallery images={mockImages} activeIndex={1} onSelect={vi.fn()} />)
    const featured = screen.getByTestId('featured-image')
    expect(featured).toHaveAttribute('src', 'https://example.com/img2.jpg')
    expect(featured).toHaveAttribute('alt', 'Side view')
  })

  it('does not render thumbnail strip for a single image', () => {
    render(<ProductGallery images={[mockImages[0]]} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a thumbnail button per image when multiple images exist', () => {
    render(<ProductGallery images={mockImages} activeIndex={0} onSelect={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })

  it('calls onSelect with the correct index when a thumbnail is clicked', () => {
    const onSelect = vi.fn()
    render(<ProductGallery images={mockImages} activeIndex={0} onSelect={onSelect} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
