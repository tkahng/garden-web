import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ProductSummaryResponse } from '#/lib/apiFetch'
import { ProductCard, FilterBar, Pagination } from './index'

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
    const product = {
      ...base,
      featuredImageUrl: 'https://cdn.example.com/img.jpg',
    }
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
    render(
      <ProductCard product={{ ...base, priceMin: 19.99, priceMax: 19.99 }} />,
    )
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('renders a price range when priceMin differs from priceMax', () => {
    render(
      <ProductCard product={{ ...base, priceMin: 9.99, priceMax: 19.99 }} />,
    )
    expect(screen.getByText('$9.99 – $19.99')).toBeInTheDocument()
  })

  it('renders compare-at price with line-through when compareAtPriceMin > priceMin', () => {
    render(
      <ProductCard
        product={{
          ...base,
          priceMin: 9.99,
          priceMax: 9.99,
          compareAtPriceMin: 14.99,
          compareAtPriceMax: 14.99,
        }}
      />,
    )
    const compareAt = screen.getByText('$14.99')
    expect(compareAt).toHaveClass('line-through')
  })

  it('does not render compare-at when compareAtPriceMin equals priceMin', () => {
    render(
      <ProductCard
        product={{
          ...base,
          priceMin: 9.99,
          priceMax: 9.99,
          compareAtPriceMin: 9.99,
          compareAtPriceMax: 9.99,
        }}
      />,
    )
    // only one $9.99 element (no compare-at)
    expect(screen.getAllByText('$9.99')).toHaveLength(1)
  })

  it('wraps the card in a link to the product handle', () => {
    render(<ProductCard product={base} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/products/heirloom-tomato-seeds')
  })
})

describe('FilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the search input with placeholder', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search products…')).toBeInTheDocument()
  })

  it('calls onSearch with q after 300ms debounce', () => {
    const onSearch = vi.fn()
    render(<FilterBar search={{}} onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search products…'), {
      target: { value: 'tomato' },
    })
    expect(onSearch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith({ q: 'tomato', page: 0 })
  })

  it('passes q as undefined when input is cleared', () => {
    const onSearch = vi.fn()
    render(<FilterBar search={{ q: 'tomato' }} onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search products…'), {
      target: { value: '' },
    })
    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith({ q: undefined, page: 0 })
  })

  it('does not render vendor dropdown when vendor is not in search', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.queryByText('All vendors')).not.toBeInTheDocument()
  })

  it('renders vendor dropdown when vendor is in search', () => {
    render(<FilterBar search={{ vendor: 'Garden Co' }} onSearch={vi.fn()} />)
    expect(screen.getByText('All vendors')).toBeInTheDocument()
    expect(screen.getByText('Garden Co')).toBeInTheDocument()
  })

  it('calls onSearch when vendor is cleared via dropdown', () => {
    const onSearch = vi.fn()
    render(<FilterBar search={{ vendor: 'Garden Co' }} onSearch={onSearch} />)
    fireEvent.change(screen.getByDisplayValue('Garden Co'), {
      target: { value: '' },
    })
    expect(onSearch).toHaveBeenCalledWith({ vendor: undefined, page: 0 })
  })

  it('does not render type dropdown when type is not in search', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.queryByText('All types')).not.toBeInTheDocument()
  })

  it('renders type dropdown when type is in search', () => {
    render(<FilterBar search={{ type: 'Seeds' }} onSearch={vi.fn()} />)
    expect(screen.getByText('All types')).toBeInTheDocument()
    expect(screen.getByText('Seeds')).toBeInTheDocument()
  })

  it('does not render clear filters link when no filters active', () => {
    render(<FilterBar search={{}} onSearch={vi.fn()} />)
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
  })

  it('renders clear filters link when q is set', () => {
    render(<FilterBar search={{ q: 'tomato' }} onSearch={vi.fn()} />)
    const link = screen.getByText('Clear filters')
    expect(link).toHaveAttribute('href', '/products')
  })

  it('renders clear filters link when vendor is set', () => {
    render(<FilterBar search={{ vendor: 'Garden Co' }} onSearch={vi.fn()} />)
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })
})

describe('Pagination', () => {
  it('renders null when total is less than or equal to pageSize', () => {
    const { container } = render(
      <Pagination page={0} total={10} pageSize={20} onPage={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders null when total exactly equals pageSize', () => {
    const { container } = render(
      <Pagination page={0} total={20} pageSize={20} onPage={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when total exceeds pageSize', () => {
    render(<Pagination page={0} total={21} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('disables Prev button on the first page', () => {
    render(<Pagination page={0} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
  })

  it('enables Prev button on pages after the first', () => {
    render(<Pagination page={1} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Prev' })).not.toBeDisabled()
  })

  it('disables Next button on the last page', () => {
    render(<Pagination page={1} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('enables Next button when not on the last page', () => {
    render(<Pagination page={0} total={40} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled()
  })

  it('calls onPage with page - 1 when Prev is clicked', () => {
    const onPage = vi.fn()
    render(<Pagination page={1} total={60} pageSize={20} onPage={onPage} />)
    fireEvent.click(screen.getByRole('button', { name: 'Prev' }))
    expect(onPage).toHaveBeenCalledWith(0)
  })

  it('calls onPage with page + 1 when Next is clicked', () => {
    const onPage = vi.fn()
    render(<Pagination page={0} total={60} pageSize={20} onPage={onPage} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPage).toHaveBeenCalledWith(1)
  })

  it('shows correct page label: Page N of M', () => {
    render(<Pagination page={2} total={60} pageSize={20} onPage={vi.fn()} />)
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
  })
})
